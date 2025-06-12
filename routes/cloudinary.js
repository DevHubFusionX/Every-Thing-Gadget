const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

// Verify if an image exists in Cloudinary
router.get('/verify-image', async (req, res) => {
  try {
    const { public_id, url } = req.query;
    
    if (!public_id && !url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either public_id or url parameter is required' 
      });
    }
    
    // If URL is provided, extract public_id from it
    let imageId = public_id;
    if (!imageId && url) {
      // Extract public_id from Cloudinary URL
      const matches = url.match(/\/v\d+\/([^/]+)(?:\.\w+)?$/);
      imageId = matches ? matches[1] : null;
    }
    
    if (!imageId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not determine public_id' 
      });
    }
    
    // Check if the image exists in Cloudinary
    const result = await cloudinary.api.resource(imageId);
    
    res.json({
      success: true,
      exists: true,
      details: {
        public_id: result.public_id,
        format: result.format,
        url: result.secure_url,
        created_at: result.created_at
      }
    });
  } catch (error) {
    // If the image doesn't exist, Cloudinary will throw an error
    if (error.http_code === 404) {
      return res.json({
        success: true,
        exists: false,
        message: 'Image not found in Cloudinary'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;