const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Save a base64 image to the uploads directory
 * @param {string} base64Image - Base64 encoded image string
 * @returns {string} - Path to the saved image
 */
function saveBase64Image(base64Image) {
  // Remove header from base64 string if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  
  // Generate a unique filename
  const filename = crypto.randomBytes(6).toString('hex') + '.jpg';
  const filepath = path.join(uploadsDir, filename);
  
  // Write the file
  fs.writeFileSync(filepath, base64Data, { encoding: 'base64' });
  
  // Return the relative path for storage in the database
  return `/uploads/${filename}`;
}

module.exports = { saveBase64Image };