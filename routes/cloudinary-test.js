const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

// Serve the test page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/cloudinary-test.html'));
});

// API endpoint to test Cloudinary connection
router.get('/api/test', async (req, res) => {
  try {
    // Test the connection
    const pingResult = await cloudinary.api.ping();
    
    // Upload a test image
    const uploadResult = await cloudinary.uploader.upload(
      'https://cloudinary-res.cloudinary.com/image/upload/cloudinary_logo.png',
      { folder: 'test' }
    );
    
    // Return success with details
    res.json({
      success: true,
      connection: {
        status: pingResult.status,
        message: 'Cloudinary connection successful'
      },
      upload: {
        success: true,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    });
    
    // Clean up the test image asynchronously
    cloudinary.uploader.destroy(uploadResult.public_id)
      .catch(err => console.error('Error cleaning up test image:', err));
      
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;