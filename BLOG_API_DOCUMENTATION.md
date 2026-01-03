# Blog API Documentation

This document provides Postman collection examples for the Blog API endpoints.

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

## 1. Admin: Create Blog (POST)

**Endpoint:** `POST /blogs`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `title`: My First Blog Post _(required)_
- `tags`: ["technology", "web development"] _(optional - send as JSON string)_
- `image`: [File] - Image file to upload _(optional - will be uploaded to Cloudinary)_
- `image`: "https://existing-image-url.com/image.jpg" _(optional - alternative to file upload)_
- `shortDescription`: This is a short description of the blog post _(required)_
- `paragraphs`: ["First paragraph", "Second paragraph"] _(required - send as JSON string)_
- `category`: ["tutorial", "javascript"] _(optional - send as JSON string)_
- `mediumLink`: https://medium.com/@username/my-first-blog-post _(optional)_
- `mediumLinkEnabled`: true _(optional, defaults to true - send as JSON boolean)_
- `status`: active _(optional, defaults to "active")_

**Example Form Data:**

```
title: My First Blog Post
tags: ["technology", "web development"]
image: [Select image file from computer]
shortDescription: This is a short description of the blog post
paragraphs: ["This is the first paragraph of the blog post.", "This is the second paragraph with more detailed content.", "This is the third paragraph concluding the post."]
category: ["tutorial", "javascript"]
mediumLink: https://medium.com/@username/my-first-blog-post
mediumLinkEnabled: true
status: active
```

**Important Notes for Form Data:**

- Arrays (`tags`, `paragraphs`, `category`) must be sent as JSON strings
- Boolean values (`mediumLinkEnabled`) must be sent as JSON booleans (`true`/`false`)
- The `image` field can either be a file upload or a direct URL string

**Response (201 Created):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "My First Blog Post",
  "tags": ["technology", "web development"],
  "image": "https://cloudinary.com/your-image-url.jpg",
  "shortDescription": "This is a short description of the blog post",
  "paragraphs": [
    "This is the first paragraph of the blog post.",
    "This is the second paragraph with more detailed content.",
    "This is the third paragraph concluding the post."
  ],
  "category": ["tutorial", "javascript"],
  "slug": "my-first-blog-post",
  "isPublished": false,
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 0,
  "likes": [],
  "mediumLink": "https://medium.com/@username/my-first-blog-post",
  "mediumLinkEnabled": true,
  "status": "active",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:45:00.000Z"
}
```

---

## 2. Admin: Get All Blogs (including unpublished) (GET)

**Endpoint:** `GET /blogs/admin/all`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:** `GET /blogs/admin/all?page=1&limit=5`

**Response (200 OK):**

```json
{
  "blogs": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "My First Blog Post",
      "tags": ["technology", "web development"],
      "image": "https://cloudinary.com/your-image-url.jpg",
      "shortDescription": "This is a short description of the blog post",
      "paragraphs": [
        "This is the first paragraph of the blog post.",
        "This is the second paragraph with more detailed content."
      ],
      "category": ["tutorial", "javascript"],
      "slug": "my-first-blog-post",
      "isPublished": false,
      "author": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "views": 0,
      "likes": [],
      "mediumLink": "https://medium.com/@username/my-first-blog-post",
      "mediumLinkEnabled": true,
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

## 3. Admin: Update Blog Data (PATCH)

**Endpoint:** `PATCH /blogs/{blog_id}`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `blog_id`: The blog ID to update

**Request Body (Form Data - only include fields you want to update):**

- `title`: Updated Blog Title _(optional)_
- `tags`: ["updated", "tags"] _(optional - send as JSON string)_
- `image`: [File] - New image file to upload _(optional - will replace existing image in Cloudinary)_
- `image`: "https://new-image-url.com/image.jpg" _(optional - alternative to file upload)_
- `shortDescription`: Updated short description _(optional)_
- `paragraphs`: ["Updated first paragraph.", "Updated second paragraph."] _(optional - send as JSON string)_
- `category`: ["updated", "category"] _(optional - send as JSON string)_
- `mediumLink`: https://medium.com/@username/updated-blog-title _(optional)_
- `mediumLinkEnabled`: false _(optional - send as JSON boolean)_
- `status`: inactive _(optional)_

**Example Form Data:**

```
title: Updated Blog Title
tags: ["updated", "tags"]
image: [Select new image file from computer]
shortDescription: Updated short description
paragraphs: ["Updated first paragraph.", "Updated second paragraph."]
category: ["updated", "category"]
mediumLink: https://medium.com/@username/updated-blog-title
mediumLinkEnabled: false
status: inactive
```

**Note:** PUT method is also supported for backward compatibility. When uploading a new image, the old image will be automatically deleted from Cloudinary.

**Response (200 OK):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "Updated Blog Title",
  "tags": ["updated", "tags"],
  "image": "https://cloudinary.com/your-image-url.jpg",
  "shortDescription": "Updated short description",
  "paragraphs": ["Updated first paragraph.", "Updated second paragraph."],
  "category": ["updated", "category"],
  "slug": "updated-blog-title",
  "isPublished": false,
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 0,
  "likes": [],
  "mediumLink": "https://medium.com/@username/updated-blog-title",
  "mediumLinkEnabled": false,
  "status": "inactive",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:50:00.000Z"
}
```

---

## 4. Admin: Update Blog Publish Status (PATCH)

**Endpoint:** `PATCH /blogs/{blog_id}/publish`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `blog_id`: The blog ID to publish/unpublish

**Request Body:** None required (empty body)

**Response (200 OK):**

```json
{
  "message": "Blog published successfully",
  "isPublished": true
}
```

**Note:** This endpoint toggles the publish status. If the blog is currently unpublished, it will be published, and vice versa.

---

## 5. Admin: Delete Blog (DELETE)

**Endpoint:** `DELETE /blogs/{blog_id}`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `blog_id`: The blog ID to delete

**Request Body:** None

**Response (200 OK):**

```json
{
  "message": "Blog deleted successfully"
}
```

---

## 6. Public: Get Published Blogs (GET)

**Endpoint:** `GET /blogs`

**Headers:** None required

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for title, description, or tags
- `category`: Filter by category (comma-separated)
- `tag`: Filter by tag (comma-separated)

**Examples:**

- `GET /blogs?page=1&limit=5`
- `GET /blogs?search=javascript`
- `GET /blogs?category=tutorial,javascript`
- `GET /blogs?tag=web development`

**Response (200 OK):**

```json
{
  "blogs": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "My First Blog Post",
      "tags": ["technology", "web development"],
      "image": "https://cloudinary.com/your-image-url.jpg",
      "shortDescription": "This is a short description of the blog post",
      "paragraphs": [
        "This is the first paragraph of the blog post.",
        "This is the second paragraph with more detailed content."
      ],
      "category": ["tutorial", "javascript"],
      "slug": "my-first-blog-post",
      "isPublished": true,
      "author": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "views": 15,
      "likes": [],
      "mediumLink": "https://medium.com/@username/my-first-blog-post",
      "mediumLinkEnabled": true,
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

## 7. Public: Get Blog Details (GET)

**Endpoint:** `GET /blogs/{blog_id_or_slug}`

**Headers:** None required

**URL Parameters:**

- `blog_id_or_slug`: Either the blog ID (MongoDB ObjectId) or the blog slug

**Examples:**

- `GET /blogs/64f1a2b3c4d5e6f7g8h9i0j1` (by ID)
- `GET /blogs/my-first-blog-post` (by slug)

**Response (200 OK):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "My First Blog Post",
  "tags": ["technology", "web development"],
  "image": "https://cloudinary.com/your-image-url.jpg",
  "shortDescription": "This is a short description of the blog post",
  "paragraphs": [
    "This is the first paragraph of the blog post.",
    "This is the second paragraph with more detailed content.",
    "This is the third paragraph concluding the post."
  ],
  "category": ["tutorial", "javascript"],
  "slug": "my-first-blog-post",
  "isPublished": true,
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 16,
  "likes": [],
  "mediumLink": "https://medium.com/@username/my-first-blog-post",
  "mediumLinkEnabled": true,
  "status": "active",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:45:00.000Z"
}
```

**Note:** This endpoint automatically increments the view count each time it's accessed.

---

## 8. Admin: Upload Blog Image (POST)

**Endpoint:** `POST /blogs/upload-image`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `image`: File (image file to upload)

**Response (200 OK):**

```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/blog-images/image.jpg",
  "publicId": "blog-images/image"
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
  "message": "Blog not found"
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

1. Create a new collection in Postman called "Blog API"
2. Create environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `admin_token`: Your admin JWT token
3. Import the requests above, replacing `YOUR_ADMIN_JWT_TOKEN` with `{{admin_token}}`
4. Set the Authorization type to "Bearer Token" and use `{{admin_token}}` for admin requests

## Testing Workflow

1. **Register/Login as Admin** to get JWT token
2. **Create a Blog** (POST /blogs)
3. **Upload an Image** (POST /blogs/upload-image) and update blog with image URL
4. **Publish the Blog** (PATCH /blogs/{id}/publish)
5. **View Public Blogs** (GET /blogs) - should see the published blog
6. **View Blog Details** (GET /blogs/{id}) - should increment view count
7. **Update Blog Data** (PATCH /blogs/{id})
8. **Delete Blog** (DELETE /blogs/{id})
