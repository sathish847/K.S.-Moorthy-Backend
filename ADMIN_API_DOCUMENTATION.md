# Admin API Documentation

This document outlines the admin authentication and user management features for the Maheesh Portfolio Backend.

## Overview

The admin system provides enhanced authentication features including:

- Admin user registration and login
- Password reset functionality
- Secure logout
- Role-based access control

## Admin User Registration

### Endpoint

```
POST /api/auth/admin/register
```

### Description

Register a new admin user. For the first admin, no authentication is required. Subsequent admin registrations require an existing admin token.

### Request Headers

```
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

### Request Body

```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

### Response (Success - 201)

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "name": "Admin Name",
  "email": "admin@example.com",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (Error - 403)

```json
{
  "message": "Only admins can create admin accounts"
}
```

## Admin Login

### Endpoint

```
POST /api/auth/admin/login
```

### Description

Authenticate an admin user and receive a JWT token.

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

### Response (Success - 200)

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "name": "Admin Name",
  "email": "admin@example.com",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (Error - 401)

```json
{
  "message": "Invalid credentials"
}
```

## Forgot Password

### Request Password Reset

#### Endpoint

```
POST /api/auth/forgot-password
```

#### Description

Initiate password reset process by sending a reset token to the user's email.

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "user@example.com"
}
```

#### Response (Success - 200)

```json
{
  "message": "Password reset email sent",
  "resetToken": "reset-token-here" // Only in development mode
}
```

#### Response (Error - 404)

```json
{
  "message": "User not found"
}
```

### Reset Password

#### Endpoint

```
POST /api/auth/reset-password
```

#### Description

Reset user password using the reset token received via email.

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "resetToken": "reset-token-from-email",
  "newPassword": "newsecurepassword123"
}
```

#### Response (Success - 200)

```json
{
  "message": "Password reset successful"
}
```

#### Response (Error - 400)

```json
{
  "message": "Invalid or expired reset token"
}
```

## Logout

### Endpoint

```
POST /api/auth/logout
```

### Description

Logout user by clearing the JWT token on the client side. (Token-based logout)

### Request Headers

```
Authorization: Bearer <jwt-token>
```

### Request Body

```json
{
  "refreshToken": "optional-refresh-token"
}
```

### Response (Success - 200)

```json
{
  "message": "Logged out successfully"
}
```

## Admin-Only Endpoints

### Get Admin Dashboard Stats

#### Endpoint

```
GET /api/admin/stats
```

#### Description

Get dashboard statistics including user counts and recent users.

#### Request Headers

```
Authorization: Bearer <admin-jwt-token>
```

#### Response (Success - 200)

```json
{
  "totalUsers": 25,
  "activeUsers": 22,
  "adminUsers": 3,
  "inactiveUsers": 3,
  "recentUsers": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2023-12-30T05:00:00.000Z"
    }
  ]
}
```

### Get All Users

#### Endpoint

```
GET /api/admin/users?page=1&limit=10
```

#### Description

Retrieve paginated list of all users (admin only).

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### Request Headers

```
Authorization: Bearer <admin-jwt-token>
```

#### Response (Success - 200)

```json
{
  "users": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "avatar": "",
      "createdAt": "2023-12-30T05:00:00.000Z",
      "updatedAt": "2023-12-30T05:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 3
}
```

### Get Single User

#### Endpoint

```
GET /api/admin/users/:id
```

#### Description

Get detailed information about a specific user.

#### Request Headers

```
Authorization: Bearer <admin-jwt-token>
```

#### Response (Success - 200)

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "name": "User Name",
  "email": "user@example.com",
  "role": "user",
  "isActive": true,
  "avatar": "",
  "createdAt": "2023-12-30T05:00:00.000Z",
  "updatedAt": "2023-12-30T05:00:00.000Z"
}
```

### Update User Role

#### Endpoint

```
PUT /api/admin/users/:id/role
```

#### Description

Update a user's role (admin only). Admins cannot demote themselves.

#### Request Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

#### Request Body

```json
{
  "role": "admin"
}
```

#### Response (Success - 200)

```json
{
  "message": "User role updated successfully",
  "user": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### Update User Status

#### Endpoint

```
PUT /api/admin/users/:id/status
```

#### Description

Activate or deactivate a user account. Admins cannot deactivate themselves.

#### Request Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

#### Request Body

```json
{
  "isActive": false
}
```

#### Response (Success - 200)

```json
{
  "message": "User deactivated successfully",
  "user": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "User Name",
    "email": "user@example.com",
    "isActive": false
  }
}
```

### Delete User

#### Endpoint

```
DELETE /api/admin/users/:id
```

#### Description

Permanently delete a user account. Admins cannot delete themselves.

#### Request Headers

```
Authorization: Bearer <admin-jwt-token>
```

#### Response (Success - 200)

```json
{
  "message": "User deleted successfully"
}
```

## Password Reset Token Model

```javascript
const passwordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resetToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  },
});
```

## Implementation Notes

### Password Reset Flow

1. User requests password reset with email
2. System generates secure reset token and expiration
3. Email sent to user with reset link containing token
4. User clicks link and provides new password
5. System validates token and updates password
6. Token is invalidated after use

### Security Considerations

- Reset tokens expire after 15 minutes
- Tokens are hashed before storage
- Admin registration requires existing admin authentication
- Passwords are hashed using bcrypt
- JWT tokens have 30-day expiration

### Email Configuration

For production, configure email service (SendGrid, Mailgun, etc.) in the environment variables:

```env
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@maheeshportfolio.com
```

## Error Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 500  | Internal Server Error |

## Rate Limiting

Consider implementing rate limiting for:

- Login attempts (5 attempts per 15 minutes)
- Password reset requests (3 requests per hour)
- Admin registration attempts

## Testing Examples

### Admin Registration (using cURL)

```bash
curl -X POST http://localhost:5000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "New Admin",
    "email": "newadmin@example.com",
    "password": "securepassword123"
  }'
```

### Password Reset Request

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Password Reset

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "your-reset-token",
    "newPassword": "newpassword123"
  }'
```
