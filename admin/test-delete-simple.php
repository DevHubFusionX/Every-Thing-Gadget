<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple delete test
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Log everything we receive
    $debug_info = [
        'post_data' => $_POST,
        'raw_input' => file_get_contents('php://input'),
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
        'method' => $_SERVER['REQUEST_METHOD']
    ];
    
    // Check for delete action
    if (isset($_POST['action']) && $_POST['action'] === 'delete') {
        if (isset($_POST['id']) && !empty($_POST['id'])) {
            // Success case
            echo json_encode([
                'success' => true,
                'message' => 'Delete test successful',
                'received_id' => $_POST['id'],
                'debug' => $debug_info
            ]);
        } else {
            // Missing ID
            http_response_code(400);
            echo json_encode([
                'error' => true,
                'message' => 'Missing product ID',
                'debug' => $debug_info
            ]);
        }
    } else {
        // No delete action
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'No delete action found',
            'debug' => $debug_info
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
}
?>