const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// GET all categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// GET products by category
router.get('/products-by-category/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get category details
    const [categoryRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    
    if (categoryRows.length === 0) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }
    
    const category = categoryRows[0];
    
    // Get products in this category
    const [products] = await pool.query(
      'SELECT * FROM products WHERE category_id = ? LIMIT ? OFFSET ?',
      [categoryId, limit, offset]
    );
    
    // Get total count for pagination
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE category_id = ?',
      [categoryId]
    );
    
    const totalCount = countResult[0].total;
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      category: category,
      products: products,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        total_pages: totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// POST create a new category
router.post('/category', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: true, message: 'Category name is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    
    res.status(201).json({
      message: 'Category created successfully',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// PUT update a category
router.put('/category/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const id = req.params.id;
    
    if (!name) {
      return res.status(400).json({ error: true, message: 'Category name is required' });
    }
    
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || '', id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }
    
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// DELETE a category
router.delete('/category/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if there are products in this category
    const [productCount] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );
    
    if (productCount[0].count > 0) {
      return res.status(400).json({ 
        error: true, 
        message: 'Cannot delete category with associated products' 
      });
    }
    
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;