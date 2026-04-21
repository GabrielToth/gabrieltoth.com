# Secure Authentication System - API Documentation

## Overview

This document describes all authentication API endpoints for the Secure Authentication System. All endpoints use JSON for request/response bodies and include comprehensive security measures.

## Base URL

```
https://gabrieltoth.com/api/auth
```

## Authentication

Most endpoints require a valid session token stored in an HTTP-only cookie named `session`. Some endpoints also require a CSRF token for additional protection against cross-site request forgery attacks.

## Response Format

All responses follow a consistent format:

### Success Response (2xx)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Endpoint-specific data
  }
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": "User-friendly error message",
  "field": "field_name" // Optional: for validation errors
}
```

## Endpoints

### 1. POST /register

Register a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "csrfToken": "token_value"
}
```

**Validation Rules:**
- Name: alphanumeric, spaces, hyphens, apostrophes only (max 255 chars)
- Email: valid RFC 5322 format (max 255 chars)
- Password: min 8 chars, uppercase, lowercase, number, special char
- Confirm Password: must match password field

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- 400: Invalid input format or validation failed
- 409: Email already registered

**Security:**
- Password hashed with bcrypt (salt: 12)
- Input sanitized to prevent XSS
- SQL injection prevention
- CSRF token validation

---

### 2. POST /login

Authenticate user and create session.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false,
  "csrfToken": "token_value"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Cookies Set:**
- `session`: HTTP-only, secure, SameSite=Strict
  - Duration: 24 hours (default) or 30 days (if rememberMe=true)

**Error Responses:**
- 400: Invalid email format
- 401: Invalid credentials or unverified email
- 429: Too many login attempts (rate limited)

**Security:**
- Rate limiting: max 5 failed attempts in 15 minutes
- Email verification required
- Password compared with bcrypt
- Login attempts logged for audit trail

---

### 3. POST /logout

Invalidate session and log out user.

**Request:**
```json
{
  "csrfToken": "token_value"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookies Cleared:**
- `session`: Set to empty with maxAge=0

**Error Responses:**
- 401: No active session
- 403: Invalid CSRF token

**Security:**
- Session invalidated in database
- CSRF token validation
- Logout event logged

---

### 4. POST /verify-email

Verify user's email address using token from email link.

**Request:**
```json
{
  "token": "email_verification_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Responses:**
- 400: Invalid or expired token

**Security:**
- Token validation
- Token expiration check (24 hours)
- Email verification logged

---

### 5. POST /forgot-password

Request password reset email.

**Request:**
```json
{
  "email": "john@example.com",
  "csrfToken": "token_value"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a reset link has been sent"
}
```

**Note:** Response is always generic to prevent email enumeration attacks.

**Security:**
- Generic response regardless of email existence
- Reset token expires in 1 hour
- Reset email sent via Resend
- Request logged for audit trail

---

### 6. POST /reset-password

Reset password using token from reset email.

**Request:**
```json
{
  "token": "password_reset_token",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!",
  "csrfToken": "token_value"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password"
}
```

**Error Responses:**
- 400: Invalid/expired token or weak password
- 403: Invalid CSRF token

**Security:**
- Token validation and expiration check
- Password hashed with bcrypt (salt: 12)
- All existing sessions invalidated
- Password reset logged

---

### 7. GET /me

Get current authenticated user information.

**Request:**
```
GET /api/auth/me
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "emailVerified": true
  }
}
```

**Error Responses:**
- 401: Not authenticated or session expired

**Security:**
- Session validation required
- Session expiration check
- User data sanitized

---

## Security Headers

All responses include the following security headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## Rate Limiting

- **Login attempts**: 5 failed attempts per 15 minutes per email/IP
- **Account lockout**: 15 minutes after exceeding limit
- **Password reset**: No limit (generic response prevents abuse)

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input or validation failed |
| 401 | Unauthorized - Invalid credentials or expired session |
| 403 | Forbidden - Invalid CSRF token |
| 409 | Conflict - Email already registered |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected error |

## Input Validation

### Email
- Must be valid RFC 5322 format
- Maximum 255 characters
- Normalized to lowercase

### Password
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character
- Maximum 255 characters

### Name
- Alphanumeric characters, spaces, hyphens, apostrophes only
- Maximum 255 characters

## Security Best Practices

1. **Always use HTTPS** - All endpoints require HTTPS in production
2. **Store session securely** - Session tokens stored in HTTP-only cookies
3. **Validate CSRF tokens** - All state-changing requests require CSRF token
4. **Check email verification** - Login requires verified email
5. **Monitor login attempts** - Rate limiting prevents brute force attacks
6. **Log all events** - Comprehensive audit trail for security monitoring
7. **Sanitize input** - All user input sanitized to prevent XSS
8. **Use parameterized queries** - SQL injection prevention
9. **Hash passwords** - bcrypt with 12 salt rounds
10. **Expire sessions** - Sessions expire after 24 hours (or 30 days with Remember Me)

## Examples

### Register and Verify Email

```bash
# 1. Register
curl -X POST https://gabrieltoth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'

# 2. Check email for verification link
# 3. Verify email
curl -X POST https://gabrieltoth.com/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "verification_token_from_email"}'
```

### Login and Access Protected Resource

```bash
# 1. Login
curl -X POST https://gabrieltoth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "rememberMe": false
  }' \
  -c cookies.txt

# 2. Access protected resource with session cookie
curl -X GET https://gabrieltoth.com/api/auth/me \
  -b cookies.txt
```

### Password Reset Flow

```bash
# 1. Request password reset
curl -X POST https://gabrieltoth.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# 2. Check email for reset link
# 3. Reset password
curl -X POST https://gabrieltoth.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "NewSecurePass123!",
    "confirmPassword": "NewSecurePass123!"
  }'

# 4. Login with new password
curl -X POST https://gabrieltoth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "NewSecurePass123!"
  }'
```

## Support

For issues or questions about the API, please contact support or open an issue on GitHub.
