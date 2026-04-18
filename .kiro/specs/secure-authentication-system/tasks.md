# Implementation Plan: Secure Authentication System

## Overview

This implementation plan breaks down the secure authentication system into discrete, manageable coding tasks organized in logical phases. Each task builds incrementally on previous steps, with integrated testing at key checkpoints. The system uses Next.js 16 with TypeScript, Supabase for the database, and follows security best practices throughout.

---

## Phase 1: Database Setup

- [x] 1.1 Create database schema and tables
  - Create `users` table with UUID primary key, email (unique), name, password_hash, email_verified, created_at, updated_at, last_login columns
  - Create `sessions` table with user_id foreign key, token (unique), expires_at columns
  - Create `password_reset_tokens` table with user_id foreign key, token (unique), expires_at columns
  - Create `email_verification_tokens` table with user_id foreign key, token (unique), expires_at columns
  - Create `login_attempts` table with user_id, email, ip_address, attempted_at, success, reason columns
  - Create `audit_logs` table with user_id, event_type, email, ip_address, details (JSONB), created_at columns
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 1.2 Create database indexes for query performance
  - Add index on `users.email` for fast email lookups
  - Add index on `sessions.user_id` and `sessions.token` for session validation
  - Add index on `password_reset_tokens.user_id` and `password_reset_tokens.token`
  - Add index on `email_verification_tokens.user_id` and `email_verification_tokens.token`
  - Add index on `login_attempts.user_id`, `login_attempts.email`, `login_attempts.ip_address`, `login_attempts.attempted_at`
  - Add index on `audit_logs.user_id`, `audit_logs.event_type`, `audit_logs.created_at`
  - _Requirements: 10.6_

- [x] 1.3 Set up database constraints and foreign keys
  - Add foreign key constraints from sessions, password_reset_tokens, email_verification_tokens to users table
  - Add ON DELETE CASCADE for user deletion
  - Add CHECK constraints for email format validation
  - Add CHECK constraints for non-empty token fields
  - _Requirements: 10.5_

- [x] 1.4 Create TypeScript interfaces for database models
  - Define `User` interface with id, email, name, emailVerified, createdAt, updatedAt, lastLogin
  - Define `Session` interface with id, userId, token, expiresAt, createdAt
  - Define `PasswordResetToken` interface with id, userId, token, expiresAt, createdAt
  - Define `EmailVerificationToken` interface with id, userId, token, expiresAt, createdAt
  - Define `LoginAttempt` interface with id, userId, email, ipAddress, attemptedAt, success, reason
  - Define `AuditLog` interface with id, userId, eventType, email, ipAddress, details, createdAt
  - Define `ApiResponse<T>` generic interface for all API responses
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

---

## Phase 2: Core Validation and Utility Functions

- [x] 2.1 Implement input validation functions
  - Create `validateEmail()` function that validates RFC 5322 email format
  - Create `validatePassword()` function that checks for 8+ chars, uppercase, lowercase, number, special char
  - Create `validateName()` function that allows only alphanumeric, spaces, hyphens, apostrophes
  - Create `validateFieldLength()` function that ensures max 255 characters
  - Create `validatePasswordMatch()` function that compares password and confirmPassword
  - _Requirements: 1.2, 1.3, 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 8.4_

- [x] 2.2 Write property tests for validation functions
  - **Property 2: Email Format Validation** - For any string input, if valid RFC 5322 format, validation accepts; if invalid, rejects
  - **Property 3: Password Strength Validation** - For any string, if 8+ chars with uppercase, lowercase, number, special char, accepts; otherwise rejects
  - **Property 8: Name Field Validation** - For any string, if only alphanumeric/spaces/hyphens/apostrophes, accepts; otherwise rejects
  - **Property 9: Field Length Validation** - For any string exceeding 255 chars, rejects; within limit, accepts
  - _Requirements: 1.2, 1.3, 7.1, 7.2, 7.4_

- [x] 2.3 Implement input sanitization functions
  - Create `sanitizeInput()` function that removes HTML tags and dangerous characters
  - Create `sanitizeName()` function that sanitizes name field specifically
  - Create `sanitizeEmail()` function that normalizes email (lowercase, trim)
  - Create `escapeHtml()` function for safe HTML display
  - _Requirements: 1.5, 7.3, 12.1, 12.2, 12.3, 12.4_

- [x] 2.4 Write property tests for sanitization functions
  - **Property 4: Input Sanitization Removes HTML** - For any string with HTML tags, sanitization removes all tags and dangerous chars
  - **Property 10: HTML Escaping on Display** - For any user-generated content, HTML chars are escaped to prevent XSS
  - _Requirements: 1.5, 7.3, 12.1, 12.2, 12.3, 12.4_

- [x] 2.5 Implement SQL injection prevention checks
  - Create `detectSqlInjection()` function that identifies SQL keywords and suspicious patterns
  - Create `validateAgainstSqlInjection()` function that rejects inputs with SQL keywords
  - _Requirements: 7.5, 11.1, 11.2, 11.3_

- [x] 2.6 Write property tests for SQL injection prevention
  - **Property 7: SQL Injection Prevention** - For any string with SQL keywords or suspicious patterns, validation rejects
  - _Requirements: 11.1, 11.2, 11.3_

---

## Phase 3: Password Hashing and Cryptography

- [x] 3.1 Implement password hashing utilities
  - Create `hashPassword()` function using bcrypt with salt rounds of 12
  - Create `comparePassword()` function that compares plain password with bcrypt hash
  - Create `generateToken()` function that generates cryptographically secure random tokens (32 bytes)
  - Create `generateCsrfToken()` function that generates CSRF tokens
  - _Requirements: 1.6, 3.4, 5.6, 6.1_

- [x] 3.2 Write property tests for password hashing
  - **Property 1: User Creation with Hashed Password** - For any valid registration data, password stored is hashed and not equal to original
  - **Property 5: Bcrypt Password Comparison** - For any user with stored hash, correct password returns true; incorrect returns false
  - _Requirements: 1.6, 3.4_

- [x] 3.3 Implement token generation and validation
  - Create `generateVerificationToken()` function for email verification
  - Create `generatePasswordResetToken()` function for password reset
  - Create `validateToken()` function that checks token format and existence
  - Create `isTokenExpired()` function that checks token expiration
  - _Requirements: 2.1, 5.2, 5.8_

- [x] 3.4 Write property tests for token validation
  - **Property 6: Email Verification Token Validation** - For any valid token, verification marks email verified; for expired/invalid, rejects
  - _Requirements: 2.1_

---

## Phase 4: Rate Limiting and Security Utilities

- [x] 4.1 Implement rate limiting for login attempts
  - Create `checkLoginAttempts()` function that queries login_attempts table
  - Create `recordLoginAttempt()` function that logs login attempt with email, IP, success status
  - Create `isAccountLocked()` function that checks if 5+ failed attempts in 15 minutes
  - Create `clearLoginAttempts()` function that resets attempts after 15 minutes
  - _Requirements: 3.7, 16.3_

- [x] 4.2 Implement audit logging
  - Create `logAuditEvent()` function that records events to audit_logs table
  - Create `logRegistration()` function that logs registration with email and IP
  - Create `logLogin()` function that logs login attempt with email, IP, success status
  - Create `logLogout()` function that logs logout event
  - Create `logPasswordReset()` function that logs password reset request
  - Create `logSecurityEvent()` function that logs security incidents (SQL injection, XSS attempts)
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 4.3 Implement security header middleware
  - Create middleware that adds Content-Security-Policy header
  - Create middleware that adds X-Frame-Options: DENY header
  - Create middleware that adds X-Content-Type-Options: nosniff header
  - Create middleware that adds Strict-Transport-Security header
  - Create middleware that adds Referrer-Policy header
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

---

## Phase 5: API Endpoints - Registration and Email Verification

- [x] 5.1 Implement POST /api/auth/register endpoint
  - Validate CSRF token from request
  - Validate input format (name, email, password, confirmPassword)
  - Sanitize all input fields
  - Check if email already exists in database
  - Hash password using bcrypt (salt: 12)
  - Create user record in database with email_verified = false
  - Generate email verification token
  - Send verification email via Resend
  - Log registration event to audit_logs
  - Return success response with userId and email
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 1.9, 6.1, 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 15.1, 16.1_

- [x] 5.2 Write unit tests for registration endpoint
  - Test successful registration with valid data
  - Test registration with invalid email format
  - Test registration with weak password
  - Test registration with mismatched passwords
  - Test registration with duplicate email
  - Test registration with invalid CSRF token
  - Test registration with SQL injection payload
  - Test registration with XSS payload
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 6.1, 7.1, 7.2, 7.3, 7.4, 11.1, 12.1_

- [x] 5.3 Implement POST /api/auth/verify-email endpoint
  - Validate token format
  - Find verification token in database
  - Check if token is expired
  - Mark user's email as verified in database
  - Delete verification token from database
  - Log verification event to audit_logs
  - Return success response
  - _Requirements: 2.1, 2.4, 16.1_

- [x] 5.4 Write unit tests for email verification endpoint
  - Test successful email verification with valid token
  - Test verification with expired token
  - Test verification with invalid token
  - Test verification with non-existent token
  - _Requirements: 2.1, 2.2_

- [x] 5.5 Implement email resend functionality
  - Create `resendVerificationEmail()` function
  - Generate new verification token
  - Send new verification email
  - Log resend event
  - _Requirements: 2.3_

---

## Phase 6: API Endpoints - Login and Session Management

- [x] 6.1 Implement POST /api/auth/login endpoint
  - Validate CSRF token from request
  - Validate email format
  - Check rate limiting (max 5 attempts in 15 minutes)
  - Find user by email in database
  - Verify email is verified (check email_verified = true)
  - Compare provided password with stored hash using bcrypt
  - Create session token (32-byte random)
  - Store session in sessions table with expiration (24h or 30d if rememberMe)
  - Set HTTP-only, secure cookie with session token
  - Update user's last_login timestamp
  - Log login attempt (success) to audit_logs
  - Return success response with user data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 6.1, 7.2, 16.2, 16.3_

- [x] 6.2 Write unit tests for login endpoint
  - Test successful login with valid credentials
  - Test login with invalid email format
  - Test login with incorrect password
  - Test login with unverified email
  - Test login with non-existent email
  - Test login with invalid CSRF token
  - Test login rate limiting (5+ attempts)
  - Test login with SQL injection payload
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 6.1, 11.1_

- [x] 6.3 Implement GET /api/auth/me endpoint
  - Get session token from cookie
  - Validate session token exists in sessions table
  - Check if session is expired
  - Fetch user data from database
  - Return user data (id, email, name, emailVerified)
  - _Requirements: 3.1, 4.1_

- [x] 6.4 Write unit tests for /api/auth/me endpoint
  - Test successful retrieval of authenticated user
  - Test with invalid session token
  - Test with expired session
  - Test without session cookie
  - _Requirements: 3.1_

- [x] 6.5 Implement POST /api/auth/logout endpoint
  - Validate CSRF token from request
  - Get session token from cookie
  - Find and delete session from sessions table
  - Clear authentication cookie
  - Log logout event to audit_logs
  - Return success response
  - _Requirements: 4.1, 4.2, 4.5, 6.1, 16.5_

- [x] 6.6 Write unit tests for logout endpoint
  - Test successful logout
  - Test logout with invalid CSRF token
  - Test logout without session
  - _Requirements: 4.1, 4.2, 6.1_

---

## Phase 7: API Endpoints - Password Recovery

- [x] 7.1 Implement POST /api/auth/forgot-password endpoint
  - Validate CSRF token from request
  - Validate email format
  - Find user by email (don't reveal if exists)
  - Generate password reset token
  - Store token in password_reset_tokens table (expires in 1 hour)
  - Send password reset email via Resend
  - Log password reset request to audit_logs
  - Return generic success response (same whether email exists or not)
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 16.4_

- [x] 7.2 Write unit tests for forgot password endpoint
  - Test with registered email
  - Test with unregistered email (should return same response)
  - Test with invalid email format
  - Test with invalid CSRF token
  - Test with SQL injection payload
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 11.1_

- [x] 7.3 Implement POST /api/auth/reset-password endpoint
  - Validate CSRF token from request
  - Validate token format
  - Find reset token in password_reset_tokens table
  - Check if token is expired
  - Validate new password meets requirements
  - Validate password and confirmPassword match
  - Hash new password using bcrypt (salt: 12)
  - Update user's password_hash in database
  - Invalidate all existing sessions for user (delete from sessions table)
  - Delete reset token from database
  - Log password reset event to audit_logs
  - Return success response
  - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.1, 16.4_

- [x] 7.4 Write unit tests for reset password endpoint
  - Test successful password reset with valid token
  - Test with expired token
  - Test with invalid token
  - Test with weak password
  - Test with mismatched passwords
  - Test with invalid CSRF token
  - Test that old sessions are invalidated
  - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.1_

---

## Phase 8: CSRF Protection Middleware

- [ ] 8.1 Implement CSRF token generation and validation
  - Create middleware that generates CSRF token on GET requests
  - Store CSRF token in session
  - Validate CSRF token on POST/PUT/DELETE requests
  - Return 403 Forbidden if token is missing or invalid
  - Regenerate token after successful form submission
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8.2 Implement CSRF token injection in forms
  - Create utility function to inject CSRF token in form responses
  - Ensure all registration, login, password reset forms include CSRF token
  - _Requirements: 6.1, 6.4_

- [ ] 8.3 Write unit tests for CSRF protection
  - Test CSRF token generation
  - Test CSRF token validation on form submission
  - Test rejection of missing CSRF token
  - Test rejection of invalid CSRF token
  - Test token expiration with session
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

---

## Phase 9: Frontend Components - Registration and Login

- [ ] 9.1 Implement RegisterForm component with real-time validation
  - Create form with name, email, password, confirmPassword fields
  - Implement real-time validation for each field
  - Display validation errors below each field
  - Show password strength indicator
  - Implement form submission with CSRF token
  - Handle loading and error states
  - Redirect to verification pending page on success
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.7, 1.8, 1.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.2 Write unit tests for RegisterForm component
  - Test real-time email validation
  - Test real-time password strength validation
  - Test password confirmation matching
  - Test name field validation
  - Test form submission with valid data
  - Test form submission with invalid data
  - Test error message display
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.3 Implement LoginForm component with real-time validation
  - Create form with email and password fields
  - Implement real-time email validation
  - Implement "Remember Me" checkbox
  - Implement form submission with CSRF token
  - Handle loading and error states
  - Display rate limiting error if applicable
  - Redirect to dashboard on success
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.4 Write unit tests for LoginForm component
  - Test real-time email validation
  - Test form submission with valid credentials
  - Test form submission with invalid credentials
  - Test "Remember Me" checkbox functionality
  - Test error message display
  - Test rate limiting error display
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.5 Implement ForgotPasswordForm component
  - Create form with email field
  - Implement email validation
  - Implement form submission with CSRF token
  - Handle loading and error states
  - Display generic success message
  - _Requirements: 5.1, 5.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.6 Write unit tests for ForgotPasswordForm component
  - Test email validation
  - Test form submission with valid email
  - Test form submission with invalid email
  - Test generic success message display
  - _Requirements: 5.1, 5.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.7 Implement ResetPasswordForm component
  - Create form with password and confirmPassword fields
  - Implement real-time password validation
  - Implement form submission with CSRF token
  - Handle loading and error states
  - Display error if token is expired
  - Redirect to login on success
  - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.8 Write unit tests for ResetPasswordForm component
  - Test password validation
  - Test password confirmation matching
  - Test form submission with valid data
  - Test form submission with invalid data
  - Test expired token error display
  - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

---

## Phase 10: Frontend Components - Dashboard and Authentication

- [ ] 10.1 Implement Dashboard component
  - Display authenticated user's name and email
  - Implement logout button
  - Show personalized content
  - Enforce authentication via middleware
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 10.2 Write unit tests for Dashboard component
  - Test display of user information
  - Test logout button functionality
  - Test redirect when not authenticated
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 10.3 Implement AuthMiddleware for route protection
  - Check for valid session token in cookies
  - Verify session hasn't expired
  - Redirect unauthenticated users to login
  - Refresh session if needed
  - Clear expired sessions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 17.2, 17.3_

- [ ] 10.4 Write unit tests for AuthMiddleware
  - Test redirect to login for unauthenticated users
  - Test access to protected routes for authenticated users
  - Test session expiration redirect
  - Test session refresh
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 17.2, 17.3_

- [ ] 10.5 Implement useAuth custom hook
  - Create hook that returns current user and authentication status
  - Implement logout function
  - Implement session refresh logic
  - _Requirements: 3.1, 4.1, 4.2_

- [ ] 10.6 Write unit tests for useAuth hook
  - Test hook returns current user
  - Test hook returns authentication status
  - Test logout function
  - Test session refresh
  - _Requirements: 3.1, 4.1, 4.2_

---

## Phase 11: Error Handling and User Feedback

- [ ] 11.1 Implement error handling for all API endpoints
  - Create error response formatter that returns generic messages
  - Never expose technical details in error messages
  - Log all errors server-side with full details
  - Return appropriate HTTP status codes (400, 401, 409, 429, 500)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 11.2 Implement client-side error display
  - Create error toast/notification component
  - Display validation errors below form fields
  - Display generic error messages for server errors
  - Clear errors when user corrects input
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 11.3 Write unit tests for error handling
  - Test error response formatting
  - Test generic error messages
  - Test error logging
  - Test HTTP status codes
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

---

## Phase 12: Integration Testing

- [ ] 12.1 Write integration tests for registration to login flow
  - Test user registration with valid data
  - Test email verification
  - Test user login with registered credentials
  - Test redirect to dashboard
  - Test dashboard displays user information
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 12.2 Write integration tests for password reset flow
  - Test password reset request
  - Test password reset email sending
  - Test password reset with valid token
  - Test login with new password
  - Test login fails with old password
  - Test all sessions invalidated after reset
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 12.3 Write integration tests for session management
  - Test session creation on login
  - Test session expiration after 24 hours
  - Test session extension with "Remember Me" (30 days)
  - Test session invalidation on logout
  - Test redirect to login on expired session
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12.4 Write integration tests for security features
  - Test CSRF token validation
  - Test rate limiting on login attempts
  - Test SQL injection prevention
  - Test XSS prevention
  - Test security headers presence
  - _Requirements: 6.1, 6.2, 6.3, 3.7, 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, 12.4, 9.1, 9.2, 9.3, 9.4, 9.5_

---

## Phase 13: Checkpoint - Core Functionality

- [ ] 13.1 Ensure all tests pass
  - Run all unit tests: `npm run test:unit`
  - Run all integration tests: `npm run test:all`
  - Verify code coverage >80%
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: All_

---

## Phase 14: Security Testing and Validation

- [ ] 14.1 Perform security testing for SQL injection prevention
  - Test registration endpoint with SQL injection payloads
  - Test login endpoint with SQL injection payloads
  - Test password reset endpoint with SQL injection payloads
  - Verify all inputs are properly validated and rejected
  - _Requirements: 11.1, 11.2, 11.3, 7.5, 7.6_

- [ ] 14.2 Perform security testing for XSS prevention
  - Test registration endpoint with XSS payloads in name field
  - Test registration endpoint with XSS payloads in email field
  - Test dashboard display of user name with HTML characters
  - Verify all user input is properly sanitized and escaped
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 1.5, 7.3_

- [ ] 14.3 Perform security testing for CSRF protection
  - Test form submission without CSRF token
  - Test form submission with invalid CSRF token
  - Verify requests are rejected with 403 Forbidden
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14.4 Verify security headers are present
  - Check Content-Security-Policy header
  - Check X-Frame-Options header
  - Check X-Content-Type-Options header
  - Check Strict-Transport-Security header
  - Check Referrer-Policy header
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 14.5 Verify audit logging is working
  - Check registration events are logged
  - Check login events are logged
  - Check logout events are logged
  - Check password reset events are logged
  - Check security events are logged
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

---

## Phase 15: Final Checkpoint and Documentation

- [ ] 15.1 Ensure all tests pass and code coverage is >80%
  - Run full test suite: `npm run test:all`
  - Generate coverage report: `npm run test:coverage`
  - Verify coverage >80%
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: All_

- [ ] 15.2 Verify build succeeds
  - Run build: `npm run build`
  - Verify no build errors
  - Verify no TypeScript errors
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: All_

- [ ] 15.3 Create API documentation
  - Document all endpoints (register, login, logout, verify-email, forgot-password, reset-password, me)
  - Document request/response formats
  - Document error codes and messages
  - Document authentication requirements
  - _Requirements: All_

- [ ] 15.4 Create security documentation
  - Document password hashing approach (bcrypt, salt: 12)
  - Document CSRF protection mechanism
  - Document rate limiting configuration
  - Document input validation rules
  - Document security headers
  - _Requirements: All_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are strongly recommended for production quality
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- Property-based tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- All code must pass `npm run build` before committing
- All tests must pass before moving to next phase
