<?php
// Products by category API endpoint
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Prevent PHP errors from breaking JSON
ini_set('display_errors', 0);

// Get category ID from query parameter
$category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : null;

if (!$category_id) {
    http_response_code(400);
    echo json_encode(["message" => "Category ID is required"]);
    exit();
}

try {
    // Include database configuration
    include_once '../config/database.php';
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    // Query to get products by category
    $query = "SELECT p.*, c.name as category_name 
              FROM products p 
              JOIN categories c ON p.category_id = c.id 
              WHERE p.category_id = :category_id 
              ORDER BY p.name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':category_id', $category_id);
    $stmt->execute();
    
    // Create products array
    $products_arr = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Use category_name from join
        $row['category'] = $row['category_name'];
        unset($row['category_name']);
        
        $products_arr[] = $row;
    }
    
    // Return success with products array
    http_response_code(200);
    echo json_encode($products_arr);
    
} catch (Exception $e) {
    // Return error as JSON
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>