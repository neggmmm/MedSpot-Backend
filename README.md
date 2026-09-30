# Nest Market Backend - API Documentation

A comprehensive e-commerce backend built with NestJS, featuring product management, shopping cart, orders, payments, and user authentication.

**Live API:** `http://13.53.40.13:8000/`

## Local setup

Create the local environment file before starting the API:

```bash
cp .env.example .env
```

Then replace the `change-me` values, ensure PostgreSQL and Redis are running,
and start the server with `npm run start:dev`. For Docker Compose, copy
`.env.docker.example` instead; it uses the Docker service hostnames.

## 🚀 Deployment

- **Server:** AWS EC2
- **Database:** PostgreSQL (hosted)
- **File Storage:** AWS S3 (for product images)
- **Node.js:** v18+
- **NestJS:** v10+

## 📋 Table of Contents

- [Authentication](#authentication)
- [Users API](#users-api)
- [Products API](#products-api)
- [Cart API](#cart-api)
- [Orders API](#orders-api)
- [Payments API](#payments-api)
- [Error Handling](#error-handling)

---

## 🔐 Authentication

All protected endpoints require authentication via **HTTP cookies** (`access_token`).

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_here"
}
```

The `access_token` is automatically set as an HTTP-only cookie.

### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Refresh Token
```bash
POST /auth/refresh-token
(Cookie: refresh_token required)
```

### Get Current User
```bash
GET /auth/me
(Cookie: access_token required)
```

### Logout
```bash
POST /auth/logout
(Cookie: access_token required)
```

---

## 👥 Users API

### Get All Users (Admin Only)
```bash
GET /users?page=1&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  ],
  "total": 100,
  "page": 1,
  "lastPage": 10
}
```

### Search Users (Admin Only)
```bash
GET /users/search?q=john@example.com&page=1&limit=10
```

Searches by email or name (case-insensitive).

### Get User by ID (Admin Only)
```bash
GET /users/:id
```

### Create User (Admin Only)
```bash
POST /users
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "customer"
}
```

### Update User (Admin Only)
```bash
PATCH /users/:id
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "role": "admin"
}
```

### Delete User (Admin Only)
```bash
DELETE /users/:id
```

---

## 📦 Products API

### Get All Products (No Auth Required)
```bash
GET /products?page=1&limit=10&search=laptop&categoryId=1&minPrice=100&maxPrice=1000&sortBy=price&order=ASC
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 50)
- `search` - Search by product name
- `categoryId` - Filter by category ID
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `sortBy` - Sort field: `id`, `price`, or `name` (default: `id`)
- `order` - Sort order: `ASC` or `DESC` (default: `ASC`)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Laptop",
      "price": 999.99,
      "image": "https://bucket.s3.amazonaws.com/product-1.jpg",
      "userId": 2
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

### Get Product by ID (No Auth Required)
```bash
GET /products/:id
```

### Create Product (Authenticated)
```bash
POST /products
Content-Type: multipart/form-data

Form Data:
- name: "New Laptop"
- price: 1299.99
- categoryId: 1 (optional)
- image: <file> (required, JPEG/PNG/WebP, max 5MB)
```

**Response:**
```json
{
  "id": 5,
  "name": "New Laptop",
  "price": 1299.99,
  "image": "https://bucket.s3.amazonaws.com/uploads/product-5.jpg",
  "userId": 1
}
```

### Update Product (Authenticated - Owner Only or Admin)
```bash
PATCH /products/:id
Content-Type: application/json

{
  "name": "Updated Laptop",
  "price": 1199.99
}
```

### Delete Product (Authenticated - Owner Only or Admin)
```bash
DELETE /products/:id
```

---

## 🛒 Cart API

### Add Item to Cart (Authenticated)
```bash
POST /cart/add
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

### Get Cart (Authenticated)
```bash
GET /cart
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 2,
      "product": {
        "id": 1,
        "name": "Laptop",
        "price": 999.99,
        "image": "..."
      }
    }
  ]
}
```

### Remove Item from Cart (Authenticated)
```bash
DELETE /cart/:cartItemId
```

---

## 📝 Orders API

### Create Order (Authenticated)
```bash
POST /order/create
Content-Type: application/json

{
  "paymentMethod": "COD"  // or "ONLINE"
}
```

**Payment Methods:**
- `COD` - Cash on Delivery (order accepted immediately)
- `ONLINE` - Online payment (payment gateway required)

**Response for COD:**
```json
{
  "id": 1,
  "userId": 1,
  "totalPrice": 2000.00,
  "createdAt": "2026-05-15T10:30:00Z",
  "items": [
    {
      "productId": 1,
      "productName": "Laptop",
      "quantity": 2,
      "price": 999.99
    }
  ]
}
```

**Response for ONLINE:**
```json
{
  "orderId": 1,
  "paymentRequired": true
}
```

### Get My Orders (Authenticated)
```bash
GET /order
```

### Get Order by ID (Authenticated - Owner Only)
```bash
GET /order/:id
```

### Get All Orders (Admin Only)
```bash
GET /order/admin/orders?page=1&limit=10
```

---

## 💳 Payments API

### Process Payment (Authenticated)
```bash
POST /payments/paymob
Content-Type: application/json

{
  "orderId": 1,
  "amount": 2000.00,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+20123456789"
}
```

Integration with **Paymob** payment gateway.

---

## ❌ Error Handling

### Common Error Responses

**Unauthorized (401)**
```json
{
  "statusCode": 401,
  "message": "No Token Provided"
}
```

**Forbidden (403)**
```json
{
  "statusCode": 403,
  "message": "You do not have the required role to access this resource"
}
```

**Not Found (404)**
```json
{
  "statusCode": 404,
  "message": "User Not Found"
}
```

**Conflict (409)**
```json
{
  "statusCode": 409,
  "message": "Email already exists"
}
```

**Bad Request (400)**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["price must be a positive number"]
}
```

---

## 🔑 User Roles

- `customer` - Regular user (default)
- `provider` - Seller/vendor
- `admin` - Administrator
- `superAdmin` - Super administrator
- `delivery` - Delivery personnel

---

## 🖼️ Image Upload

Product images are uploaded to **AWS S3** and stored with the following structure:
- Max file size: 5MB
- Allowed formats: JPEG, PNG, WebP
- Public URL format: `https://bucket.s3.amazonaws.com/uploads/product-{id}.jpg`

---

## 📊 Database Models

### User
- `id` - Primary key
- `name` - User name
- `email` - Email (unique)
- `password` - Hashed password
- `role` - User role enum
- `cart` - One-to-one relationship
- `products` - One-to-many products owned

### Product
- `id` - Primary key
- `name` - Product name
- `price` - Product price (decimal)
- `image` - S3 URL
- `userId` - Owner ID
- `categoryId` - Category ID (optional)
- `cartItems` - One-to-many cart items
- `owner` - User relationship
- `category` - Category relationship

### Category
- `id` - Primary key
- `name` - Category name (unique)
- `description` - Category description (optional)
- `products` - One-to-many products

### Cart
- `id` - Primary key
- `userId` - User ID
- `items` - One-to-many cart items

### Order
- `id` - Primary key
- `userId` - User ID
- `name` - Order name
- `totalPrice` - Total amount
- `method` - Payment method (COD/ONLINE)
- `status` - Order status (PENDING/ACCEPTED/DELIVERING/DELIVERED)
- `paymobOrderId` - Paymob reference
- `items` - One-to-many order items
- `createdAt` - Timestamp

---

## 🔒 Security Features

- ✅ JWT authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt
- ✅ Role-based authorization guards
- ✅ Input validation & sanitization
- ✅ CORS enabled for frontend
- ✅ Rate limiting (10 requests/min, 10 requests/10min)
- ✅ Duplicate email validation
- ✅ HTTPS recommended for production

---

## 📞 Support

For API issues or bugs, please contact the development team.

**API Base URL:** `http://13.53.40.13:8000/`
