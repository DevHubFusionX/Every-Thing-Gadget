<?php
// Super simple products endpoint with minimal code
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Return hardcoded sample products
$products = [
    [
        "id" => 1,
        "name" => "Test Product 1",
        "description" => "This is a test product",
        "price" => 99.99,
        "category" => "Test",
        "image_url" => null,
        "stock_quantity" => 10,
        "sku" => "TEST-001"
    ],
    [
        "id" => 2,
        "name" => "Test Product 2",
        "description" => "Another test product",
        "price" => 49.99,
        "category" => "Test",
        "image_url" => null,
        "stock_quantity" => 5,
        "sku" => "TEST-002"
    ]
];

// Return as simple array (not wrapped in an object)
echo json_encode($products);
?>