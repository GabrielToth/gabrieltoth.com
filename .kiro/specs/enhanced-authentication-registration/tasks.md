# Implementation Plan: Enhanced Authentication Registration

## Overview

This implementation plan breaks down the enhanced authentication registration feature into discrete, actionable coding tasks. The feature implements a multi-step registration flow with email verification, password setup, personal data collection, and verification review before account creation. Tasks are organized into 6 phases: Foundation & Setup, Backend API Implementation, Frontend Components, Integration & State Management, Testing & Quality, and Documentation & Deployment.

Each task builds incrementally on previous tasks, with no orphaned code. Property-based tests are included as optional sub-tasks to validate universal correctness properties defined in the design document.

## Phase 1: Foundation & Setup

- [x] 1.1 Set up database schema and migrations
  - Create `users` table with email, hashed_password, name, phone, email_verified fields
  - Create `email_verification_tokens` table with token, user_id, expires_at fields
  - Create `registration_sessions` table for session persistence
  - Add indexes on email, token, and session_id columns
  - _Requirements: 6.5, 16.1, 17.1_

- [x] 1.2 Create validation utility functions for email format
  - Implement RFC 5322 email format validation function
  - Export validation function for use in components and API routes
  - _Requirements: 2.3, 9.1_

- [x] 1.3 Write property test for email format validation
  - **Property 1: Email Format Validation**
  - **Validates: Requirements 2.3, 9.1**

- [x] 1.4 Create validation utility functions for password requirements
  - Implement password validation function (8+ chars, uppercase, number, special char)
  - Implement password strength calculation (Weak/Fair/Good/Strong)
  - Export both functions for use in components and API routes
  - _Requirements: 3.4, 3.6, 8.1_

- [x] 1.5 Write property tests for password validation
  - **Property 3: Password Requirements Validation**
  - **Validates: Requirements 3.4, 8.1**
  - **Property 4: Password Strength Calculation**
  - **Validates: Requirements 3.6**

- [x] 1.6 Create validation utility functions for phone numbers
  - Implement international phone format validation using libphonenumber-js
  - Implement phone number normalization to E.164 format
  - Export both functions for use in components and API routes
  - _Requirements: 4.7, 10.1, 10.4_

- [x] 1.7 Write property tests for phone validation
  - **Property 6: Phone Format Validation**
  - **Validates: Requirements 4.7, 10.1**
  - **Property 7: Phone Number Normalization**
  - **Validates: Requirements 10.4**

- [x] 1.8 Create validation utility functions for personal names
  - Implement name validation (not empty, min 2 chars, allowed characters)
  - Implement name rejection for numbers/special chars only
  - Export both functions for use in components and API routes
  - _Requirements: 4.3, 11.1, 11.2, 11.3, 11.4_

- [x] 1.9 Write property tests for name validation
  - **Property 8: Name Validation**
  - **Validates: Requirements 4.3, 11.1, 11.2, 11.3**
  - **Property 9: Name Rejection for Invalid Characters**
  - **Validates: Requirements 11.4**

- [x] 1.10 Set up environment variables and configuration
  - Create `.env.local.example` with all required variables (API_URL, DATABASE_URL, SMTP_*, BCRYPT_COST_FACTOR, SESSION_TIMEOUT, VERIFICATION_TOKEN_EXPIRY)
  - Document environment variables in README
  - Ensure configuration works for both cloud and local versions
  - _Requirements: 17.3, 17.4, 17.5_

- [x] 1.11 Set up error handling and logging utilities
  - Create error handler middleware for API routes
  - Create logging utility for audit events (account creation, email verification, failed attempts)
  - Ensure passwords are never logged
  - _Requirements: 6.9, 15.1, 23.1, 23.5_

- [x] 1.12 Set up session management utilities
  - Create session storage utility using HTTP-only cookies
  - Implement session expiration (30 minutes)
  - Implement session validation and retrieval
  - _Requirements: 16.1, 16.2, 16.6_

## Phase 2: Backend API Implementation

- [x] 2.1 Implement POST /api/auth/register endpoint
  - Accept email, password, name, phone parameters
  - Validate all parameters using validation utilities
  - Hash password using bcrypt (cost factor 10)
  - Create user in database
  - Return user ID on success, error on failure
  - Log account creation event
  - _Requirements: 6.3, 6.4, 6.5, 8.3, 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 2.2 Write property test for final validation before account creation
  - **Property 12: Final Validation Before Account Creation**
  - **Validates: Requirements 6.1**

- [x] 2.3 Implement GET /api/auth/check-email endpoint
  - Accept email as query parameter
  - Query database for existing email
  - Return availability status (available: true/false)
  - Respond within 500ms
  - _Requirements: 2.5, 20.1, 20.2, 20.3, 20.4_

- [x] 2.4 Write property test for email uniqueness validation
  - **Property 2: Email Uniqueness Validation**
  - **Validates: Requirements 2.5**

- [x] 2.5 Implement POST /api/auth/send-verification-email endpoint
  - Accept email and userId parameters
  - Generate unique verification token
  - Store token in email_verification_tokens table with 24-hour expiry
  - Send verification email with token link
  - Return success/error response
  - _Requirements: 7.1, 7.2, 7.3, 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 2.6 Implement GET /api/auth/verify-email/:token endpoint
  - Accept verification token as URL parameter
  - Validate token exists and hasn't expired
  - Mark email as verified in users table
  - Return verification status
  - _Requirements: 7.4, 7.5_

- [x] 2.7 Add error handling and validation to all API endpoints
  - Return 400 Bad Request for invalid input
  - Return 409 Conflict for duplicate email
  - Return 500 Internal Server Error for server errors
  - Convert technical errors to user-friendly messages
  - _Requirements: 15.1, 15.4, 15.5, 18.6, 18.7_

- [x] 2.8 Add security headers and HTTPS enforcement
  - Add HSTS header (Strict-Transport-Security)
  - Add CSP header (Content-Security-Policy)
  - Add X-Content-Type-Options: nosniff
  - Add X-Frame-Options: DENY
  - Redirect HTTP to HTTPS
  - _Requirements: 8.4, 22.1, 22.2, 22.3_

- [x] 2.9 Add rate limiting to API endpoints
  - Implement rate limiting for /api/auth/register (5 requests per hour per IP)
  - Implement rate limiting for /api/auth/check-email (10 requests per minute per IP)
  - Return 429 Too Many Requests when limit exceeded
  - _Requirements: 3.1 (implied security requirement)_

## Phase 3: Frontend Components

- [x] 3.1 Create ProgressIndicator component
  - Display 4 step dots with labels (Email, Password, Personal, Review)
  - Highlight current step
  - Show step labels below dots
  - Responsive layout (horizontal on desktop, vertical on mobile)
  - _Requirements: 1.2, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 3.2 Create EmailInput component (Step 1)
  - Display email input field with label "Email Address"
  - Implement real-time email format validation
  - Implement debounced email uniqueness check (500ms)
  - Display validation errors near input field
  - Display loading state during uniqueness check
  - Enable/disable Next button based on validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 3.3 Write unit tests for EmailInput component
  - Test email format validation display
  - Test email uniqueness check display
  - Test Next button enable/disable logic
  - Test error message display

- [x] 3.4 Create PasswordSetup component (Step 2)
  - Display password input field with label "Password"
  - Display password requirements list (8+ chars, uppercase, number, special char)
  - Display real-time password strength indicator (Weak/Fair/Good/Strong)
  - Display Show/Hide password toggle
  - Display confirm password field
  - Validate password confirmation matching
  - Display specific validation errors for each requirement
  - Enable/disable Next button based on validation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

- [x] 3.5 Write unit tests for PasswordSetup component
  - Test password strength indicator calculation
  - Test password confirmation matching
  - Test Show/Hide toggle functionality
  - Test validation error display

- [x] 3.6 Create PersonalDataForm component (Step 3)
  - Display full name input field with label "Full Name"
  - Display phone number input field with label "Phone Number"
  - Implement real-time validation for both fields
  - Display specific validation errors for each field
  - Support international phone number formats
  - Enable/disable Next button based on validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

- [x] 3.7 Write unit tests for PersonalDataForm component
  - Test name validation display
  - Test phone validation display
  - Test international phone format support
  - Test error message display

- [x] 3.8 Create VerificationReview component (Step 4)
  - Display email in read-only format
  - Display name in read-only format
  - Display phone in read-only format
  - Display "Password is set and secured" instead of password
  - Display Edit button for each field
  - Implement Edit button navigation back to corresponding step
  - Display Create Account button
  - Display Back button
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [x] 3.9 Write unit tests for VerificationReview component
  - Test read-only field display
  - Test Edit button navigation
  - Test Create Account button functionality

- [x] 3.10 Create ErrorDisplay component
  - Display error message with user-friendly text
  - Display error near corresponding field (field errors)
  - Display error at top of form (general errors)
  - Display dismiss button for general errors
  - Use error color (red) for styling
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 3.11 Create SuccessMessage component
  - Display success message "Account created successfully"
  - Show countdown timer before redirect
  - Auto-redirect to login page after 2 seconds
  - Use success color (green) for styling
  - _Requirements: 6.6, 6.7_

- [x] 3.12 Create NavigationButtons component
  - Display Back button (navigate to previous step)
  - Display Next/Create Account button (validate and proceed)
  - Display Cancel button (discard data and return to login)
  - Implement button enable/disable logic based on validation
  - _Requirements: 1.7, 1.8_

- [x] 3.13 Implement responsive design for all components
  - Ensure all components work on desktop (≥1024px)
  - Ensure all components work on tablet (768px-1023px)
  - Ensure all components work on mobile (<768px)
  - Ensure no horizontal scrolling on any viewport
  - Ensure touch-friendly button sizes (44x44px minimum)
  - Ensure readable text sizes (16px minimum)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 3.14 Implement accessibility features for all components
  - Add ARIA labels for all input fields
  - Add ARIA descriptions for password requirements
  - Add ARIA live regions for error messages
  - Ensure keyboard navigation (Tab, Enter, Escape)
  - Ensure focus indicators visible on all elements
  - Use semantic HTML (form, input, button, label, fieldset, legend)
  - Ensure WCAG 2.1 AA color contrast compliance
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

## Phase 4: Integration & State Management

- [x] 4.1 Create useRegistration custom hook
  - Manage registration state (currentStep, formData, errors, isLoading)
  - Implement step progression with validation
  - Implement navigation back with data preservation
  - Implement session storage and retrieval
  - Implement session expiration (30 minutes)
  - _Requirements: 1.3, 1.5, 1.6, 16.1, 16.2, 16.3, 16.4_

- [x] 4.2 Write property test for step validation prevents progression
  - **Property 10: Step Validation Prevents Progression**
  - **Validates: Requirements 1.3**

- [x] 4.3 Write property test for data preservation on navigation back
  - **Property 11: Data Preservation on Navigation Back**
  - **Validates: Requirements 1.6**

- [x] 4.4 Create RegistrationFlow main container component
  - Orchestrate multi-step registration process
  - Manage current step and form data
  - Handle step validation before progression
  - Preserve data when navigating back
  - Manage session storage
  - Handle API calls for email check and account creation
  - Display error and success messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 4.5 Implement form data management across steps
  - Store form data in component state
  - Persist form data to session storage
  - Retrieve form data from session storage on page refresh
  - Clear form data on cancel or successful account creation
  - _Requirements: 1.5, 1.6, 16.1, 16.4_

- [x] 4.6 Implement error state management
  - Capture validation errors from each step
  - Capture API errors from backend
  - Convert API errors to user-friendly messages
  - Display errors near corresponding fields
  - Clear errors when user corrects input
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 4.7 Implement loading states and API integration
  - Show loading state during email uniqueness check
  - Show loading state during account creation
  - Disable form inputs during API calls
  - Handle API timeouts and network errors
  - Implement retry logic for failed API calls
  - _Requirements: 15.6, 15.7, 21.3, 21.4_

- [x] 4.8 Implement session persistence and expiration
  - Store registration session in HTTP-only cookie
  - Retrieve session on page refresh
  - Expire session after 30 minutes of inactivity
  - Display warning before session expiration
  - Clear session on cancel or successful account creation
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 4.9 Implement navigation between steps
  - Implement Next button to proceed to next step
  - Implement Back button to return to previous step
  - Implement Edit button in verification step to navigate back to corresponding step
  - Implement Cancel button to discard data and return to login
  - Preserve form data when navigating back
  - _Requirements: 1.5, 1.6, 1.7, 1.8, 5.7, 5.8_

## Phase 5: Testing & Quality

- [x] 5.1 Write integration tests for API endpoints
  - Test POST /api/auth/register with valid data (creates user, returns user ID)
  - Test POST /api/auth/register with duplicate email (returns 409 error)
  - Test POST /api/auth/register with invalid data (returns 400 error)
  - Test GET /api/auth/check-email with new email (returns available: true)
  - Test GET /api/auth/check-email with existing email (returns available: false)
  - Test POST /api/auth/send-verification-email (sends email successfully)
  - Test GET /api/auth/verify-email/:token with valid token (marks email as verified)
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 19.1, 19.2, 19.3, 19.4, 19.5, 20.1, 20.2, 20.3, 20.4_

- [x] 5.2 Write integration tests for complete registration flow
  - Test complete registration flow (all 4 steps)
  - Test navigate back and edit data
  - Test cancel registration and verify data cleared
  - Test session persistence across page refresh
  - Test session expiration after 30 minutes
  - Test error recovery and retry
  - _Requirements: 1.1, 1.3, 1.5, 1.6, 1.7, 1.8, 16.1, 16.2, 16.3, 16.4_

- [x] 5.3 Write E2E tests for user scenarios
  - Test new user registration (happy path)
  - Test email already exists error and recovery
  - Test password validation errors and correction
  - Test invalid phone number and correction
  - Test session expiration warning
  - Test network error recovery
  - Test mobile responsiveness verification
  - _Requirements: 1.1, 1.3, 1.5, 1.6, 1.7, 1.8, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 5.4 Write performance tests
  - Test initial page load time (< 2 seconds on 4G)
  - Test first step display time (< 1 second)
  - Test email uniqueness check response time (< 500ms)
  - Test account creation response time (< 3 seconds)
  - Test code splitting effectiveness (reduce initial bundle size by 40%)
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [x] 5.5 Write accessibility tests
  - Test WCAG 2.1 AA color contrast compliance
  - Test keyboard navigation (Tab, Enter, Escape)
  - Test screen reader compatibility
  - Test focus indicator visibility
  - Test semantic HTML validation
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [x] 5.6 Checkpoint - Ensure all tests pass
  - Run all unit tests and verify passing
  - Run all integration tests and verify passing
  - Run all E2E tests and verify passing
  - Run all property-based tests and verify passing
  - Review test coverage (target: > 80%)
  - Ask the user if questions arise

- [x] 5.7 Write snapshot tests for component rendering
  - Test ProgressIndicator snapshot
  - Test EmailInput snapshot
  - Test PasswordSetup snapshot
  - Test PersonalDataForm snapshot
  - Test VerificationReview snapshot
  - Test ErrorDisplay snapshot
  - Test SuccessMessage snapshot

- [x] 5.8 Write visual regression tests
  - Test responsive design on desktop viewport
  - Test responsive design on tablet viewport
  - Test responsive design on mobile viewport
  - Test color contrast compliance
  - Test typography and spacing

## Phase 6: Documentation & Deployment

- [x] 6.1 Create Storybook stories for all components
  - Create story for ProgressIndicator (all steps)
  - Create story for EmailInput (valid, invalid, loading states)
  - Create story for PasswordSetup (strength indicators, validation errors)
  - Create story for PersonalDataForm (valid, invalid, international phone)
  - Create story for VerificationReview (all fields, edit buttons)
  - Create story for ErrorDisplay (field errors, general errors)
  - Create story for SuccessMessage (countdown timer)
  - Create story for RegistrationFlow (complete flow)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 6.2 Create API documentation
  - Document POST /api/auth/register endpoint (request, response, errors)
  - Document GET /api/auth/check-email endpoint (query params, response)
  - Document POST /api/auth/send-verification-email endpoint (request, response)
  - Document GET /api/auth/verify-email/:token endpoint (response, errors)
  - Include example requests and responses
  - Include error codes and messages
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 19.1, 19.2, 19.3, 19.4, 19.5, 20.1, 20.2, 20.3, 20.4_

- [x] 6.3 Create deployment guide
  - Document cloud deployment steps (Vercel, AWS, etc.)
  - Document local deployment steps (npm run dev)
  - Document environment variable configuration
  - Document database setup and migrations
  - Document email service configuration
  - Document HTTPS enforcement and security headers
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

- [x] 6.4 Create user guide and troubleshooting
  - Document registration flow steps
  - Document password requirements
  - Document supported phone number formats
  - Document common errors and solutions
  - Document email verification process
  - Document session timeout and recovery
  - _Requirements: 1.1, 3.3, 4.9, 7.1, 7.5, 16.2, 16.3_

- [x] 6.5 Create performance optimization documentation
  - Document code splitting strategy
  - Document bundle size optimization techniques
  - Document email uniqueness check debouncing
  - Document session timeout configuration
  - Document performance monitoring and metrics
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [x] 6.6 Final checkpoint - Ensure all tests pass and build succeeds
  - Run all tests and verify passing
  - Run build command and verify success
  - Verify no console errors or warnings
  - Verify performance metrics meet targets
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate API and flow integration
- E2E tests validate complete user scenarios
- All code must work in both cloud and local versions
- All components must be responsive and accessible
- All API endpoints must include proper error handling and security headers
- All passwords must be hashed using bcrypt with cost factor 10
- All sensitive data must be transmitted over HTTPS only
- All sessions must expire after 30 minutes of inactivity
- All logs must not contain passwords or sensitive data
