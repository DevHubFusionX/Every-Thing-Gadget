<?php
// API index file
header("Content-Type: application/json; charset=UTF-8");

echo json_encode([
    "name" => "E-Commerce API",
    "version" => "1.0.0",
    "endpoints" => [
        "GET /api/products" => "Get all products",
        "GET /api/product/{id}" => "Get a specific product",
        "POST /api/product" => "Add a new product (requires authentication)",
        "PUT /api/product/{id}" => "Update a product (requires authentication)",
        "DELETE /api/product/{id}" => "Delete a product (requires authentication)",
        "POST /api/login" => "Authenticate and get API token"
    ]
]);
?>