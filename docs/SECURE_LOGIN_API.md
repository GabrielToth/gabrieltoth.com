# Secure Login API Documentation

## Overview

The Secure Login API provides a comprehensive authentication endpoint with advanced security controls including CSRF protection, rate limiting, password visibility toggle, and Remember Me functionality.

## Base URL

- **Production**: `https://gabrieltoth.com/api/auth`
- **Local Development**: `http://localhost:3000/api/auth`

## Authentication Endpoints

### POST /api/auth/login

Authenticate a user with email and password credentials.

#### Request

**Method**: `POST`

**Content-Type**: `application/json`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": false,
  "csrfToken": "token_value_here"
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address (max 255 characters, valid email format) |
| `password` | string | Yes | User's password (max 1024 characters, not empty) |
| `rememberMe` | boolean | No | Enable 30-day Remember Me token (default: false) |
| `csrfToken` | string | Yes | CSRF token for request validation |

#### Response

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "sessionToken": "base64_encoded_token"
  }
}
```

**Invalid Credentials (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Rate Limited (429 Too Many Requests)**:
```json
{
  "success": false,
  "error": "Too many login attempts. Please try again in 1 hour."
}
```

**CSRF Failure (403 Forbidden)**:
```json
{
  "success": false,
  "error": "Invalid request. Please refresh and try again."
}
```

**Validation Error (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "email": "Invalid email format"
  }
}
```

**Email Not Verified (403 Forbidden)**:
```json
{
  "success": false,
  "error": "Email not verified. Please check your email for verification link."
}
```

**Server Error (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": "An unexpected error occurred. Please try again later."
}
```

#### Response Headers

The following cookies are set in the response:

| Cookie | Value | Expiration | Flags |
|--------|-------|-----------|-------|
| `auth_session` | Session token | 1 hour | HttpOnly, Secure, SameSite=Strict |
| `remember_me_token` | Remember Me token | 30 days | HttpOnly, Secure, SameSite=Strict (if rememberMe=true) |
| `csrf_token` | CSRF token | Session | HttpOnly, Secure, SameSite=Strict |

#### Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Login successful, session created |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Invalid credentials or email not verified |
| 403 | Forbidden | CSRF token invalid or email not verified |
| 429 | Too Many Requests | Rate limit exceeded (5 attempts per hour per IP) |
| 500 | Internal Server Error | Unexpected server error |

#### Example Request

```bash
curl -X POST https://gabrieltoth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "rememberMe": false,
    "csrfToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### Example Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "sessionToken": "NTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwOjE3MTQzMjE2MDAwMDA6MC4xMjM0NTY3ODk="
  }
}
```

## CSRF Token Management

### Getting a CSRF Token

CSRF tokens are automatically generated and provided when:
1. The login form is rendered
2. A GET request is made to `/api/auth/csrf`

**Request**:
```bash
GET /api/auth/csrf
```

**Response**:
```json
{
  "csrfToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### CSRF Token Validation

- Tokens are validated on every login request
- Tokens expire after the session ends
- Tokens are cryptographically secure (32 bytes)
- Tokens cannot be reused

## Rate Limiting

### Rate Limit Rules

- **Limit**: 5 failed login attempts per hour per IP address
- **Tracking**: Per IP address (extracted from `X-Forwarded-For` or `X-Real-IP` headers)
- **Reset**: Automatic after 1 hour of inactivity or on successful login
- **Response**: 429 Too Many Requests with user-friendly message

### Rate Limit Headers

The following headers are included in responses:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed (5) |
| `X-RateLimit-Remaining` | Remaining requests before limit |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |

### Example Rate Limited Response

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1714325400

{
  "success": false,
  "error": "Too many login attempts. Please try again in 1 hour."
}
```

## Session Management

### Session Token

- **Expiration**: 1 hour from creation
- **Storage**: Secure HttpOnly cookie
- **Format**: Base64-encoded string
- **Validation**: Checked on protected routes

### Remember Me Token

- **Expiration**: 30 days from creation
- **Storage**: Secure HttpOnly cookie
- **Format**: Base64-encoded string
- **Automatic Restoration**: Automatically restores session on return visit

### Session Refresh

Sessions are automatically refreshed when:
1. User accesses a protected route within 5 minutes of expiration
2. Session token is extended by 1 hour

## Error Handling

### Generic Error Messages

For security reasons, the API returns generic error messages for authentication failures:

- Invalid email or password → "Invalid email or password"
- Email not found → "Invalid email or password"
- Password incorrect → "Invalid email or password"
- Email not verified → "Email not verified. Please check your email for verification link."

This prevents attackers from determining whether an email exists in the system.

### Error Logging

All errors are logged internally with:
- Request ID for tracing
- IP address
- User agent
- Timestamp
- Detailed error reason (not exposed to user)

## Security Features

### Password Security

- **Hashing Algorithm**: bcrypt with cost factor 12
- **Comparison**: Constant-time comparison to prevent timing attacks
- **Storage**: Only password hashes stored in database
- **Validation**: Minimum 8 characters, mix of uppercase, lowercase, numbers, special characters

### Input Validation

- **Email**: Valid email format, max 255 characters
- **Password**: Not empty, max 1024 characters
- **CSRF Token**: Present, valid format
- **Request Body**: Valid JSON, max 10KB
- **Extra Fields**: Rejected (prevents prototype pollution)

### Security Headers

All responses include security headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```

## Audit Logging

All authentication events are logged for compliance and security monitoring:

### Logged Events

- **Successful Login**: User ID, email, IP address, user agent, timestamp
- **Failed Login**: Email, IP address, user agent, failure reason, timestamp
- **CSRF Failure**: IP address, user agent, timestamp
- **Rate Limiting**: IP address, attempt count, timestamp
- **Remember Me Creation**: User ID, expiration, timestamp
- **Remember Me Validation**: User ID, success/failure, timestamp

### Log Retention

- **Retention Period**: 90+ days
- **Format**: Append-only, immutable
- **Access**: Restricted to authorized personnel only
- **Export**: Available for compliance reporting

## Best Practices

### Client-Side Implementation

1. **Always include CSRF token** in login requests
2. **Never store passwords** in local storage or session storage
3. **Use HTTPS** in production (enforced by Secure flag on cookies)
4. **Handle rate limiting gracefully** with user-friendly messages
5. **Implement password visibility toggle** for better UX
6. **Support password managers** (autocomplete, autofill)
7. **Validate input** before sending to server
8. **Handle errors appropriately** without exposing sensitive information

### Server-Side Implementation

1. **Always validate CSRF tokens** on login requests
2. **Always hash passwords** with bcrypt (cost factor 12)
3. **Always use constant-time comparison** for password verification
4. **Always enforce rate limiting** (5 attempts per hour per IP)
5. **Always log authentication events** for audit trail
6. **Always use secure cookies** (HttpOnly, Secure, SameSite)
7. **Always return generic error messages** for authentication failures
8. **Always include security headers** in responses

## Troubleshooting

### Common Issues

**"Invalid email or password"**
- Verify email is correct
- Verify password is correct
- Check if email is verified
- Try again after 1 hour if rate limited

**"Too many login attempts"**
- Wait 1 hour before retrying
- Check if IP address is correct (proxy/VPN may affect this)
- Contact support if issue persists

**"Invalid request. Please refresh and try again."**
- Refresh the page to get a new CSRF token
- Clear browser cookies and try again
- Try in a different browser or incognito mode

**"Email not verified"**
- Check email for verification link
- Click verification link to verify email
- Request new verification email if link expired

**Session expires too quickly**
- Session expires after 1 hour of inactivity
- Session is automatically refreshed on activity
- Use Remember Me for longer-lived sessions

## API Versioning

The current API version is **v1**. Future versions will be available at:
- `/api/v2/auth/login`
- `/api/v3/auth/login`

Backward compatibility is maintained for at least 2 major versions.

## Support

For API support, contact:
- **Email**: support@gabrieltoth.com
- **Documentation**: https://gabrieltoth.com/docs
- **Issues**: https://github.com/gabrieltoth/gabrieltoth.com/issues

