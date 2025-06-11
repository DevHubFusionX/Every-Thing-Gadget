// Global variables
let productModal;
let deleteModal;
let currentProductId;
let currentCategoryId;
let categories = [];
let productsData = []; // Store products data globally
const apiBaseUrl = '/api'; // Fixed path for production on render.com

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  // Hide admin panel and show login form by default
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('login-form').style.display = 'flex';
  
  // Initialize Bootstrap modals
  productModal = new bootstrap.Modal(document.getElementById('productModal'));
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  
  // Set up event listeners
  document.getElementById('admin-login-form').addEventListener('submit', handleLogin);
  document.getElementById('dashboard-nav').addEventListener('click', loadDashboard);
  document.getElementById('products-nav').addEventListener('click', loadProductsPanel);
  document.getElementById('categories-nav').addEventListener('click', loadCategoriesPanel);
  document.getElementById('save-product').addEventListener('click', saveProduct);
  document.getElementById('confirm-delete').addEventListener('click', deleteProduct);
  
  // Add placeholder handlers for other nav items
  document.getElementById('orders-nav').addEventListener('click', function() {
    setActiveNavItem('orders-nav');
    document.getElementById('admin-panel').innerHTML = '<div class="alert alert-info">Orders management coming soon</div>';
  });
  
  document.getElementById('settings-nav').addEventListener('click', function() {
    setActiveNavItem('settings-nav');
    document.getElementById('admin-panel').innerHTML = '<div class="alert alert-info">Settings panel coming soon</div>';
  });
  
  // Check if already logged in
  const token = localStorage.getItem('adminToken');
  if (token) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    updateAuthNav(true);
  } else {
    updateAuthNav(false);
  }
});

// Update the authentication navigation
function updateAuthNav(isLoggedIn) {
  const authNav = document.getElementById('auth-nav');
  const navItems = document.getElementById('nav-items');
  
  if (isLoggedIn) {
    // Show user menu with logout button
    authNav.innerHTML = `
      <div class="user-image">A</div>
      <div>
        <div class="fw-bold">Admin</div>
        <a href="#" id="logout-link" class="text-muted small">Logout</a>
      </div>
    `;
    document.getElementById('logout-link').addEventListener('click', handleLogout);
    
    // Show navigation items
    navItems.style.display = 'block';
    
    // Load dashboard as default view
    loadDashboard();
  } else {
    // Hide logout button
    authNav.innerHTML = '';
    
    // Hide navigation items
    navItems.style.display = 'none';
  }
}

// Load dashboard with stats and charts
function loadDashboard() {
  setActiveNavItem('dashboard-nav');
  document.getElementById('current-page-title').textContent = 'Dashboard';
  
  const adminPanel = document.getElementById('admin-panel');
  adminPanel.style.display = 'block';
  
  // Simulate loading some stats
  adminPanel.innerHTML = `
    <div class="dashboard-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="bi bi-box-seam"></i>
        </div>
        <h3>24</h3>
        <p>Total Products</p>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="bi bi-tags"></i>
        </div>
        <h3>8</h3>
        <p>Categories</p>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="bi bi-cart3"></i>
        </div>
        <h3>156</h3>
        <p>Total Orders</p>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="bi bi-currency-dollar"></i>
        </div>
        <h3>$12,456</h3>
        <p>Revenue</p>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-8 mb-4">
        <div class="admin-container">
          <h5 class="mb-4">Sales Overview</h5>
          <canvas id="salesChart" height="300"></canvas>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="admin-container">
          <h5 class="mb-4">Top Categories</h5>
          <canvas id="categoryChart" height="300"></canvas>
        </div>
      </div>
    </div>
  `;
  
  // Initialize charts
  const salesCtx = document.getElementById('salesChart').getContext('2d');
  new Chart(salesCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sales',
        data: [1200, 1900, 1500, 2500, 2100, 3100],
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
  
  const categoryCtx = document.getElementById('categoryChart').getContext('2d');
  new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: ['Electronics', 'Clothing', 'Books', 'Home'],
      datasets: [{
        data: [40, 25, 20, 15],
        backgroundColor: [
          '#0f766e',
          '#0e7490',
          '#0284c7',
          '#2563eb'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.querySelector('#admin-login-form button[type="submit"]');
  const originalBtnText = loginBtn.innerHTML;
  
  // Show loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
  
  try {
    const response = await fetch(`${apiBaseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      loadProductsPanel(); // Load products immediately after login
      updateAuthNav(true);
    } else {
      // Show specific error message from server or default message
      const errorMsg = data.message || 'Invalid username or password';
      showLoginError(errorMsg);
    }
  } catch (error) {
    showLoginError('Connection error. Please try again.');
    console.error('Login error:', error);
  } finally {
    // Restore button state
    loginBtn.disabled = false;
    loginBtn.innerHTML = originalBtnText;
  }
}

// Show login error message
function showLoginError(message) {
  const loginForm = document.getElementById('admin-login-form');
  
  // Remove any existing error message
  const existingError = loginForm.querySelector('.login-error');
  if (existingError) {
    existingError.remove();
  }
  
  // Create and add new error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger mt-3 login-error';
  errorDiv.textContent = message;
  loginForm.appendChild(errorDiv);
  
  // Shake the form to indicate error
  loginForm.classList.add('shake');
  setTimeout(() => {
    loginForm.classList.remove('shake');
  }, 500);
}

// Handle logout
function handleLogout(e) {
  e.preventDefault();
  localStorage.removeItem('adminToken');
  document.getElementById('login-form').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
  updateAuthNav(false);
}

// Set the active navigation item
function setActiveNavItem(id) {
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  
  // Update page title
  const pageTitle = document.getElementById('current-page-title');
  switch(id) {
    case 'dashboard-nav':
      pageTitle.textContent = 'Dashboard';
      break;
    case 'products-nav':
      pageTitle.textContent = 'Products Management';
      break;
    case 'categories-nav':
      pageTitle.textContent = 'Categories Management';
      break;
    case 'orders-nav':
      pageTitle.textContent = 'Orders';
      break;
    case 'settings-nav':
      pageTitle.textContent = 'Settings';
      break;
  }
}

// Show an alert message
function showAlert(type, message, containerId = 'alert-container') {
  const alertContainer = document.getElementById(containerId);
  if (!alertContainer) return;
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alert);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    const bsAlert = new bootstrap.Alert(alert);
    bsAlert.close();
  }, 5000);
}

// Load the products management panel
async function loadProductsPanel() {
  // Prevent multiple simultaneous calls
  if (window.isLoadingProducts) return;
  window.isLoadingProducts = true;
  
  setActiveNavItem('products-nav');
  const adminPanel = document.getElementById('admin-panel');
  adminPanel.style.display = 'block';
  adminPanel.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>Loading products...</p></div>';
  
  try {
    // Load categories for the dropdown
    await loadCategories();
    
    // Check if we already have products data
    if (productsData.length > 0) {
      renderProductsTable(productsData);
      window.isLoadingProducts = false;
      return;
    }
    
    // Load products
    const response = await fetch(`${apiBaseUrl}/products`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    const products = data.products || data;
    productsData = products; // Store globally
    
    // Extract rendering to a separate function
    renderProductsTable(products);
  } catch (error) {
    adminPanel.innerHTML = `<div class="alert alert-danger">Error loading products: ${error.message}</div>`;
    console.error('Error loading products:', error);
  } finally {
    window.isLoadingProducts = false;
  }
}

// Load categories for the dropdown
async function loadCategories() {
  try {
    const response = await fetch(`${apiBaseUrl}/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    categories = await response.json();
    
    // Populate the category dropdown
    const categorySelect = document.getElementById('product-category');
    if (!categorySelect) return; // Skip if element doesn't exist yet
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Load the categories management panel
function loadCategoriesPanel() {
  setActiveNavItem('categories-nav');
  const adminPanel = document.getElementById('admin-panel');
  adminPanel.style.display = 'block';
  adminPanel.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>Loading categories...</p></div>';
  
  fetch(`${apiBaseUrl}/categories`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return res.json();
    })
    .then(categoriesData => {
      // Store categories globally
      categories = categoriesData;
      
      adminPanel.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Categories Management</h2>
          <button class="btn btn-success" id="add-category-btn">Add New Category</button>
        </div>
        <div id="alert-container"></div>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(c => `
                <tr>
                  <td>${c.id}</td>
                  <td>${c.name}</td>
                  <td>${c.description || 'N/A'}</td>
                  <td class="action-buttons">
                    <button class="btn btn-sm btn-primary edit-category" data-id="${c.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-category" data-id="${c.id}" data-name="${c.name}">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      
      // Add event listeners
      document.getElementById('add-category-btn').addEventListener('click', () => showCategoryModal());
      document.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', () => editCategory(btn.dataset.id));
      });
      document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', () => showDeleteCategoryModal(btn.dataset.id, btn.dataset.name));
      });
    })
    .catch(err => {
      adminPanel.innerHTML = `<div class="alert alert-danger">Error loading categories: ${err.message}</div>`;
    });
}

// Render products table
function renderProductsTable(products) {
  const adminPanel = document.getElementById('admin-panel');
  
  adminPanel.innerHTML = `
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
      <h2 class="mb-3 mb-md-0">Products Management</h2>
      <button class="btn btn-success" id="add-product-btn">
        <i class="bi bi-plus-circle me-1"></i> Add New Product
      </button>
    </div>
    <div class="row mb-3">
      <div class="col-12 col-md-6">
        <label for="category-filter" class="form-label">Filter by Category:</label>
        <select class="form-select" id="category-filter">
          <option value="">All Categories</option>
          ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="alert-container"></div>
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th class="d-none d-md-table-cell">Category</th>
            <th class="d-none d-md-table-cell">Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="products-table-body">
          ${products.map(p => `
            <tr>
              <td>${p.id}</td>
              <td>
                <img src="${p.image_url || '/uploads/sample-phone.jpg'}" 
                     alt="${p.name}" 
                     class="product-image"
                     onerror="this.src='/uploads/sample-phone.jpg'">
              </td>
              <td>${p.name}</td>
              <td>${parseFloat(p.price).toFixed(2)}</td>
              <td class="d-none d-md-table-cell">${p.category || 'N/A'}</td>
              <td class="d-none d-md-table-cell">${p.stock_quantity || 0}</td>
              <td class="action-buttons">
                <button class="btn btn-sm btn-primary edit-product" data-id="${p.id}">
                  <i class="bi bi-pencil-square"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-product" data-id="${p.id}" data-name="${p.name}">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  // Add event listeners for the buttons
  document.getElementById('add-product-btn').addEventListener('click', () => showProductModal());
  document.querySelectorAll('.edit-product').forEach(btn => {
    btn.addEventListener('click', () => editProduct(btn.dataset.id));
  });
  document.querySelectorAll('.delete-product').forEach(btn => {
    btn.addEventListener('click', () => showDeleteModal(btn.dataset.id, btn.dataset.name));
  });
  
  // Add event listener for image upload button
  if (document.getElementById('upload-image-btn')) {
    document.getElementById('upload-image-btn').addEventListener('click', uploadProductImage);
  }
  
  // Add event listener for category filter
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProductsByCategory);
  }
}

// Placeholder functions to prevent errors
function showProductModal() {
  showAlert('info', 'Product modal functionality coming soon');
}

function editProduct() {
  showAlert('info', 'Edit product functionality coming soon');
}

function showDeleteModal() {
  showAlert('info', 'Delete product functionality coming soon');
}

function saveProduct() {
  showAlert('info', 'Save product functionality coming soon');
}

function deleteProduct() {
  showAlert('info', 'Delete product functionality coming soon');
}

function uploadProductImage() {
  showAlert('info', 'Upload image functionality coming soon');
}

function filterProductsByCategory() {
  showAlert('info', 'Filter by category functionality coming soon');
}

function showCategoryModal() {
  showAlert('info', 'Category modal functionality coming soon');
}

function editCategory() {
  showAlert('info', 'Edit category functionality coming soon');
}

function showDeleteCategoryModal() {
  showAlert('info', 'Delete category modal functionality coming soon');
}