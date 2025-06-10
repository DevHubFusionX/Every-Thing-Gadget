<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    include_once '../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    // Check if products table exists
    $stmt = $db->query("SHOW TABLES LIKE 'products'");
    $tableExists = $stmt->rowCount() > 0;
    
    $result = [
        "database_connected" => true,
        "products_table_exists" => $tableExists
    ];
    
    if ($tableExists) {
        // Count products
        $stmt = $db->query("SELECT COUNT(*) as count FROM products");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        $result["products_count"] = $count;
        
        // Get first few products
        $stmt = $db->query("SELECT * FROM products LIMIT 3");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result["sample_products"] = $products;
        
        // Check table structure
        $stmt = $db->query("DESCRIBE products");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result["table_structure"] = $columns;
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        "error" => true,
        "message" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>