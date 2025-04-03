const mongoose = require('mongoose');

const resourceProgressSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
});

const lessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  resources: [resourceProgressSchema]
});

const moduleProgressSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  lessons: [lessonProgressSchema],
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
});

// Schema for tracking course-level resources (not tied to a specific module/lesson)
const completedResourceSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completedAt: Date,
  timeSpent: {
    type: Number, // in minutes
    default: 0
  }
});

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  modules: [moduleProgressSchema],
  resourcesCompleted: {
    type: Number,
    default: 0
  },
  resourceTimeSpent: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  // Array to track course-level resources (not tied to a specific module/lesson)
  completedResources: [completedResourceSchema],
  progress: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
}, {
  timestamps: true
});

// Create a compound index for user and course to ensure unique enrollments
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
