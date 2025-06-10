<?php
/**
 * Database Configuration
 */
class Database {
    // Database credentials
    private $host = "sql306.infinityfree.com";
    private $db_name = "if0_39193221_ecommerce";
    private $username = "if0_39193221";
    private $password = "1975FRANKa";
    public $conn;
    
    /**
     * Get the database connection
     * @return PDO|null Database connection or null on failure
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $e) {
            echo "Connection error: " . $e->getMessage();
        }
        
        return $this->conn;
    }
}
?>