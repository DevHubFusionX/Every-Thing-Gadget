-- Add cloudinary_id column to products table
ALTER TABLE products ADD COLUMN cloudinary_id VARCHAR(255) DEFAULT NULL AFTER image_url;