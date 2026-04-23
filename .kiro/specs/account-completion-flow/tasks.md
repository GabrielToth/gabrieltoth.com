# Implementation Plan: Account Completion Flow

## Overview

This implementation plan breaks down the Account Completion Flow feature into discrete coding tasks. The feature enables legacy OAuth users (Google, Facebook, TikTok) without passwords to complete their account setup through a multi-step form that combines registration and verification concepts.

**Implementation Language**: TypeScript (Next.js/React)

## Tasks

- [x] 1. Database schema and migrations
  - [x] 1.1 Create database migration for account completion fields
    - Add `password_hash VARCHAR(255)` column to users table
    - Add `phone_number VARCHAR(20)` column to users table
    - Add `birth_date DATE` column to users table
    - Add `account_completion_status VARCHAR(20) DEFAULT 'pending'` column
    - Add `account_completed_at TIMESTAMP` column
    - Create index on `account_completion_status` for efficient querying
    - Test migration in local environment with rollback
    - _Requirements: 1.1, 1.2, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [x] 1.2 Write unit tests for migration
    - Test migration applies successfully
    - Test rollback works correctly
    - Test indexes are created
    - _Requirements: 9.1, 9.8_

- [-] 2. Update TypeScript type definitions
  - [x] 2.1 Update OAuthUser interface in `src/types/auth.ts`
    - Add `password_hash: string | null` field
    - Add `phone_number?: string | null` field
    - Add `birth_date?: Date | null` field
    - Add `account_completion_status: 'pending' | 'in_progress' | 'completed'` field
    - Add `account_completed_at?: Date | null` field
    - Update JSDoc comments with field descriptions
    - Run `npm run type-check` to verify
    - _Requirements: 1.1, 9.1_

- [-] 3. Implement validation utilities
  - [x] 3.1 Create `src/lib/auth/validation.ts` with validation functions
    - Implement `validatePassword()` - 8+ chars, uppercase, lowercase, number, special char
    - Implement `validatePhoneNumber()` - international format (+1234567890)
    - Implement `validateBirthDate()` - ISO 8601, age >= 13, not future
    - Implement `validateEmail()` - standard email format
    - Implement `validateAccountCompletionData()` - validates all fields together
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 3.2 Write property test for password strength invariant
    - **Property 1: Password Strength Invariant**
    - **Validates: Requirements 5.2, 5.3**
    - Test with 100+ random password inputs
    - Verify all accepted passwords meet security requirements
    - _Requirements: 11.1, 11.2_
  
  - [x] 3.3 Write property test for phone number format consistency
    - **Property 2: Phone Number Format Consistency**
    - **Validates: Requirements 5.4, 5.5**
    - Test with 100+ random phone number inputs
    - Verify valid phone numbers are in international format
    - _Requirements: 11.1, 11.2_
  
  - [x] 3.4 Write property test for birth date age calculation idempotence
    - **Property 3: Birth Date Age Calculation Idempotence**
    - **Validates: Requirements 5.6, 5.7**
    - Test with 100+ random birth dates
    - Verify age calculation is consistent
    - _Requirements: 11.1, 11.2_
  
  - [x] 3.5 Write property test for validation error consistency
    - **Property 7: Validation Error Messages Consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**
    - Test same invalid inputs produce same error messages
    - _Requirements: 11.1, 11.2_

- [-] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement temporary token module
  - [x] 5.1 Create `src/lib/auth/temp-token.ts` with token functions
    - Implement `generateTempToken()` - creates JWT with 30min expiration
    - Implement `verifyTempToken()` - validates and decodes JWT
    - Include OAuth data in token payload (email, oauth_provider, oauth_id, name, picture)
    - Add token hashing for secure storage
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_
  
  - [x] 5.2 Write unit tests for temporary token module
    - Test token generation with valid data
    - Test token verification with valid token
    - Test token expiration after 30 minutes
    - Test token verification with invalid token
    - Test token verification with expired token
    - _Requirements: 1.4, 2.4_

- [x] 6. Update user database functions
  - [x] 6.1 Update `src/lib/auth/user.ts` with account completion functions
    - Implement `updateUserAccountCompletion()` - updates user with completion data
    - Implement `getUserByEmail()` - retrieves user by email (if not exists)
    - Implement `markAccountInProgress()` - sets status to 'in_progress'
    - Implement `markAccountCompleted()` - sets status to 'completed' with timestamp
    - Add database error handling and logging
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.1, 9.7_
  
  - [x] 6.2 Write unit tests for user database functions
    - Test updateUserAccountCompletion with valid data
    - Test getUserByEmail with existing and non-existing emails
    - Test markAccountInProgress updates status correctly
    - Test markAccountCompleted sets timestamp
    - Test database error handling
    - _Requirements: 8.8, 9.7_

- [-] 7. Create account completion API endpoint
  - [ ] 7.1 Create `src/app/api/auth/complete-account/route.ts` with POST handler
    - Parse and validate request body
    - Verify temporary token from request
    - Validate all submitted data (email, name, password, phone, birthDate)
    - Check email uniqueness (prevent duplicates)
    - Hash password using bcrypt (salt rounds = 12)
    - Update user record with completion data
    - Create session and set HTTP-only cookie
    - Return success response with redirect URL
    - Handle errors with appropriate HTTP status codes (400, 401, 409, 500)
    - Add audit logging for all attempts
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  
  - [ ] 7.2 Write property test for email uniqueness invariant
    - **Property 4: Email Uniqueness Invariant**
    - **Validates: Requirements 4.4, 4.5, 6.6, 8.4**
    - Test with 100+ random emails
    - Verify no duplicate emails after completion
    - _Requirements: 11.1, 11.2_
  
  - [ ] 7.3 Write property test for round-trip data persistence
    - **Property 5: Round-Trip Data Persistence**
    - **Validates: Requirements 8.5, 8.6, 8.7**
    - Test data submitted equals data retrieved from database
    - Test with 100+ random data sets
    - _Requirements: 11.1, 11.2_
  
  - [ ] 7.4 Write property test for account completion idempotence
    - **Property 6: Account Completion Status Idempotence**
    - **Validates: Requirements 8.5, 8.6, 8.7**
    - Test completing account twice produces same state
    - Verify error handling for duplicate completion
    - _Requirements: 11.1, 11.2_
  
  - [ ] 7.5 Write integration tests for API endpoint
    - Test successful account completion flow
    - Test invalid temp token returns 401
    - Test expired temp token returns 401
    - Test missing required fields returns 400
    - Test invalid email format returns 400
    - Test duplicate email returns 409
    - Test invalid password returns 400
    - Test invalid phone number returns 400
    - Test invalid birth date returns 400
    - Test database errors return 500
    - Test session creation and cookie setting
    - _Requirements: 8.8_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement account completion middleware
  - [x] 9.1 Create `src/lib/middleware/account-completion.ts` with redirect logic
    - Implement `checkAccountCompletion()` function
    - Check if user has active session
    - Get user from database by session user_id
    - Check if account is complete (has password_hash and status = 'completed')
    - Allow access if account is complete
    - Allow access if user is on completion page
    - Redirect to `/[locale]/auth/complete-account` if incomplete
    - Handle errors gracefully
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 9.2 Integrate middleware into `src/middleware.ts`
    - Add account completion middleware to middleware chain
    - Ensure proper execution order
    - Test middleware execution flow
    - _Requirements: 2.1, 2.5_
  
  - [x] 9.3 Write integration tests for middleware
    - Test redirect for incomplete accounts
    - Test allow access for complete accounts
    - Test allow access to completion page
    - Test session validation
    - Test expired session handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [-] 10. Create account completion UI components
  - [x] 10.1 Create `src/app/[locale]/auth/complete-account/hooks/useAccountCompletion.ts`
    - Implement state management for form data
    - Add step navigation (currentStep: 1 | 2 | 3)
    - Add field update functions (updatePrefilledField, updateNewField)
    - Add validation functions (validateStep)
    - Add form submission function (submitForm)
    - Handle loading and error states
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 10.2 Create `src/app/[locale]/auth/complete-account/components/progress-indicator.tsx`
    - Display current step number (1, 2, or 3)
    - Display total steps (3)
    - Add visual progress bar
    - Add step labels (Pre-filled Data, New Fields, Verification)
    - Style with Tailwind CSS
    - _Requirements: 3.3_
  
  - [x] 10.3 Create `src/app/[locale]/auth/complete-account/components/password-strength.tsx`
    - Display password requirements list
    - Show requirement status (met/unmet) with icons
    - Add visual indicators (colors, checkmarks)
    - Update in real-time as user types
    - Style with Tailwind CSS
    - _Requirements: 5.2, 5.3_
  
  - [x] 10.4 Create `src/app/[locale]/auth/complete-account/components/field-editor.tsx`
    - Add inline editing for pre-filled fields
    - Add save/cancel buttons
    - Add real-time validation
    - Display error messages
    - Style with Tailwind CSS
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [x] 10.5 Create `src/app/[locale]/auth/complete-account/components/data-summary.tsx`
    - Display all data in read-only format
    - Add section headers (Pre-filled Data, New Fields)
    - Format data appropriately (mask password, format phone)
    - Style with Tailwind CSS
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 10.6 Create `src/app/[locale]/auth/complete-account/steps/step-1-prefilled.tsx`
    - Display email field (read-only initially, editable on click)
    - Display name field (editable)
    - Display profile picture from OAuth
    - Add "Edit" button for each field
    - Add inline validation
    - Add "Continue" button to proceed to Step 2
    - Style with Tailwind CSS
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [x] 10.7 Create `src/app/[locale]/auth/complete-account/steps/step-2-new-fields.tsx`
    - Add password input with strength indicator
    - Add phone number input with international format placeholder
    - Add birth date input with date picker
    - Add real-time validation for all fields
    - Display error messages below each field
    - Add "Continue to Verification" button (enabled when all valid)
    - Style with Tailwind CSS
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [x] 10.8 Create `src/app/[locale]/auth/complete-account/steps/step-3-verification.tsx`
    - Display all data in read-only format using DataSummary component
    - Add "Edit" buttons for each section (returns to Step 1 or 2)
    - Add "Complete Account Setup" button
    - Display success message after submission
    - Handle loading state during submission
    - Handle error state with error messages
    - Style with Tailwind CSS
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 10.9 Create `src/app/[locale]/auth/complete-account/complete-account-form.tsx`
    - Integrate useAccountCompletion hook
    - Render ProgressIndicator component
    - Conditionally render Step 1, 2, or 3 based on currentStep
    - Handle step navigation
    - Handle form submission
    - Display loading and error states
    - Style with Tailwind CSS
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [x] 10.10 Create `src/app/[locale]/auth/complete-account/page.tsx`
    - Render CompleteAccountForm component
    - Add page metadata (title, description)
    - Add locale support
    - Add "Back to Login" link
    - Handle loading state while fetching temp token
    - Handle error state if temp token is invalid/expired
    - Style with Tailwind CSS
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Add internationalization support
  - [x] 12.1 Update `src/locales/en/auth.json` with account completion translations
    - Add completeAccount section with all translation keys
    - Add step1, step2, step3 subsections
    - Add error messages for all validation scenarios
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [x] 12.2 Update `src/locales/pt-BR/auth.json` with Portuguese translations
    - Translate all account completion keys to Portuguese
    - Verify translations are accurate and natural
    - _Requirements: 10.1, 10.2, 10.7_
  
  - [x] 12.3 Update `src/locales/es/auth.json` with Spanish translations
    - Translate all account completion keys to Spanish
    - Verify translations are accurate and natural
    - _Requirements: 10.1, 10.2, 10.7_
  
  - [x] 12.4 Update `src/locales/de/auth.json` with German translations
    - Translate all account completion keys to German
    - Verify translations are accurate and natural
    - _Requirements: 10.1, 10.2, 10.7_
  
  - [x] 12.5 Write integration tests for multilingual support
    - Test account completion in English
    - Test account completion in Portuguese
    - Test account completion in Spanish
    - Test account completion in German
    - Test locale switching during flow
    - Verify error messages display in correct locale
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 13. Add audit logging
  - [x] 13.1 Update `src/lib/auth/audit-logging.ts` with account completion logging
    - Implement `logAccountCompletion()` - logs successful completions
    - Implement `logAccountCompletionFailed()` - logs failed attempts
    - Include user ID, email, IP address, timestamp, error details
    - _Requirements: 8.7_

- [x] 14. End-to-end integration testing
  - [x] 14.1 Write E2E test for complete account flow
    - Test OAuth callback returns requiresPassword with tempToken
    - Test user accesses completion page successfully
    - Test user completes Step 1 (pre-filled data review)
    - Test user completes Step 2 (new required fields)
    - Test user completes Step 3 (verification)
    - Test form submission creates session
    - Test redirect to dashboard after completion
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  
  - [x] 14.2 Write E2E test for middleware redirect behavior
    - Test incomplete account is redirected to completion flow
    - Test complete account can access dashboard
    - Test expired session redirects to login
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 14.3 Write E2E test for duplicate email prevention
    - Test cannot complete account with existing email
    - Test error response is 409 Conflict
    - Test database state unchanged after failed attempt
    - _Requirements: 4.4, 4.5, 6.6, 8.4_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- All code should be compatible with both cloud and local versions
- All UI components should support multilingual content (EN, PT-BR, ES, DE)
- All UI components should be accessible (WCAG 2.1 AA)
- All database operations should include error handling and logging
- All API endpoints should include rate limiting and security headers
