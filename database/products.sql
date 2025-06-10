-- Create database
CREATE DATABASE IF NOT EXISTS ecommerce;
USE ecommerce;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url VARCHAR(255),
  stock_quantity INT NOT NULL DEFAULT 0,
  sku VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create users table for API authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  api_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, password, api_token) VALUES 
('admin', '$2y$10$8WxmVFNDxkXO9nK5EvUOXuHqGRFIVEXZJLNu7KMt/wftB4kzDa.Hy', 'f8c91a5c9f58c5b4b3b3f3d6b8c7a9e2d1f0e3b2a1c0d9e8f7a6b5c4d3e2f1');

-- Insert sample products
INSERT INTO products (name, description, price, category, image_url, stock_quantity, sku) VALUES
('Premium Laptop', 'High-performance laptop for professionals', 1299.99, 'Laptops', '/products/laptop.jpg', 15, 'TECH-LAP-001'),
('Wireless Earbuds', 'Premium wireless earbuds with noise cancellation', 149.99, 'Accessories', '/products/earbuds.jpg', 30, 'TECH-EAR-002'),
('4K Monitor', 'Ultra-wide 4K monitor for immersive viewing', 499.99, 'Monitor', '/products/monitor.jpg', 10, 'TECH-MON-003'),
('Gaming Mouse', 'High-precision gaming mouse', 79.99, 'Gaming Accessories', '/products/mouse.jpg', 0, 'TECH-MOU-004'),
('iPhone 13 Pro', 'Latest smartphone with advanced camera system', 999.99, 'Phones', '/products/phone.jpg', 8, 'TECH-PHO-005');