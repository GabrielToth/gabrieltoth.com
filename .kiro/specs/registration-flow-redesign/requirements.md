# Requirements Document - Registration Flow Redesign

## Introduction

This document specifies the requirements for redesigning the user registration flow. The redesign introduces a dual-authentication entry point allowing users to choose between email/password registration or Google OAuth authentication. The flow maintains visual consistency with the login interface (dark blue background, dark card styling, blue buttons) and guides users through a multi-step process to collect essential account information. The registration flow hides the main menu during the registration process to minimize distractions and provide a focused user experience. The system supports both email-based and Google OAuth-based registration paths, with Google's pre-filled name field and additional required fields for complete user profiles.

## Glossary

- **Registration_Flow**: The multi-step process for creating a new user account
- **User**: A person creating a new account in the system
- **Authentication_Entry**: The initial screen presenting authentication method choices
- **Email_Registration**: Registration path using email and password
- **Google_OAuth**: Registration path using Google authentication
- **OAuth_Provider**: Third-party authentication service (Google)
- **Email**: The user's email address used as the primary account identifier
- **Password**: The user's secret credential for email/password authentication
- **Full_Name**: The user's complete name (first and last name)
- **Birth_Date**: The user's date of birth
- **Phone**: The user's phone number for contact purposes
- **Verification_Step**: The step where users review and confirm all entered data before account creation
- **Account**: The user's profile and associated data in the system
- **Linked_Email**: An email address associated with a Google OAuth account
- **Primary_Authentication**: Email and password as the main authentication method
- **Social_Login**: Authentication using OAuth providers (Google)
- **Data_Validation**: Process of verifying that entered data meets required format and quality standards
- **Account_Creation**: The final step that persists the user account to the database
- **Cloud_Version**: The application deployed on a remote server (Vercel, AWS, etc.)
- **Local_Version**: The application running on a developer's local machine
- **Menu**: The main navigation menu of the application
- **Visual_Style**: The design system including colors, typography, spacing, and components
- **Dark_Theme**: Dark blue background (#1a1f3a or similar), dark cards, light text
- **Primary_Button_Color**: Blue color (#0070F3 or similar) for primary actions
- **Session**: A user's temporary state during the registration process

## Requirements

### Requirement 1: Authentication Entry Point - Dual Method Selection

**User Story:** As a new user, I want to choose between email and Google authentication, so that I can register using my preferred method.

#### Acceptance Criteria

1. THE Registration_Flow SHALL display an Authentication_Entry screen as the first step
2. THE Authentication_Entry SHALL display two prominent buttons: "Sign up with Email" and "Sign up with Google"
3. THE Authentication_Entry SHALL display the platform logo or branding
4. THE Authentication_Entry SHALL use the Dark_Theme styling (dark blue background, dark card, light text)
5. THE Authentication_Entry SHALL use Primary_Button_Color (#0070F3) for both buttons
6. WHEN a user clicks "Sign up with Email", THE Registration_Flow SHALL navigate to the email registration path
7. WHEN a user clicks "Sign up with Google", THE Registration_Flow SHALL initiate Google OAuth authentication
8. THE Authentication_Entry SHALL display a "Back to Login" link to return to the login page
9. THE Authentication_Entry SHALL be responsive on all viewport sizes

### Requirement 2: Email Registration Path - Email Input Step

**User Story:** As a new user choosing email registration, I want to enter my email address, so that I can create an account linked to my email.

#### Acceptance Criteria

1. THE Registration_Flow SHALL display an email input step after the user selects "Sign up with Email"
2. THE Registration_Flow SHALL display a label "Email Address" for the email field
3. WHEN a user enters an email, THE Registration_Flow SHALL validate the email format
4. IF the email format is invalid, THEN THE Registration_Flow SHALL display an error message "Please enter a valid email address"
5. WHEN a user enters an email that already exists, THE Registration_Flow SHALL display an error message "This email is already registered"
6. WHEN a user enters a valid and unique email, THE Registration_Flow SHALL enable the "Next" button
7. THE Registration_Flow SHALL display a "Next" button to proceed to the next step
8. THE Registration_Flow SHALL display a "Back" button to return to the Authentication_Entry
9. THE Registration_Flow SHALL store the email in the Session
10. THE Registration_Flow SHALL use the Dark_Theme styling consistent with the login page

### Requirement 3: Email Registration Path - Password Setup Step

**User Story:** As a new user, I want to set a secure password, so that I can authenticate using email and password.

#### Acceptance Criteria

1. THE Registration_Flow SHALL display a password setup step after email validation
2. THE Registration_Flow SHALL display a label "Password" for the password field
3. THE Registration_Flow SHALL display password requirements: minimum 8 characters, at least one uppercase letter, at least one number, at least one special character
4. WHEN a user enters a password, THE Registration_Flow SHALL validate the password against the requirements
5. IF the password does not meet requirements, THEN THE Registration_Flow SHALL display specific error messages for each unmet requirement
6. THE Registration_Flow SHALL display a password strength indicator (Weak, Fair, Good, Strong)
7. THE Registration_Flow SHALL display a "Show/Hide Password" toggle to reveal or hide the password
8. THE Registration_Flow SHALL display a password confirmation field with label "Confirm Password"
9. WHEN the password and confirmation do not match, THE Registration_Flow SHALL display an error message "Passwords do not match"
10. WHEN a user enters a valid password that matches the confirmation, THE Registration_Flow SHALL enable the "Next" button
11. THE Registration_Flow SHALL store the password in the Session (encrypted in transit)
12. THE Registration_Flow SHALL use the Dark_Theme styling consistent with the login page

### Requirement 4: Email Registration Path - Personal Information Step

**User Story:** As a new user, I want to provide my personal information, so that my account has complete profile details.

#### Acceptance Criteria

1. THE Registration_Flow SHALL display a personal information step after password setup
2. THE Registration_Flow SHALL display a "Full Name" input field with label "Full Name"
3. WHEN a user enters a name, THE Registration_Flow SHALL validate that the name is not empty
4. IF the name is empty, THEN THE Registration_Flow SHALL display an error message "Full name is required"
5. THE Registration_Flow SHALL validate that the name contains at least 2 characters
6. IF the name contains less than 2 characters, THEN THE Registration_Flow SHALL display an error message "Full name must contain at least 2 characters"
7. THE Registration_Flow SHALL display a "Birth Date" input field with label "Birth Date"
8. WHEN a user enters a birth date, THE Registration_Flow SHALL validate the date format
9. IF the birth date format is invalid, THEN THE Registration_Flow SHALL display an error message "Please enter a valid date (DD/MM/YYYY)"
10. THE Registration_Flow SHALL validate that the user is at least 13 years old
11. IF the user is less than 13 years old, THEN THE Registration_Flow SHALL display an error message "You must be at least 13 years old to register"
12. THE Registration_Flow SHALL display a "Phone Number" input field with label "Phone Number"
13. WHEN a user enters a phone number, THE Registration_Flow SHALL validate the phone format
14. IF the phone format is invalid, THEN THE Registration_Flow SHALL display an error message "Please enter a valid phone number"
15. THE Registration_Flow SHALL support international phone number formats
16. WHEN a user enters valid name, birth date, and phone, THE Registration_Flow SHALL enable the "Next" button
17. THE Registration_Flow SHALL store the personal information in the Session
18. THE Registration_Flow SHALL use the Dark_Theme styling consistent with the login page

### Requirement 5: Google OAuth Registration Path - OAuth Authorization

**User Story:** As a new user choosing Google authentication, I want to authorize with my Google account, so that I can register using my existing Google credentials.

#### Acceptance Criteria

1. WHEN a user clicks "Sign up with Google", THE Registration_Flow SHALL redirect to Google OAuth authorization
2. THE Registration_Flow SHALL request the following scopes from Google: email, profile
3. WHEN the user authorizes the application, THE Registration_Flow SHALL receive the authorization code
4. THE Registration_Flow SHALL exchange the authorization code for an access token
5. WHEN authorization succeeds, THE Registration_Flow SHALL extract the user's email and name from Google
6. THE Registration_Flow SHALL store the email and name in the Session
7. WHEN authorization fails, THE Registration_Flow SHALL display an error message "Google authorization failed. Please try again."
8. THE Registration_Flow SHALL provide a "Try Again" button to retry authorization
9. THE Registration_Flow SHALL provide a "Back" button to return to the Authentication_Entry

### Requirement 6: Google OAuth Registration Path - Personal Information Step

**User Story:** As a new user using Google OAuth, I want to confirm and complete my profile information, so that my account has all necessary details.

#### Acceptance Criteria

1. WHEN Google OAuth authorization succeeds, THE Registration_Flow SHALL display a personal information step
2. THE Registration_Flow SHALL display a "Full Name" input field with label "Full Name"
3. THE Registration_Flow SHALL pre-fill the "Full Name" field with the name from Google
4. THE Registration_Flow SHALL allow the user to edit the pre-filled name
5. WHEN a user enters a name, THE Registration_Flow SHALL validate that the name is not empty
6. IF the name is empty, THEN THE Registration_Flow SHALL display an error message "Full name is required"
7. THE Registration_Flow SHALL display a "Birth Date" input field with label "Birth Date"
8. WHEN a user enters a birth date, THE Registration_Flow SHALL validate the date format
9. IF the birth date format is invalid, THEN THE Registration_Flow SHALL display an error message "Please enter a valid date (DD/MM/YYYY)"
10. THE Registration_Flow SHALL validate that the user is at least 13 years old
11. IF the user is less than 13 years old, THEN THE Registration_Flow SHALL display an error message "You must be at least 13 years old to register"
12. THE Registration_Flow SHALL display a "Phone Number" input field with label "Phone Number"
13. WHEN a user enters a phone number, THE Registration_Flow SHALL validate the phone format
14. IF the phone format is invalid, THEN THE Registration_Flow SHALL display an error message "Please enter a valid phone number"
15. THE Registration_Flow SHALL support international phone number formats
16. WHEN a user enters valid name, birth date, and phone, THE Registration_Flow SHALL enable the "Next" button
17. THE Registration_Flow SHALL store the personal information in the Session
18. THE Registration_Flow SHALL use the Dark_Theme styling consistent with the login page

### Requirement 7: Registration Flow - Data Verification Step

**User Story:** As a new user, I want to review all my entered information before account creation, so that I can verify everything is correct.

#### Acceptance Criteria

1. THE Registration_Flow SHALL display a verification step showing all previously entered data
2. THE Registration_Flow SHALL display the email address in a read-only format
3. THE Registration_Flow SHALL display the full name in a read-only format
4. THE Registration_Flow SHALL display the birth date in a read-only format
5. THE Registration_Flow SHALL display the phone number in a read-only format
6. FOR email registration path, THE Registration_Flow SHALL NOT display the password in plain text
7. FOR email registration path, THE Registration_Flow SHALL display a message "Password is set and secured" instead of the password
8. THE Registration_Flow SHALL display an "Edit" button for each field to allow corrections
9. WHEN a user clicks "Edit" for a field, THE Registration_Flow SHALL navigate back to the corresponding step
10. THE Registration_Flow SHALL display a "Create Account" button to proceed with account creation
11. THE Registration_Flow SHALL display a "Back" button to return to the previous step
12. THE Registration_Flow SHALL use the Dark_Theme styling consistent with the login page

### Requirement 8: Registration Flow - Account Creation

**User Story:** As a new user, I want my account to be created with all my information, so that I can start using the platform.

#### Acceptance Criteria

1. WHEN a user clicks "Create Account", THE Registration_Flow SHALL validate all data one final time
2. IF validation fails, THEN THE Registration_Flow SHALL display error messages and prevent account creation
3. WHEN validation succeeds, THE Registration_Flow SHALL create the account in the database
4. FOR email registration path, THE Registration_Flow SHALL hash the password using a secure algorithm (bcrypt or equivalent)
5. THE Registration_Flow SHALL store the email, full name, birth date, and phone in the database
6. FOR Google OAuth path, THE Registration_Flow SHALL store the Google OAuth token for future authentication
7. WHEN account creation succeeds, THE Registration_Flow SHALL display a success message "Account created successfully"
8. WHEN account creation succeeds, THE Registration_Flow SHALL redirect to the login page after 2 seconds
9. IF account creation fails, THEN THE Registration_Flow SHALL display an error message "Account creation failed. Please try again."
10. THE Registration_Flow SHALL log account creation events for audit purposes

### Requirement 9: Registration Flow - Menu Visibility

**User Story:** As a user, I want the main menu to be hidden during registration, so that I can focus on completing the registration process.

#### Acceptance Criteria

1. WHEN a user is on the Authentication_Entry screen, THE Menu SHALL be hidden
2. WHEN a user is on any registration step, THE Menu SHALL be hidden
3. WHEN a user is on the verification step, THE Menu SHALL be hidden
4. WHEN account creation succeeds and the user is redirected to login, THE Menu SHALL remain hidden
5. WHEN a user clicks "Back to Login" or "Cancel", THE Menu SHALL be displayed on the login page
6. THE Menu SHALL be displayed on all other pages of the application

### Requirement 10: Registration Flow - Visual Design Consistency

**User Story:** As a designer, I want the registration flow to match the login page styling, so that the user experience is consistent.

#### Acceptance Criteria

1. THE Registration_Flow SHALL use the Dark_Theme styling (dark blue background, dark cards, light text)
2. THE Registration_Flow SHALL use Primary_Button_Color (#0070F3) for primary action buttons
3. THE Registration_Flow SHALL use consistent spacing and typography with the login page
4. THE Registration_Flow SHALL display the platform logo or branding at the top of each step
5. THE Registration_Flow SHALL display a progress indicator showing current step and total steps
6. THE Registration_Flow SHALL use consistent card styling with the login page
7. THE Registration_Flow SHALL use consistent input field styling with the login page
8. THE Registration_Flow SHALL use consistent error message styling with the login page
9. THE Registration_Flow SHALL use consistent button styling with the login page

### Requirement 11: Registration Flow - Responsive Design

**User Story:** As a user, I want the registration flow to work on all devices, so that I can register from any device.

#### Acceptance Criteria

1. THE Registration_Flow SHALL be responsive on desktop viewports (≥1024px width)
2. THE Registration_Flow SHALL be responsive on tablet viewports (768px to 1023px width)
3. THE Registration_Flow SHALL be responsive on mobile viewports (<768px width)
4. WHEN the viewport width is less than 768px, THE Registration_Flow SHALL display content in a single-column layout
5. THE Registration_Flow SHALL display all content without horizontal scrolling on all viewports
6. THE Registration_Flow SHALL display touch-friendly button sizes (minimum 44x44px) on mobile
7. THE Registration_Flow SHALL display readable text sizes on all viewports (minimum 16px)

### Requirement 12: Registration Flow - Accessibility

**User Story:** As an accessibility advocate, I want the registration flow to be accessible, so that all users can register.

#### Acceptance Criteria

1. THE Registration_Flow SHALL meet WCAG 2.1 AA color contrast requirements
2. THE Registration_Flow SHALL provide keyboard navigation for all interactive elements
3. THE Registration_Flow SHALL display focus indicators for keyboard navigation
4. THE Registration_Flow SHALL use semantic HTML elements (form, input, button, label, etc.)
5. THE Registration_Flow SHALL include ARIA labels for all input fields
6. THE Registration_Flow SHALL include ARIA descriptions for password requirements
7. THE Registration_Flow SHALL support screen reader navigation
8. THE Registration_Flow SHALL associate form labels with input fields using the "for" attribute

### Requirement 13: Registration Flow - Error Handling

**User Story:** As a user, I want clear error messages, so that I can understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN validation fails, THE Registration_Flow SHALL display specific error messages for each field
2. THE Registration_Flow SHALL display error messages near the corresponding input field
3. THE Registration_Flow SHALL display error messages in a clear, user-friendly language
4. THE Registration_Flow SHALL NOT display technical error messages to users
5. WHEN an API request fails, THE Registration_Flow SHALL display a user-friendly error message
6. THE Registration_Flow SHALL provide a retry option for failed operations
7. THE Registration_Flow SHALL display loading states during API requests

### Requirement 14: Registration Flow - Session Management

**User Story:** As a system, I want to manage registration sessions, so that I can prevent data loss and ensure security.

#### Acceptance Criteria

1. THE Registration_Flow SHALL store registration data in a secure Session
2. THE Registration_Flow SHALL expire registration Sessions after 30 minutes of inactivity
3. WHEN a Session expires, THE Registration_Flow SHALL display a message and require the user to start over
4. THE Registration_Flow SHALL clear registration data when the user cancels or completes registration
5. THE Registration_Flow SHALL NOT store sensitive data (passwords) in browser local storage
6. THE Registration_Flow SHALL use secure, HTTP-only cookies for Session management

### Requirement 15: Registration Flow - Data Validation - Email Format

**User Story:** As a system, I want to validate email addresses, so that I can ensure data quality.

#### Acceptance Criteria

1. THE Registration_Flow SHALL validate email format using RFC 5322 standard
2. THE Registration_Flow SHALL reject emails with invalid format
3. THE Registration_Flow SHALL reject emails that are already registered
4. THE Registration_Flow SHALL accept emails with common top-level domains (.com, .org, .net, etc.)
5. THE Registration_Flow SHALL accept emails with country-specific domains (.co.uk, .com.br, etc.)

### Requirement 16: Registration Flow - Data Validation - Phone Format

**User Story:** As a system, I want to validate phone numbers, so that I can ensure data quality.

#### Acceptance Criteria

1. THE Registration_Flow SHALL validate phone numbers using international format standards
2. THE Registration_Flow SHALL accept phone numbers with country codes
3. THE Registration_Flow SHALL accept phone numbers with or without formatting characters (spaces, hyphens, parentheses)
4. THE Registration_Flow SHALL normalize phone numbers to a standard format for storage
5. THE Registration_Flow SHALL reject phone numbers with invalid format

### Requirement 17: Registration Flow - Data Validation - Full Name

**User Story:** As a system, I want to validate personal names, so that I can ensure data quality.

#### Acceptance Criteria

1. THE Registration_Flow SHALL validate that full name is not empty
2. THE Registration_Flow SHALL validate that full name contains at least 2 characters
3. THE Registration_Flow SHALL accept names with letters, spaces, hyphens, and apostrophes
4. THE Registration_Flow SHALL reject names with only numbers or special characters
5. THE Registration_Flow SHALL trim whitespace from names before storage

### Requirement 18: Registration Flow - Data Validation - Birth Date

**User Story:** As a system, I want to validate birth dates, so that I can ensure data quality and age compliance.

#### Acceptance Criteria

1. THE Registration_Flow SHALL validate birth date format (DD/MM/YYYY)
2. THE Registration_Flow SHALL reject invalid dates (e.g., 32/13/2000)
3. THE Registration_Flow SHALL validate that the user is at least 13 years old
4. THE Registration_Flow SHALL reject birth dates in the future
5. THE Registration_Flow SHALL accept birth dates up to 120 years in the past

### Requirement 19: Registration Flow - Password Security

**User Story:** As a security-conscious user, I want my password to be secure, so that my account is protected.

#### Acceptance Criteria

1. THE Registration_Flow SHALL enforce password requirements: minimum 8 characters, uppercase, number, special character
2. THE Registration_Flow SHALL NOT store passwords in plain text
3. THE Registration_Flow SHALL hash passwords using bcrypt with a minimum cost factor of 10
4. THE Registration_Flow SHALL NOT transmit passwords over unencrypted connections (HTTPS only)
5. THE Registration_Flow SHALL NOT log passwords in any logs or error messages
6. THE Registration_Flow SHALL display password strength feedback to guide users

### Requirement 20: Registration Flow - Security - HTTPS Enforcement

**User Story:** As a security-conscious user, I want my data to be transmitted securely, so that my information is protected.

#### Acceptance Criteria

1. THE Registration_Flow SHALL only accept HTTPS connections
2. THE Registration_Flow SHALL redirect HTTP requests to HTTPS
3. THE Registration_Flow SHALL use secure headers (HSTS, CSP, etc.)
4. THE Registration_Flow SHALL NOT transmit sensitive data over unencrypted connections

### Requirement 21: Registration Flow - Security - Rate Limiting

**User Story:** As a system administrator, I want to prevent brute force attacks, so that I can protect user accounts.

#### Acceptance Criteria

1. THE Registration_Flow SHALL implement rate limiting on email validation endpoint
2. THE Registration_Flow SHALL limit email validation requests to 5 per minute per IP address
3. THE Registration_Flow SHALL implement rate limiting on account creation endpoint
4. THE Registration_Flow SHALL limit account creation requests to 3 per hour per IP address
5. WHEN rate limit is exceeded, THE Registration_Flow SHALL display an error message "Too many requests. Please try again later."
6. THE Registration_Flow SHALL log rate limit violations for security monitoring

### Requirement 22: Registration Flow - Logging and Audit

**User Story:** As a system administrator, I want to log registration events, so that I can audit user account creation.

#### Acceptance Criteria

1. THE Registration_Flow SHALL log successful account creation events
2. THE Registration_Flow SHALL log failed account creation attempts
3. THE Registration_Flow SHALL log Google OAuth authorization events
4. THE Registration_Flow SHALL include timestamp, email, and status in log entries
5. THE Registration_Flow SHALL NOT log passwords or sensitive data
6. THE Registration_Flow SHALL store logs securely and retain them for at least 90 days

### Requirement 23: Registration Flow - Compatibility - Cloud and Local Versions

**User Story:** As a developer, I want the registration flow to work in both cloud and local versions, so that I can test and deploy consistently.

#### Acceptance Criteria

1. THE Registration_Flow SHALL work in the Cloud_Version (deployed on Vercel, AWS, etc.)
2. THE Registration_Flow SHALL work in the Local_Version (running locally with npm run dev)
3. THE Registration_Flow SHALL use environment variables for API endpoints
4. WHEN running in Cloud_Version, THE Registration_Flow SHALL use the production API endpoint
5. WHEN running in Local_Version, THE Registration_Flow SHALL use the local API endpoint
6. THE Registration_Flow SHALL handle both HTTP and HTTPS connections appropriately
7. THE Registration_Flow SHALL work with both remote and local databases

### Requirement 24: Registration Flow - API Integration - User Creation Endpoint

**User Story:** As a developer, I want to integrate with the user creation API, so that I can persist user data.

#### Acceptance Criteria

1. THE Registration_Flow SHALL call a POST endpoint to create a new user
2. THE endpoint SHALL accept email, password (for email registration), full name, birth date, and phone as parameters
3. FOR Google OAuth registration, THE endpoint SHALL accept email, full name, birth date, phone, and Google OAuth token
4. THE endpoint SHALL validate all parameters before creating the user
5. THE endpoint SHALL return a success response with the created user ID
6. THE endpoint SHALL return an error response with a descriptive error message if creation fails
7. THE endpoint SHALL return a 409 Conflict status if the email already exists
8. THE endpoint SHALL return a 400 Bad Request status if validation fails

### Requirement 25: Registration Flow - API Integration - Email Uniqueness Check

**User Story:** As a developer, I want to check email uniqueness before account creation, so that I can provide immediate feedback.

#### Acceptance Criteria

1. THE Registration_Flow SHALL call a GET endpoint to check if an email is already registered
2. THE endpoint SHALL accept the email as a query parameter
3. THE endpoint SHALL return a response indicating whether the email is available
4. THE endpoint SHALL return the response within 500ms
5. THE endpoint SHALL NOT create any records during the check

### Requirement 26: Registration Flow - API Integration - Google OAuth Endpoint

**User Story:** As a developer, I want to integrate with Google OAuth, so that I can authenticate users with Google.

#### Acceptance Criteria

1. THE Registration_Flow SHALL call a POST endpoint to exchange Google authorization code for access token
2. THE endpoint SHALL accept the authorization code as a parameter
3. THE endpoint SHALL exchange the code for an access token from Google
4. THE endpoint SHALL extract the user's email and name from Google
5. THE endpoint SHALL return a success response with the email and name
6. THE endpoint SHALL return an error response if the exchange fails
7. THE endpoint SHALL NOT store the access token in the response (store securely on server)

### Requirement 27: Registration Flow - Performance - Load Time

**User Story:** As a user, I want the registration form to load quickly, so that I can start registering without delays.

#### Acceptance Criteria

1. THE Registration_Flow SHALL load the initial Authentication_Entry within 2 seconds on a 4G connection
2. THE Registration_Flow SHALL display each registration step within 1 second
3. THE Registration_Flow SHALL validate email uniqueness within 500ms
4. THE Registration_Flow SHALL create an account within 3 seconds of clicking "Create Account"
5. THE Registration_Flow SHALL implement code splitting to reduce initial bundle size

### Requirement 28: Registration Flow - Future Milestone - Email Verification

**User Story:** As a platform administrator, I want to verify user email addresses, so that I can ensure users have valid email accounts.

#### Acceptance Criteria

1. WHEN an account is created, THE Registration_Flow SHALL send a verification email to the user's email address
2. THE verification email SHALL contain a unique verification link
3. THE verification email SHALL expire after 24 hours
4. WHEN a user clicks the verification link, THE Registration_Flow SHALL mark the email as verified
5. WHEN a user's email is not verified, THE Registration_Flow SHALL display a message prompting email verification
6. THE Registration_Flow SHALL allow users to request a new verification email

### Requirement 29: Registration Flow - Future Milestone - Additional OAuth Providers

**User Story:** As a user, I want to authenticate using multiple OAuth providers, so that I can use my preferred social account.

#### Acceptance Criteria

1. WHERE additional OAuth providers are enabled, THE Registration_Flow SHALL display additional provider buttons (GitHub, Microsoft, etc.)
2. WHEN a user authenticates with an OAuth provider, THE Registration_Flow SHALL extract the linked email
3. WHEN a user authenticates with an OAuth provider, THE Registration_Flow SHALL require providing personal information (name, birth date, phone)
4. WHEN a user authenticates with an OAuth provider, THE Registration_Flow SHALL follow the same verification step as email registration
5. THE Registration_Flow SHALL create an account with the provider's linked email as the primary email
6. THE Registration_Flow SHALL link the OAuth provider account to the user's account for future login

## Acceptance Criteria - Correctness Properties

### Property 1: Email Validation Consistency

**Property:** FOR ALL valid email addresses, email validation SHALL accept them consistently across all registration attempts.

**Rationale:** Email validation must be deterministic and consistent to prevent users from being rejected for valid emails.

**Test Type:** Property-based test with round-trip property

**Implementation:** Generate valid email addresses, validate them multiple times, verify all validations return the same result.

### Property 2: Password Hashing Idempotence

**Property:** FOR ALL passwords, hashing the same password multiple times SHALL produce different hashes (due to salt), but verification SHALL succeed for all hashes.

**Rationale:** Password hashing must use salts to prevent rainbow table attacks, but verification must work consistently.

**Test Type:** Property-based test with idempotence property

**Implementation:** Generate passwords, hash them multiple times, verify that each hash verifies correctly with the original password.

### Property 3: Personal Information Preservation

**Property:** FOR ALL valid personal information entered, the information stored in the database SHALL match the information entered (after normalization).

**Rationale:** User data must be preserved accurately through the registration process.

**Test Type:** Property-based test with round-trip property

**Implementation:** Generate valid names, birth dates, and phone numbers, store them, retrieve them, verify they match the original input.

### Property 4: Session Data Isolation

**Property:** FOR ALL concurrent registration sessions, session data from one session SHALL NOT leak into another session.

**Rationale:** Session data must be isolated to prevent data leakage between users.

**Test Type:** Property-based test with metamorphic property

**Implementation:** Create multiple concurrent sessions with different data, verify that each session's data remains isolated.

### Property 5: Age Validation Correctness

**Property:** FOR ALL birth dates, age validation SHALL correctly determine if the user is at least 13 years old.

**Rationale:** Age validation must be accurate to comply with legal requirements.

**Test Type:** Property-based test with invariant property

**Implementation:** Generate birth dates, validate age, verify that users under 13 are rejected and users 13+ are accepted.

### Property 6: Email Uniqueness Enforcement

**Property:** FOR ALL registered emails, attempting to register with the same email again SHALL fail with a 409 Conflict error.

**Rationale:** Email uniqueness must be enforced to prevent duplicate accounts.

**Test Type:** Property-based test with invariant property

**Implementation:** Register users with unique emails, attempt to register with duplicate emails, verify that duplicates are rejected.

### Property 7: Form Navigation Consistency

**Property:** FOR ALL registration paths (email and Google OAuth), navigating back and forward SHALL preserve previously entered data.

**Rationale:** Users must be able to navigate the form without losing data.

**Test Type:** Property-based test with idempotence property

**Implementation:** Enter data, navigate back and forward, verify that data is preserved at each step.

### Property 8: Error Message Clarity

**Property:** FOR ALL validation errors, error messages SHALL be specific to the field and provide actionable guidance.

**Rationale:** Error messages must help users understand and fix validation issues.

**Test Type:** Example-based test (not property-based)

**Implementation:** Test specific validation errors (invalid email, weak password, etc.) and verify error messages are clear and actionable.

### Property 9: HTTPS Enforcement

**Property:** FOR ALL HTTP requests to the registration endpoint, THE system SHALL redirect to HTTPS.

**Rationale:** All registration data must be transmitted over HTTPS to prevent man-in-the-middle attacks.

**Test Type:** Integration test (not property-based)

**Implementation:** Make HTTP requests to registration endpoints, verify they are redirected to HTTPS.

### Property 10: Rate Limiting Effectiveness

**Property:** FOR ALL requests exceeding the rate limit, THE system SHALL reject the request with a 429 Too Many Requests status.

**Rationale:** Rate limiting must prevent brute force attacks.

**Test Type:** Integration test (not property-based)

**Implementation:** Make requests exceeding the rate limit, verify they are rejected with 429 status.

