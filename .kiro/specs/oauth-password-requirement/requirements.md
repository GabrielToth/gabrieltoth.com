# Requirements Document: OAuth Password Requirement

## Introduction

This feature ensures that all users, including those who register via OAuth providers (Google, Facebook, TikTok), have both an email address and a password associated with their account. This enables users to authenticate using either OAuth or traditional email/password login, providing flexibility and account recovery options.

Currently, the system supports Google OAuth authentication where users can register and login without creating a password. This feature extends the OAuth registration flow to require password creation, ensuring all users have multiple authentication methods available.

## Glossary

- **OAuth_System**: The authentication system that handles OAuth provider integration (Google, Facebook, TikTok)
- **Registration_Flow**: The process of creating a new user account
- **Login_Flow**: The process of authenticating an existing user
- **Password_Creator**: The component that handles password creation and validation during OAuth registration
- **Email_Validator**: The component that validates and verifies email addresses
- **User_Database**: The database table storing user credentials and OAuth information
- **OAuth_Provider**: External authentication service (Google, Facebook, TikTok)
- **Recovery_Email**: Email address provided by user for account recovery when OAuth provider doesn't supply one
- **Password_Hash**: Bcrypt-hashed password stored in the database

## Requirements

### Requirement 1: Universal Password Requirement

**User Story:** As a system administrator, I want all users to have a password, so that every account has a fallback authentication method.

#### Acceptance Criteria

1. THE User_Database SHALL store a password_hash for every user record
2. THE User_Database SHALL enforce NOT NULL constraint on the password_hash column
3. THE User_Database SHALL store an email for every user record
4. THE User_Database SHALL enforce NOT NULL constraint on the email column
5. WHEN a user record is created, THE Registration_Flow SHALL ensure both email and password_hash are provided

### Requirement 2: Google OAuth Registration with Password

**User Story:** As a user registering via Google OAuth, I want to create a password during registration, so that I can login with email and password if needed.

#### Acceptance Criteria

1. WHEN a user completes Google OAuth authorization, THE OAuth_System SHALL capture the Google email automatically
2. WHEN Google OAuth returns user data, THE Registration_Flow SHALL display a password creation form
3. THE Password_Creator SHALL validate the password meets security requirements (minimum 8 characters, uppercase, lowercase, number, special character)
4. WHEN the user submits a valid password, THE Registration_Flow SHALL hash the password using bcrypt with 12 salt rounds
5. THE Registration_Flow SHALL store the Google email, Google OAuth ID, and password_hash in the User_Database
6. THE Registration_Flow SHALL NOT complete until a valid password is created

### Requirement 3: Facebook and TikTok OAuth Registration with Email and Password

**User Story:** As a user registering via Facebook or TikTok OAuth, I want to provide a recovery email and create a password, so that I have full account access and recovery options.

#### Acceptance Criteria

1. WHEN a user completes Facebook or TikTok OAuth authorization without an email, THE Registration_Flow SHALL display an email input form
2. THE Email_Validator SHALL validate the provided email follows RFC 5322 format
3. WHEN a valid email is provided, THE Registration_Flow SHALL display a password creation form
4. THE Password_Creator SHALL validate the password meets security requirements (minimum 8 characters, uppercase, lowercase, number, special character)
5. WHEN the user submits valid email and password, THE Registration_Flow SHALL hash the password using bcrypt with 12 salt rounds
6. THE Registration_Flow SHALL store the provided email, OAuth provider ID, and password_hash in the User_Database
7. THE Registration_Flow SHALL NOT complete until both valid email and password are provided

### Requirement 4: Dual Authentication Methods for OAuth Users

**User Story:** As a user who registered via OAuth, I want to login using either OAuth or email/password, so that I have flexibility in how I access my account.

#### Acceptance Criteria

1. WHEN a user with OAuth credentials attempts login via OAuth, THE Login_Flow SHALL authenticate using the OAuth_Provider
2. WHEN a user with OAuth credentials attempts login via email and password, THE Login_Flow SHALL authenticate using bcrypt password comparison
3. THE Login_Flow SHALL accept the OAuth-provided email (e.g., Gmail address from Google OAuth) for email/password login
4. WHEN authentication succeeds via either method, THE Login_Flow SHALL create a session with identical permissions
5. THE Login_Flow SHALL log the authentication method used (OAuth or email/password) in audit logs

### Requirement 5: Email-Based Account Recovery for OAuth Users

**User Story:** As a user who forgot they used OAuth, I want to login with my email and password, so that I can access my account without remembering which OAuth provider I used.

#### Acceptance Criteria

1. WHEN a user attempts email/password login, THE Login_Flow SHALL check the User_Database for matching email
2. IF the email exists with OAuth provider data, THE Login_Flow SHALL authenticate using the stored password_hash
3. THE Login_Flow SHALL NOT require users to know which OAuth provider they originally used
4. WHEN authentication succeeds, THE Login_Flow SHALL return the same user session regardless of original registration method

### Requirement 6: Database Schema Requirements

**User Story:** As a database administrator, I want the schema to enforce email and password requirements, so that data integrity is maintained at the database level.

#### Acceptance Criteria

1. THE User_Database SHALL define email column as VARCHAR(255) NOT NULL
2. THE User_Database SHALL define password_hash column as VARCHAR(255) NOT NULL
3. THE User_Database SHALL define oauth_provider column as VARCHAR(50) nullable with allowed values ('google', 'facebook', 'tiktok', null)
4. THE User_Database SHALL define oauth_id column as VARCHAR(255) nullable
5. THE User_Database SHALL create a unique index on email column
6. THE User_Database SHALL create an index on oauth_provider column for query performance
7. THE User_Database SHALL create a unique index on oauth_id column where oauth_id IS NOT NULL

### Requirement 7: Password Security Requirements

**User Story:** As a security engineer, I want OAuth user passwords to meet the same security standards as regular registration, so that all accounts have consistent security.

#### Acceptance Criteria

1. THE Password_Creator SHALL enforce minimum 8 character length
2. THE Password_Creator SHALL require at least one uppercase letter
3. THE Password_Creator SHALL require at least one lowercase letter
4. THE Password_Creator SHALL require at least one number
5. THE Password_Creator SHALL require at least one special character
6. THE Password_Creator SHALL hash passwords using bcrypt with 12 salt rounds
7. THE Password_Creator SHALL reject passwords that match common password lists

### Requirement 8: OAuth Token Validation

**User Story:** As a security engineer, I want OAuth tokens to be validated even when passwords are required, so that OAuth authentication remains secure.

#### Acceptance Criteria

1. WHEN a user authenticates via OAuth, THE OAuth_System SHALL validate the OAuth token with the provider's servers
2. THE OAuth_System SHALL verify token signature using the provider's public keys
3. THE OAuth_System SHALL verify token expiration timestamp
4. THE OAuth_System SHALL verify token audience matches the application client ID
5. THE OAuth_System SHALL verify token issuer matches the OAuth provider
6. IF token validation fails, THE OAuth_System SHALL reject authentication and log the failure

### Requirement 9: Email Verification for OAuth Users

**User Story:** As a security engineer, I want OAuth user emails to be verified, so that all accounts have confirmed email addresses.

#### Acceptance Criteria

1. WHEN a user registers via Google OAuth with verified Google email, THE Registration_Flow SHALL mark email_verified as TRUE
2. WHEN a user registers via Facebook or TikTok OAuth and provides a recovery email, THE Registration_Flow SHALL send a verification email
3. THE Email_Validator SHALL generate a unique verification token with 24-hour expiration
4. WHEN a user clicks the verification link, THE Email_Validator SHALL mark email_verified as TRUE
5. THE Login_Flow SHALL allow login via OAuth regardless of email verification status
6. THE Login_Flow SHALL require email verification for email/password login

### Requirement 10: Password Creation User Interface

**User Story:** As a user registering via OAuth, I want a clear password creation interface, so that I understand why a password is required and can create one easily.

#### Acceptance Criteria

1. WHEN the password creation form is displayed, THE Registration_Flow SHALL show a message explaining why password creation is required
2. THE Password_Creator SHALL display real-time password strength feedback
3. THE Password_Creator SHALL display which password requirements are met and which are not
4. WHEN password validation fails, THE Password_Creator SHALL display specific error messages for each unmet requirement
5. WHEN password creation succeeds, THE Registration_Flow SHALL display a success message and redirect to the dashboard

### Requirement 11: Migration Path for Existing OAuth Users

**User Story:** As an existing OAuth user without a password, I want to be prompted to create a password on next login, so that my account gains the additional authentication method.

#### Acceptance Criteria

1. WHEN an existing OAuth user with NULL password_hash logs in via OAuth, THE Login_Flow SHALL redirect to password creation page
2. THE Password_Creator SHALL display a message explaining the new password requirement
3. WHEN the user creates a valid password, THE Login_Flow SHALL update the User_Database with the password_hash
4. WHEN password creation is complete, THE Login_Flow SHALL redirect to the originally requested page
5. THE Login_Flow SHALL NOT allow access to protected routes until password is created

### Requirement 12: Parser and Serializer for OAuth Provider Data

**User Story:** As a developer, I want to parse and serialize OAuth provider data consistently, so that provider-specific data is handled correctly.

#### Acceptance Criteria

1. WHEN OAuth provider returns user data, THE OAuth_Parser SHALL parse the JSON response into a standardized user object
2. THE OAuth_Parser SHALL handle missing optional fields (name, picture) gracefully
3. THE OAuth_Parser SHALL validate required fields (sub/id, email for Google) are present
4. THE Pretty_Printer SHALL format user objects back into provider-specific JSON format for logging
5. FOR ALL valid OAuth provider responses, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
6. WHEN OAuth provider returns invalid JSON, THE OAuth_Parser SHALL return a descriptive error message
7. THE OAuth_Parser SHALL reference the OAuth 2.0 specification and provider-specific documentation

