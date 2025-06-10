const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const crypto = require('crypto');

// Helper function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: true, message: 'Username and password are required' });
    }
    
    // Hash the password for comparison
    const hashedPassword = hashPassword(password);
    
    // Check if user exists with these credentials - removed role field
    const [users] = await pool.query(
      'SELECT id, username FROM users WHERE username = ? AND password = ?',
      [username, hashedPassword]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: true, message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Generate a simple token
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username
      },
      token: token
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Create admin user endpoint
router.post('/create-admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: true, message: 'Username and password are required' });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: true, message: 'Username already exists' });
    }
    
    // Hash the password
    const hashedPassword = hashPassword(password);
    
    // Insert the new admin user - removed role field
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;