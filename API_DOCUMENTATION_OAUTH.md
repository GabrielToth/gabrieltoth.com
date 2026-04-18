# OAuth Google Authentication API Documentation

## Overview

This document describes the OAuth Google Authentication API endpoints for the application. The system uses Google OAuth 2.0 for authentication and maintains sessions with HTTP-Only cookies.

## Base URL

```
https://example.com/api/auth
```

## Authentication

All endpoints except `/google/callback` require a valid session cookie. Sessions are maintained using HTTP-Only cookies with the following properties:

- **Name**: `session`
- **HttpOnly**: true (not accessible via JavaScript)
- **Secure**: true (only sent over HTTPS)
- **SameSite**: Strict (not sent on cross-site requests)
- **Max-Age**: 30 days (2,592,000 seconds)

## Endpoints

### 1. POST /google/callback

Handles the Google OAuth callback after user authorization.

**Request**

```http
POST /api/auth/google/callback HTTP/1.1
Content-Type: application/json

{
  "code": "authorization_code_from_google"
}
```

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Authorization code received from Google OAuth |

**Response (Success)**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session=session_token; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/

{
  "success": true,
  "message": "Login successful",
  "redirectUrl": "/dashboard"
}
```

**Response (Error)**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": "Invalid or expired Google token"
}
```

**Error Codes**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Authorization code is required | Missing authorization code in request |
| 401 | Failed to authenticate with Google | Code exchange failed |
| 401 | Invalid or expired Google token | Token validation failed |
| 500 | Failed to create or update user | Database error during user creation |
| 500 | Failed to create session | Database error during session creation |
| 500 | Server configuration error | Google credentials not configured |

**Process Flow**

1. Frontend sends authorization code to this endpoint
2. Backend exchanges code for Google ID token
3. Backend validates token with Google servers
4. Backend extracts user information (email, name, picture, google_id)
5. Backend creates or updates user in database
6. Backend creates session
7. Backend sets HTTP-Only cookie with session_id
8. Backend logs login event to audit_logs
9. Backend returns redirect URL to dashboard

---

### 2. GET /me

Returns the current authenticated user's information.

**Request**

```http
GET /api/auth/me HTTP/1.1
Cookie: session=session_token
```

**Response (Success)**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "user-uuid",
    "google_email": "user@example.com",
    "google_name": "User Name",
    "google_picture": "https://example.com/picture.jpg"
  }
}
```

**Response (Error)**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": "Unauthorized"
}
```

**Error Codes**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | No session cookie or invalid session |
| 401 | Unauthorized | Session expired |
| 401 | Unauthorized | User not found |
| 500 | An error occurred | Database error |

**Process Flow**

1. Frontend sends GET request with session cookie
2. Backend validates session_id from cookie
3. Backend checks if session is expired
4. Backend fetches user data from database
5. Backend returns user information

---

### 3. POST /logout

Logs out the current user and removes their session.

**Request**

```http
POST /api/auth/logout HTTP/1.1
Cookie: session=session_token
Content-Type: application/json
```

**Response (Success)**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/

{
  "success": true,
  "message": "Logout successful"
}
```

**Response (Error)**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": "No active session"
}
```

**Error Codes**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | No active session | Missing session cookie |
| 401 | Invalid session | Session not found in database |
| 500 | An error occurred | Database error |

**Process Flow**

1. Frontend sends POST request with session cookie
2. Backend validates session_id from cookie
3. Backend removes session from database
4. Backend clears HTTP-Only cookie (maxAge=0)
5. Backend logs logout event to audit_logs
6. Backend returns success response

---

## Security Features

### Google Token Validation

- All Google tokens are validated with Google's servers
- Token signature is verified using Google's public keys
- Token expiration is checked
- Token audience (aud) is verified to match client ID
- Token issuer (iss) is verified to be Google

### Session Management

- Sessions expire after 30 days
- Session IDs are generated using crypto.randomBytes(32)
- Sessions are stored in database with user_id and expiration time
- Sessions are validated on every request

### CSRF Protection

- CSRF tokens are generated for each session
- CSRF tokens are validated on POST/PUT/DELETE requests
- CSRF tokens expire after 24 hours

### Security Headers

- Content-Security-Policy: Prevents XSS attacks
- X-Frame-Options: DENY - Prevents clickjacking
- X-Content-Type-Options: nosniff - Prevents MIME type sniffing
- Strict-Transport-Security: Enforces HTTPS
- Referrer-Policy: Restricts referrer information
- Permissions-Policy: Disables dangerous browser features

### Audit Logging

- All login/logout events are logged
- Failed login attempts are logged
- IP address and user agent are recorded
- Logs are retained for 90 days

### HTTP-Only Cookies

- Session cookies have HttpOnly flag (not accessible via JavaScript)
- Session cookies have Secure flag (only sent over HTTPS)
- Session cookies have SameSite=Strict (not sent on cross-site requests)
- Session cookies expire after 30 days

---

## Data Models

### User

```typescript
interface User {
  id: string                    // UUID
  google_id: string            // Unique Google ID
  google_email: string         // User's Google email
  google_name: string          // User's name from Google
  google_picture?: string      // User's profile picture URL
  created_at: Date             // Account creation timestamp
  updated_at: Date             // Last update timestamp
}
```

### Session

```typescript
interface Session {
  id: string                   // UUID
  user_id: string              // Reference to user
  session_id: string           // Unique session token
  created_at: Date             // Session creation timestamp
  expires_at: Date             // Session expiration timestamp
}
```

### Audit Log

```typescript
interface AuditLog {
  id: string                   // UUID
  user_id?: string             // Reference to user (nullable)
  event_type: string           // Event type (login, logout, login_failed)
  timestamp: Date              // Event timestamp
  ip_address?: string          // Client IP address
  user_agent?: string          // Client user agent
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: CSRF token invalid
- **500 Internal Server Error**: Server error

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for:

- `/google/callback` - Limit authorization code exchanges
- `/logout` - Limit logout attempts
- Failed login attempts - Implement exponential backoff

---

## Examples

### Complete Login Flow

1. User clicks "Login with Google" button
2. Frontend redirects to Google OAuth authorization URL
3. User authorizes application
4. Google redirects to `/api/auth/google/callback` with authorization code
5. Frontend sends code to backend
6. Backend exchanges code for token and creates session
7. Frontend redirects to `/dashboard`
8. Dashboard loads and calls `/api/auth/me` to get user data

### Complete Logout Flow

1. User clicks "Logout" button
2. Frontend sends POST request to `/api/auth/logout`
3. Backend removes session from database
4. Backend clears session cookie
5. Frontend redirects to `/auth/login`

---

## Environment Variables

Required environment variables:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://example.com/api/auth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://example.com/api/auth/google/callback
```

---

## Testing

### Unit Tests

- Google token validation
- User creation and updates
- Session creation and validation
- Audit logging
- API endpoint responses

### Integration Tests

- Complete login flow
- Complete logout flow
- Session persistence
- Protected routes

### Security Tests

- Google token validation security
- CSRF protection
- Security headers
- Audit logging
- HTTP-Only cookie security

---

## Deployment Checklist

- [ ] Google OAuth credentials configured
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Database migrations applied
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Security headers configured
- [ ] CSRF protection enabled
- [ ] Audit logging enabled
- [ ] Session expiration set to 30 days
- [ ] HTTP-Only cookies enabled
- [ ] Secure flag enabled for cookies
- [ ] SameSite=Strict set for cookies

---

## Support

For issues or questions, please contact the development team.
