# Campus Pantry API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```
POST /api/auth/register
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "first_name": "John",
  "last_name": "Doe"
}
```

Response:
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": { ... }
}
```

#### Login
```
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Posts

#### Get Posts
```
GET /api/posts
Query parameters:
  - lat: float (latitude)
  - lng: float (longitude)
  - radius: float (km, default: 5.0)
  - tags: array (tag slugs)
  - type: string (surplus|resource)
  - status: string (active|claimed|expired)
  - page: int (default: 1)
  - per_page: int (default: 20)
```

#### Get Single Post
```
GET /api/posts/:id
```

#### Create Post
```
POST /api/posts
Headers: Authorization: Bearer <token>
```

Request body:
```json
{
  "title": "Leftover Pizza",
  "description": "Extra pizza from lunch",
  "type": "surplus",
  "quantity": 10,
  "available_from": "2025-09-24T12:00:00Z",
  "available_until": "2025-09-24T18:00:00Z",
  "pickup_instructions": "Ask at front desk",
  "location": {
    "name": "Main Dining Hall",
    "address": "123 Campus St",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "tags": ["vegetarian", "pizza"]
}
```

#### Update Post
```
PUT /api/posts/:id
Headers: Authorization: Bearer <token>
```

#### Claim Post
```
POST /api/posts/:id/claim
Headers: Authorization: Bearer <token>
```

Request body:
```json
{
  "quantity": 1
}
```

#### Delete Post
```
DELETE /api/posts/:id
Headers: Authorization: Bearer <token>
```

### Organizations

#### Get Organizations
```
GET /api/organizations
```

#### Get Organization Dashboard
```
GET /api/organizations/:id/dashboard
Headers: Authorization: Bearer <token>
```

### Users

#### Get Profile
```
GET /api/users/me
Headers: Authorization: Bearer <token>
```

#### Update Profile
```
PUT /api/users/me
Headers: Authorization: Bearer <token>
```

#### Get Preferences
```
GET /api/users/me/preferences
Headers: Authorization: Bearer <token>
```

#### Update Preferences
```
PUT /api/users/me/preferences
Headers: Authorization: Bearer <token>
```

### Admin

#### Get Stats
```
GET /api/admin/stats
Headers: Authorization: Bearer <token>
Requires: admin or moderator role
```

#### Get Flagged Posts
```
GET /api/admin/posts/flagged
Headers: Authorization: Bearer <token>
Requires: admin or moderator role
```

#### Verify Organization
```
POST /api/admin/organizations/:id/verify
Headers: Authorization: Bearer <token>
Requires: admin or moderator role
```

### Notifications

#### Get Notifications
```
GET /api/notifications
Headers: Authorization: Bearer <token>
Query parameters:
  - page: int
  - per_page: int
```

#### Mark Notification as Read
```
POST /api/notifications/:id/read
Headers: Authorization: Bearer <token>
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

Status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error


