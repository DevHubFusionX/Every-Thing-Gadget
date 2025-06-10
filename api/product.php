<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

// Get request URI and extract ID if present
$id = null;

// Check if ID is provided in the URL parameter
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
}

// Alternative method to extract ID from URL path
if (!$id) {
    $request_uri = $_SERVER['REQUEST_URI'];
    $uri_parts = explode('/', trim($request_uri, '/'));
    $endpoint = end($uri_parts);
    
    if (is_numeric($endpoint)) {
        $id = intval($endpoint);
    }
}

// Check authentication for non-GET requests
if ($method !== 'GET') {
    $token = $auth->getBearerToken();
    if (!$auth->validateToken($token)) {
        http_response_code(401);
        echo json_encode(["message" => "Unauthorized"]);
        exit();
    }
}

// Handle different HTTP methods
switch ($method) {
    case 'GET':
        if ($id) {
            getProduct($db, $id);
        } else {
            getProducts($db);
        }
        break;
    case 'POST':
        addProduct($db);
        break;
    case 'PUT':
        if ($id) {
            updateProduct($db, $id);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Product ID is required"]);
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteProduct($db, $id);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Product ID is required"]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}

/**
 * Get all products
 * @param PDO $db Database connection
 */
function getProducts($db) {
    $query = "SELECT * FROM products ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $products = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $products[] = $row;
        }
        
        http_response_code(200);
        echo json_encode($products);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "No products found"]);
    }
}

/**
 * Get a single product
 * @param PDO $db Database connection
 * @param int $id Product ID
 */
function getProduct($db, $id) {
    $query = "SELECT * FROM products WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($product);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Product not found"]);
    }
}

/**
 * Add a new product
 * @param PDO $db Database connection
 */
function addProduct($db) {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check if data is complete
    if (
        !empty($data->name) &&
        !empty($data->description) &&
        !empty($data->price) &&
        !empty($data->category) &&
        !empty($data->stock_quantity) &&
        !empty($data->sku)
    ) {
        // Create query
        $query = "INSERT INTO products
                  SET name = :name,
                      description = :description,
                      price = :price,
                      category = :category,
                      image_url = :image_url,
                      stock_quantity = :stock_quantity,
                      sku = :sku";
        
        $stmt = $db->prepare($query);
        
        // Sanitize and bind data
        $name = htmlspecialchars(strip_tags($data->name));
        $description = htmlspecialchars(strip_tags($data->description));
        $price = floatval($data->price);
        $category = htmlspecialchars(strip_tags($data->category));
        $image_url = !empty($data->image_url) ? htmlspecialchars(strip_tags($data->image_url)) : null;
        $stock_quantity = intval($data->stock_quantity);
        $sku = htmlspecialchars(strip_tags($data->sku));
        
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":price", $price);
        $stmt->bindParam(":category", $category);
        $stmt->bindParam(":image_url", $image_url);
        $stmt->bindParam(":stock_quantity", $stock_quantity);
        $stmt->bindParam(":sku", $sku);
        
        // Execute query
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Product created successfully",
                "id" => $db->lastInsertId()
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create product"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Unable to create product. Data is incomplete"]);
    }
}

/**
 * Update an existing product
 * @param PDO $db Database connection
 * @param int $id Product ID
 */
function updateProduct($db, $id) {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check if product exists
    $check_query = "SELECT id FROM products WHERE id = :id LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":id", $id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(["message" => "Product not found"]);
        return;
    }
    
    // Build update query based on provided fields
    $query = "UPDATE products SET ";
    $params = [];
    
    if (!empty($data->name)) {
        $query .= "name = :name, ";
        $params[':name'] = htmlspecialchars(strip_tags($data->name));
    }
    
    if (isset($data->description)) {
        $query .= "description = :description, ";
        $params[':description'] = htmlspecialchars(strip_tags($data->description));
    }
    
    if (isset($data->price)) {
        $query .= "price = :price, ";
        $params[':price'] = floatval($data->price);
    }
    
    if (!empty($data->category)) {
        $query .= "category = :category, ";
        $params[':category'] = htmlspecialchars(strip_tags($data->category));
    }
    
    if (isset($data->image_url)) {
        $query .= "image_url = :image_url, ";
        $params[':image_url'] = htmlspecialchars(strip_tags($data->image_url));
    }
    
    if (isset($data->stock_quantity)) {
        $query .= "stock_quantity = :stock_quantity, ";
        $params[':stock_quantity'] = intval($data->stock_quantity);
    }
    
    if (!empty($data->sku)) {
        $query .= "sku = :sku, ";
        $params[':sku'] = htmlspecialchars(strip_tags($data->sku));
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
            echo json_encode(["message" => "Product updated successfully"]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update product"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "No fields to update"]);
    }
}

/**
 * Delete a product
 * @param PDO $db Database connection
 * @param int $id Product ID
 */
function deleteProduct($db, $id) {
    // Check if product exists
    $check_query = "SELECT id FROM products WHERE id = :id LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":id", $id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(["message" => "Product not found"]);
        return;
    }
    
    // Delete query
    $query = "DELETE FROM products WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $id);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Product deleted successfully"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to delete product"]);
    }
}
?>