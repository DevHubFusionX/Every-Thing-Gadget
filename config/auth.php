<?php
/**
 * Authentication Helper
 */
class Auth {
    private $conn;
    private $table_name = "users";
    
    /**
     * Constructor
     * @param PDO $db Database connection
     */
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Validate API token
     * @param string $token API token to validate
     * @return bool True if token is valid, false otherwise
     */
    public function validateToken($token) {
        if (empty($token)) {
            return false;
        }
        
        // Query to check if token exists
        $query = "SELECT id FROM " . $this->table_name . " WHERE api_token = :token LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":token", $token);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Get token from Authorization header
     * @return string|null Token or null if not found
     */
    public function getBearerToken() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }
    
    /**
     * Authenticate user by username and password
     * @param string $username Username
     * @param string $password Password
     * @return string|false API token if authenticated, false otherwise
     */
    public function authenticate($username, $password) {
        $query = "SELECT id, password, api_token FROM " . $this->table_name . " WHERE username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $username);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($password, $row['password'])) {
                return $row['api_token'];
            }
        }
        
        return false;
    }
}
?>