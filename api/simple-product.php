<?php
// File: backend/api/simple-product.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Enable error display
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Just return success for testing
    http_response_code(201);
    echo json_encode([
        "message" => "Product created successfully",
        "id" => 999
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>