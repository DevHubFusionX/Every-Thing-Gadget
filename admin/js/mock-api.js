// Mock API for testing when real API is not available
const mockProducts = [
    {
        id: 1,
        name: "iPhone 13 Pro",
        description: "Latest smartphone with advanced camera system",
        price: 999.99,
        category: "Phones",
        stock_quantity: 15,
        sku: "PHONE-001",
        image_url: null
    },
    {
        id: 2,
        name: "Gaming Laptop",
        description: "High-performance gaming laptop with RTX 3080",
        price: 2199.99,
        category: "Gaming Laptop",
        stock_quantity: 8,
        sku: "GLAPTOP-001",
        image_url: null
    },
    {
        id: 3,
        name: "Wireless Earbuds",
        description: "Premium wireless earbuds with noise cancellation",
        price: 149.99,
        category: "Accessories",
        stock_quantity: 30,
        sku: "ACC-001",
        image_url: null
    }
];

const mockCategories = [
    { id: 1, name: "Phones", description: "Smartphones and mobile devices" },
    { id: 2, name: "Gaming Laptop", description: "Laptops optimized for gaming" },
    { id: 3, name: "Accessories", description: "Device accessories and peripherals" },
    { id: 4, name: "Gaming Consoles", description: "Video game consoles" },
    { id: 5, name: "Gaming Accessories", description: "Accessories for gaming" },
    { id: 6, name: "Content Tools", description: "Tools for content creation" },
    { id: 7, name: "Monitor", description: "Computer monitors and displays" },
    { id: 8, name: "Laptops", description: "General purpose laptops" }
];

// Mock API functions
window.mockAPI = {
    getProducts: function() {
        return Promise.resolve({
            products: mockProducts,
            pagination: {
                total: mockProducts.length,
                page: 1,
                limit: 10,
                total_pages: 1
            }
        });
    },
    
    getCategories: function() {
        return Promise.resolve(mockCategories);
    },
    
    addProduct: function(product) {
        const newProduct = {
            ...product,
            id: mockProducts.length + 1
        };
        mockProducts.push(newProduct);
        return Promise.resolve({
            message: "Product created successfully",
            id: newProduct.id
        });
    },
    
    updateProduct: function(id, product) {
        const index = mockProducts.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            mockProducts[index] = { ...mockProducts[index], ...product, id: parseInt(id) };
            return Promise.resolve({ message: "Product updated successfully" });
        }
        return Promise.reject({ message: "Product not found" });
    },
    
    deleteProduct: function(id) {
        const index = mockProducts.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            mockProducts.splice(index, 1);
            return Promise.resolve({ message: "Product deleted successfully" });
        }
        return Promise.reject({ message: "Product not found" });
    }
};