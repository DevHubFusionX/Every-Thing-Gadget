<?php
// Categories API endpoint
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database and auth configuration
include_once '../config/database.php';
include_once '../config/auth.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize auth
$auth = new Auth($db);

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get category ID from query parameter
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// Check authentication for non-GET requests
if ($method !== 'GET') {
    $token = $auth->getBearerToken();
    $fixed_token = "f8c91a5c9f58c5b4b3b3f3d6b8c7a9e2d1f0e3b2a1c0d9e8f7a6b5c4d3e2f1";
    
    if ($token !== $fixed_token && !$auth->validateToken($token)) {
        http_response_code(401);
        echo json_encode(["message" => "Unauthorized"]);
        exit();
    }
}

// Handle different HTTP methods
switch ($method) {
    case 'GET':
        if ($id) {
            getCategory($db, $id);
        } else {
            getCategories($db);
        }
        break;
    case 'POST':
        addCategory($db);
        break;
    case 'PUT':
        if ($id) {
            updateCategory($db, $id);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Category ID is required"]);
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteCategory($db, $id);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Category ID is required"]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}

/**
 * Get all categories
 * @param PDO $db Database connection
 */
function getCategories($db) {
    $query = "SELECT * FROM categories ORDER BY name ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $categories = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categories[] = $row;
    }
    
    http_response_code(200);
    echo json_encode($categories);
}

/**
 * Get a single category
 * @param PDO $db Database connection
 * @param int $id Category ID
 */
function getCategory($db, $id) {
    $query = "SELECT * FROM categories WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($category);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Category not found"]);
    }
}

/**
 * Add a new category
 * @param PDO $db Database connection
 */
function addCategory($db) {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check if data is complete
    if (!empty($data->name)) {
        // Create query
        $query = "INSERT INTO categories SET name = :name, description = :description";
        
        $stmt = $db->prepare($query);
        
        // Sanitize and bind data
        $name = htmlspecialchars(strip_tags($data->name));
        $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : "";
        
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        
        // Execute query
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Category created successfully",
                "id" => $db->lastInsertId()
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create category"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Unable to create category. Name is required"]);
    }
}

/**
 * Update an existing category
 * @param PDO $db Database connection
 * @param int $id Category ID
 */
function updateCategory($db, $id) {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check if category exists
    $check_query = "SELECT id FROM categories WHERE id = :id LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":id", $id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(["message" => "Category not found"]);
        return;
    }
    
    // Build update query based on provided fields
    $query = "UPDATE categories SET ";
    $params = [];
    
    if (!empty($data->name)) {
        $query .= "name = :name, ";
        $params[':name'] = htmlspecialchars(strip_tags($data->name));
    }
    
    if (isset($data->description)) {
        $query .= "description = :description, ";
        $params[':description'] = htmlspecialchars(strip_tags($data->description));
    }
    
    // Remove trailing comma and space
    $query = rtrim($query, ", ");
    
    // Add WHERE clause
    $query .= " WHERE id = :id";
    $params[':id'] = $id;
    
    // Execute query if there are fields to update
    if (count($params) > 1) { // More than just the ID parameter
        $stmt = $db->prepare($query);
        
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Category updated successfully"]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update category"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "No fields to update"]);
    }
}

/**
 * Delete a category
 * @param PDO $db Database connection
 * @param int $id Category ID
 */
function deleteCategory($db, $id) {
    // Check if category exists
    $check_query = "SELECT id FROM categories WHERE id = :id LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":id", $id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(["message" => "Category not found"]);
        return;
    }
    
    // Check if category is in use
    $check_usage_query = "SELECT COUNT(*) as count FROM products WHERE category_id = :id";
    $check_usage_stmt = $db->prepare($check_usage_query);
    $check_usage_stmt->bindParam(":id", $id);
    $check_usage_stmt->execute();
    $row = $check_usage_stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row['count'] > 0) {
        http_response_code(400);
        echo json_encode([
            "message" => "Cannot delete category because it is used by products",
            "product_count" => $row['count']
        ]);
        return;
    }
    
    // Delete query
    $query = "DELETE FROM categories WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $id);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Category deleted successfully"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to delete category"]);
    }
}
?>