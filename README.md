# Everything-Tech Backend API

This is a RESTful API for the Everything-Tech e-commerce website built with Express.js and MySQL.

## Features

- RESTful API endpoints for products and categories
- Token-based authentication
- MySQL database integration
- JSON responses
- CORS support
- Environment variable configuration

## API Endpoints

### Products
- `GET /api/products` – Get all products with filtering, sorting, and pagination
- `GET /api/product/:id` – Get a specific product
- `POST /api/product` – Add a new product
- `PUT /api/product/:id` – Update a product
- `DELETE /api/product/:id` – Delete a product

### Categories
- `GET /api/categories` – Get all categories
- `GET /api/products-by-category/:id` – Get products by category
- `POST /api/category` – Add a new category
- `PUT /api/category/:id` – Update a category
- `DELETE /api/category/:id` – Delete a category

### Authentication
- `POST /api/login` – Authenticate and get API token
- `POST /api/create-admin` – Create an admin user

## Setup

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   DB_HOST=your_database_host
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   PORT=3000
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add the environment variables in the Render dashboard
5. Deploy!

## Database Setup

Import the database schema from the `database/products.sql` file into your MySQL server.