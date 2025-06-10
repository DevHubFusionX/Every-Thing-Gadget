// Categories management script
// const apiBaseUrl = '../api'; // Use the global declaration from script.js
let apiToken = localStorage.getItem('api_token');
const FIXED_TOKEN = "f8c91a5c9f58c5b4b3b3f3d6b8c7a9e2d1f0e3b2a1c0d9e8f7a6b5c4d3e2f1";
const DEBUG = true;

// DOM Elements
const categoriesSection = document.getElementById('categories-section');
const categoriesTableBody = document.getElementById('categories-table-body');
const categoryForm = document.getElementById('category-form');
const categoryNameInput = document.getElementById('category-name');
const categoryDescriptionInput = document.getElementById('category-description');
const categoryIdInput = document.getElementById('category-id');
const formTitle = document.getElementById('category-form-title');
const backToProductsBtn = document.getElementById('back-to-products-btn');
const addCategoryBtn = document.getElementById('add-category-btn');
const categoryFormError = document.getElementById('category-form-error');

// Event Listeners
categoryForm.addEventListener('submit', handleCategorySubmit);
backToProductsBtn.addEventListener('click', hideCategories);
addCategoryBtn.addEventListener('click', showAddCategoryForm);

// Add event listener for categories section becoming visible
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.id === 'categories-section' && 
            !mutation.target.classList.contains('hidden')) {
            loadCategories();
        }
    });
});

// Start observing the categories section for visibility changes
observer.observe(categoriesSection, { 
    attributes: true, 
    attributeFilter: ['class'] 
});

// Functions
function showCategories() {
    categoriesSection.classList.remove('hidden');
    productsSection.classList.add('hidden');
    productFormSection.classList.add('hidden');
    loadCategories();
}

function hideCategories() {
    categoriesSection.classList.add('hidden');
    productsSection.classList.remove('hidden');
    loadProducts();
}

function showAddCategoryForm() {
    formTitle.textContent = 'Add New Category';
    categoryForm.reset();
    categoryIdInput.value = '';
    hideError(categoryFormError);
}

function showEditCategoryForm(category) {
    formTitle.textContent = 'Edit Category';
    categoryIdInput.value = category.id;
    categoryNameInput.value = category.name;
    categoryDescriptionInput.value = category.description || '';
    hideError(categoryFormError);
}

// Make loadCategories globally accessible
window.loadCategories = async function() {
    try {
        if (DEBUG) console.log('Fetching categories');
        
        const response = await fetch(`${apiBaseUrl}categories.php`);
        
        if (DEBUG) {
            console.log('Response status:', response.status);
        }
        
        const data = await response.json();
        
        if (DEBUG) console.log('Categories data:', data);
        
        renderCategoriesTable(data);
        
        // Also update the category filter in products section
        updateCategoryFilter(data);
    } catch (error) {
        if (DEBUG) console.error('Error loading categories:', error);
        showAlert('danger', 'Failed to load categories');
    }
}

function renderCategoriesTable(categories) {
    categoriesTableBody.innerHTML = '';
    
    if (categories.length === 0) {
        categoriesTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No categories found</td>
            </tr>
        `;
        return;
    }
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td>${category.description || ''}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-category-btn" data-id="${category.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-category-btn" data-id="${category.id}">Delete</button>
            </td>
        `;
        
        categoriesTableBody.appendChild(row);
        
        // Add event listeners
        row.querySelector('.edit-category-btn').addEventListener('click', () => {
            showEditCategoryForm(category);
        });
        
        row.querySelector('.delete-category-btn').addEventListener('click', () => {
            deleteCategory(category.id);
        });
    });
}

function updateCategoryFilter(categories) {
    const categoryFilter = document.getElementById('category-filter');
    
    // Keep the first option (All Categories)
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    // Add categories
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryId = categoryIdInput.value;
    const isEdit = categoryId !== '';
    
    const categoryData = {
        name: categoryNameInput.value,
        description: categoryDescriptionInput.value
    };
    
    try {
        const url = isEdit ? 
            `${apiBaseUrl}categories.php?id=${categoryId}` : 
            `${apiBaseUrl}categories.php`;
        const method = isEdit ? 'PUT' : 'POST';
        
        if (DEBUG) console.log(`${method} request to ${url}`, categoryData);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken || FIXED_TOKEN}`
            },
            body: JSON.stringify(categoryData)
        });
        
        if (DEBUG) console.log('Response status:', response.status);
        
        const data = await response.json();
        
        if (DEBUG) console.log('Response data:', data);
        
        if (response.ok) {
            showAlert('success', isEdit ? 'Category updated successfully' : 'Category added successfully');
            categoryForm.reset();
            loadCategories();
        } else {
            showError(categoryFormError, data.message || 'Failed to save category');
        }
    } catch (error) {
        if (DEBUG) console.error('Error saving category:', error);
        showError(categoryFormError, 'Network error. Please try again.');
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? Products in this category will not be deleted.')) {
        return;
    }
    
    try {
        const url = `${apiBaseUrl}categories.php?id=${categoryId}`;
        
        if (DEBUG) console.log(`DELETE request to ${url}`);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiToken || FIXED_TOKEN}`
            }
        });
        
        if (DEBUG) console.log('Response status:', response.status);
        
        const data = await response.json();
        
        if (DEBUG) console.log('Response data:', data);
        
        if (response.ok) {
            showAlert('success', 'Category deleted successfully');
            loadCategories();
        } else {
            showAlert('danger', data.message || 'Failed to delete category');
        }
    } catch (error) {
        if (DEBUG) console.error('Error deleting category:', error);
        showAlert('danger', 'Network error. Please try again.');
    }
}

// Helper function to show error
function hideError(element) {
    element.textContent = '';
    element.classList.add('hidden');
}

function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}