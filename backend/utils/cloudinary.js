import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (file) => {
  try {
    // Create a temporary file path
    const tempFilePath = file.tempFilePath;

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(tempFilePath, {
      resource_type: 'auto',
      folder: 'educube/resources'
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete file');
  }
};
