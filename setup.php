<?php
/**
 * Setup script to check environment and configuration
 */

// Display all errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>E-Commerce Backend Setup</h1>";

// Check PHP version
echo "<h2>PHP Environment</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Check required extensions
$required_extensions = ['pdo', 'pdo_mysql', 'json'];
echo "<h3>Required Extensions:</h3>";
echo "<ul>";
foreach ($required_extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "<li>✅ {$ext} is loaded</li>";
    } else {
        echo "<li>❌ {$ext} is NOT loaded</li>";
    }
}
echo "</ul>";

// Check database connection
echo "<h2>Database Connection</h2>";
try {
    include_once 'config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        echo "<p>✅ Database connection successful</p>";
        
        // Check if tables exist
        $tables = ['products', 'users'];
        echo "<h3>Database Tables:</h3>";
        echo "<ul>";
        
        foreach ($tables as $table) {
            $query = "SHOW TABLES LIKE '{$table}'";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                echo "<li>✅ Table '{$table}' exists</li>";
                
                // Count records
                $count_query = "SELECT COUNT(*) as count FROM {$table}";
                $count_stmt = $db->prepare($count_query);
                $count_stmt->execute();
                $count = $count_stmt->fetch(PDO::FETCH_ASSOC)['count'];
                
                echo " ({$count} records)";
            } else {
                echo "<li>❌ Table '{$table}' does NOT exist</li>";
            }
        }
        
        echo "</ul>";
    } else {
        echo "<p>❌ Database connection failed</p>";
    }
} catch (Exception $e) {
    echo "<p>❌ Database error: " . $e->getMessage() . "</p>";
}

// Check file permissions
echo "<h2>File Permissions</h2>";
$directories = ['api', 'admin', 'config', 'database'];
echo "<ul>";

foreach ($directories as $dir) {
    if (is_dir($dir)) {
        $is_writable = is_writable($dir);
        echo "<li>" . ($is_writable ? "✅" : "❌") . " {$dir}/: " . ($is_writable ? "Writable" : "Not writable") . "</li>";
    } else {
        echo "<li>❌ {$dir}/: Directory not found</li>";
    }
}

echo "</ul>";

// Server information
echo "<h2>Server Information</h2>";
echo "<p>Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p>Request URI: " . $_SERVER['REQUEST_URI'] . "</p>";
echo "<p>Script Name: " . $_SERVER['SCRIPT_NAME'] . "</p>";

// Suggest next steps
echo "<h2>Next Steps</h2>";
echo "<ol>";
echo "<li>Make sure all required extensions are installed</li>";
echo "<li>If database tables don't exist, import the SQL file from database/products.sql</li>";
echo "<li>Check that the API endpoints are accessible</li>";
echo "<li>Try accessing the <a href='api/test.php' target='_blank'>test endpoint</a></li>";
echo "<li>Try accessing the <a href='admin/' target='_blank'>admin dashboard</a></li>";
echo "</ol>";
?>