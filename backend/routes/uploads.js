const express = require('express');
const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

const router = express.Router();

// Verify Cloudinary configuration
const verifyCloudinaryConfig = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary configuration is missing');
  }
};

// Configure Cloudinary
try {
  verifyCloudinaryConfig();
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configured successfully');
} catch (error) {
  console.error('Cloudinary configuration error:', error.message);
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // For thumbnails and images, allow common image formats
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    // For other resources, check specific file types
    const allowedTypes = {
      'application/pdf': true,
      'application/msword': true,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
      'video/mp4': true,
      'video/webm': true
    };

    if (allowedTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
}).single('file');

// Upload endpoint
router.post('/', verifyToken, async (req, res) => {
  try {
    // Verify Cloudinary config before processing upload
    verifyCloudinaryConfig();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('Processing upload:', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Handle thumbnails with Cloudinary
      if (req.file.mimetype.startsWith('image/')) {
        try {
          console.log('Uploading to Cloudinary...');
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'course-thumbnails',
            resource_type: 'auto'
          });
          console.log('Cloudinary upload successful:', result.secure_url);

          // Delete local file after Cloudinary upload
          await unlinkAsync(req.file.path);
          
          return res.json({
            url: result.secure_url,
            fileId: result.public_id,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype
          });
        } catch (cloudinaryError) {
          console.error('Cloudinary upload error:', cloudinaryError);
          // Clean up local file
          if (req.file.path) {
            try {
              await unlinkAsync(req.file.path);
            } catch (unlinkError) {
              console.error('Error deleting local file:', unlinkError);
            }
          }
          throw cloudinaryError;
        }
      }

      // Handle other files locally
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('File saved locally:', fileUrl);
      
      res.json({
        url: fileUrl,
        fileId: req.file.filename,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      // Clean up local file if it exists
      if (req.file && req.file.path) {
        try {
          await unlinkAsync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting local file:', unlinkError);
        }
      }
      res.status(500).json({ 
        message: error.message || 'Upload failed',
        details: error.message
      });
    }
  });
});

// Serve uploaded files
router.get('/:filename', verifyToken, (req, res) => {
  const file = path.join(uploadsDir, req.params.filename);
  res.sendFile(file);
});

// Delete file
router.delete('/:fileId', verifyToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Check if it's a Cloudinary image (thumbnails)
    if (fileId.includes('course-thumbnails/')) {
      await cloudinary.uploader.destroy(fileId);
      return res.json({ message: 'File deleted successfully' });
    }

    // For local files
    const filePath = path.join(uploadsDir, fileId);
    await unlinkAsync(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
