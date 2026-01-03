# Works API Documentation

## Overview

The Works API provides endpoints for managing portfolio works/projects with image support via Cloudinary. Works have the following fields:

- `title` (required): Title of the work
- `category` (required): Category of the work
- `image`: Cloudinary image URL
- `status`: "active" or "inactive" (default: "active")

## Authentication

All admin operations require authentication with admin role.

## Endpoints

### Public Endpoints

#### Get All Active Works

```http
GET /api/works
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search in title
- `category` (optional): Filter by category

**Response:**

```json
{
  "works": [
    {
      "_id": "work_id",
      "title": "Project Title",
      "category": "Web Development",
      "image": "https://cloudinary.com/...",
      "status": "active",
      "author": {
        "name": "Author Name",
        "email": "author@example.com"
      },
      "views": 0,
      "likes": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### Get Single Work

```http
GET /api/works/:id
```

**Response:** Returns work object (only active works are accessible publicly)

### Admin Endpoints

#### Upload Image to Cloudinary

```http
POST /api/works/upload-image
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**

- `image`: Image file (max 5MB)

**Response:**

```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://cloudinary.com/...",
  "publicId": "work-images/image_id"
}
```

#### Create Work

```http
POST /api/works
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**

- `title` (required): Work title
- `category` (required): Work category
- `image`: Image file or URL
- `status` (optional): "active" or "inactive" (default: "active")

**Response:** Returns created work object

#### Update Work

```http
PATCH /api/works/:id
PUT /api/works/:id
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:** Same as create, all fields optional

**Response:** Returns updated work object

#### Delete Work

```http
DELETE /api/works/:id
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Work deleted successfully"
}
```

#### Get All Works (Admin View)

```http
GET /api/works/admin/all
```

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** Returns all works including inactive ones

## Image Handling

### Cloudinary Integration

- Images are stored in the "work-images" folder on Cloudinary
- File size limit: 5MB
- Supported formats: All image formats
- Images are automatically deleted from Cloudinary when work is deleted or image is updated

### Image Upload Options

1. **File Upload**: Send image file in multipart/form-data
2. **URL**: Provide direct image URL in request body

## Error Responses

### Validation Errors

```json
{
  "errors": [
    {
      "msg": "Title is required",
      "param": "title",
      "location": "body"
    }
  ]
}
```

### Not Found

```json
{
  "message": "Work not found"
}
```

### Server Error

```json
{
  "message": "Server error"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error

## Postman Collection - Admin Operations

### Authentication Setup

All admin requests require authentication. Set up the following in Postman:

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

### 1. Create Work

**Method:** `POST`  
**URL:** `http://localhost:5000/api/works`  
**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**

```
title: "My Portfolio Project"
category: "Web Development"
status: "active"
image: [Upload image file here]
```

**Alternative Body (if using image URL instead of file):**

```
title: "My Portfolio Project"
category: "Web Development"
status: "active"
image: "https://example.com/image.jpg"
```

### 2. Get All Works (Admin View)

**Method:** `GET`  
**URL:** `http://localhost:5000/api/works/admin/all`  
**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Query Parameters (optional):**

```
page: 1
limit: 10
```

### 3. Update Work

**Method:** `PATCH`  
**URL:** `http://localhost:5000/api/works/{work_id}`  
**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data) - all fields optional:**

```
title: "Updated Project Title"
category: "Mobile Development"
status: "inactive"
image: [Upload new image file here]
```

### 4. Delete Work

**Method:** `DELETE`  
**URL:** `http://localhost:5000/api/works/{work_id}`  
**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

### 5. Upload Image Separately

**Method:** `POST`  
**URL:** `http://localhost:5000/api/works/upload-image`  
**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**

```
image: [Upload image file here]
```

## Notes

- Only active works are visible to public users
- Image URLs are automatically managed by Cloudinary
- Views are incremented when work is accessed publicly
- All timestamps are in ISO format
- Replace `{work_id}` with the actual MongoDB ObjectId from your database
- For file uploads, use the "form-data" body type in Postman and select "File" for the image field
