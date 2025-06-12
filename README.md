# Everything-Tech Backend

Backend API for Everything-Tech e-commerce site.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example` and fill in your database and Cloudinary credentials:
   ```
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=everything_tech

   # Server Configuration
   PORT=3000

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. Run the database migrations:
   ```
   mysql -u your_db_user -p your_db_name < database/products.sql
   mysql -u your_db_user -p your_db_name < database/update_cloudinary.sql
   ```

4. Start the server:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

### Products

- `GET /api/products` - Get all products with filtering, sorting, pagination
- `GET /api/product/:id` - Get a specific product
- `POST /api/product` - Add a new product
- `PUT /api/product/:id` - Update a product
- `DELETE /api/product/:id` - Delete a product

### Image Upload

- `POST /api/upload-image` - Upload an image to Cloudinary
  - Request: Form data with 'image' field
  - Response: 
    ```json
    {
      "success": true,
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234/products/image.jpg",
      "public_id": "products/image",
      "message": "Image uploaded successfully to Cloudinary"
    }
    ```

## Cloudinary Integration

This project uses Cloudinary for image storage. When uploading product images:

1. Images are temporarily stored on the server
2. Uploaded to Cloudinary
3. Local temporary files are deleted
4. Cloudinary URL and public_id are returned and stored in the database

Benefits:
- Optimized image delivery
- Automatic image transformations
- CDN distribution
- Secure storage