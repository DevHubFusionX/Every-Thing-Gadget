-- Add categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add category_id to products table
ALTER TABLE products ADD COLUMN category_id INT NULL;
ALTER TABLE products ADD CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Insert default categories based on existing product categories
INSERT IGNORE INTO categories (name)
SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '';

-- Update products with category_id
UPDATE products p
JOIN categories c ON p.category = c.name
SET p.category_id = c.id
WHERE p.category_id IS NULL;