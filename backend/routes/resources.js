const express = require('express');
const multer = require('multer');
const ImageKit = require('imagekit');
const Resource = require('../models/Resource');
const Course = require('../models/Course');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all resources
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('Fetching all resources...');
    const resources = await Resource.find()
      .populate('author', 'username')
      .populate('course', 'title');
    console.log(`Found ${resources.length} resources`);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload a new resource
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Processing file upload:', req.file.originalname);

    const { title, description, type, courseId, estimatedTime } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Upload file to ImageKit
    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: 'resources'
    });

    console.log('File uploaded to ImageKit:', result);

    // Create resource document
    const resource = new Resource({
      title,
      description,
      type,
      url: result.url,
      fileId: result.fileId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      estimatedTime,
      author: req.user._id,
      course: courseId
    });

    console.log('Creating resource document:', resource);

    const newResource = await resource.save();
    await newResource.populate('author', 'username');
    await newResource.populate('course', 'title');

    console.log('Resource created successfully:', newResource._id);
    res.status(201).json(newResource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a resource
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    console.log('Deleting resource:', req.params.id);
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      console.error('Resource not found:', req.params.id);
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user is the author or an instructor
    if (resource.author.toString() !== req.user._id.toString() && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete file from ImageKit
    if (resource.fileId) {
      try {
        await imagekit.deleteFile(resource.fileId);
        console.log('Deleted file from ImageKit:', resource.fileId);
      } catch (deleteError) {
        console.error('Error deleting file from ImageKit:', deleteError);
      }
    }

    // Delete resource document
    await Resource.findByIdAndDelete(req.params.id);
    console.log('Resource deleted successfully');
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
