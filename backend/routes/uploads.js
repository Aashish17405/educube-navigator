const express = require('express');
const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const imagekit = require('../config/imagekit');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/x-bibtex',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, BibTeX, images, and videos are allowed.'));
    }
  }
}).single('file');

// Upload endpoint
router.post('/', verifyToken, async (req, res) => {
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
        size: req.file.size,
        path: req.file.path
      });

      try {
        // Use Cloudinary for images
        if (req.file.mimetype.startsWith('image/')) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'course-resources',
            resource_type: 'image'
          });
          await unlinkAsync(req.file.path);
          
          return res.json({
            url: result.secure_url,
            publicId: result.public_id,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            provider: 'cloudinary'
          });
        }
        
        // Use ImageKit for other files
        const fileBuffer = await fs.promises.readFile(req.file.path);
        const fileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        // Upload file to ImageKit
        const result = await imagekit.upload({
          file: fileBuffer,
          fileName: fileName,
          folder: '/course-resources',
          useUniqueFileName: true
        });

        await unlinkAsync(req.file.path);

        // For PDFs, append the PDF viewer transformation to the URL
        const fileUrl = req.file.mimetype === 'application/pdf' 
          ? `${result.url}?tr=orig-true`
          : result.url;

        return res.json({
          url: fileUrl,
          publicId: result.fileId,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          provider: 'imagekit'
        });

      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        if (req.file.path) {
          try {
            await unlinkAsync(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting local file:', unlinkError);
          }
        }
        throw uploadError;
      }
    } catch (error) {
      console.error('Upload processing error:', error);
      return res.status(500).json({ message: error.message });
    }
  });
});

module.exports = router;
