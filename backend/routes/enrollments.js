const express = require("express");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Enroll in a course
router.post("/:courseId/enroll", verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Create enrollment with initial module progress structure
    const enrollment = new Enrollment({
      user: req.user._id,
      course: course._id,
      modules: course.modules.map((module) => ({
        moduleId: module._id,
        lessons: module.lessons.map((lesson) => ({
          lessonId: lesson._id,
          timeSpent: 0,
          completed: false,
        })),
      })),
    });

    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res
        .status(400)
        .json({ message: "Already enrolled in this course" });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get enrollment status
router.get("/status/:courseId", verifyToken, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Not enrolled in this course" });
    }

    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update lesson progress
router.post("/:courseId/progress", verifyToken, async (req, res) => {
  try {
    const { moduleId, lessonId, timeSpent, completed } = req.body;

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Find and update the specific lesson
    const moduleIndex = enrollment.modules.findIndex(
      (m) => m.moduleId.toString() === moduleId
    );
    if (moduleIndex === -1) {
      return res.status(404).json({ message: "Module not found" });
    }

    const lessonIndex = enrollment.modules[moduleIndex].lessons.findIndex(
      (l) => l.lessonId.toString() === lessonId
    );
    if (lessonIndex === -1) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Update lesson progress
    const lesson = enrollment.modules[moduleIndex].lessons[lessonIndex];
    lesson.timeSpent = (lesson.timeSpent || 0) + (timeSpent || 0);
    if (completed) {
      lesson.completed = true;
      lesson.completedAt = new Date();
    }

    // Check if module is completed
    const allLessonsCompleted = enrollment.modules[moduleIndex].lessons.every(
      (l) => l.completed
    );
    if (allLessonsCompleted) {
      enrollment.modules[moduleIndex].completed = true;
      enrollment.modules[moduleIndex].completedAt = new Date();
    }

    // Update total progress
    const totalLessons = enrollment.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0
    );
    const completedLessons = enrollment.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => l.completed).length,
      0
    );
    enrollment.progress = (completedLessons / totalLessons) * 100;

    // Update total time spent
    enrollment.totalTimeSpent = enrollment.modules.reduce(
      (total, module) =>
        total +
        module.lessons.reduce(
          (sum, lesson) => sum + (lesson.timeSpent || 0),
          0
        ),
      0
    );

    // Check if course is completed
    const allModulesCompleted = enrollment.modules.every((m) => m.completed);
    if (allModulesCompleted) {
      enrollment.completed = true;
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get enrollment status and progress
router.get("/:courseId/status", verifyToken, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Not enrolled in this course" });
    }

    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all enrollments for a user (dashboard)
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id }).populate({
      path: "course",
      select: "title description thumbnail category",
      populate: {
        path: "instructor",
        select: "username",
      },
    });

    // Add additional stats for the dashboard
    const enhancedEnrollments = enrollments.map((enrollment) => {
      // Get last activity timestamp - either the enrollment update time
      // or the most recent completed lesson
      let lastActivity = enrollment.updatedAt;
      enrollment.modules.forEach((module) => {
        module.lessons.forEach((lesson) => {
          if (
            lesson.completedAt &&
            new Date(lesson.completedAt) > new Date(lastActivity)
          ) {
            lastActivity = lesson.completedAt;
          }
        });
      });

      return {
        ...enrollment.toObject(),
        lastActivity,
      };
    });

    res.json(enhancedEnrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark entire course as completed
router.post("/:courseId/complete", verifyToken, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Mark all modules and lessons as completed
    enrollment.modules.forEach((module) => {
      module.completed = true;
      module.completedAt = new Date();

      module.lessons.forEach((lesson) => {
        lesson.completed = true;
        if (!lesson.completedAt) {
          lesson.completedAt = new Date();
        }
      });
    });

    enrollment.completed = true;
    enrollment.completedAt = new Date();
    enrollment.progress = 100;

    await enrollment.save();
    res.json(enrollment);
  } catch (error) {
    console.error("Error completing course:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark a resource as completed
router.post("/:courseId/resource-complete", verifyToken, async (req, res) => {
  try {
    const { moduleId, lessonId, resourceId, timeSpent } = req.body;
    
    if (!resourceId) {
      return res.status(400).json({ message: "Resource ID is required" });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    let resourceTracked = false;
    
    // If moduleId and lessonId are provided, track the resource in that specific module/lesson
    if (moduleId && lessonId) {
      // Find the module and lesson
      const moduleIndex = enrollment.modules.findIndex(
        (m) => m.moduleId.toString() === moduleId
      );
      
      if (moduleIndex === -1) {
        return res.status(404).json({ message: "Module not found" });
      }

      const lessonIndex = enrollment.modules[moduleIndex].lessons.findIndex(
        (l) => l.lessonId.toString() === lessonId
      );
      
      if (lessonIndex === -1) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Initialize resources array if it doesn't exist
      if (!enrollment.modules[moduleIndex].lessons[lessonIndex].resources) {
        enrollment.modules[moduleIndex].lessons[lessonIndex].resources = [];
      }

      // Check if resource is already tracked
      const resourceIndex = enrollment.modules[moduleIndex].lessons[lessonIndex].resources.findIndex(
        (r) => r.resourceId.toString() === resourceId
      );

      if (resourceIndex === -1) {
        // Add new resource progress
        enrollment.modules[moduleIndex].lessons[lessonIndex].resources.push({
          resourceId,
          timeSpent: timeSpent || 0,
          completed: true,
          completedAt: Date.now()
        });
      } else {
        // Update existing resource progress
        const resource = enrollment.modules[moduleIndex].lessons[lessonIndex].resources[resourceIndex];
        resource.timeSpent = (resource.timeSpent || 0) + (timeSpent || 0);
        resource.completed = true;
        resource.completedAt = Date.now();
      }
      
      resourceTracked = true;
    } 
    
    // If the resource wasn't tracked in a specific module/lesson (or module/lesson weren't provided),
    // we'll just track it at the enrollment level
    if (!resourceTracked) {
      // Initialize completedResources array if it doesn't exist
      if (!enrollment.completedResources) {
        enrollment.completedResources = [];
      }
      
      // Check if this resource is already in the completed resources
      const existingResourceIndex = enrollment.completedResources.findIndex(
        r => r.resourceId.toString() === resourceId
      );
      
      if (existingResourceIndex === -1) {
        // Add new completed resource
        enrollment.completedResources.push({
          resourceId,
          completedAt: Date.now()
        });
      }
    }

    // Update resource completion stats
    enrollment.resourcesCompleted = enrollment.resourcesCompleted + 1 || 1;
    enrollment.resourceTimeSpent = (enrollment.resourceTimeSpent || 0) + (timeSpent || 0);
    
    // Update total time spent
    enrollment.totalTimeSpent = (enrollment.totalTimeSpent || 0) + (timeSpent || 0);

    await enrollment.save();
    res.json(enrollment);
  } catch (error) {
    console.error("Error completing resource:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
