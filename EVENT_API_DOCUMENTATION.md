# Event API Documentation

This document provides Postman collection examples for the Event API endpoints.

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

## 1. Admin: Create Event (POST)

**Endpoint:** `POST /events`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `title`: My First Event _(required)_
- `tags`: ["conference", "technology"] _(optional - send as JSON string)_
- `image`: [File] - Main image file to upload **OR** "https://existing-image-url.com/image.jpg" _(optional - either upload file or provide URL string)_
- `excerpt`: This is a short excerpt of the event _(required)_
- `displayDate`: 2024-12-31T10:00:00.000Z _(required - ISO date string)_
- `location`: Conference Center, New York _(required)_
- `category`: ["conference", "tech"] _(optional - send as JSON string)_
- `status`: upcoming _(optional, defaults to "upcoming", values: "upcoming" or "completed")_
- `images`: ["https://image1.jpg", "https://image2.jpg"] _(optional - send as JSON string array of existing image URLs)_
- `images`: [Files] - Additional image files to upload _(optional - will be uploaded to Cloudinary and added to the images array)_
- `duration`: 2 hours _(optional)_
- `knowMoreLink`: https://event-website.com _(optional)_
- `knowMoreLinkEnabled`: true _(optional, defaults to true - send as JSON boolean)_

**Example Form Data:**

```
title: Tech Conference 2024
tags: ["conference", "technology", "networking"]
image: [Select main image file from computer]
excerpt: Join us for an exciting day of technology talks and networking opportunities
displayDate: 2024-12-31T10:00:00.000Z
location: Conference Center, New York
category: ["conference", "tech"]
status: upcoming
images: ["https://existing-image1.jpg", "https://existing-image2.jpg"]
images: [Select additional image files from computer]
duration: 8 hours
knowMoreLink: https://techconf2024.com
knowMoreLinkEnabled: true
```

**Important Notes for Form Data:**

- Arrays (`tags`, `category`, `images`) must be sent as JSON strings
- Boolean values (`knowMoreLinkEnabled`) must be sent as JSON booleans (`true`/`false`)
- Date values (`displayDate`) must be sent as ISO date strings
- The `image` field can either be a file upload or a direct URL string
- The `images` field can contain both existing URLs (as JSON array) and new file uploads

**Response (201 Created):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "id": 1,
  "title": "Tech Conference 2024",
  "tags": ["conference", "technology", "networking"],
  "image": "https://cloudinary.com/your-image-url.jpg",
  "excerpt": "Join us for an exciting day of technology talks and networking opportunities",
  "displayDate": "2024-12-31T10:00:00.000Z",
  "location": "Conference Center, New York",
  "category": ["conference", "tech"],
  "status": "upcoming",
  "images": [
    "https://existing-image1.jpg",
    "https://existing-image2.jpg",
    "https://cloudinary.com/uploaded-image1.jpg",
    "https://cloudinary.com/uploaded-image2.jpg"
  ],
  "duration": "8 hours",
  "knowMoreLink": "https://techconf2024.com",
  "knowMoreLinkEnabled": true,
  "slug": "tech-conference-2024",
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 0,
  "createdAt": "2024-01-15T11:45:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

---

## 2. Admin: Get All Events (GET)

**Endpoint:** `GET /events/admin/all`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:** `GET /events/admin/all?page=1&limit=5`

**Response (200 OK):**

```json
{
  "events": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "id": 1,
      "title": "Tech Conference 2024",
      "tags": ["conference", "technology"],
      "image": "https://cloudinary.com/your-image-url.jpg",
      "excerpt": "Join us for an exciting day of technology talks",
      "displayDate": "2024-12-31T10:00:00.000Z",
      "location": "Conference Center, New York",
      "category": ["conference", "tech"],
      "status": "upcoming",
      "images": ["https://image1.jpg", "https://image2.jpg"],
      "duration": "8 hours",
      "knowMoreLink": "https://techconf2024.com",
      "knowMoreLinkEnabled": true,
      "slug": "tech-conference-2024",
      "author": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "views": 0,
      "createdAt": "2024-01-15T11:45:00.000Z",
      "updatedAt": "2024-01-15T11:45:00.000Z"
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

## 3. Admin: Update Event (PATCH)

**Endpoint:** `PATCH /events/{event_id}`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `event_id`: The event ID to update

**Request Body (Form Data - only include fields you want to update):**

- `title`: Updated Event Title _(optional)_
- `tags`: ["updated", "tags"] _(optional - send as JSON string)_
- `image`: [File] - New main image file to upload _(optional - will replace existing image in Cloudinary)_
- `image`: "https://new-image-url.com/image.jpg" _(optional - alternative to file upload)_
- `excerpt`: Updated excerpt _(optional)_
- `displayDate`: 2024-12-31T14:00:00.000Z _(optional - ISO date string)_
- `location`: Updated Location _(optional)_
- `category`: ["updated", "category"] _(optional - send as JSON string)_
- `status`: completed _(optional)_
- `images`: ["https://new-image1.jpg", "https://new-image2.jpg"] _(optional - send as JSON string array)_
- `images`: [Files] - Additional image files to upload _(optional - will be added to images array)_
- `duration`: 6 hours _(optional)_
- `knowMoreLink`: https://updated-event-website.com _(optional)_
- `knowMoreLinkEnabled`: false _(optional - send as JSON boolean)_

**Example Form Data:**

```
title: Updated Tech Conference 2024
tags: ["conference", "technology", "updated"]
image: [Select new main image file from computer]
excerpt: Updated event description
displayDate: 2024-12-31T14:00:00.000Z
location: Grand Hotel, New York
category: ["conference", "tech", "updated"]
status: completed
images: ["https://existing-image1.jpg"]
images: [Select additional image files from computer]
duration: 6 hours
knowMoreLink: https://updated-techconf2024.com
knowMoreLinkEnabled: false
```

**Note:** PUT method is also supported for backward compatibility. When uploading a new main image, the old image will be automatically deleted from Cloudinary.

**Response (200 OK):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "Updated Tech Conference 2024",
  "tags": ["conference", "technology", "updated"],
  "image": "https://cloudinary.com/new-image-url.jpg",
  "excerpt": "Updated event description",
  "displayDate": "2024-12-31T14:00:00.000Z",
  "location": "Grand Hotel, New York",
  "category": ["conference", "tech", "updated"],
  "status": "completed",
  "images": [
    "https://existing-image1.jpg",
    "https://cloudinary.com/new-uploaded-image1.jpg",
    "https://cloudinary.com/new-uploaded-image2.jpg"
  ],
  "duration": "6 hours",
  "knowMoreLink": "https://updated-techconf2024.com",
  "knowMoreLinkEnabled": false,
  "slug": "updated-tech-conference-2024",
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 0,
  "createdAt": "2024-01-15T11:45:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

---

## 4. Admin: Delete Event (DELETE)

**Endpoint:** `DELETE /events/{event_id}`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**

- `event_id`: The event ID to delete

**Request Body:** None

**Response (200 OK):**

```json
{
  "message": "Event deleted successfully"
}
```

---

## 5. Public: Get Events (GET)

**Endpoint:** `GET /events`

**Headers:** None required

**Query Parameters (optional):**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for title, excerpt, or tags
- `category`: Filter by category (comma-separated)
- `tag`: Filter by tag (comma-separated)
- `status`: Filter by status ("upcoming" or "completed")

**Examples:**

- `GET /events?page=1&limit=5`
- `GET /events?search=conference`
- `GET /events?category=conference,tech`
- `GET /events?tag=technology`
- `GET /events?status=upcoming`

**Response (200 OK):**

```json
{
  "events": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "id": 1,
      "title": "Tech Conference 2024",
      "tags": ["conference", "technology"],
      "image": "https://cloudinary.com/your-image-url.jpg",
      "excerpt": "Join us for an exciting day of technology talks",
      "displayDate": "2024-12-31T10:00:00.000Z",
      "location": "Conference Center, New York",
      "category": ["conference", "tech"],
      "status": "upcoming",
      "images": ["https://image1.jpg", "https://image2.jpg"],
      "duration": "8 hours",
      "knowMoreLink": "https://techconf2024.com",
      "knowMoreLinkEnabled": true,
      "slug": "tech-conference-2024",
      "author": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "views": 25,
      "createdAt": "2024-01-15T11:45:00.000Z",
      "updatedAt": "2024-01-15T11:45:00.000Z"
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

## 6. Public: Get Event Details (GET)

**Endpoint:** `GET /events/{event_id_or_slug}`

**Headers:** None required

**URL Parameters:**

- `event_id_or_slug`: Either the event ID (MongoDB ObjectId) or the event slug

**Examples:**

- `GET /events/64f1a2b3c4d5e6f7g8h9i0j1` (by ID)
- `GET /events/tech-conference-2024` (by slug)

**Response (200 OK):**

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "id": 1,
  "title": "Tech Conference 2024",
  "tags": ["conference", "technology", "networking"],
  "image": "https://cloudinary.com/your-image-url.jpg",
  "excerpt": "Join us for an exciting day of technology talks and networking opportunities",
  "displayDate": "2024-12-31T10:00:00.000Z",
  "location": "Conference Center, New York",
  "category": ["conference", "tech"],
  "status": "upcoming",
  "images": ["https://image1.jpg", "https://image2.jpg", "https://image3.jpg"],
  "duration": "8 hours",
  "knowMoreLink": "https://techconf2024.com",
  "knowMoreLinkEnabled": true,
  "slug": "tech-conference-2024",
  "author": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "views": 26,
  "createdAt": "2024-01-15T11:45:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

**Note:** This endpoint automatically increments the view count each time it's accessed.

---

## 7. Admin: Upload Event Image (POST)

**Endpoint:** `POST /events/upload-image`

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
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/event-images/image.jpg",
  "publicId": "event-images/image"
}
```

---

## 8. Admin: Upload Multiple Event Images (POST)

**Endpoint:** `POST /events/upload-images`

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body (Form Data):**

- `images`: Files (multiple image files to upload, max 10)

**Response (200 OK):**

```json
{
  "message": "Images uploaded successfully",
  "imageUrls": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/event-images/image1.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v1704019500/event-images/image2.jpg"
  ],
  "publicIds": ["event-images/image1", "event-images/image2"]
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
  "message": "Event not found"
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

1. Create a new collection in Postman called "Event API"
2. Create environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `admin_token`: Your admin JWT token
3. Import the requests above, replacing `YOUR_ADMIN_JWT_TOKEN` with `{{admin_token}}`
4. Set the Authorization type to "Bearer Token" and use `{{admin_token}}` for admin requests

## Testing Workflow

1. **Register/Login as Admin** to get JWT token
2. **Create an Event** (POST /events)
3. **Upload Images** (POST /events/upload-image or POST /events/upload-images) and update event with image URLs
4. **View Public Events** (GET /events) - should see all events
5. **View Event Details** (GET /events/{id}) - should increment view count
6. **Update Event Data** (PATCH /events/{id})
7. **Delete Event** (DELETE /events/{id})

## Event Status Values

- `upcoming`: Event is scheduled for the future
- `completed`: Event has already taken place

## Date Format

All dates should be sent in ISO 8601 format:

- `2024-12-31T10:00:00.000Z` (UTC)
- `2024-12-31T15:30:00.000+05:30` (with timezone offset)
