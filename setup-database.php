<?php
// File: backend/setup-database.php
header("Content-Type: text/html; charset=UTF-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);

include_once 'config/database.php';

echo "<h1>Database Setup</h1>";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    echo "<p>Connected to database successfully.</p>";
    
    // Create categories table
    $categories_sql = "
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $db->exec($categories_sql);
    echo "<p>Categories table created successfully.</p>";
    
    // Create products table
    $products_sql = "
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100),
      category_id INT,
      image_url VARCHAR(255),
      stock_quantity INT DEFAULT 0,
      sku VARCHAR(50) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $db->exec($products_sql);
    echo "<p>Products table created successfully.</p>";
    
    // Insert default categories
    $categories = [
        'Phones',
        'Gaming Laptop',
        'Accessories',
        'Gaming Consoles',
        'Gaming Accessories',
        'Content Tools',
        'Monitor',
        'Laptops'
    ];
    
    $insert_count = 0;
    foreach ($categories as $category) {
        $stmt = $db->prepare("INSERT IGNORE INTO categories (name) VALUES (?)");
        $stmt->execute([$category]);
        $insert_count += $stmt->rowCount();
    }
    
    echo "<p>Added $insert_count categories.</p>";
    
    // Add sample products
    $sample_products = [
        [
            "name" => "iPhone 13 Pro",
            "description" => "Latest smartphone with advanced camera system",
            "price" => 999.99,
            "category" => "Phones",
            "image_url" => "/backend/uploads/sample-phone.jpg",
            "stock_quantity" => 15,
            "sku" => "PHONE-001"
        ],
        [
            "name" => "Gaming Laptop Alienware",
            "description" => "High-performance gaming laptop with RTX 3080",
            "price" => 2199.99,
            "category" => "Gaming Laptop",
            "image_url" => "/backend/uploads/sample-laptop.jpg",
            "stock_quantity" => 8,
            "sku" => "GLAPTOP-001"
        ],
        [
            "name" => "Wireless Earbuds",
            "description" => "Premium wireless earbuds with noise cancellation",
            "price" => 149.99,
            "category" => "Accessories",
            "image_url" => "/backend/uploads/sample-earbuds.jpg",
            "stock_quantity" => 30,
            "sku" => "ACC-001"
        ],
        [
            "name" => "PlayStation 5",
            "description" => "Next-gen gaming console with ultra-fast SSD",
            "price" => 499.99,
            "category" => "Gaming Consoles",
            "image_url" => "/backend/uploads/sample-console.jpg",
            "stock_quantity" => 5,
            "sku" => "CONSOLE-001"
        ],
        [
            "name" => "Gaming Mouse",
            "description" => "High-precision gaming mouse",
            "price" => 79.99,
            "category" => "Gaming Accessories",
            "image_url" => "/backend/uploads/sample-mouse.jpg",
            "stock_quantity" => 25,
            "sku" => "GACC-001"
        ],
        [
            "name" => "Adobe Creative Cloud",
            "description" => "Suite of creative tools for content creators",
            "price" => 52.99,
            "category" => "Content Tools",
            "image_url" => "/backend/uploads/sample-adobe.jpg",
            "stock_quantity" => 100,
            "sku" => "CONTENT-001"
        ],
        [
            "name" => "4K Monitor",
            "description" => "Ultra-wide 4K monitor for immersive viewing",
            "price" => 499.99,
            "category" => "Monitor",
            "image_url" => "/backend/uploads/sample-monitor.jpg",
            "stock_quantity" => 10,
            "sku" => "MON-001"
        ],
        [
            "name" => "MacBook Pro",
            "description" => "Apple's professional laptop with M1 chip",
            "price" => 1299.99,
            "category" => "Laptops",
            "image_url" => "/backend/uploads/sample-macbook.jpg",
            "stock_quantity" => 12,
            "sku" => "LAPTOP-001"
        ]
    ];
    
    // Get category IDs
    $stmt = $db->query("SELECT id, name FROM categories");
    $categories = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categories[$row['name']] = $row['id'];
    }
    
    // Insert sample products
    $product_count = 0;
    foreach ($sample_products as $product) {
        try {
            $category_id = $categories[$product['category']] ?? null;
            
            $stmt = $db->prepare("INSERT IGNORE INTO products 
                (name, description, price, category, category_id, image_url, stock_quantity, sku) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                
            $stmt->execute([
                $product['name'],
                $product['description'],
                $product['price'],
                $product['category'],
                $category_id,
                $product['image_url'],
                $product['stock_quantity'],
                $product['sku']
            ]);
            
            $product_count += $stmt->rowCount();
        } catch (Exception $e) {
            echo "<p style='color:orange'>Warning: " . $e->getMessage() . "</p>";
        }
    }
    
    echo "<p>Added $product_count sample products.</p>";
    echo "<p>Database setup completed successfully!</p>";
    
    echo "<p><a href='admin/' class='btn btn-primary'>Go to Admin Panel</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
?>