<?php
// Script to create admin user with fixed token
header("Content-Type: application/json; charset=UTF-8");

// Include database configuration
include_once '../config/database.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Check if database connection is successful
if (!$db) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection failed"]);
    exit();
}

// Create users table if not exists
$create_users_table_query = "
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  api_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

try {
    $db->exec($create_users_table_query);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Failed to create users table",
        "error" => $e->getMessage()
    ]);
    exit();
}

// Fixed token for testing
$fixed_token = "f8c91a5c9f58c5b4b3b3f3d6b8c7a9e2d1f0e3b2a1c0d9e8f7a6b5c4d3e2f1";

// Check if admin user exists
$check_admin_query = "SELECT id FROM users WHERE username = 'admin' LIMIT 1";
$stmt = $db->prepare($check_admin_query);
$stmt->execute();

if ($stmt->rowCount() == 0) {
    // Insert admin user with fixed token
    $insert_admin_query = "
    INSERT INTO users (username, password, api_token) VALUES 
    ('admin', :password, :token)
    ";
    
    $hashed_password = password_hash('admin123', PASSWORD_DEFAULT);
    
    $stmt = $db->prepare($insert_admin_query);
    $stmt->bindParam(':password', $hashed_password);
    $stmt->bindParam(':token', $fixed_token);
    
    try {
        $stmt->execute();
        echo json_encode([
            "message" => "Admin user created successfully",
            "username" => "admin",
            "password" => "admin123",
            "token" => $fixed_token
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Failed to create admin user",
            "error" => $e->getMessage()
        ]);
    }
} else {
    // Update existing admin user with fixed token
    $update_admin_query = "
    UPDATE users SET api_token = :token WHERE username = 'admin'
    ";
    
    $stmt = $db->prepare($update_admin_query);
    $stmt->bindParam(':token', $fixed_token);
    
    try {
        $stmt->execute();
        echo json_encode([
            "message" => "Admin user token updated successfully",
            "username" => "admin",
            "password" => "admin123",
            "token" => $fixed_token
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Failed to update admin token",
            "error" => $e->getMessage()
        ]);
    }
}
?>