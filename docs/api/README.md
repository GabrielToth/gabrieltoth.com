# API Reference

> Complete REST API documentation for gabrieltoth.com

## 📋 Table of Contents

- [Authentication](#authentication)
- [Social Media](#social-media)
- [Publishing](#publishing)
- [Analytics](#analytics)
- [User Management](#user-management)

## 🔐 Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Base URL

```
https://gabrieltoth.com/api
```

---

## Auth Endpoints

### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd",
  "name": "John Doe",
  "captchaToken": "cf-turnstile-token"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "userId": "uuid",
  "message": "Verification email sent"
}
```

**Errors:**
- `400` - Invalid email or weak password
- `409` - Email already registered
- `429` - Rate limit exceeded

---

### POST `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd",
  "captchaToken": "cf-turnstile-token"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_abc123",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `423` - Account locked (brute-force protection)
- `429` - Rate limit exceeded

---

### POST `/api/auth/logout`

Invalidate current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

### POST `/api/auth/refresh`

Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_abc123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_xyz789"
}
```

---

### GET `/api/auth/me`

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-15T10:30:00Z",
  "emailVerified": true
}
```

---

## OAuth Endpoints

### GET `/api/auth/google/callback`

Google OAuth callback handler.

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - CSRF state token

**Response:** Redirects to `/dashboard`

---

### POST `/api/auth/oauth/authorize-google`

Initiate Google OAuth flow.

**Response:** `200 OK`
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "csrf_token_abc123"
}
```

---

## Social Media Endpoints

### GET `/api/youtube/channels`

List user's connected YouTube channels.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "channels": [
    {
      "id": "UCxxxxxx",
      "title": "My Channel",
      "thumbnailUrl": "https://...",
      "subscriberCount": 10000,
      "connected": true
    }
  ]
}
```

---

### POST `/api/youtube/connect`

Connect YouTube channel via OAuth.

**Request Body:**
```json
{
  "authCode": "google_auth_code"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "channelId": "UCxxxxxx"
}
```

---

### DELETE `/api/youtube/disconnect`

Disconnect YouTube channel.

**Request Body:**
```json
{
  "channelId": "UCxxxxxx"
}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

## Publishing Endpoints

### POST `/api/publish`

Publish content to multiple social networks.

**Request Body:**
```json
{
  "content": "My post content",
  "networks": ["youtube", "twitter", "instagram"],
  "scheduledAt": "2026-07-27T10:00:00Z",
  "media": [
    {
      "type": "image",
      "url": "https://..."
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "publicationId": "pub_abc123",
  "status": "scheduled",
  "networks": {
    "youtube": { "status": "pending" },
    "twitter": { "status": "pending" },
    "instagram": { "status": "pending" }
  }
}
```

---

### GET `/api/publications`

List user's publications.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` - Filter: `scheduled`, `published`, `failed`

**Response:** `200 OK`
```json
{
  "publications": [
    {
      "id": "pub_abc123",
      "content": "My post content",
      "status": "published",
      "createdAt": "2026-07-26T10:00:00Z",
      "networks": ["youtube", "twitter"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

## Analytics Endpoints

### GET `/api/analytics/overview`

Get analytics overview for all connected channels.

**Query Parameters:**
- `period` - `7d`, `30d`, `90d` (default: `30d`)

**Response:** `200 OK`
```json
{
  "period": "30d",
  "metrics": {
    "views": 125000,
    "likes": 5000,
    "comments": 800,
    "shares": 300
  },
  "growth": {
    "views": 15.5,
    "likes": 8.2
  }
}
```

---

### GET `/api/analytics/channel/:channelId`

Get detailed analytics for a specific channel.

**Path Parameters:**
- `channelId` - Channel ID

**Query Parameters:**
- `period` - `7d`, `30d`, `90d`

**Response:** `200 OK`
```json
{
  "channelId": "UCxxxxxx",
  "platform": "youtube",
  "metrics": {
    "views": 50000,
    "subscribers": 10500,
    "watchTime": 2500000
  },
  "topVideos": [
    {
      "id": "vid_123",
      "title": "Video Title",
      "views": 5000
    }
  ]
}
```

---

## Rate Limits

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| Auth (login/register) | 5 requests | 15 minutes |
| API (authenticated) | 100 requests | 1 minute |
| Publishing | 10 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1627392000
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Email is required",
    "details": {
      "field": "email"
    }
  }
}
```

**Common Error Codes:**
- `INVALID_REQUEST` - Malformed request
- `UNAUTHORIZED` - Missing or invalid auth token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Webhook Events

Subscribe to real-time events:

### POST `/api/webhooks/register`

Register a webhook URL.

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["publication.completed", "analytics.daily"]
}
```

**Event Payload Example:**
```json
{
  "event": "publication.completed",
  "timestamp": "2026-07-26T10:00:00Z",
  "data": {
    "publicationId": "pub_abc123",
    "status": "published"
  }
}
```

---

**Last updated**: 2026-07-26  
**API Version**: v1
