const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// Configure multer storage for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Image upload route with Cloudinary
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded' });
    }
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path);
    
    res.json({
      success: true,
      imageUrl: result.url,
      public_id: result.public_id,
      message: 'Image uploaded successfully to Cloudinary',
      verifyUrl: `/test-cloudinary?public_id=${encodeURIComponent(result.public_id)}`
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// GET all products with filtering, sorting, pagination
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
    const search = req.query.search || null;
    const inStock = req.query.in_stock || null;
    const sortBy = req.query.sort_by || 'created_at';
    const sortDir = (req.query.sort_dir && req.query.sort_dir.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
    
    const allowedSortFields = ['id', 'name', 'price', 'category', 'stock_quantity', 'created_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    
    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (categoryId) {
      query += ' AND p.category_id = ?';
      countQuery += ' AND p.category_id = ?';
      params.push(categoryId);
      countParams.push(categoryId);
    }
    
    if (search) {
      const searchParam = `%${search}%`;
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    if (inStock === 'true') {
      query += ' AND p.stock_quantity > 0';
      countQuery += ' AND p.stock_quantity > 0';
    } else if (inStock === 'false') {
      query += ' AND p.stock_quantity = 0';
      countQuery += ' AND p.stock_quantity = 0';
    }
    
    query += ` ORDER BY p.${validSortBy} ${sortDir}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [countResult] = await pool.query(countQuery, countParams);
    const totalCount = countResult[0].total;
    
    const [products] = await pool.query(query, params);
    
    // Format products
    const productsArr = products.map(product => {
      if (product.category_name) {
        product.category = product.category_name;
      }
      delete product.category_name;
      return product;
    });
    
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      products: productsArr,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        total_pages: totalPages,
        sort_by: validSortBy,
        sort_dir: sortDir
      }
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// GET a single product by ID
router.get('/product/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', 
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Product not found' });
    }
    
    const product = rows[0];
    if (product.category_name) {
      product.category = product.category_name;
    }
    delete product.category_name;
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// POST create a new product
router.post('/product', async (req, res) => {
  try {
    const { name, description, price, category, stock_quantity, sku, image_url, cloudinary_id } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: true, message: 'Missing required fields' });
    }
    
    // Find category_id from category name if provided
    let categoryId = null;
    if (category) {
      const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
      if (catRows.length > 0) {
        categoryId = catRows[0].id;
      }
    }
    
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, category, category_id, stock_quantity, sku, image_url, cloudinary_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description || '', price, category || '', categoryId, stock_quantity || 0, sku || '', image_url || null, cloudinary_id || null]
    );
    
    res.status(201).json({
      message: 'Product created successfully',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// PUT update a product
router.put('/product/:id', async (req, res) => {
  try {
    const { name, description, price, category, stock_quantity, sku, image_url, cloudinary_id } = req.body;
    const id = req.params.id;
    
    if (!name || !price) {
      return res.status(400).json({ error: true, message: 'Missing required fields' });
    }
    
    // Find category_id from category name if provided
    let categoryId = null;
    if (category) {
      const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
      if (catRows.length > 0) {
        categoryId = catRows[0].id;
      }
    }
    
    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, category = ?, category_id = ?, stock_quantity = ?, sku = ?, image_url = ?, cloudinary_id = ? WHERE id = ?',
      [name, description || '', price, category || '', categoryId, stock_quantity || 0, sku || '', image_url || null, cloudinary_id || null, id]
    );
    
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// DELETE a product
router.delete('/product/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: true, message: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;