# Implementation Plan: OAuth Google Authentication

## Overview

This implementation plan breaks down the OAuth Google Authentication system into discrete, manageable coding tasks organized in logical phases. Each task builds incrementally on previous steps, with integrated testing at key checkpoints. The system uses Next.js 16 with TypeScript, Supabase for the database, and follows security best practices throughout.

---

## Phase 1: Database Setup

- [x] 1.1 Create users table with columns: id (UUID), google_id (VARCHAR unique), google_email (VARCHAR), google_name (VARCHAR), google_picture (VARCHAR nullable), created_at (TIMESTAMP), updated_at (TIMESTAMP)
  - Create primary key on id
  - Create unique constraint on google_id
  - Create indexes on google_id and google_email
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.2 Create sessions table with columns: id (UUID), user_id (UUID FK), session_id (VARCHAR unique), created_at (TIMESTAMP), expires_at (TIMESTAMP)
  - Create primary key on id
  - Create foreign key constraint on user_id referencing users.id with ON DELETE CASCADE
  - Create indexes on user_id, session_id, and expires_at
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 1.3 Create audit_logs table with columns: id (UUID), user_id (UUID FK nullable), event_type (VARCHAR), timestamp (TIMESTAMP), ip_address (VARCHAR), user_agent (TEXT)
  - Create primary key on id
  - Create foreign key constraint on user_id referencing users.id with ON DELETE SET NULL
  - Create indexes on user_id, event_type, and timestamp
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 1.4 Create TypeScript interfaces for database models
  - Define User interface with id, google_id, google_email, google_name, google_picture, created_at, updated_at
  - Define Session interface with id, user_id, session_id, created_at, expires_at
  - Define AuditLog interface with id, user_id, event_type, timestamp, ip_address, user_agent
  - Define ApiResponse<T> generic interface for all API responses
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

---

## Phase 2: Google OAuth Integration

- [x] 2.1 Implement validateGoogleToken() function
  - Validate Google token using google-auth-library
  - Extract user information (sub, email, name, picture)
  - Verify token signature, expiration, audience, and issuer
  - Return GoogleTokenPayload with extracted data
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 2.2 Write property tests for Google token validation
  - **Property 1: Google Token Validation** - For any valid Google token, validation accepts and extracts user info; for invalid, rejects
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 2.3 Implement upsertUser() function
  - Check if user exists by google_id
  - If not exists: create new user with google_id, google_email, google_name, google_picture
  - If exists: update google_name and google_picture if changed
  - Return User object
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.4 Write property tests for user creation and updates
  - **Property 2: User Creation on First Login** - For any new Google user, system creates user with all required fields
  - **Property 3: User Update on Subsequent Login** - For any existing user, system updates profile if changed
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

---

## Phase 3: Session Management

- [x] 3.1 Implement createSession() function
  - Generate unique session_id using crypto.randomBytes(32)
  - Create session record in database with user_id, session_id, created_at, expires_at (30 days)
  - Return Session object
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3.2 Implement validateSession() function
  - Query sessions table by session_id
  - Check if session exists and not expired
  - Return Session object if valid, null if invalid or expired
  - _Requirements: 4.5, 4.6, 4.7_

- [x] 3.3 Implement removeSession() function
  - Delete session from database by session_id
  - Return success status
  - _Requirements: 5.1, 5.2_

- [x] 3.4 Write property tests for session management
  - **Property 4: Session Creation and Validation** - For any authenticated user, system creates valid session with unique ID
  - **Property 5: Session Expiration** - For any expired session, system rejects it
  - **Property 6: Logout Removes Session** - For any logout, system removes session and clears cookie
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2_

---

## Phase 4: Audit Logging and Security

- [~] 4.1 Implement logAuditEvent() function
  - Create audit_log record with user_id, event_type, timestamp, ip_address, user_agent
  - Support event types: login, logout, login_failed, user_created
  - Return AuditLog object
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [~] 4.2 Implement CSRF protection middleware
  - Generate CSRF token on GET requests
  - Store CSRF token in session
  - Validate CSRF token on POST/PUT/DELETE requests
  - Return 403 Forbidden if token invalid or missing
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [~] 4.3 Implement security headers middleware
  - Add Content-Security-Policy header
  - Add X-Frame-Options: DENY header
  - Add X-Content-Type-Options: nosniff header
  - Add Strict-Transport-Security header
  - Add Referrer-Policy header
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [~] 4.4 Write property tests for security features
  - **Property 7: Audit Log Recording** - For any authentication event, system records audit log with full details
  - **Property 8: HTTP-Only Cookie Security** - For any session cookie, system sets HttpOnly, Secure, SameSite=Strict flags
  - **Property 9: Invalid Token Rejection** - For any invalid token, system rejects without creating session
  - **Property 10: Unique Google ID Constraint** - For any user, google_id is unique in database
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.2, 14.3, 14.4, 11.2, 3.4_

---

## Phase 5: API Endpoints - Authentication

- [~] 5.1 Implement POST /api/auth/google/callback endpoint
  - Validate authorization code from request body
  - Exchange code for Google access token
  - Validate token with Google servers
  - Extract user information from token
  - Create or update user in database
  - Create session
  - Set HTTP-Only cookie with session_id (HttpOnly, Secure, SameSite=Strict, 30 days)
  - Log login event to audit_logs
  - Return success response with redirect URL
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 11.1, 11.2, 11.3, 13.1, 13.2, 13.3, 13.4, 14.2, 14.3, 14.4_

- [~] 5.2 Write unit tests for POST /api/auth/google/callback
  - Test successful callback with valid authorization code
  - Test callback with invalid authorization code
  - Test callback with expired authorization code
  - Test new user creation on first login
  - Test existing user update on subsequent login
  - Test session creation and cookie setting
  - Test audit log recording
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

- [~] 5.3 Implement GET /api/auth/me endpoint
  - Get session_id from HTTP-Only cookie
  - Validate session exists and not expired
  - Fetch user data from database
  - Return user data (id, google_email, google_name, google_picture)
  - Return 401 Unauthorized if session invalid or expired
  - _Requirements: 6.1, 6.2, 6.3_

- [~] 5.4 Write unit tests for GET /api/auth/me
  - Test successful retrieval with valid session
  - Test with invalid session_id
  - Test with expired session
  - Test without session cookie
  - _Requirements: 6.1, 6.2, 6.3_

- [~] 5.5 Implement POST /api/auth/logout endpoint
  - Get session_id from HTTP-Only cookie
  - Validate session exists
  - Remove session from database
  - Clear HTTP-Only cookie
  - Log logout event to audit_logs
  - Return success response
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 13.1, 13.2, 13.3, 13.4_

- [~] 5.6 Write unit tests for POST /api/auth/logout
  - Test successful logout with valid session
  - Test logout without session
  - Test session removal from database
  - Test cookie clearing
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

---

## Phase 6: Frontend Components - Authentication

- [~] 6.1 Implement GoogleLoginButton component
  - Display button with text "Login with Google"
  - Use @react-oauth/google library for OAuth flow
  - Include client_id, redirect_uri, scope, state parameters
  - Handle successful login response
  - Send authorization code to POST /api/auth/google/callback
  - Redirect to /dashboard on success
  - Display error message on failure
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [~] 6.2 Write unit tests for GoogleLoginButton component
  - Test button renders correctly
  - Test click handler initiates OAuth flow
  - Test successful login redirect
  - Test error message display
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [~] 6.3 Implement GoogleLogoutButton component
  - Display button with text "Logout"
  - Handle click event
  - Send POST request to /api/auth/logout
  - Redirect to /auth/login on success
  - Display error message on failure
  - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [~] 6.4 Write unit tests for GoogleLogoutButton component
  - Test button renders correctly
  - Test click handler sends logout request
  - Test successful logout redirect
  - Test error message display
  - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [~] 6.5 Implement useAuth custom hook
  - Fetch user data from GET /api/auth/me on component mount
  - Return object with: user, isAuthenticated, isLoading, logout function
  - Handle loading state during fetch
  - Handle error state if fetch fails
  - Provide logout function that calls POST /api/auth/logout
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [~] 6.6 Write unit tests for useAuth hook
  - Test hook returns user data when authenticated
  - Test hook returns null when not authenticated
  - Test hook returns loading state during fetch
  - Test logout function calls API endpoint
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

---

## Phase 7: Frontend Components - Dashboard and Protection

- [~] 7.1 Implement Dashboard component
  - Use useAuth hook to get user data
  - Display user name, email, and profile picture
  - Display GoogleLogoutButton
  - Show loading state while fetching user data
  - Redirect to /auth/login if not authenticated
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [~] 7.2 Write unit tests for Dashboard component
  - Test display of user information
  - Test logout button presence
  - Test redirect when not authenticated
  - Test loading state display
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [~] 7.3 Implement ProtectedRoute component
  - Check authentication status using useAuth hook
  - Redirect to /auth/login if not authenticated
  - Render protected component if authenticated
  - Show loading state while checking authentication
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [~] 7.4 Write unit tests for ProtectedRoute component
  - Test redirect to login for unauthenticated users
  - Test access to protected routes for authenticated users
  - Test loading state display
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

---

## Phase 8: Cleanup and Removal

- [~] 8.1 Remove RegisterForm component
  - Delete src/components/auth/register-form.tsx
  - Remove all imports and references
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [~] 8.2 Remove LoginForm component
  - Delete src/components/auth/login-form.tsx
  - Remove all imports and references
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [~] 8.3 Remove ForgotPasswordForm component
  - Delete src/components/auth/forgot-password-form.tsx
  - Remove all imports and references
  - _Requirements: 9.1, 9.2, 9.3_

- [~] 8.4 Remove ResetPasswordForm component
  - Delete src/components/auth/reset-password-form.tsx
  - Remove all imports and references
  - _Requirements: 9.1, 9.2, 9.3_

- [~] 8.5 Remove old authentication routes
  - Delete POST /api/auth/register route
  - Delete GET /api/auth/verify-email route
  - Delete POST /api/auth/resend-verification route
  - Delete POST /api/auth/forgot-password route
  - Delete POST /api/auth/reset-password route
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3_

- [~] 8.6 Remove old database tables
  - Drop password_reset_tokens table
  - Drop email_verification_tokens table
  - Drop login_attempts table
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

---

## Phase 9: Integration Testing

- [~] 9.1 Write integration test for complete login flow
  - Test user clicks GoogleLoginButton
  - Test Google OAuth redirect
  - Test authorization code exchange
  - Test user creation/update
  - Test session creation
  - Test redirect to dashboard
  - Test dashboard displays user information
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [~] 9.2 Write integration test for complete logout flow
  - Test user clicks GoogleLogoutButton
  - Test logout request sent to backend
  - Test session removed from database
  - Test cookie cleared
  - Test redirect to login page
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 21.1, 21.2, 21.3, 21.4_

- [~] 9.3 Write integration test for session persistence
  - Test user logs in
  - Test session persists across multiple requests
  - Test GET /api/auth/me returns user data
  - Test session expires after 30 days
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [~] 9.4 Write integration test for protected routes
  - Test unauthenticated user redirected to login
  - Test authenticated user can access dashboard
  - Test session expiration redirects to login
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

---

## Phase 10: Security Testing and Validation

- [~] 10.1 Perform security testing for Google token validation
  - Test with invalid Google token
  - Test with expired Google token
  - Test with tampered token
  - Verify all invalid tokens are rejected
  - _Requirements: 11.1, 11.2, 11.3_

- [~] 10.2 Perform security testing for CSRF protection
  - Test form submission without CSRF token
  - Test form submission with invalid CSRF token
  - Verify requests are rejected with 403 Forbidden
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [~] 10.3 Verify security headers are present
  - Check Content-Security-Policy header
  - Check X-Frame-Options header
  - Check X-Content-Type-Options header
  - Check Strict-Transport-Security header
  - Check Referrer-Policy header
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [~] 10.4 Verify audit logging is working
  - Check login events are logged
  - Check logout events are logged
  - Check login_failed events are logged
  - Check user_created events are logged
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [~] 10.5 Verify HTTP-Only cookie security
  - Check cookies have HttpOnly flag
  - Check cookies have Secure flag
  - Check cookies have SameSite=Strict flag
  - Check cookies expire after 30 days
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

---

## Phase 11: Final Checkpoint and Documentation

- [~] 11.1 Ensure all tests pass
  - Run all unit tests: `npm run test:unit`
  - Run all integration tests: `npm run test:integration`
  - Run all property-based tests: `npm run test:pbt`
  - Verify code coverage >80%
  - Fix any failing tests
  - _Requirements: All_

- [~] 11.2 Verify build succeeds
  - Run build: `npm run build`
  - Verify no build errors
  - Verify no TypeScript errors
  - _Requirements: All_

- [~] 11.3 Create API documentation
  - Document POST /api/auth/google/callback endpoint
  - Document GET /api/auth/me endpoint
  - Document POST /api/auth/logout endpoint
  - Document request/response formats
  - Document error codes and messages
  - _Requirements: All_

- [~] 11.4 Create security documentation
  - Document Google OAuth token validation approach
  - Document CSRF protection mechanism
  - Document session management (30 days expiration)
  - Document HTTP-Only cookie security
  - Document audit logging
  - _Requirements: All_

---

## Notes

- All tasks should follow the design document specifications
- All code should be tested before committing
- All tests should pass before deploying
- All security considerations should be implemented
- All error handling should be implemented
- All database column names, table names, and function names must be in English
- All parameter names and variable names must be in English
- All comments and documentation must be in English
