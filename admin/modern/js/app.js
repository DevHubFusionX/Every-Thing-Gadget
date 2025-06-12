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
      
      // Only load data if it hasn't been loaded yet or if it's been more than 5 minutes
      const now = Date.now();
      if (pageId === 'products-content') {
        const lastProductsLoad = localStorage.getItem('lastProductsLoad');
        if (!productsData.length || !lastProductsLoad || (now - parseInt(lastProductsLoad)) > 300000) {
          loadProducts();
          localStorage.setItem('lastProductsLoad', now.toString());
        }
      } else if (pageId === 'categories-content') {
        const lastCategoriesLoad = localStorage.getItem('lastCategoriesLoad');
        if (!categoriesData.length || !lastCategoriesLoad || (now - parseInt(lastCategoriesLoad)) > 300000) {
          loadCategories();
          localStorage.setItem('lastCategoriesLoad', now.toString());
        }
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
    console.log('Fetching products from:', `${apiBaseUrl}/products`);
    
    const response = await fetch(`${apiBaseUrl}/products`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log('Products response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse products response:', e);
      throw new Error('Invalid response format');
    }
    
    // Ensure productsData is always an array
    productsData = Array.isArray(data) ? data : (data.products || []);
    console.log('Processed products data:', productsData);
    
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
  
  productsTableBody.innerHTML = productsData.map(product => {
    // Use Cloudinary URL or fallback to placeholder
    let imageUrl = product.image_url || 'https://via.placeholder.com/50';
    
    return `
    <tr>
      <td>
        <img src="${imageUrl}" 
             alt="${product.name}" 
             class="img-thumbnail" 
             style="width: 50px; height: 50px; object-fit: cover;">
      </td>
      <td>${product.name}</td>
      <td>$${parseFloat(product.price).toFixed(2)}</td>
      <td>${product.stock_quantity || 0}</td>
      <td>${getCategoryName(product.category_id) || 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="window.editProduct(${product.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="window.deleteProduct(${product.id}, '${product.name.replace(/'/g, "\\\\'").replace(/"/g, '\\\\"')}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
    `;
  }).join('');
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
    console.log('Fetching categories from:', `${apiBaseUrl}/categories`);
    const response = await fetch(`${apiBaseUrl}/categories`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log('Categories response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse categories response:', e);
      throw new Error('Invalid response format');
    }
    
    // Ensure categoriesData is always an array
    categoriesData = Array.isArray(data) ? data : (data.categories || []);
    console.log('Processed categories data:', categoriesData);
    
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
        <button class="btn btn-sm btn-primary me-1" onclick="window.editCategory(${category.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="window.deleteCategory(${category.id}, '${category.name.replace(/'/g, "\\\\'").replace(/"/g, '\\\\"')}')">
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
    document.getElementById('product-sku').value = product.sku || '';
    
    // Show image preview if available
    if (product.image_url) {
      // Use Cloudinary URL directly
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
    stock_quantity: parseInt(document.getElementById('product-stock').value) || 0,
    description: document.getElementById('product-description').value,
    sku: document.getElementById('product-sku').value || `SKU-${Date.now()}`
  };
  
  // Get category name instead of ID
  const categorySelect = document.getElementById('product-category');
  if (categorySelect.value) {
    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
    productData.category = selectedOption.text;
    productData.category_id = categorySelect.value;
  }
  
  try {
    // Handle image upload
    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      console.log('Uploading image to Cloudinary...');
      const uploadResponse = await fetch(`${apiBaseUrl}/upload-image`, {
        method: 'POST',
        body: formData
      });
      
      const uploadText = await uploadResponse.text();
      console.log('Upload response:', uploadText);
      
      try {
        const uploadResult = JSON.parse(uploadText);
        if (uploadResult.imageUrl) {
          // Store the Cloudinary URL
          productData.image_url = uploadResult.imageUrl;
          productData.cloudinary_id = uploadResult.public_id;
          console.log('Cloudinary image URL saved:', productData.image_url);
        }
      } catch (e) {
        console.error('Failed to parse upload response:', e);
      }
    }
    
    console.log('Saving product data:', JSON.stringify(productData));
    
    // Now save the product
    let url = `${apiBaseUrl}/product`;
    let method = 'POST';
    
    if (isEdit) {
      url = `${apiBaseUrl}/product/${productId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const responseText = await response.text();
    console.log('Server response:', responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${responseText}`);
    }
    
    await loadProducts();
    productModal.hide();
    document.getElementById('products-count').textContent = productsData.length;
    showToast('Success', isEdit ? 'Product updated successfully' : 'Product added successfully', 'success');
  } catch (error) {
    console.error('Error saving product:', error);
    showToast('Error', 'Failed to save product: ' + error.message, 'danger');
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
    let url = `${apiBaseUrl}/category`;
    let method = 'POST';
    
    if (isEdit) {
      url = `${apiBaseUrl}/category/${categoryId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(categoryData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    // Reload categories
    await loadCategories();
    
    // Close modal and update UI
    categoryModal.hide();
    
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
async function editProduct(id) {
  try {
    const response = await fetch(`${apiBaseUrl}/product/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const product = await response.json();
    if (product) {
      showProductModal(product);
    }
  } catch (error) {
    console.error('Error loading product details:', error);
    showToast('Error', 'Failed to load product details', 'danger');
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
async function editCategory(id) {
  try {
    const response = await fetch(`${apiBaseUrl}/category/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const category = await response.json();
    if (category) {
      showCategoryModal(category);
    }
  } catch (error) {
    console.error('Error loading category details:', error);
    showToast('Error', 'Failed to load category details', 'danger');
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
    let url;
    let reloadFunction;
    let successMessage;
    
    if (currentItemType === 'product') {
      url = `${apiBaseUrl}/product/${currentItemId}`;
      reloadFunction = loadProducts;
      successMessage = 'Product deleted successfully';
    } else if (currentItemType === 'category') {
      url = `${apiBaseUrl}/category/${currentItemId}`;
      reloadFunction = loadCategories;
      successMessage = 'Category deleted successfully';
    } else {
      throw new Error('Unknown item type');
    }
    
    console.log(`Deleting ${currentItemType} with ID: ${currentItemId}`);
    console.log(`DELETE request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    const responseText = await response.text();
    console.log('Delete response:', responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${responseText}`);
    }
    
    // Reload data
    await reloadFunction();
    
    // Update dashboard stats
    document.getElementById('products-count').textContent = productsData.length;
    document.getElementById('categories-count').textContent = categoriesData.length;
    
    showToast('Success', successMessage, 'success');
    deleteModal.hide();
  } catch (error) {
    console.error('Error deleting item:', error);
    showToast('Error', 'Failed to delete item: ' + error.message, 'danger');
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

// Make functions available globally
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.showProductModal = showProductModal;
window.showCategoryModal = showCategoryModal;