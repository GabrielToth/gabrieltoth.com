# Authentication Routes Documentation

## Overview

This document describes all authentication-related routes in the application.

## Public Routes

### Sign-In Page
- **Route**: `GET /:locale/signin`
- **File**: `src/app/[locale]/signin/page.tsx`
- **Description**: Unified sign-in and registration page
- **Access**: Public (unauthenticated users)
- **Features**:
  - Email verification
  - Password entry for existing users
  - Registration form for new users
  - Google OAuth button
  - SSO option
- **Redirects**:
  - Existing user → `/dashboard` after successful sign-in
  - New user → `/auth/complete-account` after registration
- **Translations**: Supported in en, pt-BR, es, de

### Login Redirect
- **Route**: `GET /:locale/login`
- **File**: `src/app/[locale]/login/page.tsx`
- **Description**: Legacy login page (redirects to signin)
- **Access**: Public (unauthenticated users)
- **Behavior**: Redirects to `/:locale/signin`
- **Reason**: Consolidation of login/register into unified signin

### Register Redirect
- **Route**: `GET /:locale/register`
- **File**: `src/app/[locale]/register/page.tsx`
- **Description**: Legacy register page (redirects to signin)
- **Access**: Public (unauthenticated users)
- **Behavior**: Redirects to `/:locale/signin`
- **Reason**: Consolidation of login/register into unified signin

### Complete Account
- **Route**: `GET /:locale/auth/complete-account`
- **File**: `src/app/[locale]/auth/complete-account/page.tsx`
- **Description**: Account setup page for new users
- **Access**: Authenticated users (new accounts only)
- **Features**:
  - Review information from OAuth provider
  - Add required information (password, phone, etc.)
  - Verify information before completion
- **Redirects**: `/dashboard` after completion
- **Translations**: Supported in en, pt-BR, es, de

### Forgot Password
- **Route**: `GET /:locale/forgot-password`
- **File**: `src/app/[locale]/forgot-password/page.tsx`
- **Description**: Password reset request page
- **Access**: Public (unauthenticated users)
- **Features**:
  - Enter email to request reset
  - Receive reset link via email
- **Redirects**: Confirmation page after email sent
- **Translations**: Supported in en, pt-BR, es, de

### Reset Password
- **Route**: `GET /:locale/reset-password`
- **File**: `src/app/[locale]/reset-password/page.tsx`
- **Description**: Password reset page
- **Access**: Public (with valid reset token)
- **Features**:
  - Enter new password
  - Confirm new password
  - Validate reset token
- **Redirects**: `/signin` after successful reset
- **Translations**: Supported in en, pt-BR, es, de

## API Routes

### Check Email Existence
- **Route**: `POST /api/auth/check-email`
- **File**: `src/app/api/auth/check-email/route.ts`
- **Description**: Check if email exists in database
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "exists": true,
    "email": "user@example.com"
  }
  ```
- **Status Codes**:
  - `200`: Success
  - `400`: Invalid email
  - `429`: Rate limited
  - `500`: Server error

### Sign In
- **Route**: `POST /api/auth/signin`
- **File**: `src/app/api/auth/signin/route.ts`
- **Description**: Authenticate user with email and password
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "userId": "uuid",
    "email": "user@example.com",
    "sessionToken": "token"
  }
  ```
- **Status Codes**:
  - `200`: Success
  - `401`: Invalid credentials
  - `400`: Missing fields
  - `429`: Rate limited
  - `500`: Server error

### Sign Up
- **Route**: `POST /api/auth/signup`
- **File**: `src/app/api/auth/signup/route.ts`
- **Description**: Create new user account
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "userId": "uuid",
    "email": "user@example.com"
  }
  ```
- **Status Codes**:
  - `201`: Created
  - `400`: Invalid input
  - `409`: Email already exists
  - `429`: Rate limited
  - `500`: Server error

### OAuth Authorize
- **Route**: `GET /api/oauth/authorize/:platform`
- **File**: `src/app/api/oauth/authorize/[platform]/route.ts`
- **Description**: Initiate OAuth flow
- **Access**: Public
- **Parameters**:
  - `platform`: OAuth provider (google, github, etc.)
- **Query Parameters**:
  - `redirect_uri`: Where to redirect after auth
  - `state`: CSRF protection state
- **Response**: Redirect to OAuth provider
- **Status Codes**:
  - `302`: Redirect
  - `400`: Invalid platform
  - `500`: Server error

### OAuth Callback
- **Route**: `GET /api/oauth/callback/:platform`
- **File**: `src/app/api/oauth/callback/[platform]/route.ts`
- **Description**: Handle OAuth provider callback
- **Access**: Public
- **Parameters**:
  - `platform`: OAuth provider (google, github, etc.)
- **Query Parameters**:
  - `code`: Authorization code from provider
  - `state`: CSRF protection state
- **Response**: Redirect to `/dashboard` or `/auth/complete-account`
- **Status Codes**:
  - `302`: Redirect
  - `400`: Invalid code or state
  - `500`: Server error

### Verify Email
- **Route**: `GET /api/auth/verify-email/:token`
- **File**: `src/app/api/auth/verify-email/[token]/route.ts`
- **Description**: Verify email with token
- **Access**: Public (with valid token)
- **Parameters**:
  - `token`: Email verification token
- **Response**:
  ```json
  {
    "success": true,
    "message": "Email verified successfully"
  }
  ```
- **Status Codes**:
  - `200`: Success
  - `400`: Invalid token
  - `410`: Token expired
  - `500`: Server error

### Sign Out
- **Route**: `POST /api/auth/signout`
- **File**: `src/app/api/auth/signout/route.ts`
- **Description**: Sign out user
- **Access**: Authenticated users
- **Request Body**: Empty
- **Response**:
  ```json
  {
    "success": true,
    "message": "Signed out successfully"
  }
  ```
- **Status Codes**:
  - `200`: Success
  - `401`: Not authenticated
  - `500`: Server error

### Get Session
- **Route**: `GET /api/auth/session`
- **File**: `src/app/api/auth/session/route.ts`
- **Description**: Get current user session
- **Access**: Authenticated users
- **Response**:
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": true
    },
    "session": {
      "token": "token",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  }
  ```
- **Status Codes**:
  - `200`: Success
  - `401`: Not authenticated
  - `500`: Server error

### Refresh Session
- **Route**: `POST /api/auth/refresh`
- **File**: `src/app/api/auth/refresh/route.ts`
- **Description**: Refresh user session
- **Access**: Authenticated users
- **Request Body**: Empty
- **Response**:
  ```json
  {
    "success": true,
    "sessionToken": "new-token",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
  ```
- **Status Codes**:
  - `200`: Success
  - `401`: Not authenticated
  - `500`: Server error

## Middleware Routes

### Authentication Middleware
- **File**: `src/middleware.ts`
- **Description**: Validates authentication for protected routes
- **Protected Routes**:
  - `/dashboard`
  - `/settings`
  - `/profile`
  - `/admin`
- **Behavior**:
  - Checks for valid session token
  - Redirects to `/signin` if not authenticated
  - Refreshes token if expired

### Locale Middleware
- **File**: `src/middleware.ts`
- **Description**: Handles locale routing
- **Behavior**:
  - Detects user locale from headers
  - Redirects to appropriate locale route
  - Stores locale in cookie

## Rate Limiting

### Email Verification
- **Limit**: 5 attempts per hour per IP
- **Applies to**: `/api/auth/check-email`

### Sign In
- **Limit**: 5 attempts per hour per IP
- **Applies to**: `/api/auth/signin`

### Sign Up
- **Limit**: 3 attempts per hour per IP
- **Applies to**: `/api/auth/signup`

### Password Reset
- **Limit**: 3 attempts per hour per email
- **Applies to**: `/api/auth/forgot-password`

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `INVALID_EMAIL`: Email format is invalid
- `EMAIL_EXISTS`: Email already registered
- `INVALID_PASSWORD`: Password doesn't meet requirements
- `INVALID_CREDENTIALS`: Email or password is incorrect
- `USER_NOT_FOUND`: User doesn't exist
- `SESSION_EXPIRED`: Session has expired
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_TOKEN`: Token is invalid or expired
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

## Security Headers

All authentication routes include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self'`

## CORS Configuration

- **Allowed Origins**: Configured in environment
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Allowed

## Testing Routes

### Test Sign-In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Test Check Email
```bash
curl -X POST http://localhost:3000/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Test Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123","confirmPassword":"password123"}'
```

## Deployment Checklist

- [ ] All routes tested locally
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Email templates configured
- [ ] OAuth providers configured
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] CORS configured
- [ ] SSL/TLS enabled
- [ ] Monitoring configured
- [ ] Error logging configured
- [ ] Performance optimized
