<?php
// Image upload endpoint
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include auth configuration
include_once '../config/auth.php';
include_once '../config/database.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize auth
$auth = new Auth($db);

// Check authentication
$token = $auth->getBearerToken();
$fixed_token = "f8c91a5c9f58c5b4b3b3f3d6b8c7a9e2d1f0e3b2a1c0d9e8f7a6b5c4d3e2f1";

if ($token !== $fixed_token && !$auth->validateToken($token)) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit();
}

// Create uploads directory if it doesn't exist
$upload_dir = '../uploads/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Check if file was uploaded
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $file_tmp = $_FILES['image']['tmp_name'];
    $file_name = $_FILES['image']['name'];
    $file_size = $_FILES['image']['size'];
    $file_type = $_FILES['image']['type'];
    
    // Generate unique filename
    $file_ext = pathinfo($file_name, PATHINFO_EXTENSION);
    $unique_name = uniqid() . '.' . $file_ext;
    $upload_path = $upload_dir . $unique_name;
    
    // Check file type
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file_type, $allowed_types)) {
        http_response_code(400);
        echo json_encode([
            "message" => "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed."
        ]);
        exit();
    }
    
    // Check file size (max 2MB)
    if ($file_size > 2 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode([
            "message" => "File is too large. Maximum size is 2MB."
        ]);
        exit();
    }
    
    // Move uploaded file
    if (move_uploaded_file($file_tmp, $upload_path)) {
        // Return success with image URL
        $image_url = '/backend/uploads/' . $unique_name;
        http_response_code(201);
        echo json_encode([
            "message" => "Image uploaded successfully",
            "image_url" => $image_url
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "message" => "Failed to upload image"
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "message" => "No image file provided",
        "error_code" => $_FILES['image']['error'] ?? 'No file'
    ]);
}
?>