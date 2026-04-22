# Account Completion Flow - API Documentation

## Overview

The Account Completion Flow API enables legacy OAuth users to complete their account setup by adding required information (password, phone number, birth date) to their existing OAuth profile.

## Base URL

```
https://api.gabrieltoth.com/api/auth
```

For local development:

```
http://localhost:3000/api/auth
```

## Authentication

The Account Completion API uses temporary tokens for authentication. These tokens are generated during the OAuth callback process and are valid for 30 minutes.

### Temporary Token

A temporary token is a JWT that contains the user's OAuth information and is used to maintain context during the account completion process.

**Token Structure:**

```json
{
  "email": "user@example.com",
  "oauth_provider": "google",
  "oauth_id": "google-123",
  "name": "John Doe",
  "picture": "https://example.com/photo.jpg",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Token Expiration:** 30 minutes from generation

## Endpoints

### POST /api/auth/complete-account

Completes account setup for a legacy OAuth user.

#### Request

**Method:** `POST`

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "birthDate": "1990-01-01"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tempToken` | string | Yes | Temporary token from OAuth callback |
| `email` | string | Yes | User's email address (can be different from OAuth email) |
| `name` | string | Yes | User's full name (2-100 characters) |
| `password` | string | Yes | User's password (must meet security requirements) |
| `phone` | string | Yes | User's phone number in international format (+1234567890) |
| `birthDate` | string | Yes | User's birth date in ISO 8601 format (YYYY-MM-DD) |

#### Response

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Account setup completed successfully",
  "redirectUrl": "/dashboard"
}
```

**Set-Cookie Header:**

```
Set-Cookie: session=session-id-123; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/
```

#### Error Responses

**400 Bad Request - Validation Error:**

```json
{
  "success": false,
  "error": "Password does not meet security requirements",
  "field": "password"
}
```

**401 Unauthorized - Invalid Token:**

```json
{
  "success": false,
  "error": "Your session has expired. Please log in again"
}
```

**409 Conflict - Email Already Registered:**

```json
{
  "success": false,
  "error": "This email is already in use",
  "field": "email"
}
```

**429 Too Many Requests - Rate Limited:**

```json
{
  "success": false,
  "error": "Too many requests. Please try again later"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": "An error occurred. Please try again later"
}
```

## Validation Rules

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

**Example Valid Passwords:**

- `SecurePass123!`
- `MyP@ssw0rd`
- `Str0ng#Pass`

**Example Invalid Passwords:**

- `password` (no uppercase, number, or special character)
- `Pass123` (no special character)
- `Pass!` (too short)

### Phone Number Format

Phone numbers must be in international format with a leading `+` sign.

**Format:** `+[country code][number]`

**Examples:**

- `+1234567890` (USA)
- `+551199999999` (Brazil)
- `+34912345678` (Spain)
- `+491234567890` (Germany)

### Birth Date Format

Birth dates must be in ISO 8601 format.

**Format:** `YYYY-MM-DD`

**Validation Rules:**

- Date must be in the past
- User must be at least 13 years old
- Date cannot be in the future

**Examples:**

- `1990-01-15` (Valid)
- `2010-12-31` (Invalid - user too young)
- `2025-01-01` (Invalid - future date)

### Email Format

Email addresses must be valid and unique in the system.

**Validation Rules:**

- Must contain `@` symbol
- Must have a domain name
- Must not already be registered (unless it's the same as the OAuth email)

**Examples:**

- `user@example.com` (Valid)
- `invalid.email` (Invalid - no @ symbol)
- `user@` (Invalid - no domain)

### Name Format

User names must be between 2 and 100 characters.

**Validation Rules:**

- Minimum 2 characters
- Maximum 100 characters
- Can contain letters, numbers, spaces, and hyphens

**Examples:**

- `John Doe` (Valid)
- `J` (Invalid - too short)
- `A very long name with many characters that exceeds the maximum allowed length of one hundred characters` (Invalid - too long)

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOKEN` | 401 | Temporary token is invalid or expired |
| `EXPIRED_TOKEN` | 401 | Temporary token has expired |
| `INVALID_INPUT` | 400 | One or more input fields are invalid |
| `MISSING_FIELD` | 400 | A required field is missing |
| `INVALID_EMAIL` | 400 | Email format is invalid |
| `EMAIL_ALREADY_REGISTERED` | 409 | Email is already registered to another account |
| `INVALID_PASSWORD` | 400 | Password does not meet security requirements |
| `INVALID_PHONE` | 400 | Phone number format is invalid |
| `INVALID_BIRTHDATE` | 400 | Birth date format is invalid or user is too young |
| `USER_TOO_YOUNG` | 400 | User is under 13 years old |
| `FUTURE_DATE` | 400 | Birth date is in the future |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `TOO_MANY_ATTEMPTS` | 429 | Too many requests from this IP address |

## Rate Limiting

The Account Completion API is rate limited to prevent abuse.

**Limits:**

- 5 requests per hour per IP address
- 10 requests per hour per email address

**Response Headers:**

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1234567890
```

## Security

### HTTPS

All API requests must be made over HTTPS in production. HTTP is only allowed for local development.

### CORS

The API supports CORS requests from the following origins:

- `https://gabrieltoth.com`
- `https://www.gabrieltoth.com`
- `http://localhost:3000` (development only)

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) require a valid CSRF token in the `X-CSRF-Token` header.

### Input Sanitization

All user inputs are sanitized to prevent XSS and SQL injection attacks.

### Password Hashing

Passwords are hashed using bcrypt with a cost factor of 12 before being stored in the database.

## Examples

### cURL

```bash
curl -X POST https://api.gabrieltoth.com/api/auth/complete-account \
  -H "Content-Type: application/json" \
  -d '{
    "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePass123!",
    "phone": "+1234567890",
    "birthDate": "1990-01-01"
  }'
```

### JavaScript/Fetch

```javascript
const response = await fetch('/api/auth/complete-account', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tempToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    email: 'user@example.com',
    name: 'John Doe',
    password: 'SecurePass123!',
    phone: '+1234567890',
    birthDate: '1990-01-01',
  }),
})

const data = await response.json()

if (data.success) {
  window.location.href = data.redirectUrl
} else {
  console.error(data.error)
}
```

### Python/Requests

```python
import requests

response = requests.post(
    'https://api.gabrieltoth.com/api/auth/complete-account',
    json={
        'tempToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'email': 'user@example.com',
        'name': 'John Doe',
        'password': 'SecurePass123!',
        'phone': '+1234567890',
        'birthDate': '1990-01-01',
    }
)

data = response.json()

if data['success']:
    print(f"Redirecting to {data['redirectUrl']}")
else:
    print(f"Error: {data['error']}")
```

## Troubleshooting

### "Your session has expired. Please log in again"

This error occurs when the temporary token is invalid or has expired. The token is valid for 30 minutes from generation.

**Solution:** Start the OAuth login process again to generate a new temporary token.

### "This email is already in use"

This error occurs when the email address is already registered to another account.

**Solution:** Use a different email address or contact support if you believe this is an error.

### "Password does not meet security requirements"

This error occurs when the password doesn't meet the security requirements.

**Solution:** Ensure your password contains:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

### "Please enter a valid international phone number"

This error occurs when the phone number is not in the correct format.

**Solution:** Use the international format with a leading `+` sign (e.g., `+1234567890`).

### "You must be at least 13 years old"

This error occurs when the birth date indicates the user is under 13 years old.

**Solution:** Ensure the birth date is correct and the user is at least 13 years old.

## Support

For API support, please contact:

- Email: support@gabrieltoth.com
- Documentation: https://docs.gabrieltoth.com
- Status Page: https://status.gabrieltoth.com
