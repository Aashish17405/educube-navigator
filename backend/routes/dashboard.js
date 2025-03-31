const express = require('express');
const { verifyToken } = require('../middleware/auth');
const Course = require('../models/Course');
const Resource = require('../models/Resource');
const Progress = require('../models/Progress');

const router = express.Router();

// Get dashboard data
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('Fetching dashboard data for user:', req.user._id);

    // Get courses where user is enrolled or is instructor
    const courses = await Course.find({
      $or: [
        { students: req.user._id },
        { instructor: req.user._id }
      ]
    }).populate('instructor', 'username');

    console.log(`Found ${courses.length} courses for user`);

    // Get progress for each course
    const progress = await Progress.find({
      student: req.user._id,
      course: { $in: courses.map(c => c._id) }
    });

    console.log(`Found ${progress.length} progress records`);

    // Calculate statistics
    const totalTimeSpent = progress.reduce((total, p) => total + (p.timeSpent || 0), 0);
    const coursesInProgress = progress.filter(p => p.progress > 0 && p.progress < 100).length;
    const completedCourses = progress.filter(p => p.progress === 100).length;
    const quizzes = progress.filter(p => p.quizScore !== undefined);
    const averageQuizScore = quizzes.length > 0 
      ? Math.round(quizzes.reduce((total, p) => total + p.quizScore, 0) / quizzes.length)
      : 0;

    // Get recent resources
    const recentResources = await Resource.find({
      course: { $in: courses.map(c => c._id) }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('course', 'title');

    console.log(`Found ${recentResources.length} recent resources`);

    res.json({
      courses,
      progress,
      recentResources,
      stats: {
        totalTimeSpent,
        coursesInProgress,
        completedCourses,
        averageQuizScore
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
