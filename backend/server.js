require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.js');
const courseRoutes = require('./routes/courses.js');
const resourcesRoutes = require('./routes/resources.js');
const uploadRoutes = require('./routes/uploads.js');
const dashboardRoutes = require('./routes/dashboard.js');
const imagekitRoutes = require('./routes/imagekit.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/imagekit', imagekitRoutes);

// Log environment variables (without secrets)
console.log('Environment configuration:', {
  port: process.env.PORT,
  mongoUri: process.env.MONGODB_URI?.split('@')[1], // Only show host part
  cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME,
  imagekitConfigured: !!process.env.IMAGEKIT_PUBLIC_KEY
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
