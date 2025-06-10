require('dotenv').config();
const mysql = require('mysql2/promise');

// Create a connection pool using the full connection string if available
const connectionConfig = process.env.DATABASE_URL ? 
  { uri: process.env.DATABASE_URL, connectTimeout: 60000 } : 
  {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectTimeout: 60000 // Increase timeout to 60 seconds
  };

const pool = mysql.createPool(connectionConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };