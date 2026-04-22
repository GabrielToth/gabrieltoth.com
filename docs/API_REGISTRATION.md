# Enhanced Authentication Registration - API Documentation

## Overview

This document describes all API endpoints for the Enhanced Authentication Registration system. These endpoints support a multi-step registration flow with email verification, password setup, personal data collection, and account creation. All endpoints use JSON for request/response bodies and include comprehensive security measures.

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

## Endpoints

### 1. POST /register

Create a new user account with email, password, name, and phone.

**Purpose**: Final step in the registration flow. Creates the user account after all data has been collected and verified.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1-555-123-4567"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|-----------|
| email | string | Yes | User's email address | Valid RFC 5322 format, max 255 chars, must be unique |
| password | string | Yes | User's password | Min 8 chars, uppercase, number, special char, max 255 chars |
| name | string | Yes | User's full name | Min 2 chars, letters/spaces/hyphens/apostrophes only, max 255 chars |
| phone | string | Yes | User's phone number | Valid international format, normalized to E.164 |

**Response (201 - Created):**
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

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Unique identifier for the created user |
| email | string | User's email address |
| name | string | User's full name |
| emailVerified | boolean | Email verification status (always false on creation) |

**Error Responses:**

**400 - Bad Request (Validation Failed)**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Please enter a valid email address",
    "password": "Password must contain at least one special character",
    "name": "Full name must be at least 2 characters",
    "phone": "Please enter a valid phone number"
  }
}
```

**409 - Conflict (Email Already Exists)**
```json
{
  "success": false,
  "error": "This email is already registered. Please use a different email or try logging in.",
  "field": "email"
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "error": "An error occurred while creating your account. Please try again later."
}
```

**Validation Rules:**

- **Email**:
  - Must be valid RFC 5322 format
  - Must not already exist in database
  - Maximum 255 characters
  - Normalized to lowercase for storage

- **Password**:
  - Minimum 8 characters
  - Must contain at least one uppercase letter (A-Z)
  - Must contain at least one number (0-9)
  - Must contain at least one special character (!@#$%^&*)
  - Maximum 255 characters
  - Validated on both client and server

- **Name**:
  - Minimum 2 characters
  - Maximum 255 characters
  - Only letters, spaces, hyphens, and apostrophes allowed
  - Whitespace trimmed before storage

- **Phone**:
  - Valid international phone format
  - Supports country codes (e.g., +1, +55, +44)
  - Normalized to E.164 format for storage (e.g., +15551234567)
  - Supports various formatting (spaces, hyphens, parentheses)

**Security:**
- Password hashed using bcrypt with cost factor 10
- HTTPS only (HTTP requests redirected)
- Input sanitized to prevent XSS attacks
- SQL injection prevention via parameterized queries
- Rate limiting: 5 requests per hour per IP address
- All sensitive data transmitted over HTTPS
- Passwords never logged or stored in plain text

**Example Request:**
```bash
curl -X POST https://gabrieltoth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "phone": "+1-555-123-4567"
  }'
```

**Example Response:**
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

**Next Steps:**
1. User receives verification email at provided email address
2. User clicks verification link in email
3. Call `GET /verify-email/:token` to verify email
4. User can then log in with email and password

---

### 2. GET /check-email

Check if an email address is available for registration.

**Purpose**: Validate email uniqueness during registration Step 1. Provides immediate feedback to users about email availability without creating an account.

**Request:**
```
GET /api/auth/check-email?email=john@example.com
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Email address to check for availability |

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "email": "john@example.com"
  }
}
```

**Response (200 - OK, Email Exists):**
```json
{
  "success": true,
  "data": {
    "available": false,
    "email": "existing@example.com"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| available | boolean | Whether the email is available for registration |
| email | string | The email address that was checked |

**Error Responses:**

**400 - Bad Request (Invalid Email)**
```json
{
  "success": false,
  "error": "Please enter a valid email address"
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "error": "An error occurred while checking email availability. Please try again."
}
```

**Performance:**
- Response time: < 500ms (SLA)
- Debounced on client-side (500ms) to reduce server load
- No database records created during check
- Cached results for 60 seconds per email

**Security:**
- HTTPS only
- Rate limiting: 10 requests per minute per IP address
- No sensitive information exposed
- Email existence not revealed to prevent enumeration attacks (always returns available: true/false)

**Example Request:**
```bash
curl -X GET "https://gabrieltoth.com/api/auth/check-email?email=john@example.com"
```

**Example Response (Available):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "email": "john@example.com"
  }
}
```

**Example Response (Not Available):**
```json
{
  "success": true,
  "data": {
    "available": false,
    "email": "john@example.com"
  }
}
```

**Usage in Registration Flow:**
1. User enters email in Step 1
2. Client debounces input (500ms)
3. Client calls `GET /check-email?email=...`
4. Display "Email available" or "Email already registered" message
5. Enable/disable Next button based on availability

---

### 3. POST /send-verification-email

Send a verification email to the user's email address.

**Purpose**: Send email verification link after account creation. User clicks the link to verify their email address.

**Request:**
```json
{
  "email": "john@example.com",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User's email address to send verification to |
| userId | string | Yes | User's unique identifier |

**Response (200 - OK):**
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

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| email | string | Email address where verification was sent |
| expiresAt | string | ISO 8601 timestamp when verification link expires (24 hours) |

**Error Responses:**

**400 - Bad Request (Invalid Input)**
```json
{
  "success": false,
  "error": "Invalid email address or user ID"
}
```

**404 - Not Found (User Not Found)**
```json
{
  "success": false,
  "error": "User not found"
}
```

**500 - Internal Server Error (Email Service Failed)**
```json
{
  "success": false,
  "error": "Failed to send verification email. Please try again later."
}
```

**Email Content:**

The verification email includes:
- User's name (personalized greeting)
- Verification link: `https://gabrieltoth.com/auth/verify-email?token=<verification_token>`
- Link expiration time (24 hours)
- Instructions to verify email
- Support contact information
- Security notice about not sharing the link

**Verification Token:**
- Unique, cryptographically secure token
- Expires after 24 hours
- Single-use (invalidated after verification)
- Stored in `email_verification_tokens` table
- Linked to user ID and email address

**Security:**
- HTTPS only
- Rate limiting: 3 requests per hour per email address
- Email service (Resend) used for reliable delivery
- Verification tokens stored securely in database
- Tokens never logged or exposed in responses
- Email address validated before sending

**Example Request:**
```bash
curl -X POST https://gabrieltoth.com/api/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Example Response:**
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

**Usage in Registration Flow:**
1. Account created via `POST /register`
2. System automatically calls `POST /send-verification-email`
3. User receives email with verification link
4. User clicks link in email
5. Browser navigates to `/auth/verify-email?token=<token>`
6. Frontend calls `GET /verify-email/:token`
7. Email marked as verified

**Resend Verification Email:**
Users can request a new verification email if:
- Original email was not received
- Verification link expired (24 hours)
- User wants to verify a different email address

Call this endpoint again with the same email and userId to send a new verification email.

---

### 4. GET /verify-email/:token

Verify user's email address using verification token from email link.

**Purpose**: Mark email as verified when user clicks verification link in email. Completes the email verification process.

**Request:**
```
GET /api/auth/verify-email/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| token | string | Yes | Verification token from email link |

**Response (200 - OK):**
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

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| email | string | Verified email address |
| verified | boolean | Email verification status (always true on success) |
| userId | string | User's unique identifier |

**Error Responses:**

**400 - Bad Request (Invalid Token)**
```json
{
  "success": false,
  "error": "Invalid verification token. Please request a new verification email.",
  "field": "token"
}
```

**400 - Bad Request (Expired Token)**
```json
{
  "success": false,
  "error": "Verification link has expired. Please request a new verification email.",
  "field": "token"
}
```

**400 - Bad Request (Already Verified)**
```json
{
  "success": false,
  "error": "This email has already been verified. You can now log in."
}
```

**404 - Not Found (Token Not Found)**
```json
{
  "success": false,
  "error": "Verification token not found. Please request a new verification email."
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "error": "An error occurred while verifying your email. Please try again."
}
```

**Token Validation:**
- Token must exist in `email_verification_tokens` table
- Token must not be expired (24-hour expiration)
- Token must not have been used already (single-use)
- Token must be linked to a valid user
- Token must match the email in the database

**Verification Process:**
1. Validate token format and existence
2. Check token expiration (24 hours from creation)
3. Check if token has already been used
4. Update `users` table: set `emailVerified = true`
5. Mark token as used in `email_verification_tokens` table
6. Log verification event for audit trail
7. Return success response

**Security:**
- HTTPS only
- Token validated on server-side
- Single-use tokens (cannot be reused)
- Tokens expire after 24 hours
- Verification logged for audit trail
- No sensitive information exposed in errors
- Rate limiting: 10 requests per minute per IP address

**Example Request:**
```bash
curl -X GET "https://gabrieltoth.com/api/auth/verify-email/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example Response (Success):**
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

**Example Response (Expired Token):**
```json
{
  "success": false,
  "error": "Verification link has expired. Please request a new verification email.",
  "field": "token"
}
```

**Usage in Registration Flow:**
1. User receives verification email
2. User clicks verification link: `https://gabrieltoth.com/auth/verify-email?token=<token>`
3. Frontend extracts token from URL
4. Frontend calls `GET /verify-email/:token`
5. Email marked as verified
6. User redirected to login page
7. User can now log in with email and password

**Handling Expired Tokens:**
If verification link expires (24 hours):
1. User sees error message: "Verification link has expired"
2. User clicks "Request new verification email" button
3. Frontend calls `POST /send-verification-email` again
4. New verification email sent with new token
5. User clicks new verification link

---

## Complete Registration Flow

### Step-by-Step Process

**Step 1: Email Input**
1. User enters email address
2. Frontend debounces input (500ms)
3. Frontend calls `GET /check-email?email=...`
4. Display "Email available" or "Email already registered"
5. Enable/disable Next button

**Step 2: Password Setup**
1. User enters password
2. Frontend validates password requirements in real-time
3. Display password strength indicator
4. User confirms password
5. Enable/disable Next button

**Step 3: Personal Information**
1. User enters full name
2. User enters phone number
3. Frontend validates both fields in real-time
4. Enable/disable Next button

**Step 4: Verification Review**
1. Display all entered data (read-only)
2. Display "Password is set and secured" (not actual password)
3. Allow editing individual fields (navigate back to corresponding step)
4. User clicks "Create Account"

**Account Creation**
1. Frontend calls `POST /register` with all data
2. Backend validates all data
3. Backend hashes password with bcrypt
4. Backend creates user in database
5. Backend calls `POST /send-verification-email`
6. Email service sends verification email
7. Frontend displays success message
8. Frontend redirects to login page after 2 seconds

**Email Verification**
1. User receives verification email
2. User clicks verification link
3. Frontend calls `GET /verify-email/:token`
4. Email marked as verified
5. User can now log in

---

## Error Codes and Messages

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Account created successfully |
| 400 | Bad Request | Invalid input, validation failed, expired token |
| 404 | Not Found | User not found, token not found |
| 409 | Conflict | Email already registered |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error, email service failure |

### Validation Error Messages

| Field | Error Message | Cause |
|-------|---------------|-------|
| email | "Please enter a valid email address" | Invalid RFC 5322 format |
| email | "This email is already registered" | Email exists in database |
| password | "Password must be at least 8 characters" | Too short |
| password | "Password must contain at least one uppercase letter" | Missing uppercase |
| password | "Password must contain at least one number" | Missing number |
| password | "Password must contain at least one special character" | Missing special char |
| name | "Full name is required" | Empty field |
| name | "Full name must be at least 2 characters" | Too short |
| name | "Full name can only contain letters, spaces, hyphens, and apostrophes" | Invalid characters |
| phone | "Please enter a valid phone number" | Invalid format |
| token | "Invalid verification token" | Token doesn't exist or invalid format |
| token | "Verification link has expired" | Token older than 24 hours |

---

## Rate Limiting

Different endpoints have different rate limits:

| Endpoint | Limit | Window | Per |
|----------|-------|--------|-----|
| POST /register | 5 requests | 1 hour | IP address |
| GET /check-email | 10 requests | 1 minute | IP address |
| POST /send-verification-email | 3 requests | 1 hour | Email address |
| GET /verify-email/:token | 10 requests | 1 minute | IP address |

**Rate Limit Headers:**
All responses include rate limit information:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1619712000
```

**Rate Limit Exceeded (429):**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## Security Features

### Password Security
- Minimum 8 characters with uppercase, number, and special character
- Hashed using bcrypt with cost factor 10
- Never transmitted in plain text
- Never logged or stored in plain text
- Validated on both client and server

### Email Security
- RFC 5322 format validation
- Uniqueness check before account creation
- Verification required before login
- Verification tokens expire after 24 hours
- Single-use verification tokens

### Data Protection
- HTTPS only (HTTP redirected to HTTPS)
- Input sanitized to prevent XSS attacks
- SQL injection prevention via parameterized queries
- CSRF protection for state-changing requests
- Secure headers (HSTS, CSP, X-Frame-Options, etc.)

### Session Management
- HTTP-only cookies for session storage
- Session expiration after 30 minutes of inactivity
- Secure, SameSite=Strict cookie attributes
- Session validation on each request

### Rate Limiting
- Prevents brute force attacks
- Prevents email enumeration
- Prevents verification token guessing
- Per-IP and per-email rate limits

### Audit Logging
- All account creation events logged
- All email verification events logged
- All failed attempts logged
- Timestamps and IP addresses recorded
- Passwords never logged

---

## Environment Variables

Required environment variables for registration endpoints:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Security
BCRYPT_COST_FACTOR=10
SESSION_TIMEOUT=1800000  # 30 minutes in milliseconds
VERIFICATION_TOKEN_EXPIRY=86400000  # 24 hours in milliseconds

# URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
VERIFICATION_EMAIL_FROM=noreply@gabrieltoth.com
```

---

## Testing with cURL

### Check Email Availability
```bash
curl -X GET "https://gabrieltoth.com/api/auth/check-email?email=test@example.com"
```

### Register New Account
```bash
curl -X POST https://gabrieltoth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "phone": "+1-555-123-4567"
  }'
```

### Send Verification Email
```bash
curl -X POST https://gabrieltoth.com/api/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Verify Email
```bash
curl -X GET "https://gabrieltoth.com/api/auth/verify-email/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Testing with Postman

Import the Postman collection to test all registration endpoints:

1. Open Postman
2. Click "Import"
3. Select "Link" tab
4. Enter: `https://www.gabrieltoth.com/api/postman-collection.json`
5. Click "Continue"

Or use the Postman MCP integration (if available).

---

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify email address is correct
- Request new verification email via `POST /send-verification-email`
- Check email service status (Resend)

### Verification Link Expired
- Verification links expire after 24 hours
- Request new verification email via `POST /send-verification-email`
- New link will be sent immediately

### Email Already Registered
- Email is already associated with an account
- Try logging in with that email
- Use password reset if you forgot your password
- Contact support if you need account recovery

### Password Validation Failed
- Password must be at least 8 characters
- Must contain uppercase letter (A-Z)
- Must contain number (0-9)
- Must contain special character (!@#$%^&*)
- Example: `SecurePass123!`

### Rate Limit Exceeded
- Too many requests from your IP address
- Wait for the time specified in `retryAfter` header
- Try again after the rate limit window expires

---

## Support

For API issues or questions:
- Open an issue on [GitHub](https://github.com/gabrieltoth/gabrieltoth.com/issues)
- Contact: support@gabrieltoth.com
- Check [API_AUTH.md](API_AUTH.md) for general authentication documentation

---

## Changelog

### v1.0.0 (2026-04-20)
- Initial registration API documentation
- POST /register endpoint
- GET /check-email endpoint
- POST /send-verification-email endpoint
- GET /verify-email/:token endpoint
- Complete registration flow documentation
- Error codes and messages
- Security features and best practices
- Rate limiting documentation
- Testing examples

---

**Last Updated**: April 20, 2026
**API Version**: 1.0.0
**Status**: Production Ready

