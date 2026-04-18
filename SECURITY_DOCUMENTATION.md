# Secure Authentication System - Security Documentation

## Overview

This document describes the security measures implemented in the Secure Authentication System to protect user data and prevent common web vulnerabilities.

## Table of Contents

1. [Password Security](#password-security)
2. [Session Management](#session-management)
3. [CSRF Protection](#csrf-protection)
4. [Input Validation & Sanitization](#input-validation--sanitization)
5. [SQL Injection Prevention](#sql-injection-prevention)
6. [XSS Prevention](#xss-prevention)
7. [Rate Limiting](#rate-limiting)
8. [Security Headers](#security-headers)
9. [Audit Logging](#audit-logging)
10. [Email Verification](#email-verification)
11. [Password Reset Security](#password-reset-security)

---

## Password Security

### Hashing Algorithm

- **Algorithm**: bcrypt
- **Salt Rounds**: 12
- **Implementation**: Node.js `bcrypt` package

### Password Requirements

Users must create passwords that meet the following criteria:

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}';:"\\|,.<>/?

### Password Storage

- Passwords are never stored in plain text
- Passwords are hashed using bcrypt before storage
- Each password gets a unique salt
- Hashes are stored in the `password_hash` column of the `users` table

### Password Comparison

- Passwords are compared using bcrypt's `compare()` function
- Comparison is timing-safe to prevent timing attacks
- Failed comparisons do not reveal whether the email exists

---

## Session Management

### Session Creation

- Sessions are created upon successful login
- Session tokens are generated using cryptographically secure random bytes (32 bytes)
- Tokens are stored in the `sessions` table with expiration time

### Session Storage

- Session tokens are stored in HTTP-only cookies
- Cookies are marked as `Secure` (HTTPS only in production)
- Cookies use `SameSite=Strict` to prevent CSRF attacks
- Cookie path is set to `/` for application-wide access

### Session Duration

- **Default**: 24 hours
- **Remember Me**: 30 days
- Sessions are automatically invalidated after expiration
- Expired sessions are cleaned up from the database

### Session Validation

- Session token is validated on every request
- Session expiration is checked before granting access
- Invalid or expired sessions redirect to login page
- Session validation is performed server-side

### Session Invalidation

- Sessions are invalidated on logout
- All sessions are invalidated when password is reset
- Sessions are invalidated when user logs out
- Invalidated sessions are deleted from the database

---

## CSRF Protection

### Token Generation

- CSRF tokens are generated using cryptographically secure random bytes
- Tokens are unique per session
- Tokens are stored in memory with expiration time

### Token Validation

- CSRF tokens are required for all state-changing requests (POST, PUT, DELETE, PATCH)
- Tokens are validated before processing the request
- Invalid or missing tokens result in 403 Forbidden response
- Token validation is performed server-side

### Token Injection

- CSRF tokens are injected into forms on GET requests
- Tokens are included in form data for submission
- Tokens are also accepted in `X-CSRF-Token` header for API requests

### Token Expiration

- CSRF tokens expire with the session (24 hours or 30 days)
- Expired tokens are automatically cleaned up
- New tokens are generated for each session

---

## Input Validation & Sanitization

### Validation Rules

#### Email
- Must be valid RFC 5322 format
- Maximum 255 characters
- Normalized to lowercase
- Checked against existing users

#### Password
- Minimum 8 characters
- Must contain uppercase, lowercase, number, special character
- Maximum 255 characters
- Confirmed with confirmPassword field

#### Name
- Alphanumeric characters, spaces, hyphens, apostrophes only
- Maximum 255 characters
- No special characters allowed

### Sanitization

- All user input is sanitized on the server
- HTML tags are removed using DOMPurify
- Special characters are escaped
- Whitespace is trimmed
- Input is validated before sanitization

### Client-Side Validation

- Real-time validation as user types
- Immediate error feedback
- Password strength indicator
- Prevents invalid submissions

### Server-Side Validation

- All input is re-validated on the server
- Validation errors return 400 Bad Request
- Specific error messages for each field
- Generic error messages for security errors

---

## SQL Injection Prevention

### Parameterized Queries

- All database queries use parameterized statements
- User input is never concatenated into SQL
- Parameters are passed separately from SQL
- Database driver handles escaping

### Input Validation

- SQL keywords are detected and rejected
- Suspicious patterns are identified
- Requests with SQL injection attempts are logged
- Generic error messages prevent information leakage

### Detection

The system detects common SQL injection patterns:

- SQL keywords: SELECT, INSERT, UPDATE, DELETE, DROP, etc.
- Comment syntax: --, /*, */
- String delimiters: ', "
- Wildcard characters: %, _
- Union-based injection: UNION, SELECT
- Time-based injection: SLEEP, WAITFOR

---

## XSS Prevention

### Input Sanitization

- All user input is sanitized to remove HTML tags
- Special characters are escaped
- Dangerous characters are removed
- Sanitization is performed on the server

### Output Encoding

- User-generated content is HTML-escaped when displayed
- Special characters are converted to HTML entities
- Script tags cannot be executed
- Event handlers are removed

### Content Security Policy

The following CSP header is set on all responses:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

This policy:
- Restricts script execution to same-origin
- Prevents inline script execution (except for necessary styles)
- Blocks external script loading
- Prevents data exfiltration

---

## Rate Limiting

### Login Attempt Limiting

- Maximum 5 failed login attempts per 15 minutes
- Limit is per email address and IP address
- Account is temporarily locked after exceeding limit
- Lockout duration is 15 minutes

### Implementation

- Failed attempts are tracked in the `login_attempts` table
- Attempts are recorded with timestamp and IP address
- Automatic cleanup of old attempts
- Rate limiting is enforced server-side

### Response

- Rate-limited requests receive 429 Too Many Requests
- Generic error message: "Too many login attempts. Please try again later"
- No information about remaining attempts is disclosed

---

## Security Headers

### Content-Security-Policy

```
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
```

Prevents XSS attacks by restricting script execution.

### X-Frame-Options

```
DENY
```

Prevents clickjacking attacks by disallowing frame embedding.

### X-Content-Type-Options

```
nosniff
```

Prevents MIME type sniffing attacks.

### Strict-Transport-Security

```
max-age=31536000; includeSubDomains
```

Enforces HTTPS for 1 year, including subdomains.

### Referrer-Policy

```
strict-origin-when-cross-origin
```

Controls referrer information sent with requests.

---

## Audit Logging

### Logged Events

The system logs the following authentication events:

- User registration
- Email verification
- Successful login
- Failed login attempts
- Logout
- Password reset requests
- Password reset completion
- Security incidents (SQL injection, XSS attempts)

### Log Information

Each log entry includes:

- Event type
- User ID (if applicable)
- Email address
- IP address
- Timestamp
- Additional details (reason for failure, etc.)

### Log Storage

- Logs are stored in the `audit_logs` table
- Logs are indexed for efficient querying
- Logs are retained for audit trail purposes
- Logs are not exposed to users

### Log Access

- Logs are only accessible to administrators
- Logs are used for security monitoring
- Logs are used for incident investigation
- Logs are used for compliance reporting

---

## Email Verification

### Verification Process

1. User registers with email address
2. Verification email is sent with unique token
3. User clicks link in email
4. Token is validated and email is marked as verified
5. User can now log in

### Token Security

- Tokens are generated using cryptographically secure random bytes
- Tokens are unique and cannot be guessed
- Tokens expire after 24 hours
- Tokens are single-use (deleted after verification)
- Tokens are stored in the `email_verification_tokens` table

### Email Sending

- Emails are sent via Resend service
- Email templates are pre-approved
- Verification links include secure tokens
- Emails are sent asynchronously

### Unverified Email Restrictions

- Users cannot log in with unverified email
- Users receive error message: "Please verify your email before logging in"
- Users can request resend of verification email
- Verification is required for account activation

---

## Password Reset Security

### Reset Process

1. User requests password reset with email
2. Reset email is sent with unique token
3. User clicks link in email
4. User enters new password
5. Password is validated and updated
6. All existing sessions are invalidated
7. User must log in with new password

### Token Security

- Tokens are generated using cryptographically secure random bytes
- Tokens are unique and cannot be guessed
- Tokens expire after 1 hour
- Tokens are single-use (deleted after reset)
- Tokens are stored in the `password_reset_tokens` table

### Generic Response

- Response is always generic: "If an account exists with this email, a reset link has been sent"
- Response is the same whether email exists or not
- This prevents email enumeration attacks

### Session Invalidation

- All existing sessions are invalidated after password reset
- User must log in again with new password
- This prevents unauthorized access with old sessions

### Email Sending

- Reset emails are sent via Resend service
- Email templates are pre-approved
- Reset links include secure tokens
- Emails are sent asynchronously

---

## Security Checklist

- [x] All passwords are hashed with bcrypt (salt: 12)
- [x] CSRF tokens are validated on all forms
- [x] Input validation is performed on server
- [x] Input sanitization removes HTML tags
- [x] SQL injection prevention using parameterized queries
- [x] XSS prevention using HTML escaping
- [x] Rate limiting is implemented (5 attempts in 15 minutes)
- [x] Sessions use HTTP-only, secure cookies
- [x] Security headers are configured
- [x] Audit logging is implemented
- [x] Error messages don't expose technical details
- [x] Email verification is required before login
- [x] Password reset invalidates all sessions
- [x] Expired sessions are cleaned up
- [x] All endpoints require CSRF token validation

---

## Compliance

This authentication system is designed to comply with:

- OWASP Top 10 security guidelines
- GDPR data protection requirements
- SOC 2 security standards
- Industry best practices for authentication

---

## Incident Response

### Security Incident Reporting

If you discover a security vulnerability, please report it to:

- Email: security@gabrieltoth.com
- Do not disclose the vulnerability publicly
- Include detailed information about the vulnerability
- Allow time for the team to respond and fix

### Incident Handling

- Security incidents are investigated immediately
- Affected users are notified
- Patches are released as soon as possible
- Incident details are logged for future reference

---

## Regular Security Updates

- Dependencies are regularly updated
- Security patches are applied promptly
- Code is reviewed for security issues
- Penetration testing is performed regularly
- Security audit logs are reviewed

---

## Support

For security questions or concerns, please contact:

- Email: security@gabrieltoth.com
- Security team will respond within 24 hours
