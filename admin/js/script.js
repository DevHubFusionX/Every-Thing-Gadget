// Global variables
let apiToken = localStorage.getItem("api_token");
const apiBaseUrl = "../api/";

// Debug mode - log API requests and responses
const DEBUG = true;

// Helper function to safely parse JSON responses
async function safeJsonParse(response) {
  const text = await response.text();
  if (DEBUG) console.log("Raw response:", text);
  
  // Check if response is HTML (InfinityFree error page)
  if (text.trim().startsWith('<')) {
    throw new Error("Server returned HTML instead of JSON. This might be an InfinityFree anti-bot protection or server error.");
  }
  
  try {
    // Try to parse as-is first
    return JSON.parse(text);
  } catch (error) {
    if (DEBUG) console.error("JSON parse error:", error);
    
    // Try to find and extract JSON from the response
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      try {
        if (DEBUG) console.log("Attempting to parse extracted JSON:", jsonMatch[0]);
        return JSON.parse(jsonMatch[0]);
      } catch (extractError) {
        if (DEBUG) console.error("Failed to parse extracted JSON:", extractError);
      }
    }
    
    throw new Error("Invalid JSON response from server");
  }
}

// Fixed token for testing (same as in create-admin.php)
const FIXED_TOKEN =
  "f8c91a5c9f58c5b4b3b3f3d6b8c7a9e2d1f0e3b2a1c0d9e8f7a6b5c4d3e2f1";

// Pagination and filtering state
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let searchQuery = "";
let categoryFilter = "";
let stockFilter = "";
let sortBy = "created_at";
let sortDir = "DESC";
const deleteModal = new bootstrap.Modal(
  document.getElementById("delete-modal")
);
let productToDelete = null;

// DOM Elements
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const productsSection = document.getElementById("products-section");
const productFormSection = document.getElementById("product-form-section");
const categoriesSection = document.getElementById("categories-section");
const loginForm = document.getElementById("login-form");
const productForm = document.getElementById("product-form");
const productsTableBody = document.getElementById("products-table-body");
const addProductBtn = document.getElementById("add-product-btn");
const backToProductsBtn = document.getElementById("back-to-products-btn");
const logoutBtn = document.getElementById("logout-btn");
const formTitle = document.getElementById("form-title");
const loginError = document.getElementById("login-error");
const formError = document.getElementById("form-error");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const manageCategoriesBtn = document.getElementById("manage-categories-btn");
const pagination = document.getElementById("pagination");

// Search and filter elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const categoryFilterSelect = document.getElementById("category-filter");
const stockFilterSelect = document.getElementById("stock-filter");
const sortBySelect = document.getElementById("sort-by");

// Image upload elements
const uploadImageBtn = document.getElementById("upload-image-btn");
const imageFileInput = document.getElementById("image-file-input");
const imagePreview = document.getElementById("image-preview");
const previewImage = imagePreview.querySelector("img");
const removeImageBtn = document.getElementById("remove-image-btn");
const productImageInput = document.getElementById("product-image");

// Check if user is logged in
document.addEventListener("DOMContentLoaded", () => {
  if (apiToken) {
    showDashboard();

    // Restore category filter from localStorage if available
    const savedCategoryId = localStorage.getItem("selectedCategoryId");
    if (savedCategoryId) {
      categoryFilter = savedCategoryId;

      // Wait for categories to load before setting the filter value
      setTimeout(() => {
        if (categoryFilterSelect && categoryFilterSelect.options.length > 0) {
          categoryFilterSelect.value = savedCategoryId;

          // Update page title with saved category name
          const savedCategoryName = localStorage.getItem(
            "selectedCategoryName"
          );
          if (savedCategoryName && savedCategoryName !== "All Categories") {
            document.querySelector(
              "#products-section h2"
            ).textContent = `Products - ${savedCategoryName}`;
          }
        }
      }, 500);
    }

    loadProducts();
  } else {
    showLogin();
  }

  // No additional buttons needed
});

// Event Listeners
loginForm.addEventListener("submit", handleLogin);
productForm.addEventListener("submit", handleProductSubmit);
addProductBtn.addEventListener("click", showAddProductForm);
backToProductsBtn.addEventListener("click", showProductsSection);
logoutBtn.addEventListener("click", handleLogout);
confirmDeleteBtn.addEventListener("click", confirmDeleteProduct);
manageCategoriesBtn.addEventListener("click", showCategoriesSection);

// Search and filter event listeners
searchBtn.addEventListener("click", applyFilters);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") applyFilters();
});

// Add event listener to category filter that updates the dropdown text
categoryFilterSelect.addEventListener("change", function () {
  // Store the selected category ID
  categoryFilter = this.value;

  // Update the dropdown text
  const selectedText = this.options[this.selectedIndex].text;
  console.log("Selected category:", selectedText);

  // Apply filters
  applyFilters();
});

stockFilterSelect.addEventListener("change", applyFilters);
sortBySelect.addEventListener("change", applyFilters);

// Image upload event listeners
uploadImageBtn.addEventListener("click", () => imageFileInput.click());
imageFileInput.addEventListener("change", handleImageUpload);
removeImageBtn.addEventListener("click", removeImagePreview);
productImageInput.addEventListener("input", updateImagePreview);

// Authentication Functions
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    if (DEBUG) console.log("Logging in with username:", username);

    // For testing: Use fixed token instead of API call
    if (username === "admin" && password === "admin123") {
      apiToken = FIXED_TOKEN;
      localStorage.setItem("api_token", apiToken);
      showDashboard();
      loadProducts();
      return;
    }

    const response = await fetch(`${apiBaseUrl}login-direct.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (DEBUG) console.log("Login response status:", response.status);

    const data = await response.json();

    if (DEBUG) console.log("Login response data:", data);

    if (response.ok) {
      apiToken = data.token;
      localStorage.setItem("api_token", apiToken);
      showDashboard();
      loadProducts();
    } else {
      showError(loginError, data.message || "Login failed");
    }
  } catch (error) {
    if (DEBUG) console.error("Login error:", error);
    showError(loginError, "Network error. Please try again.");
  }
}

function handleLogout() {
  localStorage.removeItem("api_token");
  apiToken = null;
  showLogin();
}

// UI Functions
function showLogin() {
  loginSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  loginForm.reset();
  hideError(loginError);
}

function showDashboard() {
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  showProductsSection();
}

function showProductsSection() {
  productsSection.classList.remove("hidden");
  productFormSection.classList.add("hidden");
  categoriesSection.classList.add("hidden");
}

function showCategoriesSection() {
  if (DEBUG) console.log("Showing categories section");
  productsSection.classList.add("hidden");
  productFormSection.classList.add("hidden");
  categoriesSection.classList.remove("hidden");

  // Just show the categories section, don't try to load categories
  // The categories.js file will handle loading categories when needed
}

function showAddProductForm() {
  formTitle.textContent = "Add New Product";
  productForm.reset();
  document.getElementById("product-id").value = "";
  hideError(formError);
  hideImagePreview();

  productsSection.classList.add("hidden");
  productFormSection.classList.remove("hidden");
}

function showEditProductForm(product) {
  formTitle.textContent = "Edit Product";

  document.getElementById("product-id").value = product.id;
  document.getElementById("product-name").value = product.name;
  document.getElementById("product-description").value = product.description;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-stock").value = product.stock_quantity;
  document.getElementById("product-sku").value = product.sku;
  document.getElementById("product-image").value = product.image_url || "";

  // Show image preview if available
  if (product.image_url) {
    showImagePreview(product.image_url);
  } else {
    hideImagePreview();
  }

  hideError(formError);

  productsSection.classList.add("hidden");
  productFormSection.classList.remove("hidden");
}

// Product CRUD Functions
async function loadProducts() {
  try {
    // Build query parameters for filtering and pagination
    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      sort_by: sortBy,
      sort_dir: sortDir,
    });

    // Add optional filters if they exist
    if (searchQuery) params.append("search", searchQuery);
    if (categoryFilter) params.append("category_id", categoryFilter);
    if (stockFilter) params.append("in_stock", stockFilter);

    const url = `${apiBaseUrl}products.php?${params.toString()}`;

    if (DEBUG) {
      console.log("Loading products with URL:", url);
      console.log("Full URL:", new URL(url, window.location.href).href);
      console.log("Sort by:", sortBy);
      console.log("Sort direction:", sortDir);
    }

    const response = await fetch(url);

    if (DEBUG) {
      console.log("Response status:", response.status);
    }

    // Use simpler approach with fetch API
    const data = await safeJsonParse(response).catch((error) => {
      if (DEBUG) console.error("Failed to parse JSON:", error);
      showAlert("danger", error.message || "Failed to parse server response");
      return null;
    });

    if (!data) return;

    // Check if response contains an error
    if (data.error) {
      if (DEBUG) console.error("API returned error:", data.message);
      showAlert("danger", data.message || "Server error");
      return;
    }

    if (DEBUG) console.log("Response data:", data);
    if (DEBUG) console.log("Data type:", typeof data);
    if (DEBUG) console.log("Is array:", Array.isArray(data));

    // Get products array (either direct array or from products property)
    const productsArray = Array.isArray(data) ? data : data.products || [];
    
    if (DEBUG) console.log("Products array:", productsArray);
    if (DEBUG) console.log("Products array length:", productsArray.length);

    // Get pagination info if available
    if (data.pagination) {
      totalPages = data.pagination.total_pages || 1;
      currentPage = data.pagination.page || 1;
    } else {
      // If no pagination info, assume single page
      totalPages = 1;
      currentPage = 1;
    }

    if (DEBUG) console.log("Products array:", productsArray);

    renderProductsTable(productsArray);
    renderPagination();

    // Also load categories for the filter
    loadCategoriesForFilter();
  } catch (error) {
    if (DEBUG) {
      console.error("Error loading products:", error);
      console.error("Error stack:", error.stack);
      console.error("API URL being called:", url);
    }
    showAlert("danger", `Network error: ${error.message}. Check console for details.`);
  }
}

async function loadCategoriesForFilter() {
  try {
    const response = await fetch(`${apiBaseUrl}categories.php`);
    const categories = await safeJsonParse(response);

    if (DEBUG) console.log("Categories response:", categories);

    if (Array.isArray(categories)) {
      updateCategoryFilter(categories);
      updateProductCategorySelect(categories);
    }
  } catch (error) {
    if (DEBUG) console.error("Error loading categories for filter:", error);
    // Don't show alert for categories error, just log it
  }
}

function updateCategoryFilter(categories) {
  // Keep the first option (All Categories)
  categoryFilterSelect.innerHTML = '<option value="">All Categories</option>';

  // Add categories
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categoryFilterSelect.appendChild(option);
  });

  // Restore selected value if there was one
  if (categoryFilter) {
    categoryFilterSelect.value = categoryFilter;
  }
}

function updateProductCategorySelect(categories) {
  const productCategorySelect = document.getElementById("product-category");
  productCategorySelect.innerHTML = '<option value="">Select Category</option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    productCategorySelect.appendChild(option);
  });
}

function applyFilters() {
  // Get filter values
  searchQuery = searchInput.value.trim();
  categoryFilter = categoryFilterSelect.value;
  stockFilter = stockFilterSelect.value;
  sortBy = sortBySelect.value;

  // Get sort direction based on selected sort field
  if (sortBy === "price" || sortBy === "name") {
    sortDir = "ASC"; // Ascending for price and name
  } else if (sortBy === "stock_quantity") {
    sortDir = "DESC"; // Descending for stock
  } else {
    sortDir = "DESC"; // Default descending for created_at
  }

  // Update page title to show selected category
  const categoryName = categoryFilter
    ? categoryFilterSelect.options[categoryFilterSelect.selectedIndex].text
    : "All Categories";

  document.querySelector("#products-section h2").textContent =
    categoryName !== "All Categories"
      ? `Products - ${categoryName}`
      : "Products";

  // Store the selection in localStorage for persistence
  localStorage.setItem("selectedCategoryId", categoryFilter);
  localStorage.setItem("selectedCategoryName", categoryName);
  localStorage.setItem("selectedSortBy", sortBy);

  if (DEBUG) {
    console.log("Applying filters:");
    console.log("- Search:", searchQuery);
    console.log("- Category ID:", categoryFilter);
    console.log("- Category Name:", categoryName);
    console.log("- Stock:", stockFilter);
    console.log("- Sort by:", sortBy);
    console.log("- Sort direction:", sortDir);
  }

  // Reset to first page when filters change
  currentPage = 1;

  // Reload products with new filters
  loadProducts();
}

function renderPagination() {
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>`;
  if (currentPage > 1) {
    prevLi.addEventListener("click", () => {
      currentPage--;
      loadProducts();
    });
  }
  pagination.appendChild(prevLi);

  // Page numbers
  const maxPages = Math.min(5, totalPages);
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPages - 1);

  if (endPage - startPage + 1 < maxPages) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;

    if (i !== currentPage) {
      pageLi.addEventListener("click", () => {
        currentPage = i;
        loadProducts();
      });
    }

    pagination.appendChild(pageLi);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentPage === totalPages ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>`;
  if (currentPage < totalPages) {
    nextLi.addEventListener("click", () => {
      currentPage++;
      loadProducts();
    });
  }
  pagination.appendChild(nextLi);
}

async function handleProductSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById("product-id").value;
  const isEdit = productId !== "";

  const productData = {
    name: document.getElementById("product-name").value,
    description: document.getElementById("product-description").value,
    price: parseFloat(document.getElementById("product-price").value),
    category: document.getElementById("product-category").value,
    stock_quantity: parseInt(document.getElementById("product-stock").value),
    sku: document.getElementById("product-sku").value,
    image_url: document.getElementById("product-image").value,
  };

  try {
    // Use products.php for product operations - use POST for both add and edit
    let url = `${apiBaseUrl}products.php`;
    const method = "POST";
    
    // Add action and id parameters for edit operations
    if (isEdit) {
      productData.action = "update";
      productData.id = productId;
    }

    if (DEBUG) {
      console.log(`${method} request to ${url}`, productData);
      console.log("Full URL being called:", url);
      console.log("Request method:", method);
      console.log("Request body:", JSON.stringify(productData));
    }

    // Convert productData to form-encoded format for better InfinityFree compatibility
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(productData)) {
      formData.append(key, value);
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    });

    if (DEBUG) console.log("Response status:", response.status);

    const responseText = await response.text();
    if (DEBUG) console.log("Raw response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      if (DEBUG) console.log("Response data:", data);
    } catch (jsonError) {
      if (DEBUG) console.error("JSON parse error:", jsonError);
      showError(formError, "Invalid response from server");
      return;
    }

    if (DEBUG) console.log("Response status:", response.status);

    if (response.ok) {
      showProductsSection();
      loadProducts();
      showAlert(
        "success",
        isEdit ? "Product updated successfully" : "Product added successfully"
      );
    } else {
      showError(formError, data.message || "Failed to save product");
    }
  } catch (error) {
    if (DEBUG) {
      console.error("Error saving product:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    showError(formError, `Network error: ${error.message}. Please try again.`);
  }
}

function showDeleteConfirmation(productId) {
  // Convert productId to string explicitly
  productToDelete = String(productId);
  console.log("showDeleteConfirmation called with:", productId);
  console.log("productToDelete set to:", productToDelete);
  console.log("productToDelete type:", typeof productToDelete);
  deleteModal.show();
}

async function confirmDeleteProduct() {
  if (!productToDelete) return;

  try {
    // Use products.php for delete operations
    const url = `${apiBaseUrl}products.php`;

    if (DEBUG) console.log(`DELETE request to ${url}`);

    // DIRECT APPROACH: Create a simple string with the exact format needed
    // This is the approach that works in our debug tests
    const urlEncodedData = `action=delete&id=${encodeURIComponent(productToDelete)}`;

    if (DEBUG) {
      console.log("Delete - Product ID:", productToDelete);
      console.log("Delete - Product ID type:", typeof productToDelete);
      console.log("Delete - Form data:", urlEncodedData);
      console.log("Delete - URL:", url);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlEncodedData,
      // Prevent caching issues
      cache: "no-cache"
    });

    if (DEBUG) console.log("Response status:", response.status);

    const text = await response.text();
    if (DEBUG) {
      console.log("Raw response:", text);
      console.log("Response headers:", response.headers);
      console.log("Content-Type:", response.headers.get('Content-Type'));
    }

    let data;
    try {
      data = JSON.parse(text);
      if (DEBUG) console.log("Parsed data:", data);
    } catch (error) {
      if (DEBUG) {
        console.error("JSON parse error:", error);
        console.error("Raw response that failed to parse:", text);
      }
      showAlert("danger", "Invalid response from server");
      return;
    }

    if (DEBUG) console.log("Response data:", data);

    if (response.ok && data.success) {
      loadProducts();
      showAlert("success", "Product deleted successfully");
    } else {
      // Show detailed error information
      if (DEBUG) {
        console.error("Delete failed. Full response:", data);
      }
      const errorMsg = data.message || "Failed to delete product";
      const detailMsg = data.received_post ? ` (Received: ${JSON.stringify(data.received_post)})` : '';
      showAlert("danger", errorMsg + detailMsg);
    }
  } catch (error) {
    if (DEBUG) console.error("Error deleting product:", error);
    showAlert("danger", "Failed to delete product");
  }

  deleteModal.hide();
  productToDelete = null;
  // Accessibility: Move focus to Add Product button after modal closes
  setTimeout(() => {
    if (addProductBtn) addProductBtn.focus();
  }, 300);
}

// Helper Functions
function renderProductsTable(products) {
  productsTableBody.innerHTML = "";

  if (products.length === 0) {
    productsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No products found</td>
            </tr>
        `;
    return;
  }

  products.forEach((product) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${product.id}</td>
            <td>
                ${
                  product.image_url
                    ? `<img src="${product.image_url}" alt="${product.name}" class="product-image">`
                    : '<span class="badge bg-secondary">No image</span>'
                }
            </td>
            <td>
                <div>${product.name}</div>
                <small class="text-muted d-md-none">
                    ${product.category} | Stock: ${product.stock_quantity}
                </small>
            </td>
            <td>${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.category}</td>
            <td class="d-none d-md-table-cell">${product.stock_quantity}</td>
            <td class="d-none d-md-table-cell">${product.sku}</td>
            <td>
                <div class="product-buttons">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${
                      product.id
                    }">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${
                      product.id
                    }">Delete</button>
                </div>
            </td>
        `;

    productsTableBody.appendChild(row);

    // Add event listeners to the buttons
    row.querySelector(".edit-btn").addEventListener("click", () => {
      showEditProductForm(product);
    });

    row.querySelector(".delete-btn").addEventListener("click", () => {
      // Convert to string explicitly when passing to showDeleteConfirmation
      showDeleteConfirmation(String(product.id));
    });
  });
}

function showAlert(type, message) {
  const alertContainer = document.getElementById("alert-container");
  const alert = document.createElement("div");

  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  alertContainer.appendChild(alert);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (alert && alert.parentNode) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 5000);
}

function showError(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

function hideError(element) {
  element.textContent = "";
  element.classList.add("hidden");
}

// Image Upload Functions
async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    showAlert(
      "danger",
      "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed."
    );
    return;
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showAlert("danger", "File is too large. Maximum size is 2MB.");
    return;
  }

  // Show loading state
  uploadImageBtn.disabled = true;
  uploadImageBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...';

  try {
    // Create form data
    const formData = new FormData();
    formData.append("image", file);

    // Upload image
    const response = await fetch(`${apiBaseUrl}upload-image.php`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      // Update image URL input
      productImageInput.value = data.image_url;

      // Show preview
      showImagePreview(data.image_url);

      showAlert("success", "Image uploaded successfully");
    } else {
      showAlert("danger", data.message || "Failed to upload image");
    }
  } catch (error) {
    if (DEBUG) console.error("Image upload error:", error);
    showAlert("danger", "Network error. Please try again.");
  } finally {
    // Reset upload button
    uploadImageBtn.disabled = false;
    uploadImageBtn.textContent = "Upload";

    // Clear file input
    imageFileInput.value = "";
  }
}

function updateImagePreview() {
  const imageUrl = productImageInput.value.trim();
  if (imageUrl) {
    showImagePreview(imageUrl);
  } else {
    hideImagePreview();
  }
}

function showImagePreview(url) {
  previewImage.src = url;
  previewImage.onload = () => {
    imagePreview.classList.remove("d-none");
  };
  previewImage.onerror = () => {
    imagePreview.classList.add("d-none");
  };
}

function hideImagePreview() {
  imagePreview.classList.add("d-none");
  previewImage.src = "";
}

function removeImagePreview() {
  productImageInput.value = "";
  hideImagePreview();
}

// Sample products function removed;