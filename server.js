require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'E-Commerce API',
    version: '1.0.0',
    endpoints: [
      'GET /api/products - Get all products',
      'GET /api/product/:id - Get a specific product',
      'POST /api/product - Add a new product',
      'PUT /api/product/:id - Update a product',
      'DELETE /api/product/:id - Delete a product',
      'POST /api/login - Authenticate and get API token'
    ]
  });
});

// Routes
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');

app.use('/api', productsRouter);
app.use('/api', categoriesRouter);
app.use('/api', authRouter);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve admin dashboard
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/admin/modern', express.static(path.join(__dirname, 'admin/modern')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();
});

module.exports = { app };