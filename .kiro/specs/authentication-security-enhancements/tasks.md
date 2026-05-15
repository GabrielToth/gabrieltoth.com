# Implementation Plan: Authentication Security Enhancements

## Overview

This implementation plan covers comprehensive security enhancements to the authentication system, including logout functionality with rate limiting, session invalidation, route protection for all dashboard routes, audit logging, and extensive security testing. The implementation builds upon the existing Next.js 16.2.4 App Router architecture with Supabase PostgreSQL, extending the current session-based authentication with CSRF protection and in-memory rate limiting.

## Tasks

- [x] 1. Set up database schema and audit logging infrastructure
  - Create audit_logs table in Supabase with proper indexes
  - Add indexes to sessions table for performance optimization
  - Generate TypeScript types from updated schema
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Implement session management utilities
  - [x] 2.1 Create session validation and removal functions
    - Implement `validateSession(sessionId)` to query database and check expiration
    - Implement `removeSession(sessionId)` to delete session from database
    - Implement `getSessionFromCookie(request)` to extract session from cookie
    - Add proper error handling and logging
    - _Requirements: 2.1, 2.4, 10.2, 10.3_
  
  - [x] 2.2 Write unit tests for session management functions
    - Test session validation with valid, invalid, and expired sessions
    - Test session removal and database deletion
    - Test cookie extraction and parsing
    - _Requirements: 6.2_

- [x] 3. Extend rate limiting for logout endpoint
  - [x] 3.1 Add logout rate limiting to proxy.ts
    - Extend `checkRateLimit` function to support logout endpoint
    - Implement 5 requests per 60 seconds limit for logout
    - Use composite key format "userId:logout" or "ip:logout"
    - Add rate limit response with HTTP 429 status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 3.2 Write property test for rate limiting
    - **Property 1: Rate Limit Enforcement**
    - **Validates: Requirements 1.2, 1.3**
    - Test that 6th request within 60 seconds is rejected with 429
    - _Requirements: 6.1_
  
  - [x] 3.3 Write property test for rate limit window reset
    - **Property 2: Rate Limit Window Reset**
    - **Validates: Requirements 1.4**
    - Test that request count resets after 60-second window expires
    - _Requirements: 6.1_

- [x] 4. Implement logout API route
  - [x] 4.1 Create /api/auth/logout/route.ts
    - Extract session token from cookie
    - Validate CSRF token
    - Validate session exists and not expired
    - Delete session from database
    - Clear session cookie with maxAge=0 and empty value
    - Create audit log entry (non-blocking)
    - Return success response with redirect instruction
    - Implement comprehensive error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 4.2 Write property test for session deletion
    - **Property 3: Session Deletion on Logout**
    - **Validates: Requirements 2.1**
    - Test that session is deleted from database after logout
    - _Requirements: 6.2_
  
  - [x] 4.3 Write property test for cookie clearing
    - **Property 4: Cookie Clearing on Logout**
    - **Validates: Requirements 2.2, 2.3**
    - Test that session cookie has maxAge=0 and empty value
    - _Requirements: 6.2_
  
  - [x] 4.4 Write property test for deleted session authentication
    - **Property 5: Deleted Session Authentication Failure**
    - **Validates: Requirements 2.4**
    - Test that deleted session cannot be used for authentication
    - _Requirements: 6.2_
  
  - [x] 4.5 Write property test for invalid session handling
    - **Property 6: Invalid Session Logout Handling**
    - **Validates: Requirements 2.5**
    - Test that invalid session returns 401 without database changes
    - _Requirements: 6.2_
  
  - [x] 4.6 Write property test for logout redirect
    - **Property 7: Logout Redirect Instruction**
    - **Validates: Requirements 3.1**
    - Test that successful logout includes redirect to /auth/login
    - _Requirements: 6.3_

- [x] 5. Checkpoint - Ensure logout functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement authentication middleware
  - [x] 6.1 Create or update auth-middleware.ts
    - Implement `authMiddleware(request)` to validate sessions
    - Query sessions database table for session token
    - Verify expires_at timestamp is in the future
    - Redirect to /auth/login with 302 status for invalid sessions
    - Return null for valid sessions to allow request to proceed
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 6.2 Write unit tests for authentication middleware
    - Test middleware with valid session
    - Test middleware with no session
    - Test middleware with invalid session
    - Test middleware with expired session
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 7. Implement dashboard route protection
  - [x] 7.1 Update middleware.ts to protect dashboard routes
    - Add route matching for /dashboard/*
    - Call authMiddleware for all dashboard routes
    - Redirect to /auth/login for unauthenticated requests
    - Protect /dashboard, /dashboard/publish, /dashboard/insights, /dashboard/settings
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.5_
  
  - [x] 7.2 Write property test for dashboard route session validation
    - **Property 9: Dashboard Route Session Validation**
    - **Validates: Requirements 4.1**
    - Test that all dashboard routes validate session tokens
    - _Requirements: 6.4_
  
  - [x] 7.3 Write property test for unauthenticated dashboard access
    - **Property 10: Dashboard Route Unauthenticated Redirect**
    - **Validates: Requirements 4.2**
    - Test that requests without session redirect to /auth/login
    - _Requirements: 6.4_
  
  - [x] 7.4 Write property test for invalid token dashboard access
    - **Property 11: Dashboard Route Invalid Token Redirect**
    - **Validates: Requirements 4.3**
    - Test that requests with invalid session redirect to /auth/login
    - _Requirements: 6.5_
  
  - [x] 7.5 Write property test for expired token dashboard access
    - **Property 12: Dashboard Route Expired Token Redirect**
    - **Validates: Requirements 4.4**
    - Test that requests with expired session redirect to /auth/login
    - _Requirements: 6.6_
  
  - [x] 7.6 Write property test for valid token dashboard access
    - **Property 13: Dashboard Route Valid Token Access**
    - **Validates: Requirements 4.6**
    - Test that requests with valid session can access dashboard
    - _Requirements: 6.7_

- [x] 8. Implement audit logging system
  - [x] 8.1 Create audit logging utility functions
    - Implement `createAuditLog()` to insert audit log entries
    - Include event_type, user_id, ip_address, timestamp
    - Make audit logging non-blocking (use .catch())
    - Log audit failures without blocking main flow
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 8.2 Write property test for audit log creation
    - **Property 15: Audit Log Creation on Logout**
    - **Validates: Requirements 7.1**
    - Test that successful logout creates audit log with "LOGOUT" event type
    - _Requirements: 6.9_
  
  - [x] 8.3 Write property test for audit log user identifier
    - **Property 16: Audit Log User Identifier**
    - **Validates: Requirements 7.2**
    - Test that audit log contains user_id
    - _Requirements: 6.9_
  
  - [x] 8.4 Write property test for audit log IP address
    - **Property 17: Audit Log IP Address**
    - **Validates: Requirements 7.3**
    - Test that audit log contains client IP address
    - _Requirements: 6.9_
  
  - [x] 8.5 Write property test for audit log timestamp
    - **Property 18: Audit Log Timestamp**
    - **Validates: Requirements 7.4**
    - Test that audit log contains timestamp
    - _Requirements: 6.9_
  
  - [x] 8.6 Write property test for audit log failure resilience
    - **Property 19: Audit Log Failure Resilience**
    - **Validates: Requirements 7.5**
    - Test that logout completes even if audit logging fails
    - _Requirements: 6.9_

- [x] 9. Checkpoint - Ensure middleware and audit logging work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement error handling and messages
  - [x] 10.1 Add comprehensive error responses to logout route
    - Implement rate limit error message
    - Implement missing session error message
    - Implement invalid session error message
    - Implement generic error message for unexpected errors
    - Add error logging with context but without sensitive data
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 10.2 Write property test for rate limited error message
    - **Property 20: Rate Limited Error Message**
    - **Validates: Requirements 8.1**
    - Test exact error message for rate limited requests
    - _Requirements: 6.1_
  
  - [x] 10.3 Write property test for missing session error message
    - **Property 21: Missing Session Error Message**
    - **Validates: Requirements 8.2**
    - Test exact error message for missing session
    - _Requirements: 6.2_
  
  - [x] 10.4 Write property test for invalid session error message
    - **Property 22: Invalid Session Error Message**
    - **Validates: Requirements 8.3**
    - Test exact error message for invalid session
    - _Requirements: 6.2_
  
  - [x] 10.5 Write property test for generic error message
    - **Property 23: Generic Error Message for Unexpected Errors**
    - **Validates: Requirements 8.4**
    - Test that unexpected errors return generic message
    - _Requirements: 6.2_
  
  - [x] 10.6 Write property test for error logging privacy
    - **Property 24: Error Logging Privacy**
    - **Validates: Requirements 8.5**
    - Test that error logs don't contain sensitive data
    - _Requirements: 6.2_

- [x] 11. Implement session cookie security
  - [x] 11.1 Ensure secure cookie attributes
    - Verify httpOnly=true for all session cookies
    - Verify secure=true in production environment
    - Verify sameSite="strict" for all session cookies
    - Verify path="/" for all session cookies
    - Ensure cleared cookies maintain security attributes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 11.2 Write property test for httpOnly attribute
    - **Property 25: Session Cookie HttpOnly Attribute**
    - **Validates: Requirements 9.1**
    - Test that session cookies have httpOnly=true
    - _Requirements: 6.8_
  
  - [x] 11.3 Write property test for secure attribute in production
    - **Property 26: Session Cookie Secure Attribute in Production**
    - **Validates: Requirements 9.2**
    - Test that session cookies have secure=true in production
    - _Requirements: 6.8_
  
  - [x] 11.4 Write property test for sameSite attribute
    - **Property 27: Session Cookie SameSite Attribute**
    - **Validates: Requirements 9.3**
    - Test that session cookies have sameSite="strict"
    - _Requirements: 6.8_
  
  - [x] 11.5 Write property test for path attribute
    - **Property 28: Session Cookie Path Attribute**
    - **Validates: Requirements 9.4**
    - Test that session cookies have path="/"
    - _Requirements: 6.8_
  
  - [x] 11.6 Write property test for cleared cookie security attributes
    - **Property 29: Cleared Cookie Security Attributes**
    - **Validates: Requirements 9.5**
    - Test that cleared cookies maintain security attributes
    - _Requirements: 6.8_

- [x] 12. Implement middleware execution order validation
  - [x] 12.1 Ensure middleware executes before route handlers
    - Verify middleware configuration in middleware.ts
    - Ensure session validation happens before route handler execution
    - Test that invalid sessions never reach route handlers
    - _Requirements: 10.1, 10.4, 10.5_
  
  - [x] 12.2 Write property test for middleware execution order
    - **Property 30: Middleware Execution Order**
    - **Validates: Requirements 10.1**
    - Test that middleware executes before route handlers
    - _Requirements: 6.10_
  
  - [x] 12.3 Write property test for middleware database query
    - **Property 31: Middleware Database Query**
    - **Validates: Requirements 10.2**
    - Test that middleware queries sessions table
    - _Requirements: 6.10_
  
  - [x] 12.4 Write property test for middleware expiration check
    - **Property 32: Middleware Expiration Check**
    - **Validates: Requirements 10.3**
    - Test that middleware verifies expires_at timestamp
    - _Requirements: 6.10_
  
  - [x] 12.5 Write property test for middleware request blocking
    - **Property 33: Middleware Request Blocking**
    - **Validates: Requirements 10.4**
    - Test that invalid sessions don't reach route handlers
    - _Requirements: 6.10_
  
  - [x] 12.6 Write property test for universal dashboard protection
    - **Property 34: Middleware Universal Dashboard Protection**
    - **Validates: Requirements 10.5**
    - Test that all dashboard routes execute middleware
    - _Requirements: 6.10_

- [x] 13. Checkpoint - Ensure all security features work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement comprehensive security tests
  - [x] 14.1 Write integration tests for complete logout flow
    - Test logout from button click to redirect
    - Test session invalidation end-to-end
    - Test cookie clearing in browser context
    - _Requirements: 6.11_
  
  - [x] 14.2 Write security tests for session hijacking
    - Test that stolen session tokens cannot be reused after logout
    - Test that session tokens cannot be used from different IP addresses
    - Test that expired sessions are rejected
    - _Requirements: 6.12_
  
  - [x] 14.3 Write security tests for token replay attacks
    - Test that logged-out session tokens cannot be replayed
    - Test that CSRF tokens are validated
    - Test that old session tokens are rejected
    - _Requirements: 6.12_
  
  - [x] 14.4 Write security tests for brute force attempts
    - Test that rate limiting blocks brute force logout attempts
    - Test that rate limiting resets after window expires
    - Test that different users have separate rate limits
    - _Requirements: 6.12_
  
  - [x] 14.5 Write security tests for CSRF protection
    - Test that logout requests without CSRF token are rejected
    - Test that logout requests with invalid CSRF token are rejected
    - Test that CSRF tokens are validated correctly
    - _Requirements: 6.8_
  
  - [x] 14.6 Write security tests for SQL injection
    - Test that session queries are parameterized
    - Test that malicious session tokens don't cause SQL injection
    - Test that audit log queries are parameterized
    - _Requirements: 6.12_
  
  - [x] 14.7 Write security tests for XSS attacks
    - Test that error messages are properly escaped
    - Test that audit log data is sanitized
    - Test that user input is validated
    - _Requirements: 6.12_

- [x] 15. Implement code coverage and quality checks
  - [x] 15.1 Verify 90% code coverage for authentication components
    - Run coverage report for all modified files
    - Ensure logout route has >90% coverage
    - Ensure middleware has >90% coverage
    - Ensure session utilities have >90% coverage
    - _Requirements: 6.10_
  
  - [x] 15.2 Run type checking and linting
    - Execute `npm run type-check` to verify TypeScript types
    - Execute `npm run lint` to check code quality
    - Fix any type errors or linting issues
    - _Requirements: 6.10_

- [x] 16. Final integration and testing
  - [x] 16.1 Wire all components together
    - Verify rate limiting works with logout endpoint
    - Verify middleware protects all dashboard routes
    - Verify audit logging captures all logout events
    - Verify error handling works for all scenarios
    - Test complete flow from login to logout to re-login
    - _Requirements: All requirements_
  
  - [x] 16.2 Run complete test suite
    - Execute `npm run test` to run all tests
    - Execute `npm run test:coverage` to verify coverage
    - Execute `npm run build` to ensure production build works
    - _Requirements: 6.10_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate complete workflows
- Security tests validate protection against common attack vectors
- The implementation extends existing authentication infrastructure rather than replacing it
- Rate limiting uses existing in-memory mechanism in proxy.ts for consistency
- Audit logging is non-blocking to ensure logout performance
- All session cookies use secure attributes (httpOnly, secure, sameSite, path)
- Middleware executes before route handlers to enforce authentication consistently
- Error messages are user-friendly while maintaining security (no internal details exposed)
- Database queries use parameterized statements to prevent SQL injection
- TypeScript types are generated from Supabase schema for type safety

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "8.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 5, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6", "10.1"] },
    { "id": 6, "tasks": ["10.2", "10.3", "10.4", "10.5", "10.6", "11.1"] },
    { "id": 7, "tasks": ["11.2", "11.3", "11.4", "11.5", "11.6", "12.1"] },
    { "id": 8, "tasks": ["12.2", "12.3", "12.4", "12.5", "12.6"] },
    { "id": 9, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "14.7"] },
    { "id": 10, "tasks": ["15.1", "15.2", "16.1"] },
    { "id": 11, "tasks": ["16.2"] }
  ]
}
```
