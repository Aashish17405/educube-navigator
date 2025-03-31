const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const Resource = require('../models/Resource');
const Course = require('../models/Course');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

let gfs;
let upload;

// Initialize GridFS and storage after MongoDB connection is established
mongoose.connection.once('open', () => {
  console.log('Initializing GridFS...');
  
  // Initialize GridFS stream
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection('resources');

  // Create GridFS storage engine
  const storage = new GridFsStorage({
    db: mongoose.connection,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
      console.log('Processing file upload:', file.originalname);
      return {
        bucketName: 'resources',
        filename: `${Date.now()}-${file.originalname}`
      };
    }
  });

  // Initialize multer upload
  upload = multer({ storage });
  console.log('GridFS initialization complete');
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
router.post('/', verifyToken, (req, res) => {
  if (!upload) {
    console.error('Upload middleware not initialized');
    return res.status(500).json({ message: 'Server not ready for file uploads' });
  }

  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Error in file upload:', err);
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('File uploaded successfully:', req.file);

      const { title, description, type, courseId, estimatedTime } = req.body;

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      const resource = new Resource({
        title,
        description,
        type,
        fileId: req.file.id,
        fileName: req.file.filename,
        mimeType: req.file.contentType,
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
      
      // If there's an error, delete the uploaded file
      if (req.file && req.file.id) {
        try {
          const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'resources'
          });
          await bucket.delete(req.file.id);
          console.log('Cleaned up uploaded file:', req.file.id);
        } catch (deleteError) {
          console.error('Error deleting file after failed resource creation:', deleteError);
        }
      }

      res.status(400).json({ message: error.message });
    }
  });
});

// Download a resource
router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    console.log('Downloading resource:', req.params.id);
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      console.error('Resource not found:', req.params.id);
      return res.status(404).json({ message: 'Resource not found' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'resources'
    });

    const downloadStream = bucket.openDownloadStream(resource.fileId);

    res.set('Content-Type', resource.mimeType);
    res.set('Content-Disposition', `attachment; filename="${resource.fileName}"`);

    downloadStream.on('error', (error) => {
      console.error('Error in download stream:', error);
      res.status(500).json({ message: 'Error downloading file' });
    });

    downloadStream.pipe(res);
    console.log('Download stream started for:', resource.fileName);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ message: error.message });
  }
});

// View a resource (streaming)
router.get('/:id/view', verifyToken, async (req, res) => {
  try {
    console.log('Viewing resource:', req.params.id);
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      console.error('Resource not found:', req.params.id);
      return res.status(404).json({ message: 'Resource not found' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'resources'
    });

    const downloadStream = bucket.openDownloadStream(resource.fileId);

    res.set('Content-Type', resource.mimeType);

    downloadStream.on('error', (error) => {
      console.error('Error in view stream:', error);
      res.status(500).json({ message: 'Error viewing file' });
    });

    downloadStream.pipe(res);
    console.log('View stream started for:', resource.fileName);
  } catch (error) {
    console.error('Error viewing resource:', error);
    res.status(500).json({ message: error.message });
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

    // Delete file from GridFS
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'resources'
    });
    await bucket.delete(resource.fileId);
    console.log('Deleted file from GridFS:', resource.fileId);

    // Delete resource document
    await Resource.deleteOne({ _id: req.params.id });
    console.log('Deleted resource document:', req.params.id);

    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
