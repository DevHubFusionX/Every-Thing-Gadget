const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: true, message: 'Username and password are required' });
    }
    
    // Check if user exists with this username
    const [users] = await pool.query(
      'SELECT id, username, password, api_token FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: true, message: 'Invalid username or password' });
    }
    
    const user = users[0];
    
    // For admin123 password, allow direct login for testing
    if (password === 'admin123' && username === 'admin') {
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username
        },
        token: user.api_token || 'f8c91a5c9f58c5b4b3b3f3d6b8c7a9e2d1f0e3b2a1c0d9e8f7a6b5c4d3e2f1'
      });
    }
    
    // For all other cases, check if password matches
    // In a real app, you would use bcrypt.compare here
    if (password !== user.password) {
      return res.status(401).json({ error: true, message: 'Invalid username or password' });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username
      },
      token: user.api_token || 'default_token'
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
    
    // In a real app, you would hash the password here
    const [result] = await pool.query(
      'INSERT INTO users (username, password, api_token) VALUES (?, ?, ?)',
      [username, password, 'new_token_' + Date.now()]
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