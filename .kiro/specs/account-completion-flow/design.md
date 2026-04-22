# Account Completion Flow - Design Document

## 1. Architecture Overview

### System Components

The Account Completion Flow consists of five main components:

1. **OAuth Callback Handler** - Detects incomplete accounts and generates temporary tokens
2. **Middleware** - Intercepts requests and redirects incomplete accounts to the completion flow
3. **Account Completion UI** - Multi-step form for completing account data
4. **API Endpoint** - Processes and persists account completion data
5. **Database Schema** - Tracks account completion status and new user fields

### Data Flow

```
OAuth Callback
    ↓
[User has password_hash?]
    ├─ YES → Create session → Redirect to dashboard
    └─ NO → Generate temp token → Return requiresPassword: true
                ↓
        Frontend redirects to /[locale]/auth/complete-account
                ↓
        Middleware validates temp token
                ↓
        Account Completion UI loads
                ↓
        User completes form (3 steps)
                ↓
        POST /api/auth/complete-account
                ↓
        API validates and persists data
                ↓
        Create session → Redirect to dashboard
```

## 2. Component Architecture

### 2.1 OAuth Callback Enhancement

**File**: `src/app/api/auth/oauth/callback/route.ts`

**Changes**:
- Already detects incomplete accounts (users without password_hash)
- Returns `requiresPassword: true` with `tempToken` for new users
- Returns `requiresPassword: true` with `userId` for legacy users without passwords

**Temporary Token Structure**:
```typescript
interface TempTokenPayload {
    email: string
    oauth_provider: "google" | "facebook" | "tiktok"
    oauth_id: string
    name: string
    picture?: string
    iat: number
    exp: number // 30 minutes from now
}
```

### 2.2 Middleware Implementation

**File**: `src/lib/middleware/account-completion.ts` (new)

**Responsibility**: Intercept requests to protected routes and redirect incomplete accounts

**Logic**:
```typescript
export async function checkAccountCompletion(request: NextRequest) {
    // 1. Check if user has active session
    const session = getSessionFromCookie(request)
    
    if (!session) {
        return null // Not authenticated, let other middleware handle
    }
    
    // 2. Get user from database
    const user = await getUserById(session.user_id)
    
    if (!user) {
        return null // User not found, let other middleware handle
    }
    
    // 3. Check if account is complete
    if (user.password_hash && user.account_completion_status === 'completed') {
        return null // Account is complete, allow access
    }
    
    // 4. Check if user is on the completion flow page
    const pathname = request.nextUrl.pathname
    if (pathname.includes('/auth/complete-account')) {
        return null // Already on completion page, allow access
    }
    
    // 5. Redirect to completion flow
    return NextResponse.redirect(
        new URL(`/${locale}/auth/complete-account`, request.url)
    )
}
```

**Integration**: Add to `src/middleware.ts` in the middleware chain

### 2.3 Account Completion UI Components

**File Structure**:
```
src/app/[locale]/auth/complete-account/
├── page.tsx                          # Main page
├── complete-account-form.tsx         # Form container
├── steps/
│   ├── step-1-prefilled.tsx         # Pre-filled data review
│   ├── step-2-new-fields.tsx        # Password, phone, birth date
│   └── step-3-verification.tsx      # Final confirmation
├── components/
│   ├── progress-indicator.tsx       # Step progress display
│   ├── field-editor.tsx             # Inline field editing
│   ├── password-strength.tsx        # Password validation display
│   └── data-summary.tsx             # Read-only data display
└── hooks/
    └── useAccountCompletion.ts      # Form state management
```

#### Step 1: Pre-filled Data Review

**Components**:
- Display user's OAuth data (email, name, profile picture)
- Show "Edit" button for each field
- Inline editing with validation
- "Continue" button to proceed to Step 2

**Fields**:
- Email (read-only initially, editable on click)
- Name (editable)
- Profile Picture (display only)

**Validation**:
- Email: Must be valid email format, not already registered
- Name: 2-100 characters

#### Step 2: New Required Fields

**Components**:
- Password input with strength indicator
- Phone number input with international format
- Birth date input with age validation
- Real-time validation messages
- "Continue to Verification" button

**Fields**:
- Password: 8+ chars, uppercase, lowercase, number, special char
- Phone: International format (+1234567890)
- Birth Date: ISO 8601 (YYYY-MM-DD), age >= 13

**Validation**:
- Real-time client-side validation
- Server-side validation on submission

#### Step 3: Verification

**Components**:
- Read-only display of all data
- "Edit" buttons for each section (returns to Step 1 or 2)
- "Complete Account Setup" button
- Success message after submission

**Display**:
- Pre-filled Data section (email, name, picture)
- New Fields section (password masked, phone, birth date)
- Summary of all information

### 2.4 Form State Management

**File**: `src/app/[locale]/auth/complete-account/hooks/useAccountCompletion.ts`

**State Structure**:
```typescript
interface AccountCompletionState {
    currentStep: 1 | 2 | 3
    tempToken: string
    prefilledData: {
        email: string
        name: string
        picture?: string
    }
    editedData: {
        email: string
        name: string
    }
    newFields: {
        password: string
        phone: string
        birthDate: string
    }
    errors: Record<string, string>
    isLoading: boolean
    isSubmitting: boolean
}
```

**Actions**:
- `setCurrentStep(step)` - Navigate between steps
- `updatePrefilledField(field, value)` - Edit pre-filled data
- `updateNewField(field, value)` - Update new required fields
- `validateStep(step)` - Validate current step
- `submitForm()` - Submit to API endpoint
- `resetForm()` - Reset to initial state

## 3. API Endpoint Design

### 3.1 POST /api/auth/complete-account

**Purpose**: Process and persist account completion data

**Request**:
```typescript
interface CompleteAccountRequest {
    tempToken: string
    email: string
    name: string
    password: string
    phone: string
    birthDate: string // ISO 8601 format
}
```

**Response Success (200)**:
```typescript
interface CompleteAccountResponse {
    success: true
    message: string
    redirectUrl: string
}
```

**Response Errors**:
- 400: Validation error (missing fields, invalid format)
- 401: Invalid or expired temp token
- 409: Email already registered
- 500: Server error

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
    try {
        // 1. Parse request body
        const body = await request.json()
        
        // 2. Validate temp token
        const payload = verifyTempToken(body.tempToken)
        if (!payload) {
            return NextResponse.json(
                { success: false, error: "Invalid or expired token" },
                { status: 401 }
            )
        }
        
        // 3. Validate all fields
        const validation = validateAccountCompletionData(body)
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.errors },
                { status: 400 }
            )
        }
        
        // 4. Check if email is already registered
        const existingUser = await getUserByEmail(body.email)
        if (existingUser && existingUser.id !== payload.user_id) {
            return NextResponse.json(
                { success: false, error: "Email already registered" },
                { status: 409 }
            )
        }
        
        // 5. Hash password
        const passwordHash = await hashPassword(body.password)
        
        // 6. Update user record
        await updateUserAccountCompletion(payload.user_id, {
            email: body.email,
            name: body.name,
            password_hash: passwordHash,
            phone_number: body.phone,
            birth_date: body.birthDate,
            account_completion_status: 'completed',
            account_completed_at: new Date()
        })
        
        // 7. Create session
        const session = await createSession(payload.user_id)
        
        // 8. Return response with session cookie
        const response = NextResponse.json({
            success: true,
            message: "Account setup completed successfully",
            redirectUrl: "/dashboard"
        })
        
        response.cookies.set("session", session.session_id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60,
            path: "/"
        })
        
        return response
    } catch (error) {
        logger.error("Account completion error", { error })
        return NextResponse.json(
            { success: false, error: "Server error" },
            { status: 500 }
        )
    }
}
```

## 4. Database Schema

### 4.1 Users Table Modifications

**New Columns**:
```sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN birth_date DATE;
ALTER TABLE users ADD COLUMN account_completion_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN account_completed_at TIMESTAMP;

-- Create index for efficient querying
CREATE INDEX idx_account_completion_status ON users(account_completion_status);
```

**Updated User Type**:
```typescript
export interface OAuthUser {
    id: string
    email: string
    password_hash: string | null
    oauth_provider: "google" | "facebook" | "tiktok" | null
    oauth_id: string | null
    name: string
    picture?: string | null
    phone_number?: string | null
    birth_date?: Date | null
    account_completion_status: 'pending' | 'in_progress' | 'completed'
    account_completed_at?: Date | null
    email_verified: boolean
    created_at: Date
    updated_at: Date
}
```

### 4.2 Temporary Tokens Table (Optional)

For tracking temporary tokens and their expiration:

```sql
CREATE TABLE temp_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(255),
    email VARCHAR(255),
    name VARCHAR(255),
    picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP
);

CREATE INDEX idx_temp_tokens_expires_at ON temp_tokens(expires_at);
CREATE INDEX idx_temp_tokens_user_id ON temp_tokens(user_id);
```

## 5. Validation Rules

### 5.1 Password Validation

```typescript
function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters")
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter")
    }
    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number")
    }
    if (!/[!@#$%^&*]/.test(password)) {
        errors.push("Password must contain at least one special character (!@#$%^&*)")
    }
    
    return {
        valid: errors.length === 0,
        errors
    }
}
```

### 5.2 Phone Number Validation

```typescript
function validatePhoneNumber(phone: string): boolean {
    // International format: +1234567890
    const phoneRegex = /^\+\d{1,3}\d{6,14}$/
    return phoneRegex.test(phone)
}
```

### 5.3 Birth Date Validation

```typescript
function validateBirthDate(birthDate: string): { valid: boolean; error?: string } {
    // ISO 8601 format: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    
    if (!dateRegex.test(birthDate)) {
        return { valid: false, error: "Birth date must be in YYYY-MM-DD format" }
    }
    
    const date = new Date(birthDate)
    const today = new Date()
    
    if (date > today) {
        return { valid: false, error: "Birth date cannot be in the future" }
    }
    
    const age = today.getFullYear() - date.getFullYear()
    const monthDiff = today.getMonth() - date.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--
    }
    
    if (age < 13) {
        return { valid: false, error: "You must be at least 13 years old" }
    }
    
    return { valid: true }
}
```

### 5.4 Email Validation

```typescript
function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}
```

## 6. Internationalization (i18n)

### 6.1 Translation Keys

**File**: `src/locales/[locale]/auth.json`

```json
{
    "completeAccount": {
        "title": "Complete Your Account",
        "subtitle": "Finish setting up your account to get started",
        "step1": {
            "title": "Review Your Information",
            "description": "Please review your information from your OAuth provider",
            "email": "Email",
            "name": "Full Name",
            "picture": "Profile Picture",
            "edit": "Edit",
            "continue": "Continue"
        },
        "step2": {
            "title": "Add Required Information",
            "description": "Please provide the following information to complete your account",
            "password": "Password",
            "passwordPlaceholder": "Enter a strong password",
            "passwordHint": "At least 8 characters, with uppercase, lowercase, number, and special character",
            "phone": "Phone Number",
            "phonePlaceholder": "+1234567890",
            "birthDate": "Birth Date",
            "birthDatePlaceholder": "YYYY-MM-DD",
            "continue": "Continue to Verification"
        },
        "step3": {
            "title": "Verify Your Information",
            "description": "Please review all your information before completing your account setup",
            "prefilledData": "Your Information",
            "newFields": "Additional Information",
            "edit": "Edit",
            "complete": "Complete Account Setup",
            "success": "Account setup completed successfully!"
        },
        "errors": {
            "invalidEmail": "Please enter a valid email address",
            "emailAlreadyRegistered": "This email is already in use",
            "invalidPassword": "Password does not meet security requirements",
            "invalidPhone": "Please enter a valid international phone number",
            "invalidBirthDate": "Please enter a valid birth date",
            "userTooYoung": "You must be at least 13 years old",
            "futureDate": "Birth date cannot be in the future",
            "invalidToken": "Your session has expired. Please log in again",
            "serverError": "An error occurred. Please try again later"
        }
    }
}
```

## 7. Correctness Properties

### 7.1 Property-Based Tests

#### Property 1: Password Strength Invariant

**Description**: All accepted passwords must meet security requirements

**Property**:
```typescript
property("password strength invariant", () => {
    fc.assert(
        fc.property(fc.string({ minLength: 8 }), (password) => {
            const result = validatePassword(password)
            if (result.valid) {
                // If valid, must have all required character types
                expect(/[A-Z]/.test(password)).toBe(true)
                expect(/[a-z]/.test(password)).toBe(true)
                expect(/\d/.test(password)).toBe(true)
                expect(/[!@#$%^&*]/.test(password)).toBe(true)
            }
        })
    )
})
```

#### Property 2: Phone Number Format Consistency

**Description**: Valid phone numbers must always be in international format

**Property**:
```typescript
property("phone number format consistency", () => {
    fc.assert(
        fc.property(
            fc.string({ minLength: 1, maxLength: 20 }),
            (phone) => {
                const isValid = validatePhoneNumber(phone)
                if (isValid) {
                    // Must start with + and contain only digits
                    expect(phone.startsWith('+')).toBe(true)
                    expect(/^\+\d+$/.test(phone)).toBe(true)
                }
            }
        )
    )
})
```

#### Property 3: Birth Date Age Calculation Idempotence

**Description**: Age calculation must be consistent regardless of when it's calculated

**Property**:
```typescript
property("birth date age calculation idempotence", () => {
    fc.assert(
        fc.property(fc.date({ min: new Date(1900, 0, 1), max: new Date() }), (birthDate) => {
            const dateStr = birthDate.toISOString().split('T')[0]
            const result1 = validateBirthDate(dateStr)
            const result2 = validateBirthDate(dateStr)
            
            // Same input should always produce same result
            expect(result1.valid).toBe(result2.valid)
            expect(result1.error).toBe(result2.error)
        })
    )
})
```

#### Property 4: Email Uniqueness Invariant

**Description**: After account completion, email must be unique in database

**Property**:
```typescript
property("email uniqueness invariant", () => {
    fc.assert(
        fc.property(fc.emailAddress(), async (email) => {
            // Before completion, email should not exist
            let user = await getUserByEmail(email)
            expect(user).toBeNull()
            
            // After completion with this email
            await completeAccount({ email, /* ... */ })
            
            // Email should now exist and be unique
            user = await getUserByEmail(email)
            expect(user).not.toBeNull()
            expect(user?.email).toBe(email)
        })
    )
})
```

#### Property 5: Round-Trip Data Persistence

**Description**: Data submitted must equal data retrieved from database

**Property**:
```typescript
property("round-trip data persistence", () => {
    fc.assert(
        fc.property(
            fc.record({
                email: fc.emailAddress(),
                name: fc.string({ minLength: 2, maxLength: 100 }),
                password: fc.string({ minLength: 8 }),
                phone: fc.string({ minLength: 10, maxLength: 20 }),
                birthDate: fc.date({ min: new Date(1900, 0, 1), max: new Date() })
            }),
            async (data) => {
                // Submit data
                await completeAccount(data)
                
                // Retrieve data
                const user = await getUserByEmail(data.email)
                
                // Verify round-trip
                expect(user?.email).toBe(data.email)
                expect(user?.name).toBe(data.name)
                expect(user?.phone_number).toBe(data.phone)
                expect(user?.birth_date).toEqual(new Date(data.birthDate))
            }
        )
    )
})
```

#### Property 6: Account Completion Status Idempotence

**Description**: Completing an account twice should result in same state

**Property**:
```typescript
property("account completion idempotence", () => {
    fc.assert(
        fc.property(
            fc.record({
                email: fc.emailAddress(),
                name: fc.string({ minLength: 2, maxLength: 100 }),
                password: fc.string({ minLength: 8 }),
                phone: fc.string({ minLength: 10, maxLength: 20 }),
                birthDate: fc.date({ min: new Date(1900, 0, 1), max: new Date() })
            }),
            async (data) => {
                // Complete account first time
                await completeAccount(data)
                const user1 = await getUserByEmail(data.email)
                
                // Complete account second time (should fail or be idempotent)
                try {
                    await completeAccount(data)
                    const user2 = await getUserByEmail(data.email)
                    
                    // State should be identical
                    expect(user2?.account_completion_status).toBe('completed')
                    expect(user2?.account_completed_at).toEqual(user1?.account_completed_at)
                } catch (error) {
                    // Or should throw error indicating already completed
                    expect(error).toBeDefined()
                }
            }
        )
    )
})
```

#### Property 7: Validation Error Messages Consistency

**Description**: Invalid inputs must always produce consistent error messages

**Property**:
```typescript
property("validation error consistency", () => {
    fc.assert(
        fc.property(fc.string(), (invalidPassword) => {
            const result1 = validatePassword(invalidPassword)
            const result2 = validatePassword(invalidPassword)
            
            // Same input should produce same errors
            expect(result1.errors).toEqual(result2.errors)
            expect(result1.valid).toBe(result2.valid)
        })
    )
})
```

### 7.2 Integration Tests

#### Test 1: Complete Account Flow End-to-End

**Scenario**: User completes account from OAuth callback to dashboard

```typescript
test("complete account flow end-to-end", async () => {
    // 1. OAuth callback returns requiresPassword
    const oauthResponse = await POST(createOAuthRequest())
    expect(oauthResponse.requiresPassword).toBe(true)
    expect(oauthResponse.tempToken).toBeDefined()
    
    // 2. User accesses completion page
    const completionPage = await GET(`/auth/complete-account`)
    expect(completionPage.status).toBe(200)
    
    // 3. User submits completion form
    const completionResponse = await POST(`/api/auth/complete-account`, {
        tempToken: oauthResponse.tempToken,
        email: "user@example.com",
        name: "John Doe",
        password: "SecurePass123!",
        phone: "+1234567890",
        birthDate: "1990-01-01"
    })
    
    expect(completionResponse.success).toBe(true)
    expect(completionResponse.redirectUrl).toBe("/dashboard")
    
    // 4. User is redirected to dashboard
    const dashboardResponse = await GET("/dashboard")
    expect(dashboardResponse.status).toBe(200)
})
```

#### Test 2: Middleware Redirects Incomplete Accounts

**Scenario**: Incomplete account is redirected to completion flow

```typescript
test("middleware redirects incomplete accounts", async () => {
    // 1. Create incomplete account
    const user = await createIncompleteUser()
    const session = await createSession(user.id)
    
    // 2. Try to access protected route
    const response = await GET("/dashboard", {
        cookies: { session: session.session_id }
    })
    
    // 3. Should redirect to completion flow
    expect(response.status).toBe(307)
    expect(response.headers.location).toContain("/auth/complete-account")
})
```

#### Test 3: Duplicate Email Prevention

**Scenario**: Cannot complete account with email already in use

```typescript
test("duplicate email prevention", async () => {
    // 1. Create existing user
    await createUser({ email: "existing@example.com" })
    
    // 2. Try to complete account with same email
    const response = await POST(`/api/auth/complete-account`, {
        tempToken: validToken,
        email: "existing@example.com",
        name: "John Doe",
        password: "SecurePass123!",
        phone: "+1234567890",
        birthDate: "1990-01-01"
    })
    
    expect(response.status).toBe(409)
    expect(response.error).toContain("already in use")
})
```

## 8. Error Handling

### 8.1 Error Scenarios

| Scenario | HTTP Status | Error Code | Message |
|----------|------------|-----------|---------|
| Invalid temp token | 401 | INVALID_TOKEN | "Your session has expired. Please log in again" |
| Expired temp token | 401 | EXPIRED_TOKEN | "Your session has expired. Please log in again" |
| Missing required field | 400 | MISSING_FIELD | "Field [name] is required" |
| Invalid email format | 400 | INVALID_EMAIL | "Please enter a valid email address" |
| Email already registered | 409 | EMAIL_EXISTS | "This email is already in use" |
| Invalid password | 400 | INVALID_PASSWORD | "Password does not meet security requirements" |
| Invalid phone number | 400 | INVALID_PHONE | "Please enter a valid international phone number" |
| Invalid birth date | 400 | INVALID_BIRTHDATE | "Please enter a valid birth date" |
| User too young | 400 | USER_TOO_YOUNG | "You must be at least 13 years old" |
| Database error | 500 | DB_ERROR | "An error occurred. Please try again later" |

## 9. Security Considerations

### 9.1 Temporary Token Security

- Tokens expire after 30 minutes of inactivity
- Tokens are single-use (marked as used after account completion)
- Tokens are stored as hashes in database (not plain text)
- Tokens include user's OAuth data to prevent token reuse across users

### 9.2 Password Security

- Passwords are hashed using bcrypt with salt rounds = 12
- Passwords are never logged or stored in plain text
- Password validation is performed on both client and server

### 9.3 Session Security

- Sessions are HTTP-only cookies (not accessible via JavaScript)
- Sessions are secure cookies (only sent over HTTPS in production)
- Sessions have SameSite=Strict to prevent CSRF attacks
- Sessions expire after 30 days

### 9.4 Data Validation

- All inputs are validated on both client and server
- Email uniqueness is checked before persistence
- Phone numbers are validated against international format
- Birth dates are validated for age and format

## 10. Performance Considerations

### 10.1 Database Queries

- Index on `account_completion_status` for efficient filtering
- Index on `email` for uniqueness checks
- Index on `oauth_id` for OAuth lookups

### 10.2 Caching

- Temporary tokens are cached in memory with TTL
- User data is cached after completion for 5 minutes

### 10.3 API Response Times

- Account completion endpoint should respond within 500ms
- Validation should complete within 100ms
- Database operations should complete within 200ms

## 11. Deployment Considerations

### 11.1 Database Migration

- Migration must be backward compatible
- New columns have default values
- Migration should be tested in staging before production

### 11.2 Feature Flags

- Account completion flow can be toggled via feature flag
- Middleware can be disabled for testing

### 11.3 Rollback Plan

- If issues occur, disable middleware to allow access to dashboard
- Temporary tokens can be invalidated via database update
- User data can be rolled back if needed

## 12. Testing Strategy

### 12.1 Unit Tests

- Password validation functions
- Phone number validation functions
- Birth date validation functions
- Email validation functions
- Temporary token generation and verification

### 12.2 Integration Tests

- OAuth callback to account completion flow
- Account completion form submission
- Database persistence
- Session creation
- Middleware redirection

### 12.3 Property-Based Tests

- Password strength invariants
- Phone number format consistency
- Birth date age calculation
- Email uniqueness
- Round-trip data persistence
- Account completion idempotence
- Validation error consistency

### 12.4 E2E Tests

- Complete user flow from OAuth to dashboard
- Multi-step form navigation
- Error handling and recovery
- Multilingual support

## 13. Monitoring and Logging

### 13.1 Metrics

- Account completion rate
- Average time to complete account
- Error rates by type
- Temporary token expiration rate

### 13.2 Logging

- Log all account completion attempts
- Log validation errors
- Log database operations
- Log session creation

### 13.3 Alerts

- Alert on high error rates
- Alert on database connection failures
- Alert on unusual patterns (e.g., many failed attempts from same IP)
