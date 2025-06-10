<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    // Test database connection
    include_once '../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        echo json_encode([
            "status" => "success",
            "message" => "Database connection successful",
            "timestamp" => date('Y-m-d H:i:s')
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Database connection failed"
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>