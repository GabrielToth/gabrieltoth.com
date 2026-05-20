# Authentication API Documentation

Complete API reference for all authentication endpoints including login, registration, OAuth, email verification, and password reset.

## Base URL

```
Production: https://gabrieltoth.com/api/auth
Development: http://localhost:3000/api/auth
```

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

---

## Authentication Methods

### 1. Email/Password Authentication

#### POST /register

Register a new user account with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1-555-123-4567"
}
```

**Validation Rules:**
- Email: valid RFC 5322 format, max 255 chars, must be unique
- Password: min 8 chars, uppercase, lowercase, number, special char
- Name: min 2 chars, letters/spaces/hyphens/apostrophes only, max 255 chars
- Phone: valid international format (E.164)

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully. Please verify your email.",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "emailVerified": false
  }
}
```

**Error Responses:**
- 400: Invalid input or validation failed
- 409: Email already registered

**Security:**
- Password hashed with Argon2id
- Input sanitized to prevent XSS
- SQL injection prevention
- Rate limiting: 5 requests per hour per IP

---

#### POST /login

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
- Password verified with Argon2id
- Login attempts logged

---

#### POST /logout

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

---

#### POST /forgot-password

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

#### POST /reset-password

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
- Password hashed with Argon2id
- All existing sessions invalidated
- Password reset logged

---

### 2. Email Verification

#### GET /check-email

Check if an email address is available for registration.

**Request:**
```
GET /api/auth/check-email?email=john@example.com
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "email": "john@example.com"
  }
}
```

**Performance:**
- Response time: < 500ms
- Debounced on client-side (500ms)
- Cached results for 60 seconds per email

**Security:**
- Rate limiting: 10 requests per minute per IP
- No sensitive information exposed

---

#### POST /send-verification-email

Send a verification email to the user's email address.

**Request:**
```json
{
  "email": "john@example.com",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent successfully. Please check your inbox.",
  "data": {
    "email": "john@example.com",
    "expiresAt": "2026-04-21T12:00:00.000Z"
  }
}
```

**Email Content:**
- User's name (personalized greeting)
- Verification link with token
- Link expiration time (24 hours)
- Support contact information

**Security:**
- Rate limiting: 3 requests per hour per email
- Email service (Resend) used for delivery
- Verification tokens stored securely
- Tokens never logged or exposed

---

#### GET /verify-email/:token

Verify user's email address using verification token from email link.

**Request:**
```
GET /api/auth/verify-email/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "data": {
    "email": "john@example.com",
    "verified": true,
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Error Responses:**
- 400: Invalid or expired token
- 400: Already verified
- 404: Token not found

**Token Validation:**
- Token must exist in database
- Token must not be expired (24-hour expiration)
- Token must not have been used already (single-use)
- Token must be linked to a valid user

**Security:**
- Single-use tokens (cannot be reused)
- Tokens expire after 24 hours
- Verification logged for audit trail
- Rate limiting: 10 requests per minute per IP

---

### 3. OAuth Authentication

#### POST /google/callback

Handles the Google OAuth callback after user authorization.

**Request:**
```json
{
  "code": "authorization_code_from_google"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "redirectUrl": "/dashboard"
}
```

**Cookies Set:**
- `session`: HTTP-only, secure, SameSite=Strict, Max-Age=2592000 (30 days)

**Error Responses:**
- 400: Authorization code is required
- 401: Failed to authenticate with Google
- 401: Invalid or expired Google token
- 500: Failed to create or update user
- 500: Failed to create session

**Process Flow:**
1. Frontend sends authorization code to this endpoint
2. Backend exchanges code for Google ID token
3. Backend validates token with Google servers
4. Backend extracts user information (email, name, picture, google_id)
5. Backend creates or updates user in database
6. Backend creates session
7. Backend sets HTTP-Only cookie with session_id
8. Backend logs login event to audit_logs
9. Backend returns redirect URL to dashboard

**Security:**
- Google token validation with Google's servers
- Token signature verified using Google's public keys
- Token expiration checked
- Token audience (aud) verified to match client ID
- Token issuer (iss) verified to be Google

---

#### GET /me

Returns the current authenticated user's information.

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

## Security Features

### Password Security
- Minimum 8 characters with uppercase, number, and special character
- Hashed using Argon2id
- Never transmitted in plain text
- Never logged or stored in plain text
- Validated on both client and server

### Email Security
- RFC 5322 format validation
- Uniqueness check before account creation
- Verification required before login
- Verification tokens expire after 24 hours
- Single-use verification tokens

### Session Management
- HTTP-only cookies for session storage
- Session expiration after 24 hours (or 30 days with Remember Me)
- Secure, SameSite=Strict cookie attributes
- Session validation on each request

### Rate Limiting
- Login attempts: 5 failed attempts per 15 minutes per email/IP
- Account lockout: 15 minutes after exceeding limit
- Password reset: No limit (generic response prevents abuse)
- Email check: 10 requests per minute per IP
- Verification email: 3 requests per hour per email

### Audit Logging
- All login/logout events logged
- Failed login attempts logged
- Email verification events logged
- Password reset events logged
- IP address and user agent recorded
- Logs retained for 90 days

### Security Headers
All responses include:
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Account created successfully |
| 400 | Bad Request - Invalid input or validation failed |
| 401 | Unauthorized - Invalid credentials or expired session |
| 403 | Forbidden - Invalid CSRF token |
| 404 | Not Found - User or token not found |
| 409 | Conflict - Email already registered |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected error |

---

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id

# Security
ARGON2_MEMORY_COST=64
SESSION_TIMEOUT=1800000  # 30 minutes in milliseconds
VERIFICATION_TOKEN_EXPIRY=86400000  # 24 hours in milliseconds
JWT_SECRET=your_jwt_secret_key
TOKEN_ENCRYPTION_KEY=your_encryption_key

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
# API base is always {NEXT_PUBLIC_APP_URL}/api
VERIFICATION_EMAIL_FROM=noreply@gabrieltoth.com
```

---

## Examples

### Complete Registration Flow

```bash
# 1. Check email availability
curl -X GET "https://gabrieltoth.com/api/auth/check-email?email=john@example.com"

# 2. Register
curl -X POST https://gabrieltoth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "phone": "+1-555-123-4567"
  }'

# 3. Verify email (click link in email)
curl -X GET "https://gabrieltoth.com/api/auth/verify-email/token_from_email"
```

### Complete Login Flow

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

# 2. Access protected resource
curl -X GET https://gabrieltoth.com/api/auth/me \
  -b cookies.txt
```

### Password Reset Flow

```bash
# 1. Request password reset
curl -X POST https://gabrieltoth.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# 2. Reset password (click link in email)
curl -X POST https://gabrieltoth.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "NewSecurePass123!",
    "confirmPassword": "NewSecurePass123!"
  }'

# 3. Login with new password
curl -X POST https://gabrieltoth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "NewSecurePass123!"
  }'
```

---

## Support

For API issues or questions:
- Open an issue on [GitHub](https://github.com/gabrieltoth/gabrieltoth.com/issues)
- Contact: support@gabrieltoth.com

