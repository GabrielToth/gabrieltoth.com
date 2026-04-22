# Account Completion Flow - Requirements Document

## Introduction

This document specifies the requirements for the Account Completion Flow feature, which enables legacy users who registered via OAuth (Google, Facebook, TikTok) without passwords to complete their account setup. The flow combines registration and verification concepts, allowing users to view pre-filled data, edit it if needed, and add required fields (password, phone number, birth date) before final verification.

This feature addresses Issue #41 and is critical for user onboarding and account security, ensuring all legacy users have complete account information and secure password protection.

## Glossary

- **Legacy User**: A user who registered via OAuth provider (Google, Facebook, TikTok) but does not have a password linked to their account
- **Account Completion Flow**: The multi-step process where legacy users complete missing account data
- **Pre-filled Data**: User information already available from OAuth provider (email, name, profile picture)
- **Temporary Token**: A short-lived JWT token used to maintain context during the account completion process
- **Account Completion Status**: A database flag indicating whether a user has completed the account setup process
- **Verification Step**: The final confirmation step where users review all data before submission
- **Middleware**: Server-side logic that intercepts requests and redirects incomplete accounts
- **Password Hash**: Securely hashed password stored in the database
- **Phone Number**: User's contact phone number in international format
- **Birth Date**: User's date of birth in ISO 8601 format (YYYY-MM-DD)
- **Locale**: Language/region setting (EN, PT-BR, ES, DE)
- **Session**: Authenticated user session with HTTP-only cookie
- **Dashboard**: Main application interface after successful authentication

## Requirements

### Requirement 1: Detect Incomplete Accounts

**User Story:** As a system administrator, I want incomplete accounts to be automatically detected, so that legacy users are properly identified and guided through account completion.

#### Acceptance Criteria

1. WHEN a user logs in via OAuth, THE System SHALL check if the user has a password_hash in the database
2. IF a user does not have a password_hash, THE System SHALL mark the account as incomplete
3. WHEN an incomplete account is detected, THE System SHALL generate a temporary token containing the user's OAuth data
4. THE temporary token SHALL expire after 30 minutes of inactivity
5. WHEN a user with an incomplete account attempts to access protected routes, THE System SHALL redirect them to the account completion flow

### Requirement 2: Intercept Incomplete Accounts with Middleware

**User Story:** As a developer, I want middleware to automatically intercept incomplete accounts, so that users cannot bypass the account completion flow.

#### Acceptance Criteria

1. WHEN a request is made to a protected route, THE Middleware SHALL check if the user has an active session
2. IF the user has an active session but no password_hash, THE Middleware SHALL redirect to `/[locale]/auth/complete-account`
3. WHEN a user is redirected, THE Middleware SHALL preserve the temporary token in the session
4. IF the temporary token is expired, THE Middleware SHALL redirect to the login page with an error message
5. THE Middleware SHALL allow access to the account completion flow without requiring a full session

### Requirement 3: Display Account Completion UI with Pre-filled Data

**User Story:** As a legacy user, I want to see my existing account information pre-filled, so that I can quickly complete my account setup.

#### Acceptance Criteria

1. WHEN a user accesses the account completion page, THE UI SHALL display all pre-filled data from the OAuth provider (email, name, profile picture)
2. THE UI SHALL display the account completion form with sections for: Pre-filled Data, New Required Fields, and Verification
3. WHEN the page loads, THE UI SHALL display a progress indicator showing the current step (1 of 3: Pre-filled Data, 2 of 3: New Fields, 3 of 3: Verification)
4. THE UI SHALL display the user's profile picture from the OAuth provider if available
5. THE UI SHALL display all form fields in the user's selected locale (EN, PT-BR, ES, DE)
6. WHEN the page loads, THE UI SHALL display a "Back to Login" link for users who want to cancel

### Requirement 4: Allow Users to Edit Pre-filled Data

**User Story:** As a legacy user, I want to edit my pre-filled data if it's incorrect, so that my account information is accurate.

#### Acceptance Criteria

1. WHEN a user views the pre-filled data section, THE UI SHALL display an "Edit" button for each pre-filled field
2. WHEN a user clicks "Edit", THE UI SHALL enable the corresponding field for editing
3. WHEN a user edits a field, THE UI SHALL validate the input in real-time
4. WHEN a user edits the email field, THE System SHALL check if the new email is already registered
5. IF the new email is already registered, THE System SHALL display an error message: "This email is already in use"
6. WHEN a user edits the name field, THE System SHALL validate that the name is between 2 and 100 characters
7. WHEN a user completes editing, THE UI SHALL display a "Save Changes" button
8. WHEN a user clicks "Save Changes", THE UI SHALL update the pre-filled data section and move to the next step

### Requirement 5: Require New Fields (Password, Phone, Birth Date)

**User Story:** As a system administrator, I want to require new fields for account completion, so that user accounts have complete and secure information.

#### Acceptance Criteria

1. WHEN a user reaches the "New Required Fields" step, THE UI SHALL display three required fields: Password, Phone Number, and Birth Date
2. WHEN a user enters a password, THE System SHALL validate that the password meets security requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (!@#$%^&*)
3. WHEN a user enters an invalid password, THE System SHALL display a real-time validation message
4. WHEN a user enters a phone number, THE System SHALL validate that it is in international format (e.g., +1234567890)
5. IF the phone number is invalid, THE System SHALL display an error message: "Please enter a valid international phone number"
6. WHEN a user enters a birth date, THE System SHALL validate that:
   - The date is in ISO 8601 format (YYYY-MM-DD)
   - The user is at least 13 years old
   - The date is not in the future
7. IF the birth date is invalid, THE System SHALL display an error message with the specific validation failure reason
8. WHEN all three fields are valid, THE UI SHALL enable the "Continue to Verification" button

### Requirement 6: Validate All Data Before Submission

**User Story:** As a system administrator, I want all data to be validated before submission, so that the database contains only valid and complete information.

#### Acceptance Criteria

1. WHEN a user submits the account completion form, THE System SHALL validate all fields on the server side
2. WHEN validation fails, THE System SHALL return a 400 error with specific field-level error messages
3. WHEN validation passes, THE System SHALL proceed to the verification step
4. THE System SHALL validate that no required fields are empty
5. THE System SHALL validate that all field formats match their specifications
6. WHEN a user attempts to submit with a duplicate email, THE System SHALL return a 409 Conflict error
7. WHEN a user attempts to submit with invalid data, THE System SHALL NOT modify the database

### Requirement 7: Final Verification/Confirmation Step

**User Story:** As a legacy user, I want to review all my account information before final submission, so that I can confirm everything is correct.

#### Acceptance Criteria

1. WHEN a user reaches the verification step, THE UI SHALL display all account information in a read-only format
2. THE UI SHALL display sections for: Pre-filled Data, New Required Fields, and a summary of all information
3. WHEN a user reviews the information, THE UI SHALL display "Edit" buttons for each section to allow corrections
4. WHEN a user clicks "Edit", THE UI SHALL return to the corresponding step (Pre-filled Data or New Fields)
5. WHEN a user confirms the information is correct, THE UI SHALL display a "Complete Account Setup" button
6. WHEN a user clicks "Complete Account Setup", THE System SHALL submit all data to the API endpoint
7. WHEN submission is successful, THE System SHALL display a success message: "Account setup completed successfully"
8. WHEN submission is successful, THE System SHALL create a session and redirect to the dashboard

### Requirement 8: Create API Endpoint for Account Completion

**User Story:** As a frontend developer, I want a dedicated API endpoint for account completion, so that I can submit account data securely.

#### Acceptance Criteria

1. THE System SHALL provide a POST endpoint at `/api/auth/complete-account`
2. WHEN a request is made to the endpoint, THE System SHALL validate the temporary token in the request headers
3. IF the temporary token is invalid or expired, THE System SHALL return a 401 Unauthorized error
4. WHEN a valid request is received, THE System SHALL validate all submitted data
5. WHEN validation passes, THE System SHALL update the user record with:
   - password_hash (hashed password)
   - phone_number
   - birth_date
   - account_completed_at (current timestamp)
   - account_completion_status = 'completed'
6. WHEN the user record is updated, THE System SHALL create a new session
7. WHEN the session is created, THE System SHALL return a 200 OK response with the session cookie
8. WHEN an error occurs, THE System SHALL return appropriate HTTP status codes (400, 401, 409, 500)

### Requirement 9: Database Migration for Account Completion Status

**User Story:** As a database administrator, I want to track account completion status, so that I can monitor user onboarding progress.

#### Acceptance Criteria

1. THE System SHALL add a new column `account_completion_status` to the users table with values: 'pending', 'in_progress', 'completed'
2. THE System SHALL add a new column `account_completed_at` to the users table to store the completion timestamp
3. THE System SHALL add a new column `phone_number` to the users table to store the user's phone number
4. THE System SHALL add a new column `birth_date` to the users table to store the user's birth date
5. WHEN a legacy user is detected, THE System SHALL set `account_completion_status` to 'pending'
6. WHEN a user starts the account completion flow, THE System SHALL set `account_completion_status` to 'in_progress'
7. WHEN a user completes the account setup, THE System SHALL set `account_completion_status` to 'completed' and populate `account_completed_at`
8. THE System SHALL create an index on `account_completion_status` for efficient querying

### Requirement 10: Multilingual Support

**User Story:** As an international user, I want the account completion flow to be available in my language, so that I can complete my account setup comfortably.

#### Acceptance Criteria

1. WHEN a user accesses the account completion page, THE System SHALL display all text in the user's selected locale
2. THE System SHALL support four languages: English (EN), Portuguese (PT-BR), Spanish (ES), and German (DE)
3. WHEN a user changes their locale preference, THE System SHALL update the page language in real-time
4. THE System SHALL translate all form labels, placeholders, error messages, and success messages
5. WHEN validation errors occur, THE System SHALL display error messages in the user's selected locale
6. WHEN the user completes account setup, THE System SHALL display the success message in the user's selected locale
7. THE System SHALL store locale preference in the user's session and database

### Requirement 11: Property-Based Tests for Account Completion Logic

**User Story:** As a quality assurance engineer, I want property-based tests to validate account completion logic, so that edge cases and unexpected inputs are properly handled.

#### Acceptance Criteria

1. THE System SHALL have property-based tests that validate password strength requirements with random inputs
2. THE System SHALL have property-based tests that validate phone number format with random international formats
3. THE System SHALL have property-based tests that validate birth date calculations with random dates
4. THE System SHALL have property-based tests that validate email uniqueness checks with random email variations
5. THE System SHALL have property-based tests that validate the round-trip property: data submitted → stored → retrieved equals original
6. THE System SHALL have property-based tests that validate idempotence: submitting the same data twice produces the same result
7. THE System SHALL have property-based tests that validate data integrity: all required fields are persisted correctly
8. WHEN property-based tests run, THE System SHALL execute at least 100 iterations per test to ensure comprehensive coverage

