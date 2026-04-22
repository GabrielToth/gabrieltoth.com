# Design Document - Enhanced Authentication Registration

## Overview

This document specifies the technical design for the enhanced authentication registration flow. The system implements a multi-step registration process that collects user information progressively: email verification, password setup, personal data collection, and final verification before account creation. The design prioritizes security, data integrity, user experience, and accessibility while supporting both cloud and local deployment environments.

The registration flow is designed as a self-contained feature that can be integrated into the authentication module and supports future social login integration without requiring architectural changes.

## Architecture

### High-Level Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Registration Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Step 1     │  │   Step 2     │  │   Step 3     │       │
│  │   Email      │→ │  Password    │→ │  Personal    │       │
│  │   Input      │  │   Setup      │  │   Data       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         ↑                                      ↓              │
│         └──────────────────────────────────────┘             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Step 4: Verification Review                        │   │
│  │   • Display all entered data (read-only)             │   │
│  │   • Allow editing individual fields                  │   │
│  │   • Create Account button                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Account Creation                                   │   │
│  │   • Validate all data                                │   │
│  │   • Hash password (bcrypt)                           │   │
│  │   • Persist to database                              │   │
│  │   • Send verification email                          │   │
│  │   • Redirect to login                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
RegistrationFlow (Container)
├── ProgressIndicator
│   ├── StepDot (x4)
│   └── StepLabel
├── StepContainer
│   ├── Step 1: EmailInput
│   │   ├── EmailField
│   │   ├── ValidationMessage
│   │   └── UniqueEmailCheck
│   ├── Step 2: PasswordSetup
│   │   ├── PasswordField
│   │   ├── PasswordStrengthIndicator
│   │   ├── PasswordRequirements
│   │   ├── ConfirmPasswordField
│   │   └── ShowHideToggle
│   ├── Step 3: PersonalDataForm
│   │   ├── NameField
│   │   ├── PhoneField
│   │   └── ValidationMessages
│   └── Step 4: VerificationReview
│       ├── ReviewField (x4)
│       ├── EditButton (x4)
│       └── CreateAccountButton
├── NavigationButtons
│   ├── BackButton
│   ├── NextButton
│   └── CancelButton
├── ErrorDisplay
│   └── ErrorMessage
└── SuccessMessage
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  RegistrationFlow Component                                  │
│  ├── Local State: currentStep, formData, errors              │
│  ├── Session Storage: registrationSession                    │
│  └── API Calls:                                              │
│      ├── POST /api/auth/register                             │
│      ├── GET /api/auth/check-email                           │
│      ├── POST /api/auth/send-verification-email              │
│      └── GET /api/auth/verify-email/:token                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (API Server)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Authentication Routes                                       │
│  ├── POST /api/auth/register                                 │
│  │   ├── Validate input                                      │
│  │   ├── Hash password (bcrypt)                              │
│  │   ├── Create user in database                             │
│  │   └── Return user ID                                      │
│  ├── GET /api/auth/check-email                               │
│  │   ├── Query database for email                            │
│  │   └── Return availability status                          │
│  ├── POST /api/auth/send-verification-email                  │
│  │   ├── Generate verification token                         │
│  │   ├── Store token in database                             │
│  │   └── Send email                                          │
│  └── GET /api/auth/verify-email/:token                       │
│      ├── Validate token                                      │
│      ├── Mark email as verified                              │
│      └── Return verification status                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tables:                                                     │
│  ├── users (email, hashed_password, name, phone, ...)        │
│  ├── email_verification_tokens (token, user_id, expires_at)  │
│  └── registration_sessions (session_id, data, expires_at)    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. RegistrationFlow (Main Container)

**Purpose**: Orchestrates the multi-step registration process

**Props**:
```typescript
interface RegistrationFlowProps {
  onSuccess?: (userId: string) => void;
  onCancel?: () => void;
  redirectUrl?: string;
}
```

**State**:
```typescript
interface RegistrationState {
  currentStep: 1 | 2 | 3 | 4;
  formData: RegistrationFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  sessionId: string;
}

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}
```

**Responsibilities**:
- Manage current step and form data
- Handle step validation before progression
- Preserve data when navigating back
- Manage session storage
- Handle API calls
- Display error and success messages

### 2. ProgressIndicator

**Purpose**: Visual indicator of registration progress

**Props**:
```typescript
interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  totalSteps: number;
  stepLabels: string[];
}
```

**Features**:
- Display 4 step dots
- Highlight current step
- Show step labels
- Responsive layout (vertical on mobile, horizontal on desktop)

### 3. EmailInput (Step 1)

**Purpose**: Collect and validate email address

**Props**:
```typescript
interface EmailInputProps {
  value: string;
  onChange: (email: string) => void;
  onNext: () => void;
  error?: string;
  isLoading?: boolean;
}
```

**Features**:
- Email input field with label
- Real-time email format validation
- Debounced email uniqueness check (500ms)
- Display "Email already registered" error
- Enable/disable Next button based on validation
- Show loading state during uniqueness check

**Validation Rules**:
- RFC 5322 email format
- Not already registered
- Supports common and country-specific TLDs

### 4. PasswordSetup (Step 2)

**Purpose**: Collect and validate password with strength indicator

**Props**:
```typescript
interface PasswordSetupProps {
  password: string;
  confirmPassword: string;
  onChange: (field: 'password' | 'confirmPassword', value: string) => void;
  onNext: () => void;
  error?: string;
}
```

**Features**:
- Password input field with label
- Password requirements display:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character
- Real-time password strength indicator (Weak, Fair, Good, Strong)
- Show/Hide password toggle
- Confirm password field
- Display specific validation errors for each requirement
- Enable/disable Next button based on validation

**Password Strength Calculation**:
```
Weak:   < 2 requirements met
Fair:   2 requirements met
Good:   3 requirements met
Strong: All 4 requirements met
```

### 5. PersonalDataForm (Step 3)

**Purpose**: Collect personal information (name and phone)

**Props**:
```typescript
interface PersonalDataFormProps {
  name: string;
  phone: string;
  onChange: (field: 'name' | 'phone', value: string) => void;
  onNext: () => void;
  errors?: Record<string, string>;
}
```

**Features**:
- Full name input field with label
- Phone number input field with label
- Real-time validation for both fields
- Display specific error messages
- Support international phone formats
- Normalize phone numbers for storage
- Enable/disable Next button based on validation

**Validation Rules**:
- Name: Not empty, minimum 2 characters, letters/spaces/hyphens/apostrophes only
- Phone: Valid international format, normalized to E.164 format

### 6. VerificationReview (Step 4)

**Purpose**: Display all entered data for review before account creation

**Props**:
```typescript
interface VerificationReviewProps {
  formData: RegistrationFormData;
  onEdit: (field: keyof RegistrationFormData) => void;
  onCreate: () => void;
  isLoading?: boolean;
  error?: string;
}
```

**Features**:
- Display email in read-only format
- Display name in read-only format
- Display phone in read-only format
- Display "Password is set and secured" instead of password
- Edit button for each field (navigates back to corresponding step)
- Create Account button
- Back button
- Loading state during account creation
- Display error message if creation fails

### 7. ErrorDisplay

**Purpose**: Display validation and API errors

**Props**:
```typescript
interface ErrorDisplayProps {
  message: string;
  type?: 'field' | 'general';
  onDismiss?: () => void;
}
```

**Features**:
- Display error message near corresponding field (field errors)
- Display error message at top of form (general errors)
- User-friendly error messages (no technical details)
- Dismiss button for general errors
- Red color for error state

### 8. SuccessMessage

**Purpose**: Display success message after account creation

**Props**:
```typescript
interface SuccessMessageProps {
  message: string;
  redirectUrl: string;
  redirectDelay?: number;
}
```

**Features**:
- Display success message
- Show countdown timer before redirect
- Auto-redirect after 2 seconds
- Green color for success state

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  hashedPassword: string;
  name: string;
  phone: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### RegistrationSession Model

```typescript
interface RegistrationSession {
  id: string;
  email: string;
  password: string; // Encrypted in transit, never stored
  name: string;
  phone: string;
  currentStep: 1 | 2 | 3 | 4;
  createdAt: Date;
  expiresAt: Date; // 30 minutes from creation
}
```

### EmailVerificationToken Model

```typescript
interface EmailVerificationToken {
  id: string;
  token: string;
  userId: string;
  email: string;
  createdAt: Date;
  expiresAt: Date; // 24 hours from creation
  verifiedAt?: Date;
}
```

### API Request/Response Schemas

#### POST /api/auth/register

**Request**:
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}
```

**Response (Success - 201)**:
```typescript
interface RegisterResponse {
  success: true;
  userId: string;
  email: string;
  message: string;
}
```

**Response (Error - 400/409)**:
```typescript
interface RegisterErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string>;
}
```

#### GET /api/auth/check-email

**Query Parameters**:
```typescript
interface CheckEmailQuery {
  email: string;
}
```

**Response**:
```typescript
interface CheckEmailResponse {
  available: boolean;
  email: string;
}
```

#### POST /api/auth/send-verification-email

**Request**:
```typescript
interface SendVerificationEmailRequest {
  email: string;
  userId: string;
}
```

**Response**:
```typescript
interface SendVerificationEmailResponse {
  success: boolean;
  message: string;
}
```

#### GET /api/auth/verify-email/:token

**Response**:
```typescript
interface VerifyEmailResponse {
  success: boolean;
  message: string;
  email: string;
}
```

## State Management

### Registration Session State

**Storage**: Session storage (HTTP-only cookie for sensitive data)

**Data Persistence**:
- Store registration session in session storage
- Preserve form data when navigating between steps
- Clear session on cancel or successful account creation
- Expire session after 30 minutes of inactivity

**State Structure**:
```typescript
interface RegistrationSessionState {
  sessionId: string;
  currentStep: 1 | 2 | 3 | 4;
  formData: {
    email: string;
    password: string; // Never stored in browser
    confirmPassword: string; // Never stored in browser
    name: string;
    phone: string;
  };
  errors: Record<string, string>;
  isLoading: boolean;
  createdAt: Date;
  lastActivityAt: Date;
}
```

### Error State Management

**Error Types**:
- Field validation errors (email format, password requirements, etc.)
- API errors (email already exists, server errors, etc.)
- Session errors (session expired, etc.)
- Network errors (timeout, connection failed, etc.)

**Error Display**:
- Field errors: Display near corresponding input field
- General errors: Display at top of form
- API errors: Convert to user-friendly messages
- Network errors: Display retry option

## Security Considerations

### Password Security

1. **Password Hashing**:
   - Use bcrypt with minimum cost factor of 10
   - Hash password on server-side only
   - Never transmit plain text passwords
   - Never log passwords

2. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one number
   - At least one special character
   - Enforce on client-side for UX, server-side for security

3. **Password Transmission**:
   - HTTPS only (enforce redirect from HTTP)
   - Use secure headers (HSTS, CSP)
   - No password in URL parameters or logs

### Session Management

1. **Session Storage**:
   - Use HTTP-only cookies for session ID
   - Never store sensitive data in browser local storage
   - Encrypt session data in transit
   - Expire sessions after 30 minutes of inactivity

2. **Session Security**:
   - Generate cryptographically secure session IDs
   - Validate session on each request
   - Clear session on logout or cancellation
   - Prevent session fixation attacks

### Input Validation and Sanitization

1. **Client-Side Validation**:
   - Validate email format (RFC 5322)
   - Validate password requirements
   - Validate name format (letters, spaces, hyphens, apostrophes)
   - Validate phone format (international standards)

2. **Server-Side Validation**:
   - Re-validate all inputs on server
   - Sanitize inputs to prevent injection attacks
   - Normalize phone numbers to E.164 format
   - Trim whitespace from name

3. **CSRF Protection**:
   - Use CSRF tokens for state-changing requests
   - Validate CSRF token on server-side
   - Use SameSite cookie attribute

### HTTPS Enforcement

1. **Connection Security**:
   - Redirect HTTP to HTTPS
   - Use HSTS header (Strict-Transport-Security)
   - Enforce HTTPS on all registration endpoints

2. **Secure Headers**:
   - Content-Security-Policy (CSP)
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Registration Form                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Progress Indicator                                 │    │
│  │  ● Step 1  ○ Step 2  ○ Step 3  ○ Step 4            │    │
│  │  Email    Password  Personal  Review               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Step Content                                       │    │
│  │  [Input fields, validation messages, etc.]          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Navigation Buttons                                 │    │
│  │  [Back] [Next/Create Account] [Cancel]              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Design

**Desktop (≥1024px)**:
- Single-column layout
- Full-width form (max-width: 600px, centered)
- Horizontal progress indicator
- Touch-friendly button sizes (44x44px minimum)
- Readable text sizes (16px minimum)

**Tablet (768px - 1023px)**:
- Single-column layout
- Full-width form with padding
- Horizontal progress indicator
- Touch-friendly button sizes (44x44px minimum)
- Readable text sizes (16px minimum)

**Mobile (<768px)**:
- Single-column layout
- Full-width form with padding
- Vertical progress indicator (optional)
- Touch-friendly button sizes (44x44px minimum)
- Readable text sizes (16px minimum)
- No horizontal scrolling

### Color Palette

```
Primary Blue:     #0070F3
Success Green:    #0FD66F
Error Red:        #FF4757
Warning Orange:   #FFA502
Text Primary:     #000000
Text Secondary:   #666666
Background:       #FFFFFF
Border Gray:      #EBEBEB
Light Gray:       #F5F5F5
```

### Typography

- **Headings**: 24px, bold, primary color
- **Labels**: 14px, medium, secondary color
- **Input Text**: 16px, regular, primary color
- **Error Messages**: 14px, regular, error color
- **Helper Text**: 12px, regular, secondary color

### Accessibility Features

1. **Color Contrast**:
   - Meet WCAG 2.1 AA color contrast requirements
   - Error messages: 4.5:1 contrast ratio
   - Labels: 4.5:1 contrast ratio
   - Helper text: 3:1 contrast ratio

2. **Keyboard Navigation**:
   - All interactive elements accessible via Tab key
   - Focus indicators visible on all elements
   - Logical tab order (left to right, top to bottom)
   - Enter key submits form, Escape cancels

3. **Semantic HTML**:
   - Use `<form>` element for registration form
   - Use `<input>` elements with proper types
   - Use `<label>` elements with `for` attribute
   - Use `<button>` elements for actions
   - Use `<fieldset>` and `<legend>` for grouping

4. **ARIA Labels and Descriptions**:
   - ARIA labels for all input fields
   - ARIA descriptions for password requirements
   - ARIA live regions for error messages
   - ARIA labels for icon buttons

5. **Screen Reader Support**:
   - Descriptive labels for all inputs
   - Error messages announced to screen readers
   - Progress indicator announced
   - Loading states announced

## Error Handling

### Validation Errors

**Email Validation**:
- "Please enter a valid email address" (invalid format)
- "This email is already registered" (already exists)

**Password Validation**:
- "Password must be at least 8 characters" (too short)
- "Password must contain at least one uppercase letter" (missing uppercase)
- "Password must contain at least one number" (missing number)
- "Password must contain at least one special character" (missing special char)
- "Passwords do not match" (confirmation mismatch)

**Name Validation**:
- "Full name is required" (empty)
- "Full name must be at least 2 characters" (too short)
- "Full name can only contain letters, spaces, hyphens, and apostrophes" (invalid characters)

**Phone Validation**:
- "Please enter a valid phone number" (invalid format)

### API Errors

**Email Already Exists** (409 Conflict):
- "This email is already registered. Please use a different email or try logging in."

**Invalid Input** (400 Bad Request):
- "Please check your information and try again."

**Server Error** (500 Internal Server Error):
- "An error occurred while creating your account. Please try again later."

**Network Error**:
- "Connection failed. Please check your internet connection and try again."
- Display retry button

### Session Errors

**Session Expired**:
- "Your registration session has expired. Please start over."
- Redirect to registration start

**Session Not Found**:
- "An error occurred. Please start over."
- Redirect to registration start

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

#### Requirement 2: Email Input Validation

2.3 WHEN a user enters an email, THE Registration_Flow SHALL validate the email format
  - Thoughts: This is a universal rule about email validation. We can generate random strings and verify that valid emails pass RFC 5322 validation and invalid emails fail. This is a pure function with clear input/output behavior.
  - Classification: PROPERTY
  - Test Strategy: Generate random email strings, verify valid emails pass validation and invalid emails fail

2.5 WHEN a user enters an email that already exists, THE Registration_Flow SHALL display an error message
  - Thoughts: This requires checking against a database. We can mock the database and test that the validation correctly identifies duplicate emails.
  - Classification: PROPERTY (with mocks)
  - Test Strategy: Generate random emails, mock database with existing emails, verify duplicates are rejected

#### Requirement 3: Password Setup Validation

3.4 WHEN a user enters a password, THE Registration_Flow SHALL validate the password against the requirements
  - Thoughts: This is a pure function that checks password requirements. We can generate random passwords and verify they meet the 4 requirements (length, uppercase, number, special char).
  - Classification: PROPERTY
  - Test Strategy: Generate random passwords, verify validation correctly identifies which requirements are met/unmet

3.6 THE Registration_Flow SHALL display a password strength indicator (Weak, Fair, Good, Strong)
  - Thoughts: This is a pure function that calculates strength based on requirements met. We can generate passwords and verify the strength indicator matches the requirements met.
  - Classification: PROPERTY
  - Test Strategy: Generate random passwords, verify strength indicator matches requirements met (Weak: <2, Fair: 2, Good: 3, Strong: 4)

3.9 WHEN the password and confirmation do not match, THE Registration_Flow SHALL display an error message
  - Thoughts: This is a simple comparison. We can generate random password pairs and verify matching/non-matching behavior.
  - Classification: PROPERTY
  - Test Strategy: Generate random password pairs, verify matching passwords pass and non-matching fail

#### Requirement 4: Personal Information Validation

4.3 WHEN a user enters a name, THE Registration_Flow SHALL validate that the name is not empty
  - Thoughts: This is a universal rule. We can generate random strings and verify empty strings are rejected.
  - Classification: PROPERTY
  - Test Strategy: Generate random strings including empty, verify empty strings are rejected

4.7 WHEN a user enters a phone number, THE Registration_Flow SHALL validate the phone format
  - Thoughts: This is a pure function that validates phone format. We can generate random phone numbers and verify valid formats pass and invalid formats fail.
  - Classification: PROPERTY
  - Test Strategy: Generate random phone numbers in various formats, verify valid international formats pass and invalid formats fail

4.9 THE Registration_Flow SHALL support international phone number formats
  - Thoughts: This is a universal property about phone format support. We can generate phone numbers from different countries and verify they're all accepted.
  - Classification: PROPERTY
  - Test Strategy: Generate phone numbers from different countries, verify all valid international formats are accepted

#### Requirement 9: Email Format Validation

9.1 THE Registration_Flow SHALL validate email format using RFC 5322 standard
  - Thoughts: This is a pure function that validates email format. We can generate random email strings and verify RFC 5322 compliance.
  - Classification: PROPERTY
  - Test Strategy: Generate random email strings, verify valid RFC 5322 emails pass and invalid emails fail

#### Requirement 10: Phone Format Validation

10.1 THE Registration_Flow SHALL validate phone numbers using international format standards
  - Thoughts: This is a pure function that validates phone format. We can generate random phone numbers and verify international format compliance.
  - Classification: PROPERTY
  - Test Strategy: Generate random phone numbers, verify valid international formats pass and invalid formats fail

10.4 THE Registration_Flow SHALL normalize phone numbers to a standard format for storage
  - Thoughts: This is a pure function that normalizes phone numbers. We can generate random phone numbers in different formats and verify they normalize to E.164 format.
  - Classification: PROPERTY
  - Test Strategy: Generate random phone numbers in various formats, verify all normalize to E.164 format

#### Requirement 11: Personal Name Validation

11.1 THE Registration_Flow SHALL validate that personal name is not empty
  - Thoughts: This is a universal rule. We can generate random strings and verify empty strings are rejected.
  - Classification: PROPERTY
  - Test Strategy: Generate random strings including empty, verify empty strings are rejected

11.2 THE Registration_Flow SHALL validate that personal name contains at least 2 characters
  - Thoughts: This is a universal rule about minimum length. We can generate random strings and verify strings with <2 characters are rejected.
  - Classification: PROPERTY
  - Test Strategy: Generate random strings of varying lengths, verify strings with <2 characters are rejected

11.3 THE Registration_Flow SHALL accept names with letters, spaces, hyphens, and apostrophes
  - Thoughts: This is a universal rule about allowed characters. We can generate random names with these characters and verify they're accepted.
  - Classification: PROPERTY
  - Test Strategy: Generate random names with allowed characters, verify all are accepted

11.4 THE Registration_Flow SHALL reject names with only numbers or special characters
  - Thoughts: This is a universal rule about invalid character combinations. We can generate random strings with only numbers/special chars and verify they're rejected.
  - Classification: PROPERTY
  - Test Strategy: Generate random strings with only numbers or special characters, verify all are rejected

#### Requirement 6: Account Creation

6.1 WHEN a user clicks "Create Account", THE Registration_Flow SHALL validate all data one final time
  - Thoughts: This is testing the final validation step. We can generate random form data and verify validation is performed.
  - Classification: PROPERTY (with mocks)
  - Test Strategy: Generate random form data, verify final validation correctly identifies valid/invalid data

#### Requirement 1: Multi-Step Process

1.3 WHEN a user completes a step, THE Registration_Flow SHALL validate the step data before proceeding
  - Thoughts: This is testing step validation. We can generate random data for each step and verify validation prevents progression with invalid data.
  - Classification: PROPERTY (with mocks)
  - Test Strategy: Generate random data for each step, verify invalid data prevents progression

1.6 WHEN a user navigates back, THE Registration_Flow SHALL preserve previously entered data
  - Thoughts: This is testing data persistence. We can generate random form data, navigate back, and verify data is preserved.
  - Classification: PROPERTY (with mocks)
  - Test Strategy: Generate random form data, navigate back, verify data is preserved

#### Non-Testable Criteria

- Requirement 1.2: Progress indicator display (UI rendering - use snapshot tests)
- Requirement 1.7-1.8: Cancel button behavior (UI interaction - use example tests)
- Requirement 2.1-2.2: Email field display (UI rendering - use snapshot tests)
- Requirement 3.1-3.3: Password field display (UI rendering - use snapshot tests)
- Requirement 4.1-4.2: Name field display (UI rendering - use snapshot tests)
- Requirement 5: Verification review display (UI rendering - use snapshot tests)
- Requirement 7: Email verification (Integration test - external email service)
- Requirement 8: Password security (Security configuration - smoke test)
- Requirement 12: Responsive design (UI rendering - use visual regression tests)
- Requirement 13: Visual design (UI rendering - use snapshot tests)
- Requirement 14: Accessibility (Accessibility testing - manual + automated tools)
- Requirement 15: Error handling display (UI rendering - use snapshot tests)
- Requirement 16: Session management (Integration test - session storage)
- Requirement 17: Cloud/Local compatibility (Integration test - environment configuration)
- Requirement 18-20: API integration (Integration tests - mock API)
- Requirement 21: Performance (Performance testing - benchmarks)
- Requirement 22: HTTPS enforcement (Security configuration - smoke test)
- Requirement 23: Logging and audit (Integration test - log verification)
- Requirement 24-25: Social login (Future milestone - not applicable yet)

### Property Reflection

After analyzing all acceptance criteria, the following properties are identified as testable:

**Validation Properties** (Pure Functions):
1. Email format validation (RFC 5322)
2. Email uniqueness validation (with mocks)
3. Password requirements validation
4. Password strength calculation
5. Password confirmation matching
6. Phone format validation (international)
7. Phone number normalization (E.164)
8. Name validation (not empty, min 2 chars, allowed characters)
9. Name rejection (only numbers/special chars)

**State Management Properties** (with mocks):
10. Step validation prevents progression
11. Data preservation on navigation back
12. Final validation before account creation

**Redundancy Analysis**:
- Properties 1 and 9.1 are identical (email format validation) → Consolidate
- Properties 4.3 and 11.1 are identical (name not empty) → Consolidate
- Properties 4.7 and 10.1 are identical (phone format validation) → Consolidate
- Properties 10.4 (phone normalization) is a separate concern → Keep separate
- Properties 3.4 and 3.6 are related but distinct (validation vs strength) → Keep separate

**Final Property List** (after consolidation):
1. Email format validation (RFC 5322)
2. Email uniqueness validation
3. Password requirements validation
4. Password strength calculation
5. Password confirmation matching
6. Phone format validation (international)
7. Phone number normalization (E.164)
8. Name validation (not empty, min 2 chars, allowed characters)
9. Name rejection (only numbers/special chars)
10. Step validation prevents progression
11. Data preservation on navigation back
12. Final validation before account creation

### Correctness Properties

### Property 1: Email Format Validation

*For any* email string, the email validation function SHALL accept strings that conform to RFC 5322 standard and reject strings that do not conform.

**Validates: Requirements 2.3, 9.1**

### Property 2: Email Uniqueness Validation

*For any* email string and a mocked database of existing emails, the email validation function SHALL reject emails that already exist in the database and accept emails that do not exist.

**Validates: Requirements 2.5**

### Property 3: Password Requirements Validation

*For any* password string, the password validation function SHALL correctly identify which of the 4 requirements are met (minimum 8 characters, uppercase letter, number, special character) and reject passwords that do not meet all requirements.

**Validates: Requirements 3.4, 8.1**

### Property 4: Password Strength Calculation

*For any* password string, the password strength indicator SHALL correctly calculate strength based on requirements met: Weak (<2), Fair (2), Good (3), Strong (4).

**Validates: Requirements 3.6**

### Property 5: Password Confirmation Matching

*For any* pair of password strings, the password confirmation validation SHALL accept matching passwords and reject non-matching passwords.

**Validates: Requirements 3.9**

### Property 6: Phone Format Validation

*For any* phone number string in international format, the phone validation function SHALL accept valid international phone numbers and reject invalid phone numbers.

**Validates: Requirements 4.7, 10.1**

### Property 7: Phone Number Normalization

*For any* valid phone number string in various formats (with spaces, hyphens, parentheses, country codes), the phone normalization function SHALL normalize all valid formats to E.164 standard format.

**Validates: Requirements 10.4**

### Property 8: Name Validation

*For any* name string, the name validation function SHALL accept names that are not empty, contain at least 2 characters, and contain only letters, spaces, hyphens, and apostrophes, while rejecting names that do not meet these criteria.

**Validates: Requirements 4.3, 11.1, 11.2, 11.3**

### Property 9: Name Rejection for Invalid Characters

*For any* string composed entirely of numbers or special characters, the name validation function SHALL reject the string as invalid.

**Validates: Requirements 11.4**

### Property 10: Step Validation Prevents Progression

*For any* form data in a registration step, the step validation function SHALL prevent progression to the next step if the data is invalid and allow progression if the data is valid.

**Validates: Requirements 1.3**

### Property 11: Data Preservation on Navigation Back

*For any* form data entered in a registration step, when a user navigates back to a previous step and then forward again, the form data SHALL be preserved and match the originally entered data.

**Validates: Requirements 1.6**

### Property 12: Final Validation Before Account Creation

*For any* complete registration form data, the final validation function SHALL correctly identify valid data that meets all requirements and reject data that does not meet all requirements.

**Validates: Requirements 6.1**

## Testing Strategy

### Property-Based Testing

Property-based testing is appropriate for this feature because:
- Validation logic consists of pure functions with clear input/output behavior
- Email, password, phone, and name validation have universal properties that should hold across all inputs
- Input variation (different email formats, password combinations, phone formats, etc.) reveals edge cases
- Running 100+ iterations of property tests is cost-effective for pure validation functions

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Use fast-check library for JavaScript/TypeScript
- Each property test references its design document property
- Tag format: `Feature: enhanced-authentication-registration, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
// Property 1: Email Format Validation
test('Property 1: Email format validation - for any email string, RFC 5322 validation is correct', () => {
  fc.assert(
    fc.property(fc.emailAddress(), (email) => {
      const result = validateEmailFormat(email);
      expect(result).toBe(true);
    }),
    { numRuns: 100 }
  );
});

// Property 3: Password Requirements Validation
test('Property 3: Password requirements validation - for any password, validation correctly identifies requirements', () => {
  fc.assert(
    fc.property(fc.string(), (password) => {
      const result = validatePasswordRequirements(password);
      const hasLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*]/.test(password);
      
      expect(result.length).toBe(hasLength);
      expect(result.uppercase).toBe(hasUppercase);
      expect(result.number).toBe(hasNumber);
      expect(result.special).toBe(hasSpecial);
    }),
    { numRuns: 100 }
  );
});

// Property 7: Phone Number Normalization
test('Property 7: Phone number normalization - for any valid phone, normalization produces E.164 format', () => {
  fc.assert(
    fc.property(fc.string(), (phone) => {
      try {
        const normalized = normalizePhoneNumber(phone);
        // E.164 format: +[country code][number]
        expect(normalized).toMatch(/^\+\d{1,3}\d{4,14}$/);
      } catch (e) {
        // Invalid phone numbers throw, which is acceptable
      }
    }),
    { numRuns: 100 }
  );
});
```

### Unit Tests

**Validation Function Tests** (Property-Based):
- Property 1: Email format validation (RFC 5322 compliance)
- Property 2: Email uniqueness validation (with mocked database)
- Property 3: Password requirements validation (all 4 requirements)
- Property 4: Password strength calculation (Weak/Fair/Good/Strong)
- Property 5: Password confirmation matching
- Property 6: Phone format validation (international formats)
- Property 7: Phone number normalization (E.164 format)
- Property 8: Name validation (length, characters, format)
- Property 9: Name rejection (numbers/special chars only)
- Property 10: Step validation prevents progression
- Property 11: Data preservation on navigation back
- Property 12: Final validation before account creation

**Component Tests** (Example-Based):
- EmailInput: Renders correctly, handles input changes, displays validation errors
- PasswordSetup: Renders correctly, shows strength indicator, validates confirmation
- PersonalDataForm: Renders correctly, validates name and phone
- VerificationReview: Displays all data correctly, edit buttons navigate correctly
- ProgressIndicator: Shows current step, responsive layout
- ErrorDisplay: Displays error messages, dismissal works
- SuccessMessage: Displays success message, countdown timer works

**State Management Tests** (Example-Based):
- Registration state initialization
- Step progression with validation
- Data preservation on navigation back
- Session storage and retrieval
- Session expiration
- Error state management

### Integration Tests

**API Integration**:
- POST /api/auth/register: Create user with valid data, returns user ID
- POST /api/auth/register: Reject duplicate email, returns 409 error
- POST /api/auth/register: Reject invalid data, returns 400 error
- GET /api/auth/check-email: Return availability for new email
- GET /api/auth/check-email: Return unavailability for existing email
- POST /api/auth/send-verification-email: Send email successfully
- GET /api/auth/verify-email/:token: Verify email with valid token

**Flow Integration**:
- Complete registration flow (all 4 steps)
- Navigate back and edit data
- Cancel registration and verify data cleared
- Session persistence across page refresh
- Session expiration after 30 minutes
- Error recovery and retry

### E2E Tests

**User Scenarios**:
- New user registration (happy path)
- Email already exists error and recovery
- Password validation errors and correction
- Invalid phone number and correction
- Session expiration warning
- Network error recovery
- Mobile responsiveness verification

### Performance Tests

- Initial page load: < 2 seconds on 4G
- First step display: < 1 second
- Email uniqueness check: < 500ms
- Account creation: < 3 seconds
- Code splitting: Reduce initial bundle size by 40%

### Accessibility Tests

- WCAG 2.1 AA color contrast compliance
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatibility
- Focus indicator visibility
- Semantic HTML validation

## Implementation Details

### Technology Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (cloud) / SQLite (local)
- **Password Hashing**: bcrypt (cost factor: 10)
- **Phone Validation**: libphonenumber-js
- **Email Validation**: email-validator or custom RFC 5322
- **Session Management**: HTTP-only cookies, secure session storage

### File Structure

```
src/
├── components/
│   ├── registration/
│   │   ├── RegistrationFlow.tsx
│   │   ├── ProgressIndicator.tsx
│   │   ├── EmailInput.tsx
│   │   ├── PasswordSetup.tsx
│   │   ├── PersonalDataForm.tsx
│   │   ├── VerificationReview.tsx
│   │   ├── ErrorDisplay.tsx
│   │   └── SuccessMessage.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Label.tsx
├── pages/
│   ├── auth/
│   │   ├── register.tsx
│   │   └── verify-email.tsx
│   └── api/
│       └── auth/
│           ├── register.ts
│           ├── check-email.ts
│           ├── send-verification-email.ts
│           └── verify-email.ts
├── lib/
│   ├── validation/
│   │   ├── email.ts
│   │   ├── password.ts
│   │   ├── phone.ts
│   │   └── name.ts
│   ├── auth/
│   │   ├── bcrypt.ts
│   │   ├── session.ts
│   │   └── tokens.ts
│   └── api/
│       └── client.ts
├── types/
│   ├── auth.ts
│   ├── registration.ts
│   └── api.ts
├── hooks/
│   ├── useRegistration.ts
│   ├── useEmailValidation.ts
│   └── usePasswordStrength.ts
└── styles/
    └── registration.css
```

### Environment Variables

```
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api (local) or https://api.production.com (cloud)

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/db (local) or cloud connection string

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Security Configuration
BCRYPT_COST_FACTOR=10
SESSION_TIMEOUT=1800000 (30 minutes in milliseconds)
VERIFICATION_TOKEN_EXPIRY=86400000 (24 hours in milliseconds)
```

### Database Schema

**Users Table**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Email Verification Tokens Table**:
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP
);

CREATE INDEX idx_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_tokens_user_id ON email_verification_tokens(user_id);
```

**Registration Sessions Table** (optional, for session persistence):
```sql
CREATE TABLE registration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_session_id ON registration_sessions(session_id);
```

## Performance Considerations

### Code Splitting

- Lazy load registration components
- Split registration module from main bundle
- Load components on-demand as user progresses through steps

### Email Uniqueness Check

- Debounce API calls (500ms)
- Cache results in component state
- Avoid excessive API calls during typing

### Session Timeout

- 30-minute inactivity timeout
- Warn user before session expires
- Allow session extension on user activity

### Bundle Size Optimization

- Tree-shake unused dependencies
- Minimize CSS bundle
- Compress images and assets
- Use dynamic imports for heavy libraries

## Deployment Considerations

### Cloud Deployment (Vercel, AWS, etc.)

- Use production database connection string
- Use production API endpoint
- Enable HTTPS enforcement
- Configure CORS for API endpoints
- Set up email service (SendGrid, AWS SES, etc.)
- Configure environment variables in deployment platform

### Local Deployment

- Use local database connection string
- Use local API endpoint (http://localhost:3000/api)
- Disable HTTPS enforcement for local development
- Use local email service or mock email sending
- Configure environment variables in .env.local

## Future Enhancements

### Social Login Integration

- Add social login buttons (Google, GitHub, etc.)
- Extract email from social provider
- Require password setup for email account
- Require personal data collection
- Follow same verification step
- Link social provider account to user account

### Email Verification

- Send verification email after account creation
- Require email verification before account activation
- Display verification status in user profile
- Allow resending verification email

### Two-Factor Authentication

- Add optional 2FA setup during registration
- Support TOTP (Time-based One-Time Password)
- Support SMS verification

### Account Recovery

- Add password reset functionality
- Support account recovery via email
- Support account recovery via phone

## Conclusion

This design document provides a comprehensive specification for the enhanced authentication registration flow. The system prioritizes security, data integrity, user experience, and accessibility while supporting both cloud and local deployment environments. The modular component architecture allows for easy integration and future enhancements such as social login integration and two-factor authentication.
