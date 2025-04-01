const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'word', 'excel', 'bibtex', 'link', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Allow both Cloudinary/ImageKit publicIds and our external link IDs
        return v.length > 0;
      },
      message: 'PublicId cannot be empty'
    }
  },
  fileName: String,
  mimeType: String,
  estimatedTime: {
    type: Number,
    default: 0
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const quizSchema = new mongoose.Schema({
  title: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    points: Number
  }],
  passingScore: Number,
  timeLimit: Number
});

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'quiz', 'reading', 'assignment'],
    required: true
  },
  content: String,
  resources: [resourceSchema],
  quiz: quizSchema,
  estimatedTime: Number,
  completionCriteria: {
    type: String,
    enum: ['view', 'quiz', 'time'],
    required: true
  },
  requiredScore: Number,
  requiredTime: Number
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  lessons: [lessonSchema],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }]
});

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moduleId: {
    type: String,
    required: true
  },
  lessonId: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  quizScore: Number,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  thumbnail: {
    url: String,
    publicId: String
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resources: [resourceSchema],
  modules: [moduleSchema],
  estimatedTotalTime: Number,
  learningPath: [{
    moduleId: String,
    requiredModules: [String]
  }],
  progress: [progressSchema],
  isDraft: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', courseSchema);
