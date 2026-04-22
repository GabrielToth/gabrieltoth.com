# Implementation Tasks - Registration Flow Redesign

## Overview

This implementation plan breaks down the registration flow redesign into discrete, actionable coding tasks. The feature implements a dual-authentication entry point (Email vs Google OAuth) with a streamlined multi-step registration process. Tasks are organized into 6 phases: Foundation & Setup, Backend API Implementation, Frontend Components, Integration & State Management, Testing & Quality, and Documentation & Deployment.

Each task builds incrementally on previous tasks, with no orphaned code. Property-based tests are included as optional sub-tasks to validate universal correctness properties defined in the design document.

## Phase 1: Foundation & Setup

- [x] 1.1 Set up database schema and migrations
  - Create/update `users` table with email, hashed_password, full_name, birth_date, phone, auth_method fields
  - Create `registration_sessions` table for session persistence
  - Add indexes on email, session_id columns
  - _Requirements: 1.1, 14.1, 23.1_

- [x] 1.2 Create validation utility functions for email format
  - Implement RFC 5322 email format validation function
  - Export validation function for use in components and API routes
  - _Requirements: 2.3, 15.1_

- [x] 1.3 Write property test for email format validation
  - **Property 1: Email Format Validation Consistency**
  - **Validates: Requirements 2.3, 15.1**

- [x] 1.4 Create validation utility functions for password requirements
  - Implement password validation function (8+ chars, uppercase, number, special char)
  - Implement password strength calculation (Weak/Fair/Good/Strong)
  - Export both functions for use in components and API routes
  - _Requirements: 3.4, 19.1_

- [x] 1.5 Write property tests for password validation
  - **Property 2: Password Strength Validation Correctness**
  - **Validates: Requirements 3.4, 19.1**
  - **Property 3: Password Hashing Security**
  - **Validates: Requirements 8.4, 19.3**

- [x] 1.6 Create validation utility functions for birth dates
  - Implement birth date format validation (DD/MM/YYYY)
  - Implement age validation (minimum 13 years old)
  - Export both functions for use in components and API routes
  - _Requirements: 4.8-4.11, 18.1-18.3_

- [x] 1.7 Write property tests for birth date validation
  - **Property 5: Birth Date Format Validation**
  - **Validates: Requirements 4.8-4.9, 18.1-18.2**
  - **Property 6: Age Validation Correctness**
  - **Validates: Requirements 4.10-4.11, 6.10-6.11, 18.3**

- [x] 1.8 Create validation utility functions for personal names
  - Implement name validation (not empty, min 2 chars, allowed characters)
  - Implement name rejection for numbers/special chars only
  - Export both functions for use in components and API routes
  - _Requirements: 4.3-4.5, 17.1-17.3_

- [x] 1.9 Write property tests for name validation
  - **Property 4: Full Name Validation Correctness**
  - **Validates: Requirements 4.3-4.5, 17.1-17.3**

- [x] 1.10 Create validation utility functions for phone numbers
  - Implement international phone format validation using libphonenumber-js
  - Implement phone number normalization to E.164 format
  - Export both functions for use in components and API routes
  - _Requirements: 4.13-4.15, 16.1-16.4_

- [x] 1.11 Write property tests for phone validation
  - **Property 7: Phone Number Format Validation**
  - **Validates: Requirements 4.13-4.14, 16.1-16.2**
  - **Property 8: Phone Number Normalization Consistency**
  - **Validates: Requirements 4.15, 6.15, 16.4**

- [x] 1.12 Set up environment variables and configuration
  - Create `.env.local.example` with all required variables (API_URL, DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_TIMEOUT, VERIFICATION_TOKEN_EXPIRY)
  - Document environment variables in README
  - Ensure configuration works for both cloud and local versions
  - _Requirements: 23.1-23.7_

- [x] 1.13 Set up error handling and logging utilities
  - Create error handler middleware for API routes
  - Create logging utility for audit events (account creation, email verification, failed attempts)
  - Ensure passwords are never logged
  - _Requirements: 13.1-13.7, 22.1-22.6_

- [x] 1.14 Set up session management utilities
  - Create session storage utility using HTTP-only cookies
  - Implement session expiration (30 minutes)
  - Implement session validation and retrieval
  - _Requirements: 14.1-14.6_

- [x] 1.15 Set up Google OAuth configuration
  - Configure Google OAuth client ID and secret
  - Set up OAuth redirect URI
  - Configure scopes (email, profile)
  - _Requirements: 5.1-5.3, 26.1-26.3_

## Phase 2: Backend API Implementation

- [x] 2.1 Implement POST /api/auth/register endpoint
  - Accept email, password (for email path), full_name, birth_date, phone, auth_method parameters
  - Validate all parameters using validation utilities
  - Hash password using bcrypt (cost factor 10) for email path
  - Create user in database
  - Return user ID on success, error on failure
  - Log account creation event
  - _Requirements: 8.1-8.10, 24.1-24.8_

- [x] 2.2 Write property test for final validation before account creation
  - **Property 10: Final Data Validation Completeness**
  - **Validates: Requirements 8.1-8.2**

- [x] 2.3 Implement GET /api/auth/check-email endpoint
  - Accept email as query parameter
  - Query database for existing email
  - Return availability status (available: true/false)
  - Respond within 500ms
  - _Requirements: 2.5, 15.3, 25.1-25.5_

- [x] 2.4 Write property test for email uniqueness validation
  - **Property 9: Email Uniqueness Enforcement**
  - **Validates: Requirements 2.5, 15.3, 24.7**

- [x] 2.5 Implement POST /api/auth/google/callback endpoint
  - Accept authorization code and redirect URI
  - Exchange code for access token with Google
  - Extract email and name from Google profile
  - Return email and name to client
  - Store access token securely on server
  - _Requirements: 5.1-5.9, 26.1-26.7_

- [x] 2.6 Implement POST /api/auth/send-verification-email endpoint
  - Accept email and userId parameters
  - Generate unique verification token
  - Store token in email_verification_tokens table with 24-hour expiry
  - Send verification email with token link
  - Return success/error response
  - _Requirements: 28.1-28.5_

- [x] 2.7 Add error handling and validation to all API endpoints
  - Return 400 Bad Request for invalid input
  - Return 409 Conflict for duplicate email
  - Return 500 Internal Server Error for server errors
  - Convert technical errors to user-friendly messages
  - _Requirements: 13.1-13.7, 24.6_

- [x] 2.8 Add security headers and HTTPS enforcement
  - Add HSTS header (Strict-Transport-Security)
  - Add CSP header (Content-Security-Policy)
  - Add X-Content-Type-Options: nosniff
  - Add X-Frame-Options: DENY
  - Redirect HTTP to HTTPS
  - _Requirements: 20.1-20.4_

- [x] 2.9 Add rate limiting to API endpoints
  - Implement rate limiting for /api/auth/check-email (5 requests per minute per IP)
  - Implement rate limiting for /api/auth/register (3 requests per hour per IP)
  - Return 429 Too Many Requests when limit exceeded
  - _Requirements: 21.1-21.6_

## Phase 3: Frontend Components

- [x] 3.1 Create AuthenticationEntry component
  - Display platform logo/branding
  - Display two buttons: "Sign up with Email" and "Sign up with Google"
  - Display "Back to Login" link
  - Use dark theme styling (dark blue background, dark card, light text)
  - Responsive layout (horizontal on desktop, vertical on mobile)
  - _Requirements: 1.1-1.9, 10.1-10.9, 11.1-11.7_

- [x] 3.2 Create EmailRegistrationFlow component (Step 1: Email Input)
  - Display email input field with label "Email Address"
  - Implement real-time email format validation
  - Implement debounced email uniqueness check (500ms)
  - Display validation errors near input field
  - Display loading state during uniqueness check
  - Enable/disable Next button based on validation
  - _Requirements: 2.1-2.10, 15.1-15.5_

- [x] 3.3 Write unit tests for EmailInput component
  - Test email format validation display
  - Test email uniqueness check display
  - Test Next button enable/disable logic
  - Test error message display

- [x] 3.4 Create EmailRegistrationFlow component (Step 2: Password Setup)
  - Display password input field with label "Password"
  - Display password requirements list (8+ chars, uppercase, number, special char)
  - Display real-time password strength indicator (Weak/Fair/Good/Strong)
  - Display Show/Hide password toggle
  - Display confirm password field
  - Validate password confirmation matching
  - Display specific validation errors for each requirement
  - Enable/disable Next button based on validation
  - _Requirements: 3.1-3.11, 19.1-19.6_

- [x] 3.5 Write unit tests for PasswordSetup component
  - Test password strength indicator calculation
  - Test password confirmation matching
  - Test Show/Hide toggle functionality
  - Test validation error display

- [x] 3.6 Create EmailRegistrationFlow component (Step 3: Personal Information)
  - Display full name input field with label "Full Name"
  - Display birth date input field with label "Birth Date" (DD/MM/YYYY format)
  - Display phone number input field with label "Phone Number"
  - Implement real-time validation for all fields
  - Display specific validation errors for each field
  - Support international phone number formats
  - Enable/disable Next button based on validation
  - _Requirements: 4.1-4.16, 6.1-6.17, 17.1-17.5, 18.1-18.5_

- [x] 3.7 Write unit tests for PersonalDataForm component
  - Test name validation display
  - Test birth date validation display
  - Test phone validation display
  - Test international phone format support
  - Test error message display

- [x] 3.8 Create GoogleOAuthFlow component (Step 1: OAuth Authorization)
  - Implement Google OAuth authorization redirect
  - Extract email and name from Google profile
  - Display loading state during authorization
  - Handle authorization failures with error messages
  - Display "Try Again" and "Back" buttons
  - _Requirements: 5.1-5.9, 26.1-26.7_

- [x] 3.9 Create GoogleOAuthFlow component (Step 2: Personal Information)
  - Display full name input field with label "Full Name" (pre-filled from Google)
  - Display birth date input field with label "Birth Date"
  - Display phone number input field with label "Phone Number"
  - Allow editing of pre-filled name
  - Implement real-time validation for all fields
  - Display specific validation errors for each field
  - Support international phone number formats
  - Enable/disable Next button based on validation
  - _Requirements: 6.1-6.17, 17.1-17.5, 18.1-18.5_

- [x] 3.10 Create VerificationStep component
  - Display email in read-only format
  - Display full name in read-only format
  - Display birth date in read-only format
  - Display phone in read-only format
  - FOR email registration path, display "Password is set and secured" instead of password
  - Display Edit button for each field
  - Implement Edit button navigation back to corresponding step
  - Display Create Account button
  - Display Back button
  - _Requirements: 7.1-7.12, 10.1-10.9_

- [x] 3.11 Write unit tests for VerificationReview component
  - Test read-only field display
  - Test Edit button navigation
  - Test Create Account button functionality

- [x] 3.12 Create ProgressIndicator component
  - Display current step and total steps
  - Display progress bar showing completion percentage
  - Display step labels
  - Responsive layout
  - _Requirements: 1.2, 10.1-10.9, 11.1-11.7_

- [x] 3.13 Create ErrorDisplay component
  - Display error message with user-friendly text
  - Display error near corresponding field (field errors)
  - Display error at top of form (general errors)
  - Display dismiss button for general errors
  - Use error color (red) for styling
  - _Requirements: 13.1-13.7_

- [x] 3.14 Create SuccessMessage component
  - Display success message "Account created successfully"
  - Show countdown timer before redirect
  - Auto-redirect to login page after 2 seconds
  - Use success color (green) for styling
  - _Requirements: 8.7-8.8_

- [x] 3.15 Create NavigationButtons component
  - Display Back button (navigate to previous step)
  - Display Next/Create Account button (validate and proceed)
  - Display Cancel button (discard data and return to login)
  - Implement button enable/disable logic based on validation
  - _Requirements: 1.7-1.8_

- [x] 3.16 Implement responsive design for all components
  - Ensure all components work on desktop (≥1024px)
  - Ensure all components work on tablet (768px-1023px)
  - Ensure all components work on mobile (<768px)
  - Ensure no horizontal scrolling on any viewport
  - Ensure touch-friendly button sizes (44x44px minimum)
  - Ensure readable text sizes (16px minimum)
  - _Requirements: 11.1-11.7_

- [x] 3.17 Implement accessibility features for all components
  - Add ARIA labels for all input fields
  - Add ARIA descriptions for password requirements
  - Add ARIA live regions for error messages
  - Ensure keyboard navigation (Tab, Enter, Escape)
  - Ensure focus indicators visible on all elements
  - Use semantic HTML (form, input, button, label, fieldset, legend)
  - Ensure WCAG 2.1 AA color contrast compliance
  - _Requirements: 12.1-12.8_

- [x] 3.18 Hide menu during registration flow
  - Hide main navigation menu on AuthenticationEntry
  - Hide menu on all registration steps
  - Hide menu on verification step
  - Show menu on login page after cancellation
  - Show menu on all other pages
  - _Requirements: 9.1-9.6_

## Phase 4: Integration & State Management

- [x] 4.1 Create useRegistration custom hook
  - Manage registration state (currentStep, formData, errors, isLoading)
  - Implement step progression with validation
  - Implement navigation back with data preservation
  - Implement session storage and retrieval
  - Implement session expiration (30 minutes)
  - _Requirements: 1.3-1.6, 14.1-14.6_

- [x] 4.2 Write property test for step validation prevents progression
  - **Property 11: Session Data Preservation**
  - **Validates: Requirements 14.1, 14.4**

- [x] 4.3 Write property test for session data cleanup
  - **Property 12: Session Data Cleanup**
  - **Validates: Requirements 14.4**

- [x] 4.4 Create RegistrationFlowRoot main container component
  - Orchestrate multi-step registration process
  - Manage current step and form data
  - Handle step validation before progression
  - Preserve data when navigating back
  - Manage session storage
  - Handle API calls for email check and account creation
  - Display error and success messages
  - Hide menu during registration
  - _Requirements: 1.1-1.9, 9.1-9.6_

- [x] 4.5 Implement form data management across steps
  - Store form data in component state
  - Persist form data to session storage
  - Retrieve form data from session storage on page refresh
  - Clear form data on cancel or successful account creation
  - _Requirements: 1.5-1.6, 14.1, 14.4_

- [x] 4.6 Implement error state management
  - Capture validation errors from each step
  - Capture API errors from backend
  - Convert API errors to user-friendly messages
  - Display errors near corresponding fields
  - Clear errors when user corrects input
  - _Requirements: 13.1-13.7_

- [x] 4.7 Implement loading states and API integration
  - Show loading state during email uniqueness check
  - Show loading state during account creation
  - Disable form inputs during API calls
  - Handle API timeouts and network errors
  - Implement retry logic for failed API calls
  - _Requirements: 13.1-13.7, 27.1-27.5_

- [x] 4.8 Implement session persistence and expiration
  - Store registration session in HTTP-only cookie
  - Retrieve session on page refresh
  - Expire session after 30 minutes of inactivity
  - Display warning before session expiration
  - Clear session on cancel or successful account creation
  - _Requirements: 14.1-14.6_

- [x] 4.9 Implement navigation between steps
  - Implement Next button to proceed to next step
  - Implement Back button to return to previous step
  - Implement Edit button in verification step to navigate back to corresponding step
  - Implement Cancel button to discard data and return to login
  - Preserve form data when navigating back
  - _Requirements: 1.5-1.8, 7.8-7.11_

- [x] 4.10 Implement Google OAuth integration
  - Initialize Google OAuth client
  - Handle OAuth authorization flow
  - Exchange authorization code for access token
  - Extract email and name from Google profile
  - Handle authorization failures
  - _Requirements: 5.1-5.9, 26.1-26.7_

## Phase 5: Testing & Quality

- [x] 5.1 Write integration tests for API endpoints
  - Test POST /api/auth/register with valid data (creates user, returns user ID)
  - Test POST /api/auth/register with duplicate email (returns 409 error)
  - Test POST /api/auth/register with invalid data (returns 400 error)
  - Test GET /api/auth/check-email with new email (returns available: true)
  - Test GET /api/auth/check-email with existing email (returns available: false)
  - Test POST /api/auth/google/callback (exchanges code for token)
  - Test POST /api/auth/send-verification-email (sends email successfully)
  - _Requirements: 8.1-8.10, 24.1-24.8, 25.1-25.5, 26.1-26.7_

- [x] 5.2 Write integration tests for complete registration flow
  - Test complete email registration flow (all steps)
  - Test complete Google OAuth registration flow (all steps)
  - Test navigate back and edit data
  - Test cancel registration and verify data cleared
  - Test session persistence across page refresh
  - Test session expiration after 30 minutes
  - Test error recovery and retry
  - _Requirements: 1.1-1.9, 14.1-14.6_

- [x] 5.3 Write E2E tests for user scenarios
  - Test new user registration via email (happy path)
  - Test new user registration via Google OAuth (happy path)
  - Test email already exists error and recovery
  - Test password validation errors and correction
  - Test invalid birth date and correction
  - Test invalid phone number and correction
  - Test session expiration warning
  - Test network error recovery
  - Test mobile responsiveness verification
  - _Requirements: 1.1-1.9, 11.1-11.7_

- [x] 5.4 Write performance tests
  - Test initial page load time (< 2 seconds on 4G)
  - Test first step display time (< 1 second)
  - Test email uniqueness check response time (< 500ms)
  - Test account creation response time (< 3 seconds)
  - Test code splitting effectiveness (reduce initial bundle size by 40%)
  - _Requirements: 27.1-27.5_

- [x] 5.5 Write accessibility tests
  - Test WCAG 2.1 AA color contrast compliance
  - Test keyboard navigation (Tab, Enter, Escape)
  - Test screen reader compatibility
  - Test focus indicator visibility
  - Test semantic HTML validation
  - _Requirements: 12.1-12.8_

- [x] 5.6 Checkpoint - Ensure all tests pass
  - Run all unit tests and verify passing
  - Run all integration tests and verify passing
  - Run all E2E tests and verify passing
  - Run all property-based tests and verify passing
  - Review test coverage (target: > 80%)
  - Ask the user if questions arise

- [x] 5.7 Write snapshot tests for component rendering
  - Test AuthenticationEntry snapshot
  - Test EmailRegistrationFlow snapshots (all steps)
  - Test GoogleOAuthFlow snapshots (all steps)
  - Test VerificationStep snapshot
  - Test ProgressIndicator snapshot
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
  - Create story for AuthenticationEntry (both buttons)
  - Create story for EmailRegistrationFlow (all steps)
  - Create story for GoogleOAuthFlow (all steps)
  - Create story for VerificationStep (all fields)
  - Create story for ProgressIndicator (various steps)
  - Create story for ErrorDisplay (field errors, general errors)
  - Create story for SuccessMessage (countdown timer)
  - Create story for RegistrationFlowRoot (complete flow)
  - _Requirements: 10.1-10.9_

- [x] 6.2 Create API documentation
  - Document POST /api/auth/register endpoint (request, response, errors)
  - Document GET /api/auth/check-email endpoint (query params, response)
  - Document POST /api/auth/google/callback endpoint (request, response)
  - Document POST /api/auth/send-verification-email endpoint (request, response)
  - Include example requests and responses
  - Include error codes and messages
  - _Requirements: 24.1-24.8, 25.1-25.5, 26.1-26.7_

- [x] 6.3 Create deployment guide
  - Document cloud deployment steps (Vercel, AWS, etc.)
  - Document local deployment steps (npm run dev)
  - Document environment variable configuration
  - Document database setup and migrations
  - Document Google OAuth configuration
  - Document HTTPS enforcement and security headers
  - _Requirements: 23.1-23.7_

- [x] 6.4 Create user guide and troubleshooting
  - Document registration flow steps
  - Document password requirements
  - Document supported phone number formats
  - Document common errors and solutions
  - Document email verification process
  - Document session timeout and recovery
  - _Requirements: 1.1-1.9, 3.1-3.11, 4.1-4.16, 6.1-6.17_

- [x] 6.5 Create performance optimization documentation
  - Document code splitting strategy
  - Document bundle size optimization techniques
  - Document email uniqueness check debouncing
  - Document session timeout configuration
  - Document performance monitoring and metrics
  - _Requirements: 27.1-27.5_

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
- Menu must be hidden during entire registration flow
- Dark theme styling must be consistent with login page
