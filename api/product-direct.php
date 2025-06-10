<?php
// Direct product API endpoint without URL rewriting
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

// Get product ID from query parameter
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// Check authentication for non-GET requests
if ($method !== 'GET') {
    $token = $auth->getBearerToken();
    
    // For testing: Accept fixed token
    $fixed_token = "f8c91a5c9f58c5b4b3b3f3d6b8c7a9e2d1f0e3b2a1c0d9e8f7a6b5c4d3e2f1";
    
    if ($token !== $fixed_token && !$auth->validateToken($token)) {
        http_response_code(401);
        echo json_encode([
            "message" => "Unauthorized",
            "token_received" => $token,
            "headers" => getallheaders()
        ]);
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
 * Get all products with pagination, filtering and search
 * @param PDO $db Database connection
 */
function getProducts($db) {
    // Pagination parameters
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $offset = ($page - 1) * $limit;
    
    // Filtering parameters
    $category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : null;
    $min_price = isset($_GET['min_price']) ? floatval($_GET['min_price']) : null;
    $max_price = isset($_GET['max_price']) ? floatval($_GET['max_price']) : null;
    $in_stock = isset($_GET['in_stock']) ? filter_var($_GET['in_stock'], FILTER_VALIDATE_BOOLEAN) : null;
    
    // Search parameter
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    
    // Sorting parameters
    $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'created_at';
    $sort_dir = isset($_GET['sort_dir']) && strtoupper($_GET['sort_dir']) === 'ASC' ? 'ASC' : 'DESC';
    
    // Validate sort_by to prevent SQL injection
    $allowed_sort_fields = ['id', 'name', 'price', 'category', 'stock_quantity', 'created_at'];
    if (!in_array($sort_by, $allowed_sort_fields)) {
        $sort_by = 'created_at';
    }
    
    // Build query
    $query = "SELECT p.*, c.name as category_name 
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.id 
              WHERE 1=1";
    $count_query = "SELECT COUNT(*) as total FROM products p WHERE 1=1";
    $params = [];
    
    // Add filters to query
    if ($category_id) {
        $query .= " AND p.category_id = :category_id";
        $count_query .= " AND p.category_id = :category_id";
        $params[':category_id'] = $category_id;
    }
    
    if ($min_price !== null) {
        $query .= " AND p.price >= :min_price";
        $count_query .= " AND p.price >= :min_price";
        $params[':min_price'] = $min_price;
    }
    
    if ($max_price !== null) {
        $query .= " AND p.price <= :max_price";
        $count_query .= " AND p.price <= :max_price";
        $params[':max_price'] = $max_price;
    }
    
    if ($in_stock !== null) {
        if ($in_stock) {
            $query .= " AND p.stock_quantity > 0";
            $count_query .= " AND p.stock_quantity > 0";
        } else {
            $query .= " AND p.stock_quantity = 0";
            $count_query .= " AND p.stock_quantity = 0";
        }
    }
    
    if ($search) {
        $search_param = '%' . $search . '%';
        $query .= " AND (p.name LIKE :search OR p.description LIKE :search OR p.sku LIKE :search)";
        $count_query .= " AND (p.name LIKE :search OR p.description LIKE :search OR p.sku LIKE :search)";
        $params[':search'] = $search_param;
    }
    
    // Add sorting
    $query .= " ORDER BY p.{$sort_by} {$sort_dir}";
    
    // Add pagination
    $query .= " LIMIT :limit OFFSET :offset";
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;
    
    // Execute count query
    $count_stmt = $db->prepare($count_query);
    foreach ($params as $param => $value) {
        if ($param !== ':limit' && $param !== ':offset') {
            $count_stmt->bindValue($param, $value);
        }
    }
    $count_stmt->execute();
    $total_count = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Execute main query
    $stmt = $db->prepare($query);
    foreach ($params as $param => $value) {
        $stmt->bindValue($param, $value);
    }
    $stmt->execute();
    
    // Fetch products
    $products = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Use category_name from join if available, otherwise fall back to category column
        if ($row['category_name']) {
            $row['category'] = $row['category_name'];
        }
        unset($row['category_name']);
        
        $products[] = $row;
    }
    
    // Calculate pagination info
    $total_pages = ceil($total_count / $limit);
    
    // Return response with pagination metadata
    http_response_code(200);
    echo json_encode([
        "products" => $products,
        "pagination" => [
            "total" => $total_count,
            "page" => $page,
            "limit" => $limit,
            "total_pages" => $total_pages
        ]
    ]);
}

/**
 * Get a single product
 * @param PDO $db Database connection
 * @param int $id Product ID
 */
function getProduct($db, $id) {
    $query = "SELECT p.*, c.name as category_name 
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.id 
              WHERE p.id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Use category_name from join if available, otherwise fall back to category column
        if ($product['category_name']) {
            $product['category'] = $product['category_name'];
        }
        unset($product['category_name']);
        
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
        !empty($data->price) &&
        !empty($data->sku)
    ) {
        // Check if category exists or create it
        $category_id = null;
        if (!empty($data->category)) {
            $category_query = "SELECT id FROM categories WHERE name = :name LIMIT 1";
            $category_stmt = $db->prepare($category_query);
            $category_stmt->bindParam(":name", $data->category);
            $category_stmt->execute();
            
            if ($category_stmt->rowCount() > 0) {
                $category_id = $category_stmt->fetch(PDO::FETCH_ASSOC)['id'];
            } else {
                // Create new category
                $create_category_query = "INSERT INTO categories (name) VALUES (:name)";
                $create_category_stmt = $db->prepare($create_category_query);
                $create_category_stmt->bindParam(":name", $data->category);
                $create_category_stmt->execute();
                $category_id = $db->lastInsertId();
            }
        }
        
        // Create query
        $query = "INSERT INTO products
                  SET name = :name,
                      description = :description,
                      price = :price,
                      category = :category,
                      category_id = :category_id,
                      image_url = :image_url,
                      stock_quantity = :stock_quantity,
                      sku = :sku";
        
        $stmt = $db->prepare($query);
        
        // Sanitize and bind data
        $name = htmlspecialchars(strip_tags($data->name));
        $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : "";
        $price = floatval($data->price);
        $category = !empty($data->category) ? htmlspecialchars(strip_tags($data->category)) : null;
        $image_url = !empty($data->image_url) ? htmlspecialchars(strip_tags($data->image_url)) : null;
        $stock_quantity = isset($data->stock_quantity) ? intval($data->stock_quantity) : 0;
        $sku = htmlspecialchars(strip_tags($data->sku));
        
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":price", $price);
        $stmt->bindParam(":category", $category);
        $stmt->bindParam(":category_id", $category_id);
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
    
    // Check if category exists or create it
    $category_id = null;
    if (!empty($data->category)) {
        $category_query = "SELECT id FROM categories WHERE name = :name LIMIT 1";
        $category_stmt = $db->prepare($category_query);
        $category_stmt->bindParam(":name", $data->category);
        $category_stmt->execute();
        
        if ($category_stmt->rowCount() > 0) {
            $category_id = $category_stmt->fetch(PDO::FETCH_ASSOC)['id'];
        } else {
            // Create new category
            $create_category_query = "INSERT INTO categories (name) VALUES (:name)";
            $create_category_stmt = $db->prepare($create_category_query);
            $create_category_stmt->bindParam(":name", $data->category);
            $create_category_stmt->execute();
            $category_id = $db->lastInsertId();
        }
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
        $query .= "category = :category, category_id = :category_id, ";
        $params[':category'] = htmlspecialchars(strip_tags($data->category));
        $params[':category_id'] = $category_id;
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