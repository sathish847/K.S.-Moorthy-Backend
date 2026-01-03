# Hero Slider API Documentation

This document provides Postman collection examples for the Hero Slider API endpoints.

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

## 1. Admin: Create Video Hero Slider Item (POST)

**Endpoint:** `POST /hero-sliders/video`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `mediaType`: "video"
- `videoFile`: [File] - Video file (required)
- `title`: "18+ Years of Creative Exploration"
- `subtitle`: "Learning, evolving, and growing through design"
- `buttonText`: "Explore My Creations →"
- `buttonLink`: "works.html"
- `status`: "active" (optional)
- `order`: "1" (optional)

**Field Descriptions:**

- `mediaType`: Must be "video" for this endpoint _(required)_
- `videoFile`: Video file (required) - will be uploaded to Cloudinary
- `title`: Slider title (required, max 200 characters)
- `subtitle`: Slider subtitle (required, max 300 characters)
- `buttonText`: Button text (required, max 100 characters)
- `buttonLink`: Button link URL (required)
- `status`: "active" or "inactive" (optional, defaults to "active")
- `order`: Display order (optional, defaults to 0)

**Note:** The video file will be automatically uploaded to Cloudinary and the resulting URL will be stored in the database.

---

## 2. Admin: Create Image Hero Slider Item (POST)

**Endpoint:** `POST /hero-sliders/image`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `mediaType`: "image"
- `desktopImage`: [File] - Desktop image file (required)
- `mobileImage`: [File] - Mobile image file (required)
- `title`: "Where Art Meets Thoughtful Design"
- `subtitle`: "Balancing creativity with clarity and purpose"
- `buttonText`: "Visual Diary →"
- `buttonLink`: "about.html"
- `status`: "active" (optional)
- `order`: "2" (optional)

**Field Descriptions:**

- `mediaType`: Must be "image" for this endpoint _(required)_
- `desktopImage`: Desktop image file (required) - will be uploaded to Cloudinary
- `mobileImage`: Mobile image file (required) - will be uploaded to Cloudinary
- `title`: Slider title (required, max 200 characters)
- `subtitle`: Slider subtitle (required, max 300 characters)
- `buttonText`: Button text (required, max 100 characters)
- `buttonLink`: Button link URL (required)
- `status`: "active" or "inactive" (optional, defaults to "active")
- `order`: Display order (optional, defaults to 0)

**Note:** The desktopImage and mobileImage files will be automatically uploaded to Cloudinary and the resulting URLs will be stored in the database.

---

## 3. Admin: Update Video Hero Slider Item (PATCH)

**Endpoint:** `PATCH /hero-sliders/video/{hero_slider_id}`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `videoFile`: [File] - New video file (optional - only if updating video)
- `title`: "Updated Video Title" (optional)
- `subtitle`: "Updated video subtitle" (optional)
- `buttonText`: "Updated Button Text" (optional)
- `buttonLink`: "https://updated-link.com" (optional)
- `status`: "active" or "inactive" (optional)
- `order`: "2" (optional)

**Note:** Only include fields you want to update. The video file will be uploaded to Cloudinary if provided.

---

## 4. Admin: Update Image Hero Slider Item (PATCH)

**Endpoint:** `PATCH /hero-sliders/image/{hero_slider_id}`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `desktopImage`: [File] - New desktop image file (optional)
- `mobileImage`: [File] - New mobile image file (optional)
- `title`: "Updated Image Title" (optional)
- `subtitle`: "Updated image subtitle" (optional)
- `buttonText`: "Updated Button Text" (optional)
- `buttonLink`: "https://updated-link.com" (optional)
- `status`: "active" or "inactive" (optional)
- `order`: "2" (optional)

**Note:** Only include fields you want to update. Image files will be uploaded to Cloudinary if provided.

---

## 5. Admin: Update Hero Slider Item (Text Fields Only - PATCH)

**Endpoint:** `PATCH /hero-sliders/{hero_slider_id}`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (JSON - only include fields you want to update):**

```json
{
  "title": "Updated Title",
  "subtitle": "Updated subtitle",
  "buttonText": "Updated Button",
  "buttonLink": "https://updated-link.com",
  "status": "inactive",
  "order": 5,
  "videoUrl": "https://direct-video-url.com/video.mp4",
  "desktopImage": "https://direct-image-url.com/desktop.jpg",
  "mobileImage": "https://direct-image-url.com/mobile.jpg"
}
```

**Note:** This endpoint only accepts text fields and direct URLs. Use the specific video/image update endpoints above if you need to upload new files.

---

## 6. Admin: Create Hero Slider Item (Legacy - POST)

**Endpoint:** `POST /hero-sliders`

**Note:** This legacy endpoint auto-detects the type based on mediaType and handles both video and image creation. Use the specific endpoints above for better performance.

---

## 7. Admin: Get All Hero Slider Items (including inactive) (GET)

**Endpoint:** `GET /hero-sliders/admin/all`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:** `GET /hero-sliders/admin/all?page=1&limit=5`

**Response (200 OK):**

```json
{
  "heroSliders": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "type": "video",
      "videoUrl": "https://www.11-76.com/html5-videos-22/html5-all/1.mp4",
      "desktopImage": "",
      "mobileImage": "",
      "title": "18+ Years of Creative Exploration",
      "subtitle": "Learning, evolving, and growing through design",
      "buttonText": "Explore My Creations →",
      "buttonLink": "works.html",
      "status": "active",
      "order": 1,
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

## 8. Admin: Delete Hero Slider Item (DELETE)

**Endpoint:** `DELETE /hero-sliders/{hero_slider_id}`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `hero_slider_id`: The hero slider item ID to delete

**Request Body:** None

**Response (200 OK):**

```json
{
  "message": "Hero slider item deleted successfully"
}
```

---

## 9. Public: Get All Hero Slider Items (GET)

**Endpoint:** `GET /hero-sliders/all`

**Headers:** None required

**Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "type": "video",
      "videoUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1704019500/hero-slider-videos/video.mp4",
      "desktopImage": "",
      "mobileImage": "",
      "title": "18+ Years of Creative Exploration",
      "subtitle": "Learning, evolving, and growing through design",
      "buttonText": "Explore My Creations →",
      "buttonLink": "works.html",
      "status": "active",
      "order": 1,
      "createdAt": "2023-12-31T11:45:00.000Z",
      "updatedAt": "2023-12-31T11:45:00.000Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "type": "image",
      "videoUrl": "",
      "desktopImage": "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/hero-slider-images/desktop.jpg",
      "mobileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/hero-slider-images/mobile.jpg",
      "title": "Where Art Meets Thoughtful Design",
      "subtitle": "Balancing creativity with clarity and purpose",
      "buttonText": "Visual Diary →",
      "buttonLink": "about.html",
      "status": "active",
      "order": 2,
      "createdAt": "2023-12-31T11:46:00.000Z",
      "updatedAt": "2023-12-31T11:46:00.000Z"
    }
  ]
}
```

---

## 10. Public: Get Active Hero Slider Items (GET)

**Endpoint:** `GET /hero-sliders`

**Headers:** None required

**Response (200 OK):**

```json
[
  {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "type": "video",
    "videoUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1704019500/hero-slider-videos/video.mp4",
    "desktopImage": "",
    "mobileImage": "",
    "title": "18+ Years of Creative Exploration",
    "subtitle": "Learning, evolving, and growing through design",
    "buttonText": "Explore My Creations →",
    "buttonLink": "works.html",
    "status": "active",
    "order": 1,
    "createdAt": "2023-12-31T11:45:00.000Z",
    "updatedAt": "2023-12-31T11:45:00.000Z"
  },
  {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "type": "image",
    "videoUrl": "",
    "desktopImage": "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/hero-slider-images/desktop.jpg",
    "mobileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/hero-slider-images/mobile.jpg",
    "title": "Where Art Meets Thoughtful Design",
    "subtitle": "Balancing creativity with clarity and purpose",
    "buttonText": "Visual Diary →",
    "buttonLink": "about.html",
    "status": "active",
    "order": 2,
    "createdAt": "2023-12-31T11:46:00.000Z",
    "updatedAt": "2023-12-31T11:46:00.000Z"
  }
]
```

---

## 11. Public: Get Hero Slider Item Details (GET)

**Endpoint:** `GET /hero-sliders/{hero_slider_id}`

**Headers:** None required

**URL Parameters:**

- `hero_slider_id`: The hero slider item ID

**Response (200 OK):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "type": "video",
  "videoUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1704019500/hero-slider-videos/video.mp4",
  "desktopImage": "",
  "mobileImage": "",
  "title": "18+ Years of Creative Exploration",
  "subtitle": "Learning, evolving, and growing through design",
  "buttonText": "Explore My Creations →",
  "buttonLink": "works.html",
  "status": "active",
  "order": 1,
  "createdAt": "2023-12-31T11:45:00.000Z",
  "updatedAt": "2023-12-31T11:45:00.000Z"
}
```

---

## 12. Admin: Upload Hero Slider Image (POST)

**Endpoint:** `POST /hero-sliders/upload-image`

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
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/hero-slider-images/image.jpg",
  "publicId": "hero-slider-images/image"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "errors": [
    {
      "msg": "Type is required and must be either 'video' or 'image'",
      "param": "type",
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
  "message": "Hero slider item not found"
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

1. Create a new collection in Postman called "Hero Slider API"
2. Create environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `admin_token`: Your admin JWT token
3. Import the requests above, replacing `YOUR_ADMIN_JWT_TOKEN` with `{{admin_token}}`
4. Set the Authorization type to "Bearer Token" and use `{{admin_token}}` for admin requests

## Testing Workflow

1. **Register/Login as Admin** to get JWT token
2. **Create Video Hero Slider Items** (POST /hero-sliders/video)
   - Send multipart/form-data with mediaType="video" and videoFile
3. **Create Image Hero Slider Items** (POST /hero-sliders/image)
   - Send multipart/form-data with mediaType="image" and desktopImage/mobileImage files
4. **View Public Hero Slider Items** (GET /hero-sliders) - should only see active items
5. **View Hero Slider Item Details** (GET /hero-sliders/{id})
6. **Update Hero Slider Items** (PATCH /hero-sliders/{id})
7. **Delete Hero Slider Items** (DELETE /hero-sliders/{id})

**Note:** Use the specific endpoints (/video or /image) for better performance. Both videos and images are automatically uploaded to Cloudinary.
