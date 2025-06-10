<?php
// Simple API proxy that uses local file inclusion only
ob_start();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Clear any previous output
ob_clean();

// Get the endpoint from the URL parameter
$endpoint = $_GET['endpoint'] ?? 'products.php';

// Build the target path - only use local file inclusion
$possiblePaths = [
    '../api/' . $endpoint,
    '../../api/' . $endpoint
];

$targetPath = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        $targetPath = $path;
        break;
    }
}

if ($targetPath) {
    // Set any additional query parameters for the included file
    $queryParams = $_GET;
    unset($queryParams['endpoint']);
    
    // Merge query parameters into $_GET for the included file
    foreach ($queryParams as $key => $value) {
        $_GET[$key] = $value;
    }
    
    // Include the local API file
    include $targetPath;
} else {
    http_response_code(404);
    echo json_encode([
        "error" => true,
        "message" => "API endpoint not found: " . $endpoint,
        "searched_paths" => $possiblePaths
    ]);
}
?>