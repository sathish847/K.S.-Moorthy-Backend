# Services API Documentation

This document provides Postman collection examples for the Services API endpoints.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All admin endpoints require Bearer token authentication. Include the following header:

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

---

## 1. Admin: Create Service (POST)

**Endpoint:** `POST /services`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `title`: My First Service _(required)_
- `hero_image`: [File] - Hero image file to upload _(optional - will be uploaded to Cloudinary)_
- `hero_image`: "https://existing-image-url.com/hero-image.jpg" _(optional - alternative to file upload)_
- `images`: [File, File, File, File] - Multiple image files to upload _(optional - maximum 4 files, will be uploaded to Cloudinary)_
- `images`: ["https://image1.jpg", "https://image2.jpg"] _(optional - send as JSON string, can combine with file uploads)_
- `paragraphs`: ["First paragraph", "Second paragraph"] _(required - send as JSON string)_
- `status`: active _(optional, defaults to "active")_

**Example Form Data:**

```
title: My First Service
hero_image: [Select hero image file from computer]
images: [Select first gallery image]
images: [Select second gallery image]
images: [Select third gallery image]
paragraphs: ["This is the first paragraph of the service description.", "This is the second paragraph with more detailed information."]
status: active
```

**Important Notes for Form Data:**

- Arrays (`paragraphs`) must be sent as JSON strings
- The `hero_image` field accepts one file upload or a URL string
- The `images` field can accept multiple files (up to 4) OR a JSON string array of URLs, or both combined
- When uploading multiple image files, use multiple "images" fields in Postman
- Total images (uploaded files + provided URLs) cannot exceed 4
- All uploaded images are automatically stored in Cloudinary

**Response (201 Created):**

```json
{
  "id": 1,
  "title": "My First Service",
  "hero_image": "https://cloudinary.com/hero-image.jpg",
  "images": [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg"
  ],
  "paragraphs": [
    "This is the first paragraph of the service description.",
    "This is the second paragraph with more detailed information."
  ],
  "status": "active",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:45:00.000Z"
}
```

---

## 2. Admin: Get All Services (including inactive) (GET)

**Endpoint:** `GET /services/admin/all`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:** `GET /services/admin/all?page=1&limit=5`

**Response (200 OK):**

```json
{
  "services": [
    {
      "id": 1,
      "title": "My First Service",
      "hero_image": "https://cloudinary.com/hero-image.jpg",
      "images": [
        "https://cloudinary.com/image1.jpg",
        "https://cloudinary.com/image2.jpg"
      ],
      "paragraphs": [
        "This is the first paragraph of the service description.",
        "This is the second paragraph with more detailed information."
      ],
      "status": "active",
      "createdAt": "2023-12-31T11:45:00.000Z",
      "updatedAt": "2023-12-31T11:45:00.000Z"
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

---

## 3. Admin: Update Service Data (PATCH)

**Endpoint:** `PATCH /services/{service_id}`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `service_id`: The service ID (sequential number) or MongoDB ObjectId to update

**Request Body (Form Data - only include fields you want to update):**

- `title`: Updated Service Title _(optional)_
- `hero_image`: [File] - New hero image file to upload _(optional - will replace existing hero image in Cloudinary)_
- `hero_image`: "https://new-hero-image-url.com/image.jpg" _(optional - alternative to file upload)_
- `images`: ["https://updated-image1.jpg", "https://updated-image2.jpg"] _(optional - send as JSON string, maximum 4 images)_
- `paragraphs`: ["Updated first paragraph.", "Updated second paragraph."] _(optional - send as JSON string)_
- `status`: inactive _(optional)_

**Example Form Data:**

```
title: Updated Service Title
hero_image: [Select new hero image file from computer]
images: ["https://updated-image1.jpg", "https://updated-image2.jpg"]
paragraphs: ["Updated first paragraph.", "Updated second paragraph."]
status: inactive
```

**Note:** PUT method is also supported for backward compatibility. When uploading a new hero image, the old hero image will be automatically deleted from Cloudinary.

**Response (200 OK):**

```json
{
  "id": 1,
  "title": "Updated Service Title",
  "hero_image": "https://cloudinary.com/new-hero-image.jpg",
  "images": ["https://updated-image1.jpg", "https://updated-image2.jpg"],
  "paragraphs": ["Updated first paragraph.", "Updated second paragraph."],
  "status": "inactive",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:50:00.000Z"
}
```

---

## 4. Admin: Delete Service (DELETE)

**Endpoint:** `DELETE /services/{service_id}`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `service_id`: The service ID (sequential number) or MongoDB ObjectId to delete

**Request Body:** None

**Response (200 OK):**

```json
{
  "message": "Service deleted successfully"
}
```

---

## 5. Public: Get Active Services (GET)

**Endpoint:** `GET /services`

**Headers:** None required

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for title

**Examples:**

- `GET /services?page=1&limit=5`
- `GET /services?search=web development`

**Response (200 OK):**

```json
{
  "services": [
    {
      "id": 1,
      "title": "My First Service",
      "hero_image": "https://cloudinary.com/hero-image.jpg",
      "images": [
        "https://cloudinary.com/image1.jpg",
        "https://cloudinary.com/image2.jpg"
      ],
      "paragraphs": [
        "This is the first paragraph of the service description.",
        "This is the second paragraph with more detailed information."
      ],
      "status": "active",
      "createdAt": "2023-12-31T11:45:00.000Z",
      "updatedAt": "2023-12-31T11:45:00.000Z"
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

---

## 6. Public: Get Service Details (GET)

**Endpoint:** `GET /services/{service_id}`

**Headers:** None required

**URL Parameters:**

- `service_id`: Either the service sequential ID (number) or the MongoDB ObjectId

**Examples:**

- `GET /services/1` (by sequential ID)
- `GET /services/64f1a2b3c4d5e6f7g8h9i0j1` (by MongoDB ObjectId)

**Response (200 OK):**

```json
{
  "id": 1,
  "title": "My First Service",
  "hero_image": "https://cloudinary.com/hero-image.jpg",
  "images": [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg"
  ],
  "paragraphs": [
    "This is the first paragraph of the service description.",
    "This is the second paragraph with more detailed information.",
    "This is the third paragraph concluding the service description."
  ],
  "status": "active",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:45:00.000Z"
}
```

---

## 7. Admin: Upload Service Hero Image (POST)

**Endpoint:** `POST /services/upload-hero-image`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `image`: File (hero image file to upload)

**Response (200 OK):**

```json
{
  "message": "Hero image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/service-hero-images/image.jpg",
  "publicId": "service-hero-images/image"
}
```

---

## 8. Admin: Upload Multiple Service Images (POST)

**Endpoint:** `POST /services/upload-images`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `images`: Files (up to 4 image files to upload)

**Response (200 OK):**

```json
{
  "message": "Images uploaded successfully",
  "imageUrls": [
    "https://res.cloudinary.com/your-cloud/service-images/image1.jpg",
    "https://res.cloudinary.com/your-cloud/service-images/image2.jpg"
  ],
  "publicIds": ["service-images/image1", "service-images/image2"]
}
```

---

## Error Responses

### 400 Bad Request

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

### 401 Unauthorized

```json
{
  "message": "Not authorized, no token"
}
```

### 403 Forbidden

```json
{
  "message": "Only admins can perform this action"
}
```

### 404 Not Found

```json
{
  "message": "Service not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Server error"
}
```

---

## Postman Collection Setup

1. Create a new collection in Postman called "Services API"
2. Create environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `admin_token`: Your admin JWT token
3. Import the requests above, replacing `YOUR_ADMIN_JWT_TOKEN` with `{{admin_token}}`
4. Set the Authorization type to "Bearer Token" and use `{{admin_token}}` for admin requests

## Testing Workflow

1. **Register/Login as Admin** to get JWT token
2. **Upload Images** (POST /services/upload-images) to get image URLs
3. **Upload Hero Image** (POST /services/upload-hero-image) to get hero image URL
4. **Create a Service** (POST /services) using the uploaded image URLs
5. **View Public Services** (GET /services) - should see active services
6. **View Service Details** (GET /services/{id}) - should return service details
7. **Update Service Data** (PATCH /services/{id})
8. **Delete Service** (DELETE /services/{id})
