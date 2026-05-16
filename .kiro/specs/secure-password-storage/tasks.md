# Implementation Plan: Secure Password Storage System

## Overview

This implementation plan breaks down the secure password storage feature into discrete, incremental coding tasks. The system integrates Argon2id password hashing with salt and pepper mechanisms, legacy Bcrypt compatibility, rate limiting, CAPTCHA protection, and automated algorithm migration. All tasks build sequentially with clear dependencies to enable parallel execution where possible.

Implementation language: **TypeScript** (as specified in design document)

## Tasks

- [ ] 1. Infrastructure & Database Setup
  - [x] 1.1 Clean Supabase database (delete all users and auth records)
    - Delete all rows from users table
    - Delete all rows from rate_limit_records table
    - Delete all rows from audit_logs table
    - Verify database is empty before proceeding
    - _Requirements: 21.1, 21.2, 21.3_

  - [x] 1.2 Create database schema (users, rate_limit_records, audit_logs)
    - Create users table with id, email, password_hash, created_at, updated_at fields
    - Create rate_limit_records table for tracking failed attempts
    - Create audit_logs table for security events
    - Add appropriate indexes for fast lookups
    - _Requirements: 16.8, 16.9_

  - [x] 1.3 Set up docker-compose.yml with environment variables
    - Create docker-compose configuration for local development
    - Include Supabase service configuration
    - Set ARGON2_MEMORY_COST, ARGON2_TIME_COST, ARGON2_PARALLELISM environment variables
    - Set PEPPER_SECRET, CAPTCHA_PROVIDER, CAPTCHA_SECRET_KEY variables
    - Set SUPABASE_URL, SUPABASE_SERVICE_KEY
    - _Requirements: 16.1, 16.3_

  - [x] 1.4 Configure Vercel environment variables
    - Create environment configuration in Vercel project settings
    - Use identical values as docker-compose for parity
    - Ensure PEPPER_SECRET is set securely
    - Verify all required variables are present
    - _Requirements: 16.4, 16.6_

  - [~] 1.5 Test environment parity (Docker vs Vercel behavior)
    - Run test suite in both Docker and Vercel environments
    - Verify identical security levels and behavior
    - Test database connection from both environments
    - Confirm environment variable loading works correctly
    - _Requirements: 16.2, 16.5, 16.16_

- [x] 2. Core Password Hashing Engine
  - [x] 2.1 Implement Configuration Manager and validation
    - Create Configuration_Manager class to load and validate Argon2id parameters
    - Load ARGON2_MEMORY_COST, ARGON2_TIME_COST, ARGON2_PARALLELISM from environment
    - Validate memory (16-256), iterations (2-10), parallelism (1-4)
    - Implement fail-secure behavior: throw error if pepper missing
    - Load pepper once at startup and cache in memory
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 3.2, 3.3_

  - [ ]* 2.2 Write unit tests for Configuration Manager
    - Test valid configuration loading
    - Test invalid parameter rejection
    - Test fail-secure on missing pepper
    - Test default values applied correctly
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 2.3 Implement salt generation (cryptographically secure, automatic)
    - Use argon2-lib for automatic salt generation
    - Verify salt has minimum 128-bit entropy
    - Ensure salt is automatically included in hash output
    - Never allow manual salt specification in public API
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.4 Implement Argon2id password hashing function
    - Create hash function that uses Argon2id with configured parameters
    - Apply pepper to password before hashing
    - Use tuned parameters for Vercel Free (memory=64, iterations=3, parallelism=2)
    - Ensure hashing completes within 5 seconds
    - Return hash with algorithm metadata
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 15.1_

  - [ ]* 2.5 Write property test for unique hashes
    - **Property 1: Unique Hashes - Identical passwords produce different hashes**
    - **Validates: Requirement 2.1**
    - Generate 100+ identical passwords, verify all hashes differ due to unique salt
    - Run with minimum 100 iterations
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.6 Write unit tests for Argon2id hashing
    - Test hash generation completes within time limit
    - Test salt is included in output
    - Test different passwords produce different hashes
    - Test same password produces different hash on retry
    - _Requirements: 1.1, 1.5, 1.6, 2.1_

- [ ] 3. Password Validation & Algorithm Detection
  - [x] 3.1 Implement hash algorithm detection (Argon2id vs Bcrypt)
    - Create detectHashAlgorithm function
    - Detect Argon2id format ($ prefix)
    - Detect Bcrypt format ($2a, $2b, $2y, $2x prefix)
    - Return 'unknown' for unrecognized formats
    - Log malformed hashes as errors
    - _Requirements: 5.1, 5.2, 6.4, 8.4, 8.5_

  - [~] 3.2 Implement constant-time comparison for validation
    - Use argon2-lib and bcryptjs built-in constant-time functions
    - Add response time normalization to prevent timing attacks
    - Ensure validation time is consistent regardless of password/hash difference
    - Target response time variance < 10ms on same infrastructure
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [~] 3.3 Implement password validation function (pepper + hash comparison)
    - Create validatePassword function accepting plaintext and stored hash
    - Append pepper to plaintext password before validation
    - Detect algorithm and use appropriate validation method
    - Return validation result with algorithm type
    - Implement error handling without revealing algorithm
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 3.4 Write property test for pepper application
    - **Property 2: Pepper Application - Pepper consistently applied before validation**
    - **Validates: Requirement 3.1**
    - Test that passwords validate correctly with proper pepper
    - Test that passwords fail without correct pepper
    - Test with 50+ password/pepper combinations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.5 Write unit tests for password validation
    - Test Argon2id validation with correct password
    - Test Argon2id validation with incorrect password
    - Test validation returns algorithm type
    - Test error messages don't reveal algorithm
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 8.1, 8.2, 8.3_

- [ ] 4. Legacy Bcrypt Support & Migration
  - [x] 4.1 Implement Bcrypt detection and validation
    - Create validateBcrypt function using bcryptjs library
    - Detect Bcrypt hash format correctly
    - Use constant-time comparison (built-in to bcryptjs)
    - Return validation result with algorithm type
    - _Requirements: 5.1, 5.2, 10.2_

  - [~] 4.2 Implement automatic algorithm migration trigger
    - Create migrationRequired flag when Bcrypt detected in successful validation
    - Trigger async password rehashing with Argon2id
    - Update database with new Argon2id hash
    - Continue accepting Bcrypt hashes indefinitely (no deadline)
    - _Requirements: 5.3, 11.1, 11.2, 11.3, 11.4_

  - [~] 4.3 Implement audit logging for algorithm migrations
    - Create audit log entry when migration occurs
    - Record old algorithm (Bcrypt) and new algorithm (Argon2id)
    - Include timestamp and user identifier
    - Ensure logs don't contain sensitive data
    - _Requirements: 5.4, 11.5, 14.3, 14.5, 14.6_

  - [ ]* 4.4 Write property test for algorithm migration
    - **Property 3: Algorithm Migration - Bcrypt automatically upgraded on successful login**
    - **Validates: Requirement 11.1**
    - Test that successful Bcrypt validation triggers migration
    - Test that new hash is Argon2id format
    - Test migration doesn't affect authentication success
    - _Requirements: 5.3, 5.4, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 4.5 Write unit tests for Bcrypt validation and migration
    - Test Bcrypt detection works correctly
    - Test Bcrypt password validation
    - Test migration to Argon2id on success
    - Test audit log creation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 11.1_

- [ ] 5. Rate Limiting Implementation
  - [x] 5.1 Create rate_limit_records table schema
    - Create table with id, email, failed_attempts, last_attempt, locked_until fields
    - Add indexes on email and locked_until for fast lookups
    - Ensure schema supports efficient queries
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 5.2 Implement rate limiter service with Supabase backing
    - Create RateLimiter class using Supabase table storage
    - Implement checkAndUpdateRateLimit function
    - Implement recordFailure function
    - Implement recordSuccess function to reset counter
    - Use Supabase for persistent state (not in-memory)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 15.4_

  - [~] 5.3 Implement automatic account unlock after 15 minutes
    - Check locked_until timestamp on rate limit check
    - Automatically unlock when 15 minutes have passed
    - Reset failure counter on unlock
    - _Requirements: 7.4, 7.5_

  - [~] 5.4 Implement rate limit check in login endpoint
    - Check rate limits before validating credentials
    - Return 429 Too Many Requests if locked
    - Record failures and successes appropriately
    - _Requirements: 7.1, 7.2, 7.3, 7.7_

  - [~] 5.5 Implement rate limit reset on successful authentication
    - Reset failure counter to 0 on successful login
    - Clear locked_until timestamp
    - Record success in audit logs
    - _Requirements: 7.5, 14.6_

  - [ ]* 5.6 Write property test for rate limiting
    - **Property 5: Rate Limiting - After 5 failures in 15 minutes, requests rejected with 429**
    - **Validates: Requirement 7.1**
    - Test that 5 failed attempts trigger lockout
    - Test that 429 status is returned when locked
    - Test that lockout expires after 15 minutes
    - Test that successful login resets counter
    - Run with minimum 50 iterations of failure scenarios
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 5.7 Write unit tests for rate limiting
    - Test rate limit record creation
    - Test failure counter increment
    - Test lockout after 5 failures
    - Test automatic unlock after 15 minutes
    - Test success resets counter
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 6. CAPTCHA Integration
  - [-] 6.1 Integrate Cloudflare Turnstile frontend widget
    - Create React component for CAPTCHA widget
    - Load Cloudflare Turnstile script
    - Render widget on registration and login forms
    - Extract CAPTCHA token and include in requests
    - _Requirements: 20.1, 20.2, 20.8, 20.9_

  - [~] 6.2 Implement backend CAPTCHA token verification
    - Create verifyCAPTCHA function
    - Verify tokens with Cloudflare API
    - Check token expiration (5 minute window)
    - Return success/failure
    - _Requirements: 20.3, 20.6, 20.7, 20.11_

  - [~] 6.3 Implement CAPTCHA error handling and generic responses
    - Return 400 Bad Request for invalid/missing tokens
    - Don't reveal whether user exists or password is correct
    - Log CAPTCHA failures without sensitive data
    - _Requirements: 20.3, 20.4, 20.11_

  - [~] 6.4 Implement CAPTCHA graceful degradation
    - If CAPTCHA service unavailable, log warning
    - Optionally allow degraded mode with enhanced rate limiting
    - Continue authentication with fallback behavior
    - _Requirements: 20.10, 20.12_

  - [ ]* 6.5 Write unit tests for CAPTCHA validation
    - Test valid token verification
    - Test invalid token rejection
    - Test token expiration
    - Test missing token handling
    - Test generic error messages
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.6, 20.7_

- [ ] 7. Input Validation & Error Handling
  - [-] 7.1 Implement password input validation
    - Validate input is string type
    - Validate length between 8 and 128 characters
    - Reject null bytes and control characters
    - Return validation errors with generic messages
    - _Requirements: 8.1, 8.2, 8.3, 8.7_

  - [-] 7.2 Implement hash format validation
    - Validate hash is in expected algorithm format
    - Detect malformed hashes
    - Log malformed attempts without exposing details
    - Return generic error messages
    - _Requirements: 8.4, 8.5, 8.8_

  - [-] 7.3 Implement user identifier sanitization
    - Sanitize email/username to prevent injection attacks
    - Reject suspicious input patterns
    - _Requirements: 8.6_

  - [~] 7.4 Implement generic error messages (no user enumeration)
    - Same error for missing user vs wrong password
    - Same error for rate limited vs locked
    - Don't indicate algorithm type in errors
    - _Requirements: 9.6, 14.1, 14.7_

  - [ ]* 7.5 Write unit tests for input validation and error handling
    - Test password length validation
    - Test null byte rejection
    - Test generic error messages
    - Test hash format validation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ] 8. Authentication Service Integration
  - [~] 8.1 Create Authentication Service main controller
    - Orchestrate CAPTCHA validation, rate limiting, password validation
    - Coordinate between Rate_Limiter, Password_Validator, Configuration_Manager
    - Implement login and registration flows
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [~] 8.2 Implement login endpoint (POST /api/auth/login)
    - Accept email, password, captchaToken
    - Check CAPTCHA first (before revealing user status)
    - Check rate limits
    - Validate credentials
    - Handle algorithm migration if needed
    - Return authentication token or error
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 6.7, 11.1, 15.3_

  - [~] 8.3 Implement registration endpoint (POST /api/auth/register)
    - Accept email, password, captchaToken
    - Validate CAPTCHA first
    - Validate input (length, format)
    - Hash password with Argon2id (never Bcrypt)
    - Store user with new hash
    - Return success or error (generic messages)
    - _Requirements: 1.1, 5.5, 6.1, 8.1, 8.2, 8.3_

  - [~] 8.4 Implement response time normalization for timing attack prevention
    - Normalize response times for both success and failure paths
    - Target consistent response time across scenarios
    - _Requirements: 10.4, 10.5_

  - [ ]* 8.5 Write integration tests for authentication flows
    - Test complete registration flow with CAPTCHA
    - Test complete login flow with CAPTCHA
    - Test rate limiting triggers on multiple failures
    - Test Bcrypt migration on successful login
    - Test generic error messages throughout
    - _Requirements: 1.1, 5.1, 6.1, 6.4, 11.1_

- [ ] 9. Audit Logging and Security Monitoring
  - [x] 9.1 Create audit_logs table schema
    - Create table with id, event_type, email, user_id, timestamp fields
    - Add fields for attempt_count, old_algorithm, new_algorithm
    - Add JSONB details field for flexible logging
    - Add indexes on email, timestamp, event_type
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [~] 9.2 Implement authentication failure logging
    - Log failed login attempts with timestamp and user
    - Log rate limit triggers with attempt count
    - Include generic failure reason (no password details)
    - _Requirements: 14.1, 14.2, 14.5_

  - [~] 9.3 Implement password migration audit logging
    - Log algorithm migration events
    - Record old and new algorithms
    - Include user identifier and timestamp
    - _Requirements: 5.4, 11.5, 14.3_

  - [~] 9.4 Implement configuration and parameter logging
    - Log Argon2id parameters on startup
    - Log pepper presence (not value)
    - Exclude sensitive data from logs
    - _Requirements: 14.3, 14.5_

  - [ ]* 9.5 Write unit tests for audit logging
    - Test failure events are logged
    - Test migration events are logged
    - Test sensitive data is excluded
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 10. Security Testing & Validation
  - [~] 10.1 Test Argon2id memory-hardness
    - Verify hashing fails or completes slowly under memory constraints
    - Confirm GPU/ASIC resistance through configuration
    - _Requirements: 1.1, 9.2, 9.3_

  - [~] 10.2 Test salt uniqueness (identical passwords → different hashes)
    - Generate 100+ identical passwords
    - Verify all hashes differ
    - Confirm rainbow table resistance
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [~] 10.3 Test pepper application validation
    - Test correct pepper allows validation
    - Test incorrect pepper denies access
    - Test pepper is required (fail-secure without it)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [~] 10.4 Test rate limiting (5 failures → 429)
    - Perform 5 sequential failures
    - Verify 429 status on 5th attempt
    - Verify automatic unlock after 15 minutes
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [~] 10.5 Test timing attack prevention (constant-time comparison)
    - Measure response times for success and failure
    - Verify variance < 10ms per attempt
    - Confirm timing doesn't reveal password/hash differences
    - _Requirements: 10.1, 10.2, 10.3_

  - [~] 10.6 Test generic error messages (no algorithm revelation)
    - Verify errors don't indicate Argon2id vs Bcrypt
    - Verify errors don't reveal user existence
    - Verify errors don't reveal password validity
    - _Requirements: 6.6, 9.1, 9.2, 9.3_

  - [~] 10.7 Test CAPTCHA bypass attempts (rejected)
    - Test missing CAPTCHA token rejected with 400
    - Test invalid token rejected with 400
    - Test expired token rejected
    - Verify no credentials revealed in CAPTCHA errors
    - _Requirements: 20.1, 20.3, 20.4, 20.5_

  - [~] 10.8 Test performance on Vercel (hash generation < 3 seconds)
    - Deploy to Vercel Free
    - Measure hash generation time
    - Confirm < 3 seconds on average
    - Verify no timeout errors occur
    - _Requirements: 15.1, 15.2, 15.3_

  - [~] 10.9 Test password validation against Bcrypt (legacy support)
    - Test validation of existing Bcrypt hashes
    - Verify constant-time comparison works
    - Confirm algorithm detection works correctly
    - _Requirements: 5.1, 5.2, 10.2_

  - [~] 10.10 Test algorithm migration after successful Bcrypt login
    - Login with Bcrypt password
    - Verify migration to Argon2id occurs
    - Confirm next login uses new hash
    - Verify audit log documents migration
    - _Requirements: 5.3, 5.4, 11.1, 11.5_

- [ ] 11. Configuration & Deployment Testing
  - [~] 11.1 Test configuration loading and validation
    - Test Docker environment variable loading
    - Test Vercel environment variable loading
    - Test fail-secure on missing pepper
    - Test invalid parameters rejected
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 3.2, 3.3_

  - [~] 11.2 Test environment parity (Docker vs Vercel behavior)
    - Run identical test suite in both environments
    - Verify same security levels and behavior
    - Confirm database operations identical
    - _Requirements: 16.2, 16.5_

  - [~] 11.3 Test Vercel Free Plan compatibility
    - Verify hash generation completes within 10 second timeout
    - Confirm memory usage within 1GB limit
    - Test serverless function cold start performance
    - _Requirements: 15.1, 15.2, 15.3_

- [ ] 12. Documentation & Cleanup
  - [~] 12.1 Document Argon2id parameters and security tradeoffs
    - Explain memory cost, iterations, parallelism settings
    - Document why values are tuned for Vercel
    - Include security vs performance tradeoff reasoning
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [~] 12.2 Document pepper configuration and rotation
    - Explain pepper requirement (minimum 32 characters)
    - Document how to set in Docker and Vercel
    - Explain pepper rotation process
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 13.1, 13.2, 13.3, 13.4_

  - [~] 12.3 Document CAPTCHA setup (Cloudflare Turnstile)
    - Explain Turnstile vs reCAPTCHA options
    - Document setup steps for both providers
    - Include frontend and backend integration points
    - _Requirements: 20.1, 20.2, 20.5, 20.6, 20.7, 20.8_

  - [~] 12.4 Document rate limiting strategy
    - Explain 5 failures in 15 minutes rule
    - Document automatic unlock process
    - Include troubleshooting for locked accounts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [~] 12.5 Document local development setup (Docker)
    - Step-by-step docker-compose setup
    - Environment variable configuration
    - Database initialization and testing
    - _Requirements: 16.1, 16.3_

  - [~] 12.6 Document production deployment (Vercel)
    - Step-by-step Vercel deployment
    - Environment variables in Vercel dashboard
    - Database connection and testing
    - _Requirements: 16.4, 16.6_

  - [~] 12.7 Create troubleshooting guide
    - Common issues and solutions
    - Configuration validation checklist
    - Performance troubleshooting
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [~] 12.8 Set up database cleanup utilities
    - Implement deleteAllUsers() function
    - Implement deleteAllAuthRecords() function
    - Implement resetDatabase() function with confirmation
    - Document cleanup process and risks
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8_

- [~] 13. Checkpoint - Verify All Core Components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Final Deployment & Verification
  - [~] 14.1 Deploy to production (Vercel)
    - Push code to production branch
    - Deploy via Vercel dashboard
    - Verify all environment variables are set
    - Confirm database connectivity
    - _Requirements: 16.4, 16.5_

  - [~] 14.2 Verify production authentication flow end-to-end
    - Test registration with CAPTCHA
    - Test login with CAPTCHA
    - Test rate limiting
    - Test Bcrypt migration if needed
    - Verify audit logs are recording events
    - _Requirements: 1.1, 6.1, 7.1, 11.1, 14.1, 14.2_

- [~] 15. Final Checkpoint - All Tests Passing
  - Ensure all security tests pass, all integration tests pass, and the system is production-ready.

## Notes

- All property-based tests use minimum 50-100 iterations to catch edge cases
- Optional test tasks (marked with `*`) can be skipped for faster MVP, but strongly recommended for security-critical code
- Each task references specific requirements for full traceability
- Tasks are designed for incremental verification at each step
- Checkpoints ensure the system remains in a valid state throughout implementation
- Response time normalization ensures timing attacks cannot reveal password information
- All environments (Docker, Vercel) must use identical configuration values
- Database cleanup utility is essential before fresh deployments
- Pepper must be rotated independently from code deployments

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "2.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "4.1", "5.2", "6.1", "7.1", "7.2", "7.3", "9.1"] },
    { "id": 3, "tasks": ["2.5", "2.6", "3.2", "3.3", "3.4", "3.5", "4.2", "4.3", "4.4", "4.5", "5.3", "5.4", "5.5", "6.2", "6.3", "6.4", "6.5", "7.4", "7.5", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 4, "tasks": ["5.6", "5.7", "8.1", "8.2", "8.3", "8.4", "10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9", "10.10", "11.1", "11.2", "11.3"] },
    { "id": 5, "tasks": ["8.5", "12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "12.8"] },
    { "id": 6, "tasks": ["14.1", "14.2"] }
  ]
}
```
