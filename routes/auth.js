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
    
    // Check if user exists with these credentials - removed email field
    const [users] = await pool.query(
      'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
      [username, hashedPassword]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: true, message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Generate a simple token (in production, use JWT)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token in database (in a real app, you'd use Redis or a token table)
    // For this example, we'll just return the token
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
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
    
    // Check if user already exists - removed email check
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: true, message: 'Username already exists' });
    }
    
    // Hash the password
    const hashedPassword = hashPassword(password);
    
    // Insert the new admin user - removed email field
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'admin']
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