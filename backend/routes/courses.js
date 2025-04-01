const express = require('express');
const Course = require('../models/Course.js');
const { verifyToken } = require('../middleware/auth.js');
const { v2: cloudinary } = require('cloudinary');

const router = express.Router();

// Create a new course
router.post('/', verifyToken, async (req, res) => {
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
      isDraft
    } = req.body;

    // Create course with resources
    const course = new Course({
      title,
      description,
      category,
      difficulty,
      thumbnail: thumbnail ? {
        url: thumbnail.url,
        publicId: thumbnail.publicId
      } : undefined,
      instructor: req.user._id,
      resources: resources.map(resource => ({
        ...resource,
        publicId: resource.publicId,
        url: resource.url
      })),
      modules: modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          resources: lesson.resources?.map(resource => ({
            ...resource,
            publicId: resource.publicId,
            url: resource.url
          })) || []
        }))
      })),
      estimatedTotalTime,
      learningPath,
      isDraft: isDraft || false
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'username email')
      .select('title description thumbnail category difficulty estimatedTotalTime enrolledStudents');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const courses = await Course.find()
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific course with all details
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'username email')
      .populate('enrolledStudents', 'username email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update course
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Handle thumbnail update
    if (req.body.thumbnail && course.thumbnail && course.thumbnail.publicId) {
      await cloudinary.uploader.destroy(course.thumbnail.publicId);
    }

    // Handle resource updates
    if (req.body.resources) {
      // Delete removed resources from Cloudinary
      const removedResources = course.resources.filter(oldResource => 
        oldResource.publicId && 
        !req.body.resources.some(newResource => newResource.publicId === oldResource.publicId)
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
router.post('/:id/enroll', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    if (course.enrolledStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    course.enrolledStudents.push(req.user._id);
    await course.save();

    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Track progress
router.post('/:id/progress', verifyToken, async (req, res) => {
  try {
    const { moduleId, lessonId, progress } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify enrollment
    if (!course.enrolledStudents.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Update or create progress record
    const progressRecord = {
      student: req.user._id,
      moduleId,
      lessonId,
      completed: progress.completed,
      timeSpent: progress.timeSpent,
      quizScore: progress.quizScore
    };

    const existingProgress = course.progress.findIndex(
      p => p.student.toString() === req.user._id.toString() &&
           p.moduleId === moduleId &&
           p.lessonId === lessonId
    );

    if (existingProgress > -1) {
      course.progress[existingProgress] = progressRecord;
    } else {
      course.progress.push(progressRecord);
    }

    await course.save();
    res.json({ message: 'Progress updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get course progress
router.get('/:id/progress', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get user's progress
    const userProgress = course.progress.filter(
      p => p.student.toString() === req.user._id.toString()
    );

    res.json(userProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
