const express = require("express");
const Course = require("../models/Course.js");
const Enrollment = require("../models/Enrollment.js");
const { verifyToken } = require("../middleware/auth.js");
const { v2: cloudinary } = require("cloudinary");

const router = express.Router();

// Create a new course
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      thumbnail,
      modules,
      resources,
      estimatedTotalTime,
      learningPath,
      isDraft,
    } = req.body;

    // Create course with resources
    const course = new Course({
      title,
      description,
      category,
      difficulty,
      thumbnail: thumbnail
        ? {
            url: thumbnail.url,
            publicId: thumbnail.publicId,
          }
        : undefined,
      instructor: req.user._id,
      resources: resources.map((resource) => ({
        ...resource,
        publicId: resource.publicId,
        url: resource.url,
      })),
      modules: modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          resources:
            lesson.resources?.map((resource) => ({
              ...resource,
              publicId: resource.publicId,
              url: resource.url,
            })) || [],
        })),
      })),
      estimatedTotalTime,
      learningPath,
      isDraft: isDraft || false,
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all courses
router.get("/", verifyToken, async (req, res) => {
  try {
    // Get basic course data
    const courses = await Course.find({ isDraft: false })
      .populate("instructor", "username email")
      .select(
        "title description thumbnail category difficulty estimatedTotalTime enrolledStudents"
      );

    // Check if the current user is enrolled in each course
    const coursesWithEnrollmentStatus = await Promise.all(
      courses.map(async (course) => {
        // Convert to a plain object so we can add properties
        const courseObj = course.toObject();

        // Check if user is enrolled (either through the course object or by checking enrollments)
        courseObj.isEnrolled = course.enrolledStudents.some(
          (studentId) => studentId.toString() === req.user?._id.toString()
        );

        return courseObj;
      })
    );

    res.json(coursesWithEnrollmentStatus);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get instructor's courses - MOVED BEFORE /:id route to prevent route conflicts
router.get("/instructor", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Not authorized as instructor" });
    }

    const courses = await Course.find({ instructor: req.user._id });

    // Get enrollment data for each course
    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.find({ course: course._id });
        const completedEnrollments = enrollments.filter((e) => e.completed);

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          category: course.category,
          enrollmentCount: enrollments.length,
          completionCount: completedEnrollments.length,
          completionRate:
            enrollments.length > 0
              ? (completedEnrollments.length / enrollments.length) * 100
              : 0,
          avgProgress:
            enrollments.length > 0
              ? enrollments.reduce((sum, e) => sum + e.progress, 0) /
                enrollments.length
              : 0,
          totalModules: course.modules.length,
          totalLessons: course.modules.reduce(
            (sum, module) => sum + module.lessons.length,
            0
          ),
          totalResources: course.resources.length,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        };
      })
    );

    res.json(courseStats);
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get instructor dashboard statistics - MOVED BEFORE /:id route to prevent route conflicts
router.get("/instructor/stats", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Not authorized as instructor" });
    }

    // Get all courses by this instructor
    const courses = await Course.find({ instructor: req.user._id });
    const courseIds = courses.map((course) => course._id);

    // Get all enrollments for these courses
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });

    // Calculate total enrollments and completions
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter((e) => e.completed);
    const totalCompletions = completedEnrollments.length;

    // Calculate average completion rate
    const avgCompletionRate =
      totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEnrollments = enrollments.filter(
      (e) => new Date(e.createdAt) >= thirtyDaysAgo
    ).length;

    // Get course stats for sorting
    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const courseEnrollments = enrollments.filter(
          (e) => e.course.toString() === course._id.toString()
        );
        const courseCompletions = courseEnrollments.filter((e) => e.completed);

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          category: course.category,
          enrollmentCount: courseEnrollments.length,
          completionCount: courseCompletions.length,
          completionRate:
            courseEnrollments.length > 0
              ? (courseCompletions.length / courseEnrollments.length) * 100
              : 0,
          avgProgress:
            courseEnrollments.length > 0
              ? courseEnrollments.reduce((sum, e) => sum + e.progress, 0) /
                courseEnrollments.length
              : 0,
          totalModules: course.modules.length,
          totalLessons: course.modules.reduce(
            (sum, module) => sum + module.lessons.length,
            0
          ),
          totalResources: course.resources.length,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        };
      })
    );

    // Sort for highest enrollment and lowest completion
    const coursesWithHighestEnrollment = [...courseStats]
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 3);

    const coursesWithLowestCompletion = [...courseStats]
      .filter((course) => course.enrollmentCount > 0) // Only consider courses with enrollments
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 3);

    res.json({
      totalCourses: courses.length,
      totalEnrollments,
      totalCompletions,
      avgCompletionRate,
      recentEnrollments,
      coursesWithHighestEnrollment,
      coursesWithLowestCompletion,
    });
  } catch (error) {
    console.error("Error fetching instructor stats:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific course with all details
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "username email")
      .populate("enrolledStudents", "username email");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update course
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Handle thumbnail update
    if (req.body.thumbnail && course.thumbnail && course.thumbnail.publicId) {
      await cloudinary.uploader.destroy(course.thumbnail.publicId);
    }

    // Handle resource updates
    if (req.body.resources) {
      // Delete removed resources from Cloudinary
      const removedResources = course.resources.filter(
        (oldResource) =>
          oldResource.publicId &&
          !req.body.resources.some(
            (newResource) => newResource.publicId === oldResource.publicId
          )
      );

      for (const resource of removedResources) {
        if (resource.publicId) {
          await cloudinary.uploader.destroy(resource.publicId);
        }
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enroll in a course
router.post("/:id/enroll", verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if already enrolled
    if (course.enrolledStudents.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this course" });
    }

    course.enrolledStudents.push(req.user._id);
    await course.save();

    res.json({ message: "Successfully enrolled in course" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Track progress
router.post("/:id/progress", verifyToken, async (req, res) => {
  try {
    const { moduleId, lessonId, progress } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify enrollment
    if (!course.enrolledStudents.includes(req.user._id)) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    // Update or create progress record
    const progressRecord = {
      student: req.user._id,
      moduleId,
      lessonId,
      completed: progress.completed,
      timeSpent: progress.timeSpent,
      quizScore: progress.quizScore,
    };

    const existingProgress = course.progress.findIndex(
      (p) =>
        p.student.toString() === req.user._id.toString() &&
        p.moduleId === moduleId &&
        p.lessonId === lessonId
    );

    if (existingProgress > -1) {
      course.progress[existingProgress] = progressRecord;
    } else {
      course.progress.push(progressRecord);
    }

    await course.save();
    res.json({ message: "Progress updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get course progress
router.get("/:id/progress", verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Get user's progress
    const userProgress = course.progress.filter(
      (p) => p.student.toString() === req.user._id.toString()
    );

    res.json(userProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a course (instructors only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify the user is the instructor who created the course
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this course" });
    }

    // Delete any enrollments related to this course
    await Enrollment.deleteMany({ course: course._id });

    // Delete the course itself
    await Course.findByIdAndDelete(req.params.id);

    // Clean up any Cloudinary resources if needed
    if (course.thumbnail && course.thumbnail.publicId) {
      await cloudinary.uploader.destroy(course.thumbnail.publicId);
    }

    // Clean up other resources if needed
    if (course.resources && course.resources.length > 0) {
      for (const resource of course.resources) {
        if (
          resource.publicId &&
          (resource.publicId.startsWith("educube/") ||
            resource.provider === "cloudinary")
        ) {
          await cloudinary.uploader.destroy(resource.publicId);
        }
      }
    }

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
