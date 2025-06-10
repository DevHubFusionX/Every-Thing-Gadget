<?php
// Test database connection
header("Content-Type: text/html; charset=UTF-8");

// Display all errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Database Connection Test</h1>";

// Try to include database configuration
echo "<p>Loading database configuration...</p>";
try {
    include_once 'config/database.php';
    echo "<p style='color:green'>Database configuration loaded successfully.</p>";
} catch (Exception $e) {
    echo "<p style='color:red'>Error loading database configuration: " . $e->getMessage() . "</p>";
    exit;
}

// Try to create database connection
echo "<p>Connecting to database...</p>";
try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        echo "<p style='color:green'>Database connection successful!</p>";
        
        // Get database info
        echo "<h2>Database Information:</h2>";
        $stmt = $db->query("SELECT DATABASE() as db_name");
        $db_info = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "<p>- Database name: " . ($db_info['db_name'] ?? 'Unknown') . "</p>";
        
        // Check if products table exists
        echo "<h2>Checking products table...</h2>";
        $stmt = $db->query("SHOW TABLES LIKE 'products'");
        if ($stmt->rowCount() > 0) {
            echo "<p style='color:green'>- Products table exists</p>";
            
            // Count products
            $stmt = $db->query("SELECT COUNT(*) as count FROM products");
            $count = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p>- Products count: " . $count['count'] . "</p>";
            
            // Show sample product
            if ($count['count'] > 0) {
                $stmt = $db->query("SELECT * FROM products LIMIT 1");
                $product = $stmt->fetch(PDO::FETCH_ASSOC);
                echo "<h3>Sample product:</h3>";
                echo "<pre>";
                print_r($product);
                echo "</pre>";
            }
        } else {
            echo "<p style='color:red'>- Products table does NOT exist</p>";
        }
        
        // Check if categories table exists
        echo "<h2>Checking categories table...</h2>";
        $stmt = $db->query("SHOW TABLES LIKE 'categories'");
        if ($stmt->rowCount() > 0) {
            echo "<p style='color:green'>- Categories table exists</p>";
            
            // Count categories
            $stmt = $db->query("SELECT COUNT(*) as count FROM categories");
            $count = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p>- Categories count: " . $count['count'] . "</p>";
        } else {
            echo "<p style='color:red'>- Categories table does NOT exist</p>";
        }
    } else {
        echo "<p style='color:red'>Database connection failed.</p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red'>Database connection error: " . $e->getMessage() . "</p>";
}
?>