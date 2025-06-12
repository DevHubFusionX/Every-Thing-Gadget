const { pool } = require('./db');

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Check if cloudinary_id column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'cloudinary_id'
    `);
    
    // Add cloudinary_id column if it doesn't exist
    if (columns.length === 0) {
      console.log('Adding cloudinary_id column to products table...');
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN cloudinary_id VARCHAR(255) DEFAULT NULL 
        AFTER image_url
      `);
      console.log('Migration completed successfully');
    } else {
      console.log('cloudinary_id column already exists');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

module.exports = { runMigrations };