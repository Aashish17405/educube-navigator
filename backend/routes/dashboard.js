const express = require("express");
const { verifyToken } = require("../middleware/auth");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Resource = require("../models/Resource");

const router = express.Router();

// Get dashboard data
router.get("/", verifyToken, async (req, res) => {
  try {
    // Get enrollments with course details
    const enrollments = await Enrollment.find({ user: req.user._id }).populate(
      "course",
      "title description thumbnail category"
    );

    // Get available courses (not enrolled)
    const enrolledCourseIds = enrollments.map(
      (enrollment) => enrollment.course._id
    );
    const availableCourses = await Course.find({
      _id: { $nin: enrolledCourseIds },
      isDraft: false,
    }).populate("instructor", "username");

    // Calculate stats
    const totalTimeSpent = enrollments.reduce(
      (total, enrollment) => total + enrollment.totalTimeSpent,
      0
    );
    const coursesInProgress = enrollments.filter(
      (e) => e.progress > 0 && e.progress < 100
    ).length;
    const completedCourses = enrollments.filter((e) => e.completed).length;
    const averageProgress =
      enrollments.length > 0
        ? enrollments.reduce(
            (total, enrollment) => total + enrollment.progress,
            0
          ) / enrollments.length
        : 0;

    // Get recent resources
    const recentResources = await Resource.find({
      course: { $in: enrollments.map((e) => e.course._id) },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("course", "title");

    console.log(`Found ${recentResources.length} recent resources`);

    res.json({
      enrollments,
      availableCourses,
      recentResources,
      stats: {
        totalTimeSpent,
        coursesInProgress,
        completedCourses,
        averageProgress,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
