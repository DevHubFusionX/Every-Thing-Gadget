<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database and auth configuration
include_once '../config/database.php';
include_once '../config/auth.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize auth
$auth = new Auth($db);

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit();
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Check if data is complete
if (!empty($data->username) && !empty($data->password)) {
    $username = htmlspecialchars(strip_tags($data->username));
    $password = $data->password;
    
    // Try to authenticate
    $token = $auth->authenticate($username, $password);
    
    if ($token) {
        http_response_code(200);
        echo json_encode([
            "message" => "Login successful",
            "token" => $token
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid credentials"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Username and password are required"]);
}
?>