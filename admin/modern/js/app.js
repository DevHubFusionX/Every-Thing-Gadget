// Global variables
const apiBaseUrl = '/api';
let productsData = [];
let categoriesData = [];
let currentItemId = null;
let currentItemType = null;

// DOM Elements
const loginPage = document.getElementById('login-page');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarItems = document.querySelectorAll('.sidebar-menu li');
const contentPages = document.querySelectorAll('.content-page');
const productsTableBody = document.getElementById('products-table-body');
const categoriesTableBody = document.getElementById('categories-table-body');
const addProductBtn = document.getElementById('add-product-btn');
const addCategoryBtn = document.getElementById('add-category-btn');
const productModal = new bootstrap.Modal(document.getElementById('product-modal'));
const categoryModal = new bootstrap.Modal(document.getElementById('category-modal'));
const deleteModal = new bootstrap.Modal(document.getElementById('delete-modal'));
const toast = new bootstrap.Toast(document.getElementById('toast'));

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  checkAuth();
  
  // Set up event listeners
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  sidebarToggle.addEventListener('click', toggleSidebar);
  
  // Set up sidebar navigation
  sidebarItems.forEach(item => {
    if (item.dataset.page) {
      item.addEventListener('click', () => {
        setActivePage(item.dataset.page);
      });
    }
  });
  
  // Set up modal buttons
  addProductBtn.addEventListener('click', () => showProductModal());
  addCategoryBtn.addEventListener('click', () => showCategoryModal());
  document.getElementById('save-product-btn').addEventListener('click', saveProduct);
  document.getElementById('save-category-btn').addEventListener('click', saveCategory);
  document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
  
  // Set up image preview
  document.getElementById('product-image').addEventListener('change', previewImage);
});

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('adminToken');
  if (token) {
    showAdminDashboard();
    loadDashboardData();
  } else {
    showLoginPage();
  }
}

// Show login page
function showLoginPage() {
  loginPage.style.display = 'block';
  adminDashboard.style.display = 'none';
}

// Show admin dashboard
function showAdminDashboard() {
  loginPage.style.display = 'none';
  adminDashboard.style.display = 'flex';
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  
  // Clear previous errors
  loginError.style.display = 'none';
  const usernameError = document.getElementById('username-error');
  if (usernameError) {
    usernameError.textContent = '';
  }
  document.getElementById('password-error').textContent = '';
  
  // Get form values
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  // Validate form
  let isValid = true;
  
  if (!username) {
    const usernameError = document.getElementById('username-error');
    if (usernameError) {
      usernameError.textContent = 'Username is required';
    }
    isValid = false;
  }
  
  if (!password) {
    document.getElementById('password-error').textContent = 'Password is required';
    isValid = false;
  }
  
  if (!isValid) return;
  
  // Submit form
  try {
    const response = await fetch(`${apiBaseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      // Save token and show dashboard
      localStorage.setItem('adminToken', data.token);
      showAdminDashboard();
      loadDashboardData();
    } else {
      // Show error message
      loginError.textContent = data.message || 'Invalid email or password';
      loginError.style.display = 'block';
    }
  } catch (error) {
    loginError.textContent = 'Connection error. Please try again.';
    loginError.style.display = 'block';
    console.error('Login error:', error);
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('adminToken');
  showLoginPage();
}

// Toggle sidebar on mobile
function toggleSidebar() {
  sidebar.classList.toggle('show');
  
  // If sidebar is now shown, add click event to close when clicking outside
  if (sidebar.classList.contains('show')) {
    setTimeout(() => {
      document.addEventListener('click', closeSidebarOnClickOutside);
    }, 10);
  }
}

// Close sidebar when clicking outside
function closeSidebarOnClickOutside(event) {
  if (!sidebar.contains(event.target) && !event.target.matches('#sidebar-toggle')) {
    sidebar.classList.remove('show');
    document.removeEventListener('click', closeSidebarOnClickOutside);
  }
}

// Set active page in the dashboard
function setActivePage(pageId) {
  // Update sidebar active state
  sidebarItems.forEach(item => {
    if (item.dataset.page === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Show selected content page
  contentPages.forEach(page => {
    if (page.id === pageId) {
      page.style.display = 'block';
      
      // Load data for the page if needed
      if (pageId === 'products-content' && !productsData.length) {
        loadProducts();
      } else if (pageId === 'categories-content' && !categoriesData.length) {
        loadCategories();
      }
    } else {
      page.style.display = 'none';
    }
  });
}

// Load dashboard data
async function loadDashboardData() {
  // Load initial data
  await Promise.all([loadProducts(true), loadCategories(true)]);
  
  // Update dashboard stats
  document.getElementById('products-count').textContent = productsData.length;
  document.getElementById('categories-count').textContent = categoriesData.length;
}

// Load products
async function loadProducts(silent = false) {
  if (!silent) {
    productsTableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="6">
          <div class="loading-spinner"></div>
          <p class="text-center">Loading products...</p>
        </td>
      </tr>
    `;
  }
  
  try {
    const response = await fetch(`${apiBaseUrl}/products`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized, redirect to login
        handleLogout();
        return;
      }
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    // Ensure productsData is always an array
    productsData = Array.isArray(data) ? data : (data.products || []);
    
    if (!silent) {
      renderProducts();
    }
  } catch (error) {
    if (!silent) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger">
            Error loading products: ${error.message}
          </td>
        </tr>
      `;
    }
    console.error('Error loading products:', error);
  }
}

// Render products table
function renderProducts() {
  if (productsData.length === 0) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No products found</td>
      </tr>
    `;
    return;
  }
  
  productsTableBody.innerHTML = productsData.map(product => `
    <tr>
      <td>
        <img src="${product.image_url || 'https://via.placeholder.com/50'}" 
             alt="${product.name}" 
             class="img-thumbnail" 
             style="width: 50px; height: 50px; object-fit: cover;">
      </td>
      <td>${product.name}</td>
      <td>$${parseFloat(product.price).toFixed(2)}</td>
      <td>${product.stock_quantity || 0}</td>
      <td>${getCategoryName(product.category_id) || 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="editProduct(${product.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id}, '${product.name}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Load categories
async function loadCategories(silent = false) {
  if (!silent) {
    categoriesTableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="3">
          <div class="loading-spinner"></div>
          <p class="text-center">Loading categories...</p>
        </td>
      </tr>
    `;
  }
  
  try {
    const response = await fetch(`${apiBaseUrl}/categories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized, redirect to login
        handleLogout();
        return;
      }
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    // Ensure categoriesData is always an array
    categoriesData = Array.isArray(data) ? data : (data.categories || []);
    
    if (!silent) {
      renderCategories();
    }
    
    // Update category dropdown in product form
    updateCategoryDropdown();
  } catch (error) {
    if (!silent) {
      categoriesTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-danger">
            Error loading categories: ${error.message}
          </td>
        </tr>
      `;
    }
    console.error('Error loading categories:', error);
  }
}

// Render categories table
function renderCategories() {
  if (categoriesData.length === 0) {
    categoriesTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center">No categories found</td>
      </tr>
    `;
    return;
  }
  
  categoriesTableBody.innerHTML = categoriesData.map(category => `
    <tr>
      <td>${category.name}</td>
      <td>${category.description || 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="editCategory(${category.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id}, '${category.name}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Update category dropdown in product form
function updateCategoryDropdown() {
  const categorySelect = document.getElementById('product-category');
  categorySelect.innerHTML = `
    <option value="">Select Category</option>
    ${categoriesData.map(category => `
      <option value="${category.id}">${category.name}</option>
    `).join('')}
  `;
}

// Get category name by ID
function getCategoryName(categoryId) {
  if (!categoryId) return null;
  const category = categoriesData.find(c => c.id == categoryId);
  return category ? category.name : null;
}

// Show product modal for add/edit
function showProductModal(product = null) {
  const modalTitle = document.getElementById('product-modal-title');
  const productForm = document.getElementById('product-form');
  const imagePreview = document.getElementById('image-preview');
  
  // Reset form
  productForm.reset();
  document.getElementById('product-id').value = '';
  imagePreview.style.display = 'none';
  
  if (product) {
    // Edit mode
    modalTitle.textContent = 'Edit Product';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category_id || '';
    document.getElementById('product-stock').value = product.stock_quantity || 0;
    document.getElementById('product-description').value = product.description || '';
    
    // Show image preview if available
    if (product.image_url) {
      imagePreview.querySelector('img').src = product.image_url;
      imagePreview.style.display = 'block';
    }
  } else {
    // Add mode
    modalTitle.textContent = 'Add Product';
  }
  
  productModal.show();
}

// Show category modal for add/edit
function showCategoryModal(category = null) {
  const modalTitle = document.getElementById('category-modal-title');
  const categoryForm = document.getElementById('category-form');
  
  // Reset form
  categoryForm.reset();
  document.getElementById('category-id').value = '';
  
  if (category) {
    // Edit mode
    modalTitle.textContent = 'Edit Category';
    document.getElementById('category-id').value = category.id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';
  } else {
    // Add mode
    modalTitle.textContent = 'Add Category';
  }
  
  categoryModal.show();
}

// Preview image when selected
function previewImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  const imagePreview = document.getElementById('image-preview');
  const previewImg = imagePreview.querySelector('img');
  
  reader.onload = function(e) {
    previewImg.src = e.target.result;
    imagePreview.style.display = 'block';
  };
  
  reader.readAsDataURL(file);
}

// Save product
async function saveProduct() {
  const productId = document.getElementById('product-id').value;
  const isEdit = productId !== '';
  
  // Get form values
  const productData = {
    name: document.getElementById('product-name').value,
    price: parseFloat(document.getElementById('product-price').value),
    category_id: document.getElementById('product-category').value || null,
    stock_quantity: parseInt(document.getElementById('product-stock').value) || 0,
    description: document.getElementById('product-description').value
  };
  
  // Handle image upload
  const imageFile = document.getElementById('product-image').files[0];
  if (imageFile) {
    // In a real implementation, you would upload the image to a server
    // and get back a URL to store in the product data
    // For this example, we'll just use a placeholder
    productData.image_url = URL.createObjectURL(imageFile);
  }
  
  try {
    // In a real implementation, you would send this data to your API
    // For this example, we'll just update the local data
    
    if (isEdit) {
      // Update existing product
      const index = productsData.findIndex(p => p.id == productId);
      if (index !== -1) {
        productsData[index] = { ...productsData[index], ...productData };
      }
    } else {
      // Add new product
      const newProduct = {
        id: Date.now(), // Generate a temporary ID
        ...productData
      };
      productsData.push(newProduct);
    }
    
    // Close modal and update UI
    productModal.hide();
    renderProducts();
    
    // Update dashboard stats
    document.getElementById('products-count').textContent = productsData.length;
    
    // Show success message
    showToast('Success', isEdit ? 'Product updated successfully' : 'Product added successfully', 'success');
  } catch (error) {
    console.error('Error saving product:', error);
    showToast('Error', 'Failed to save product', 'danger');
  }
}

// Save category
async function saveCategory() {
  const categoryId = document.getElementById('category-id').value;
  const isEdit = categoryId !== '';
  
  // Get form values
  const categoryData = {
    name: document.getElementById('category-name').value,
    description: document.getElementById('category-description').value
  };
  
  try {
    // In a real implementation, you would send this data to your API
    // For this example, we'll just update the local data
    
    if (isEdit) {
      // Update existing category
      const index = categoriesData.findIndex(c => c.id == categoryId);
      if (index !== -1) {
        categoriesData[index] = { ...categoriesData[index], ...categoryData };
      }
    } else {
      // Add new category
      const newCategory = {
        id: Date.now(), // Generate a temporary ID
        ...categoryData
      };
      categoriesData.push(newCategory);
    }
    
    // Close modal and update UI
    categoryModal.hide();
    renderCategories();
    updateCategoryDropdown();
    
    // Update dashboard stats
    document.getElementById('categories-count').textContent = categoriesData.length;
    
    // Show success message
    showToast('Success', isEdit ? 'Category updated successfully' : 'Category added successfully', 'success');
  } catch (error) {
    console.error('Error saving category:', error);
    showToast('Error', 'Failed to save category', 'danger');
  }
}

// Edit product
function editProduct(id) {
  const product = productsData.find(p => p.id == id);
  if (product) {
    showProductModal(product);
  }
}

// Delete product
function deleteProduct(id, name) {
  currentItemId = id;
  currentItemType = 'product';
  document.getElementById('delete-item-name').textContent = name;
  deleteModal.show();
}

// Edit category
function editCategory(id) {
  const category = categoriesData.find(c => c.id == id);
  if (category) {
    showCategoryModal(category);
  }
}

// Delete category
function deleteCategory(id, name) {
  currentItemId = id;
  currentItemType = 'category';
  document.getElementById('delete-item-name').textContent = name;
  deleteModal.show();
}

// Confirm delete
async function confirmDelete() {
  try {
    if (currentItemType === 'product') {
      // Delete product
      productsData = productsData.filter(p => p.id != currentItemId);
      renderProducts();
      document.getElementById('products-count').textContent = productsData.length;
      showToast('Success', 'Product deleted successfully', 'success');
    } else if (currentItemType === 'category') {
      // Delete category
      categoriesData = categoriesData.filter(c => c.id != currentItemId);
      renderCategories();
      updateCategoryDropdown();
      document.getElementById('categories-count').textContent = categoriesData.length;
      showToast('Success', 'Category deleted successfully', 'success');
    }
    
    deleteModal.hide();
  } catch (error) {
    console.error('Error deleting item:', error);
    showToast('Error', 'Failed to delete item', 'danger');
  }
}

// Show toast notification
function showToast(title, message, type = 'primary') {
  const toastEl = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-message').textContent = message;
  
  // Remove existing classes
  toastEl.className = 'toast';
  
  // Add type class
  toastEl.classList.add(`border-${type}`);
  
  // Show toast
  toast.show();
}

// No longer needed email validation

// Make functions available globally
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;