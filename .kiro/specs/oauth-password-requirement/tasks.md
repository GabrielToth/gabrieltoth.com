# Implementation Plan: OAuth Password Requirement

## Overview

This implementation extends the OAuth authentication system to require all users (including OAuth users) to have a password. The implementation follows a phased approach: database migration, backend API endpoints, OAuth token validation, password creation UI, integration with existing auth, and comprehensive testing.

## Tasks

- [x] 1. Database Migration - Phase 1 (Add New Columns)
  - [x] 1.1 Create migration file to add new nullable columns
    - Add `email VARCHAR(255)` nullable
    - Add `password_hash VARCHAR(255)` nullable
    - Add `oauth_provider VARCHAR(50)` nullable with CHECK constraint
    - Add `oauth_id VARCHAR(255)` nullable
    - Add `name VARCHAR(255)` nullable
    - Add `email_verified BOOLEAN DEFAULT FALSE`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 1.2 Create migration to populate existing user data
    - Populate `email` from `google_email` for existing users
    - Populate `name` from `google_name` for existing users
    - Populate `oauth_provider = 'google'` and `oauth_id` from `google_id`
    - _Requirements: 1.3, 1.4_
  
  - [x] 1.3 Create indexes for new columns
    - Create unique index on `email`
    - Create index on `oauth_provider`
    - Create unique partial index on `oauth_id` WHERE `oauth_id IS NOT NULL`
    - _Requirements: 6.5, 6.6, 6.7_

- [ ] 2. Implement OAuth Token Validator
  - [x] 2.1 Create OAuth token validator module (`src/lib/auth/oauth-validator.ts`)
    - Implement `validateOAuthToken` function
    - Validate token signature using provider's public keys
    - Verify token expiration (exp claim)
    - Verify token audience matches client ID (aud claim)
    - Verify token issuer matches provider (iss claim)
    - Extract and return user information
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 2.2 Write property test for OAuth token validation
    - **Property 7: OAuth Token Validation Completeness**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
  
  - [x] 2.3 Write unit tests for OAuth token validator
    - Test valid token acceptance
    - Test expired token rejection
    - Test invalid signature rejection
    - Test audience mismatch rejection
    - Test issuer mismatch rejection
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 3. Implement Password Validation and Hashing
  - [x] 3.1 Extend password validator in `src/lib/validation.ts`
    - Implement `validatePassword` function with detailed requirements checking
    - Check minimum 8 characters
    - Check uppercase, lowercase, number, special character
    - Check against common password list
    - Return detailed feedback for UI
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 10.2, 10.3, 10.4_
  
  - [x] 3.2 Write property test for password validation
    - **Property 1: Password Validation Completeness**
    - **Validates: Requirements 2.3, 3.4, 7.1, 7.2, 7.3, 7.4, 7.5, 10.4**
  
  - [x] 3.3 Verify password hashing module exists (`src/lib/auth/password-hashing.ts`)
    - Confirm `hashPassword` uses bcrypt with 12 salt rounds
    - Confirm `comparePassword` function exists
    - _Requirements: 2.4, 3.5, 7.6_
  
  - [x] 3.4 Write property test for password hashing
    - **Property 2: Password Hashing Consistency**
    - **Validates: Requirements 2.4, 3.5, 7.6**
  
  - [-] 3.5 Write property test for password comparison
    - **Property 6: Password Comparison Correctness**
    - **Validates: Requirements 4.2**

- [ ] 4. Implement Temporary Token Manager
  - [~] 4.1 Create temporary token manager (`src/lib/auth/temp-token.ts`)
    - Implement `generateTempToken` function using JWT with HS256
    - Implement `validateTempToken` function
    - Set token expiration to 15 minutes
    - Include OAuth user data in payload (email, oauth_provider, oauth_id, name, picture)
    - _Requirements: 2.2_
  
  - [~] 4.2 Write unit tests for temporary token manager
    - Test token generation and validation
    - Test token expiration
    - Test invalid token rejection
    - _Requirements: 2.2_

- [ ] 5. Extend User Manager
  - [~] 5.1 Extend user manager in `src/lib/auth/user.ts`
    - Implement `createOAuthUser` function
    - Implement `updateUserPassword` function
    - Implement `getUserByEmail` function
    - Implement `getUserByOAuthId` function
    - _Requirements: 2.5, 3.6, 11.3_
  
  - [~] 5.2 Write property test for user data persistence
    - **Property 3: User Data Persistence**
    - **Validates: Requirements 2.5, 3.6**
  
  - [~] 5.3 Write unit tests for user manager
    - Test user creation with all fields
    - Test user retrieval by email
    - Test user retrieval by OAuth ID
    - Test password update
    - _Requirements: 2.5, 3.6, 11.3_

- [~] 6. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement OAuth Callback Handler
  - [~] 7.1 Create OAuth callback API route (`src/app/api/auth/oauth/callback/route.ts`)
    - Handle GET/POST requests with code and provider parameters
    - Exchange authorization code for OAuth token
    - Validate OAuth token using token validator
    - Extract user information (email, name, picture, OAuth ID)
    - Check if user exists in database by OAuth ID
    - For new users: generate temporary token and return `requiresPassword: true`
    - For existing users with password: create session and return redirect URL
    - For existing users without password: return `requiresPassword: true` with userId
    - Log authentication attempts
    - _Requirements: 2.1, 2.2, 11.1_
  
  - [~] 7.2 Write unit tests for OAuth callback handler
    - Test new user flow (returns requiresPassword)
    - Test existing user with password flow (creates session)
    - Test existing user without password flow (migration)
    - Test invalid OAuth code
    - Test OAuth provider errors
    - _Requirements: 2.1, 2.2, 11.1_

- [ ] 8. Implement OAuth Completion Handler
  - [~] 8.1 Create OAuth completion API route (`src/app/api/auth/oauth/complete/route.ts`)
    - Handle POST requests with tempToken and password
    - Validate temporary token (expiration, signature)
    - Validate password using password validator
    - Hash password using bcrypt
    - Create user record with email, oauth_id, oauth_provider, password_hash
    - Create session
    - Log successful registration
    - Clean up temporary token
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [~] 8.2 Write property test for registration completeness
    - **Property 4: Registration Completeness Enforcement**
    - **Validates: Requirements 1.5, 2.6, 3.7**
  
  - [~] 8.3 Write unit tests for OAuth completion handler
    - Test successful user creation
    - Test invalid temporary token
    - Test expired temporary token
    - Test weak password rejection
    - Test missing required fields
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 9. Implement OAuth Add Password Handler (Migration)
  - [~] 9.1 Create OAuth add password API route (`src/app/api/auth/oauth/add-password/route.ts`)
    - Handle POST requests with userId and password
    - Validate user exists and has no password
    - Validate password using password validator
    - Hash password using bcrypt
    - Update user record with password_hash
    - Create session
    - Log password addition
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [~] 9.2 Write unit tests for OAuth add password handler
    - Test successful password addition
    - Test user not found
    - Test user already has password
    - Test weak password rejection
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [~] 10. Checkpoint - Backend APIs complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Password Creation UI Component
  - [~] 11.1 Create password creation form component (`src/components/auth/PasswordCreationForm.tsx`)
    - Create form with password and confirm password fields
    - Display explanation message (why password is required)
    - Implement real-time password strength indicator
    - Display requirements checklist with visual feedback
    - Display specific error messages for unmet requirements
    - Implement password visibility toggle
    - Handle form submission
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [~] 11.2 Write unit tests for password creation form
    - Test explanation message display
    - Test real-time strength feedback
    - Test requirements checklist updates
    - Test error message display
    - Test password visibility toggle
    - Test form submission
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Implement OAuth Registration Pages
  - [~] 12.1 Create OAuth callback page that handles redirect from provider
    - Call OAuth callback API endpoint
    - Handle `requiresPassword: true` response
    - Redirect to password creation page with temporary token
    - Handle complete user flow (redirect to dashboard)
    - _Requirements: 2.2, 11.1_
  
  - [~] 12.2 Create password creation page for new OAuth users
    - Display PasswordCreationForm component
    - Call OAuth completion API endpoint on submit
    - Handle success (redirect to dashboard)
    - Handle errors (display error messages)
    - _Requirements: 2.2, 2.6, 10.5_
  
  - [~] 12.3 Create password creation page for existing OAuth users (migration)
    - Display PasswordCreationForm component with migration message
    - Call OAuth add password API endpoint on submit
    - Handle success (redirect to originally requested page)
    - Handle errors (display error messages)
    - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [ ] 13. Integrate with Existing Authentication System
  - [~] 13.1 Update email/password login to support OAuth users
    - Modify login handler to accept OAuth-provided emails
    - Use existing password comparison logic
    - Create session with identical structure for both auth methods
    - Log authentication method in audit logs
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_
  
  - [~] 13.2 Write property test for authentication method equivalence
    - **Property 5: Authentication Method Equivalence**
    - **Validates: Requirements 4.4, 5.4**
  
  - [~] 13.3 Write integration tests for dual authentication
    - Test OAuth user can login via OAuth
    - Test OAuth user can login via email/password
    - Test session structure is identical
    - Test audit logs record authentication method
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 14. Implement Email Verification for OAuth Users
  - [~] 14.1 Extend email verification system
    - Mark Google OAuth emails as verified automatically
    - Send verification email for Facebook/TikTok recovery emails
    - Generate unique verification token with 24-hour expiration
    - Implement verification link handler
    - Require email verification for email/password login
    - Allow OAuth login regardless of verification status
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [~] 14.2 Write property test for email verification token
    - **Property 8: Email Verification Token Uniqueness and Expiration**
    - **Validates: Requirements 9.3**
  
  - [~] 14.3 Write unit tests for email verification
    - Test Google OAuth auto-verification
    - Test verification email sending
    - Test token generation and validation
    - Test verification link handling
    - Test login requirements based on verification status
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 15. Implement OAuth Response Parser
  - [~] 15.1 Create OAuth response parser module
    - Implement parser for Google OAuth responses
    - Implement parser for Facebook OAuth responses
    - Implement parser for TikTok OAuth responses
    - Handle missing optional fields gracefully (name, picture)
    - Validate required fields are present (sub/id, email for Google)
    - Implement pretty printer for logging
    - Return descriptive errors for invalid JSON
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_
  
  - [~] 15.2 Write property test for OAuth parsing graceful degradation
    - **Property 9: OAuth Response Parsing Graceful Degradation**
    - **Validates: Requirements 12.2**
  
  - [~] 15.3 Write property test for OAuth parsing required field validation
    - **Property 10: OAuth Response Parsing Required Field Validation**
    - **Validates: Requirements 12.3**
  
  - [~] 15.4 Write property test for OAuth data round-trip preservation
    - **Property 11: OAuth Data Round-Trip Preservation**
    - **Validates: Requirements 12.5**
  
  - [~] 15.5 Write property test for OAuth parser error handling
    - **Property 12: OAuth Parser Error Handling**
    - **Validates: Requirements 12.6**
  
  - [~] 15.6 Write unit tests for OAuth response parser
    - Test parsing valid responses from each provider
    - Test handling missing optional fields
    - Test rejecting missing required fields
    - Test round-trip preservation
    - Test error handling for invalid JSON
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [~] 16. Checkpoint - Core implementation complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Database Migration - Phase 2 (Enforce Constraints)
  - [~] 17.1 Create migration to enforce NOT NULL constraints
    - Add NOT NULL constraint to `email` column
    - Add NOT NULL constraint to `password_hash` column
    - Add NOT NULL constraint to `name` column
    - **Note**: Only run after all users have passwords
    - _Requirements: 1.1, 1.2, 6.1, 6.2_
  
  - [~] 17.2 Create migration to drop old Google-specific columns
    - Drop `google_id` column
    - Drop `google_email` column
    - Drop `google_name` column
    - Drop `google_picture` column
    - Drop old indexes on Google columns
    - **Note**: Only run after Phase 2 deployment is stable
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 18. Update API Documentation
  - [~] 18.1 Document new OAuth endpoints in `docs/API_AUTH.md`
    - Document `/api/auth/oauth/callback` endpoint
    - Document `/api/auth/oauth/complete` endpoint
    - Document `/api/auth/oauth/add-password` endpoint
    - Include request/response schemas
    - Include error codes and messages
    - Include example requests and responses
    - _Requirements: All_
  
  - [~] 18.2 Update authentication flow diagrams
    - Add OAuth registration flow diagram
    - Add migration flow diagram
    - Add dual authentication flow diagram
    - _Requirements: All_

- [ ] 19. Integration Testing - End-to-End Flows
  - [~] 19.1 Write integration test for Google OAuth registration
    - Test complete flow from OAuth button to dashboard
    - Verify user created with all fields
    - Verify session created
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [~] 19.2 Write integration test for Facebook OAuth registration
    - Test complete flow including email input
    - Verify user created with recovery email
    - Verify verification email sent
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [~] 19.3 Write integration test for OAuth user email/password login
    - Create user via OAuth
    - Login with email/password
    - Verify session structure matches OAuth login
    - Verify audit log records authentication method
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [~] 19.4 Write integration test for existing user migration
    - Create user via OAuth without password (simulate old data)
    - Login via OAuth
    - Verify redirect to password creation
    - Complete password creation
    - Verify redirect to originally requested page
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [~] 20. Final Checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify database migrations work (up and down)
  - Verify all OAuth providers work correctly
  - Verify migration flow works for existing users
  - Verify dual authentication works
  - Verify email verification works

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples, edge cases, and UI behavior
- Integration tests validate end-to-end flows across multiple components
- Database migration is split into 3 phases for safety:
  - Phase 1: Add columns (non-breaking, reversible)
  - Phase 2: Deploy application changes
  - Phase 3: Enforce constraints (only after all users have passwords)
- The implementation uses TypeScript throughout
- All password operations use bcrypt with 12 salt rounds
- OAuth tokens are validated against provider specifications
- Temporary tokens use JWT with 15-minute expiration
- Email verification tokens have 24-hour expiration
