// Simple Admin JS
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('adminToken');
  if (token) {
    showAdminPanel();
  } else {
    showLoginForm();
  }
  
  // Set up event listeners
  document.getElementById('admin-login-form').addEventListener('submit', handleLogin);
  document.getElementById('admin-logout').addEventListener('click', handleLogout);
  document.getElementById('add-product-btn').addEventListener('click', showAddProductForm);
});

// Show login form
function showLoginForm() {
  document.getElementById('login-container').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

// Show admin panel
function showAdminPanel() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  loadProducts();
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.querySelector('#admin-login-form button');
  
  // Show loading state
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';
  
  try {
    const response = await fetch('/api/login', {
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
      showAdminPanel();
    } else {
      showError('Invalid username or password');
    }
  } catch (error) {
    showError('Connection error. Please try again.');
    console.error('Login error:', error);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

// Handle logout
function handleLogout(e) {
  e.preventDefault();
  localStorage.removeItem('adminToken');
  showLoginForm();
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Load products
async function loadProducts() {
  const productsList = document.getElementById('products-list');
  productsList.innerHTML = '<tr><td colspan="5" class="text-center">Loading products...</td></tr>';
  
  try {
    const response = await fetch('/api/products', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const products = await response.json();
    
    if (products.length === 0) {
      productsList.innerHTML = '<tr><td colspan="5" class="text-center">No products found</td></tr>';
      return;
    }
    
    productsList.innerHTML = products.map(product => `
      <tr>
        <td>${product.name}</td>
        <td>$${parseFloat(product.price).toFixed(2)}</td>
        <td>${product.category || 'N/A'}</td>
        <td>${product.stock_quantity || 0}</td>
        <td>
          <button class="admin-btn edit-product" data-id="${product.id}">Edit</button>
          <button class="admin-btn admin-btn-danger delete-product" data-id="${product.id}">Delete</button>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-product').forEach(btn => {
      btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
    
  } catch (error) {
    productsList.innerHTML = `<tr><td colspan="5" class="text-center">Error loading products: ${error.message}</td></tr>`;
  }
}

// Show add product form
function showAddProductForm() {
  // Implementation will be added later
  alert('Add product functionality coming soon');
}

// Edit product
function editProduct(id) {
  // Implementation will be added later
  alert(`Edit product ${id} functionality coming soon`);
}

// Delete product
function deleteProduct(id) {
  // Implementation will be added later
  alert(`Delete product ${id} functionality coming soon`);
}