const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * Upload an image to Cloudinary
 * @param {string} filePath - Path to the image file
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, folder = 'products') => {
  try {
    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto'
    });
    
    // Remove the local file after successful upload
    fs.unlinkSync(filePath);
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format
    };
  } catch (error) {
    // If upload fails, don't delete the local file
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

/**
 * Upload a base64 image to Cloudinary
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadBase64ToCloudinary = async (base64Image, folder = 'products') => {
  try {
    // Upload the base64 image to Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'auto'
    });
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload base64 image to Cloudinary: ${error.message}`);
  }
};

module.exports = { uploadToCloudinary, uploadBase64ToCloudinary };