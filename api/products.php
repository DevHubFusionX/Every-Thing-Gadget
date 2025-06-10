<?php
// Products API endpoint with sorting, filtering, pagination, add, update, and delete
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Disable error reporting to avoid interference
ini_set('display_errors', 0);
error_reporting(0);

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    include_once '../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed");
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    switch ($method) {
        case 'GET':
            // --- LIST PRODUCTS (with filtering, sorting, pagination) ---
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
            $offset = ($page - 1) * $limit;
            $category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : null;
            $search = isset($_GET['search']) ? $_GET['search'] : null;
            $in_stock = isset($_GET['in_stock']) ? $_GET['in_stock'] : null;
            $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'created_at';
            $sort_dir = isset($_GET['sort_dir']) && strtoupper($_GET['sort_dir']) === 'ASC' ? 'ASC' : 'DESC';
            $allowed_sort_fields = ['id', 'name', 'price', 'category', 'stock_quantity', 'created_at'];
            if (!in_array($sort_by, $allowed_sort_fields)) {
                $sort_by = 'created_at';
            }
            $query = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";
            $count_query = "SELECT COUNT(*) as total FROM products p WHERE 1=1";
            $params = [];
            $count_params = [];
            if ($category_id) {
                $query .= " AND p.category_id = :category_id";
                $count_query .= " AND p.category_id = :category_id";
                $params[':category_id'] = $category_id;
                $count_params[':category_id'] = $category_id;
            }
            if ($search) {
                $search_param = '%' . $search . '%';
                $query .= " AND (p.name LIKE :search OR p.description LIKE :search OR p.sku LIKE :search)";
                $count_query .= " AND (p.name LIKE :search OR p.description LIKE :search OR p.sku LIKE :search)";
                $params[':search'] = $search_param;
                $count_params[':search'] = $search_param;
            }
            if ($in_stock === 'true') {
                $query .= " AND p.stock_quantity > 0";
                $count_query .= " AND p.stock_quantity > 0";
            } else if ($in_stock === 'false') {
                $query .= " AND p.stock_quantity = 0";
                $count_query .= " AND p.stock_quantity = 0";
            }
            $query .= " ORDER BY p.{$sort_by} {$sort_dir}";
            $query .= " LIMIT $limit OFFSET $offset";
            $count_stmt = $db->prepare($count_query);
            foreach ($count_params as $param => $value) {
                $count_stmt->bindValue($param, $value);
            }
            $count_stmt->execute();
            $total_count = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
            $stmt = $db->prepare($query);
            foreach ($params as $param => $value) {
                if ($param !== ':limit' && $param !== ':offset') {
                    $stmt->bindValue($param, $value);
                }
            }
            $stmt->execute();
            $products_arr = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if ($row['category_name']) {
                    $row['category'] = $row['category_name'];
                }
                unset($row['category_name']);
                $products_arr[] = $row;
            }
            $total_pages = ceil($total_count / $limit);
            http_response_code(200);
            echo json_encode([
                "products" => $products_arr,
                "pagination" => [
                    "total" => $total_count,
                    "page" => $page,
                    "limit" => $limit,
                    "total_pages" => $total_pages,
                    "sort_by" => $sort_by,
                    "sort_dir" => $sort_dir
                ]
            ]);
            break;
        case 'POST':
            // Debug: Log what we received
            error_log("POST data: " . print_r($_POST, true));
            error_log("Raw input: " . file_get_contents('php://input'));
            
            // --- DELETE PRODUCT (form-encoded) ---
            if (isset($_POST['action']) && $_POST['action'] === 'delete' && isset($_POST['id'])) {
                $productId = intval($_POST['id']);
                error_log("DELETE - Deleting product ID: " . $productId);
                
                $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
                if ($stmt->execute([$productId])) {
                    echo json_encode(['success' => true, 'message' => 'Product deleted']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
                }
                exit;
            }
            
            // Check if it's a delete action but missing required fields
            if (isset($_POST['action']) && $_POST['action'] === 'delete') {
                error_log("DELETE - Missing ID. POST data: " . print_r($_POST, true));
                error_log("DELETE - Raw input: " . file_get_contents('php://input'));
                http_response_code(400);
                echo json_encode([
                    'error' => true, 
                    'message' => 'Delete action requires product ID',
                    'received_post' => $_POST,
                    'received_get' => $_GET,
                    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
                ]);
                exit;
            }
            
            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);
            
            // --- DELETE PRODUCT (JSON body) ---
            if (isset($input['action']) && $input['action'] === 'delete' && isset($id)) {
                $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
                if ($stmt->execute([$id])) {
                    echo json_encode(['success' => true, 'message' => 'Product deleted']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
                }
                exit;
            }
            
            // --- UPDATE PRODUCT (form-encoded with action=update) ---
            if ((isset($_POST['action']) && $_POST['action'] === 'update') ||
                (isset($input['action']) && $input['action'] === 'update')) {
                
                // Use $_POST data if available, otherwise use JSON input
                $data = !empty($_POST) ? $_POST : $input;
                
                // Debug: Log what we have for update
                error_log("UPDATE - POST data: " . print_r($_POST, true));
                error_log("UPDATE - Input data: " . print_r($input, true));
                error_log("UPDATE - Final data: " . print_r($data, true));
                
                // Get product ID from form data or query string
                $updateId = isset($data['id']) ? intval($data['id']) : $id;
                error_log("UPDATE - Product ID: " . $updateId);
                
                if (!$data || !isset($data['name']) || !isset($data['price'])) {
                    error_log("UPDATE - Missing fields. Data keys: " . implode(', ', array_keys($data ?: [])));
                    http_response_code(400);
                    echo json_encode([
                        "error" => true, 
                        "message" => "Missing required fields",
                        "received_fields" => array_keys($data ?: []),
                        "post_data" => $_POST,
                        "input_data" => $input
                    ]);
                    exit();
                }
                
                // Find category_id from category name if provided
                $category_id = null;
                if (isset($data['category']) && !empty($data['category'])) {
                    $cat_stmt = $db->prepare("SELECT id FROM categories WHERE name = ?");
                    $cat_stmt->execute([$data['category']]);
                    $cat_result = $cat_stmt->fetch(PDO::FETCH_ASSOC);
                    $category_id = $cat_result ? $cat_result['id'] : null;
                }
                
                $query = "UPDATE products SET name = ?, description = ?, price = ?, category = ?, category_id = ?, stock_quantity = ?, sku = ?, image_url = ? WHERE id = ?";
                $stmt = $db->prepare($query);
                $stmt->bindValue(1, $data['name']);
                $stmt->bindValue(2, isset($data['description']) ? $data['description'] : '');
                $stmt->bindValue(3, $data['price']);
                $stmt->bindValue(4, isset($data['category']) ? $data['category'] : '');
                $stmt->bindValue(5, $category_id);
                $stmt->bindValue(6, isset($data['stock_quantity']) ? $data['stock_quantity'] : 0);
                $stmt->bindValue(7, isset($data['sku']) ? $data['sku'] : '');
                $stmt->bindValue(8, isset($data['image_url']) ? $data['image_url'] : null);
                $stmt->bindValue(9, $updateId);
                
                if ($stmt->execute()) {
                    echo json_encode(["message" => "Product updated successfully"]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => true, "message" => "Failed to update product"]);
                }
                exit;
            }
            
            // --- ADD PRODUCT ---
            // Use $_POST data if available (form-encoded), otherwise use JSON input
            $data = !empty($_POST) ? $_POST : ($input ?: json_decode(file_get_contents("php://input"), true));
            
            if (!$data || !isset($data['name']) || !isset($data['price'])) {
                http_response_code(400);
                echo json_encode(["error" => true, "message" => "Missing required fields"]);
                exit();
            }
            
            // Find category_id from category name if provided
            $category_id = null;
            if (isset($data['category']) && !empty($data['category'])) {
                $cat_stmt = $db->prepare("SELECT id FROM categories WHERE name = ?");
                $cat_stmt->execute([$data['category']]);
                $cat_result = $cat_stmt->fetch(PDO::FETCH_ASSOC);
                $category_id = $cat_result ? $cat_result['id'] : null;
            }
            
            $query = "INSERT INTO products (name, description, price, category, category_id, stock_quantity, sku, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->bindValue(1, $data['name']);
            $stmt->bindValue(2, isset($data['description']) ? $data['description'] : '');
            $stmt->bindValue(3, $data['price']);
            $stmt->bindValue(4, isset($data['category']) ? $data['category'] : '');
            $stmt->bindValue(5, $category_id);
            $stmt->bindValue(6, isset($data['stock_quantity']) ? $data['stock_quantity'] : 0);
            $stmt->bindValue(7, isset($data['sku']) ? $data['sku'] : '');
            $stmt->bindValue(8, isset($data['image_url']) ? $data['image_url'] : null);
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode([
                    "message" => "Product created successfully",
                    "id" => $db->lastInsertId()
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => true, "message" => "Failed to create product"]);
            }
            break;
        case 'PUT':
            // --- UPDATE PRODUCT ---
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => true, "message" => "Product ID is required"]);
                exit();
            }
            $data = json_decode(file_get_contents("php://input"));
            if (!$data) {
                http_response_code(400);
                echo json_encode(["error" => true, "message" => "Invalid data"]);
                exit();
            }
            // Find category_id from category name if provided
            $category_id = null;
            if (isset($data->category) && !empty($data->category)) {
                $cat_stmt = $db->prepare("SELECT id FROM categories WHERE name = ?");
                $cat_stmt->execute([$data->category]);
                $cat_result = $cat_stmt->fetch(PDO::FETCH_ASSOC);
                $category_id = $cat_result ? $cat_result['id'] : null;
            }
            
            $query = "UPDATE products SET name = ?, description = ?, price = ?, category = ?, category_id = ?, stock_quantity = ?, sku = ?, image_url = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->bindParam(1, $data->name);
            $stmt->bindParam(2, $data->description ?? '');
            $stmt->bindParam(3, $data->price);
            $stmt->bindParam(4, $data->category ?? '');
            $stmt->bindParam(5, $category_id);
            $stmt->bindParam(6, $data->stock_quantity ?? 0);
            $stmt->bindParam(7, $data->sku ?? '');
            $stmt->bindParam(8, $data->image_url ?? null);
            $stmt->bindParam(9, $id);
            if ($stmt->execute()) {
                echo json_encode(["message" => "Product updated successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => true, "message" => "Failed to update product"]);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(["error" => true, "message" => "Method not allowed"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>
