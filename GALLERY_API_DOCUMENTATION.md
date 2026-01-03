# Gallery API Documentation

This document provides Postman collection examples for the Gallery API endpoints.

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

## 1. Admin: Create Gallery Item (POST)

**Endpoint:** `POST /gallery`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (JSON):**

- `title`: My First Gallery Item _(required)_
- `description`: This is a description of the gallery item _(required)_
- `youtubeUrl`: https://www.youtube.com/watch?v=dQw4w9WgXcQ _(required)_
- `status`: active _(optional, defaults to "active")_

**Example JSON:**

```json
{
  "title": "My First Gallery Item",
  "description": "This is a description of the gallery item",
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "status": "active"
}
```

**Response (201 Created):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "My First Gallery Item",
  "description": "This is a description of the gallery item",
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "slug": "my-first-gallery-item",
  "isPublished": false,
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 0,
  "likes": [],
  "status": "active",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:45:00.000Z"
}
```

---

## 2. Admin: Get All Gallery Items (including unpublished) (GET)

**Endpoint:** `GET /gallery/admin/all`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:** `GET /gallery/admin/all?page=1&limit=5`

**Response (200 OK):**

```json
{
  "gallery": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "My First Gallery Item",
      "description": "This is a description of the gallery item",
      "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "slug": "my-first-gallery-item",
      "isPublished": false,
      "author": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "views": 0,
      "likes": [],
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

## 3. Admin: Update Gallery Item Data (PATCH)

**Endpoint:** `PATCH /gallery/{gallery_id}`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `gallery_id`: The gallery item ID to update

**Request Body (JSON - only include fields you want to update):**

- `title`: Updated Gallery Title _(optional)_
- `description`: Updated description _(optional)_
- `youtubeUrl`: https://www.youtube.com/watch?v=newVideoId _(optional)_
- `status`: inactive _(optional)_

**Example JSON:**

```json
{
  "title": "Updated Gallery Title",
  "description": "Updated description",
  "youtubeUrl": "https://www.youtube.com/watch?v=newVideoId",
  "status": "inactive"
}
```

**Note:** PUT method is also supported for backward compatibility.

**Response (200 OK):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "Updated Gallery Title",
  "description": "Updated description",
  "youtubeUrl": "https://www.youtube.com/watch?v=newVideoId",
  "slug": "updated-gallery-title",
  "isPublished": false,
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 0,
  "likes": [],
  "status": "inactive",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:50:00.000Z"
}
```

---

## 4. Admin: Update Gallery Item Publish Status (PATCH)

**Endpoint:** `PATCH /gallery/{gallery_id}/publish`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `gallery_id`: The gallery item ID to publish/unpublish

**Request Body:** None required (empty body)

**Response (200 OK):**

```json
{
  "message": "Gallery item published successfully",
  "isPublished": true
}
```

**Note:** This endpoint toggles the publish status. If the gallery item is currently unpublished, it will be published, and vice versa.

---

## 5. Admin: Delete Gallery Item (DELETE)

**Endpoint:** `DELETE /gallery/{gallery_id}`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `gallery_id`: The gallery item ID to delete

**Request Body:** None

**Response (200 OK):**

```json
{
  "message": "Gallery item deleted successfully"
}
```

---

## 6. Public: Get Published Gallery Items (GET)

**Endpoint:** `GET /gallery`

**Headers:** None required

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for title or description

**Examples:**

- `GET /gallery?page=1&limit=5`
- `GET /gallery?search=creative`

**Response (200 OK):**

```json
{
  "gallery": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "My First Gallery Item",
      "description": "This is a description of the gallery item",
      "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "slug": "my-first-gallery-item",
      "isPublished": true,
      "author": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "views": 15,
      "likes": [],
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

## 7. Public: Get Gallery Item Details (GET)

**Endpoint:** `GET /gallery/{gallery_id_or_slug}`

**Headers:** None required

**URL Parameters:**

- `gallery_id_or_slug`: Either the gallery item ID (MongoDB ObjectId) or the gallery item slug

**Examples:**

- `GET /gallery/64f1a2b3c4d5e6f7g8h9i0j1` (by ID)
- `GET /gallery/my-first-gallery-item` (by slug)

**Response (200 OK):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "My First Gallery Item",
  "description": "This is a description of the gallery item",
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "slug": "my-first-gallery-item",
  "isPublished": true,
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 16,
  "likes": [],
  "status": "active",
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:45:00.000Z"
}
```

**Note:** This endpoint automatically increments the view count each time it's accessed.

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
  "message": "Gallery item not found"
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

1. Create a new collection in Postman called "Gallery API"
2. Create environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `admin_token`: Your admin JWT token
3. Import the requests above, replacing `YOUR_ADMIN_JWT_TOKEN` with `{{admin_token}}`
4. Set the Authorization type to "Bearer Token" and use `{{admin_token}}` for admin requests

## Testing Workflow

1. **Register/Login as Admin** to get JWT token
2. **Create a Gallery Item** (POST /gallery)
3. **Publish the Gallery Item** (PATCH /gallery/{id}/publish)
4. **View Public Gallery Items** (GET /gallery) - should see the published gallery item
5. **View Gallery Item Details** (GET /gallery/{id}) - should increment view count
6. **Update Gallery Item Data** (PATCH /gallery/{id})
7. **Delete Gallery Item** (DELETE /gallery/{id})
