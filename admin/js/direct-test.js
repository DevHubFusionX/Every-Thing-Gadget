// This file can be included in the admin page for direct testing
// Add this to index.html: <script src="js/direct-test.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    // Add a test button to the login page
    const loginForm = document.getElementById('login-form');
    const testButton = document.createElement('button');
    testButton.type = 'button';
    testButton.className = 'btn btn-warning mt-3';
    testButton.textContent = 'Test API Connection';
    testButton.onclick = testApiConnection;
    loginForm.appendChild(testButton);
});

async function testApiConnection() {
    try {
        console.log('Testing API connection...');
        
        // Test the test.php endpoint
        const testResponse = await fetch('../api/test.php');
        const testData = await testResponse.json();
        console.log('Test endpoint response:', testData);
        
        // Try to fetch products directly
        const productsResponse = await fetch('../api/products');
        const productsStatus = productsResponse.status;
        console.log('Products endpoint status:', productsStatus);
        
        try {
            const productsData = await productsResponse.json();
            console.log('Products endpoint response:', productsData);
        } catch (e) {
            console.error('Failed to parse products response as JSON:', e);
        }
        
        alert(`API Test Results:\n\nTest endpoint: ${testData.status}\nProducts endpoint status: ${productsStatus}\n\nSee console for details.`);
    } catch (error) {
        console.error('API test error:', error);
        alert('API test failed. See console for details.');
    }
}