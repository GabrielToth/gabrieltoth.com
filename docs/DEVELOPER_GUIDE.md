# Account Completion Flow - Developer Guide

## Overview

This guide provides technical documentation for developers working on the Account Completion Flow feature. It covers architecture, implementation details, and best practices.

## Architecture

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

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── complete-account/
│   │       │   ├── route.ts          # API endpoint
│   │       │   └── route.test.ts     # API tests
│   │       └── oauth/
│   │           └── callback/
│   │               └── route.ts      # OAuth callback handler
│   └── [locale]/
│       └── auth/
│           └── complete-account/
│               ├── page.tsx          # Main page
│               ├── complete-account-form.tsx
│               ├── steps/
│               │   ├── step-1-prefilled.tsx
│               │   ├── step-2-new-fields.tsx
│               │   └── step-3-verification.tsx
│               ├── components/
│               │   ├── progress-indicator.tsx
│               │   ├── field-editor.tsx
│               │   ├── password-strength.tsx
│               │   └── data-summary.tsx
│               └── hooks/
│                   └── useAccountCompletion.ts
├── lib/
│   └── auth/
│       ├── account-completion-validation.ts
│       ├── account-completion-validation.test.ts
│       ├── account-completion.property.test.ts
│       ├── temp-token.ts
│       ├── temp-token.test.ts
│       ├── user.ts
│       ├── user.test.ts
│       ├── session.ts
│       ├── session.test.ts
│       ├── audit-logging.ts
│       ├── audit-logging.test.ts
│       ├── error-handling.ts
│       ├── error-handling.test.ts
│       └── middleware/
│           ├── account-completion.ts
│           └── account-completion.test.ts
├── middleware.ts                      # Main middleware
└── __tests__/
    └── integration/
        ├── account-completion-e2e.test.ts
        ├── account-completion-middleware.test.ts
        ├── account-completion-duplicate-email.test.ts
        └── account-completion-multilingual.test.ts
```

## Key Modules

### Temporary Token Module (`src/lib/auth/temp-token.ts`)

Handles generation and validation of temporary tokens.

**Functions:**

- `generateTempToken(payload)` - Generates a new temporary token
- `validateTempToken(token)` - Validates and decodes a temporary token

**Example:**

```typescript
import { generateTempToken, validateTempToken } from '@/lib/auth/temp-token'

// Generate token
const token = generateTempToken({
  email: 'user@example.com',
  oauth_provider: 'google',
  oauth_id: 'google-123',
  name: 'John Doe',
})

// Validate token
const payload = validateTempToken(token)
console.log(payload.email) // 'user@example.com'
```

### Validation Module (`src/lib/auth/account-completion-validation.ts`)

Validates all account completion data.

**Functions:**

- `validatePassword(password)` - Validates password strength
- `validatePhoneNumber(phone)` - Validates phone number format
- `validateBirthDate(birthDate)` - Validates birth date and age
- `validateEmail(email)` - Validates email format
- `validateAccountCompletionData(data)` - Validates all fields

**Example:**

```typescript
import { validateAccountCompletionData } from '@/lib/auth/account-completion-validation'

const validation = validateAccountCompletionData({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'SecurePass123!',
  phone: '+1234567890',
  birthDate: '1990-01-01',
})

if (!validation.valid) {
  console.log(validation.errors)
}
```

### User Module (`src/lib/auth/user.ts`)

Handles user database operations.

**Functions:**

- `getUserByEmail(email)` - Gets user by email
- `updateUserAccountCompletion(oauthId, data)` - Updates user with completion data
- `markAccountInProgress(userId)` - Marks account as in progress
- `markAccountCompleted(userId)` - Marks account as completed

**Example:**

```typescript
import { updateUserAccountCompletion } from '@/lib/auth/user'

const user = await updateUserAccountCompletion('google-123', {
  email: 'user@example.com',
  name: 'John Doe',
  password_hash: 'hashed-password',
  phone_number: '+1234567890',
  birth_date: new Date('1990-01-01'),
  account_completion_status: 'completed',
  account_completed_at: new Date(),
})
```

### Session Module (`src/lib/auth/session.ts`)

Handles session creation and management.

**Functions:**

- `createSession(userId)` - Creates a new session
- `getSession(sessionId)` - Gets session by ID
- `invalidateSession(sessionId)` - Invalidates a session

**Example:**

```typescript
import { createSession } from '@/lib/auth/session'

const session = await createSession('user-123')
console.log(session.session_id) // 'session-id-123'
```

### Audit Logging Module (`src/lib/auth/audit-logging.ts`)

Logs all account completion events.

**Functions:**

- `logAuditEvent(action, email, ip, data, userId)` - Logs an audit event

**Example:**

```typescript
import { logAuditEvent } from '@/lib/auth/audit-logging'

await logAuditEvent(
  'ACCOUNT_COMPLETION',
  'user@example.com',
  '192.168.1.1',
  { oauth_provider: 'google' },
  'user-123'
)
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(20),
  oauth_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  phone_number VARCHAR(20),
  birth_date DATE,
  account_completion_status VARCHAR(20) DEFAULT 'pending',
  account_completed_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_account_completion_status ON users(account_completion_status);
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_oauth_id ON users(oauth_id);
```

### Temporary Tokens Table (Optional)

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

## API Endpoint Implementation

### POST /api/auth/complete-account

**File:** `src/app/api/auth/complete-account/route.ts`

**Process:**

1. Apply rate limiting
2. Parse request body
3. Validate temporary token
4. Validate all submitted data
5. Check email uniqueness
6. Hash password
7. Update user record
8. Create session
9. Return response with session cookie

**Example:**

```typescript
export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimit = await rateLimitByKey(rateLimitKey)
  if (!rateLimit.success) {
    return createErrorResponse(AuthErrorType.TOO_MANY_ATTEMPTS)
  }

  // 2. Parse request
  const body = await request.json()

  // 3. Validate token
  const tokenPayload = validateTempToken(body.tempToken)

  // 4. Validate data
  const validation = validateAccountCompletionData(body)
  if (!validation.valid) {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
  }

  // 5. Check email uniqueness
  const existingUser = await getUserByEmail(body.email)
  if (existingUser) {
    return createErrorResponse(AuthErrorType.EMAIL_ALREADY_REGISTERED)
  }

  // 6. Hash password
  const passwordHash = await bcrypt.hash(body.password, 12)

  // 7. Update user
  const user = await updateUserAccountCompletion(tokenPayload.oauth_id, {
    email: body.email,
    name: body.name,
    password_hash: passwordHash,
    phone_number: body.phone,
    birth_date: new Date(body.birthDate),
    account_completion_status: 'completed',
    account_completed_at: new Date(),
  })

  // 8. Create session
  const session = await createSession(user.id)

  // 9. Return response
  const response = NextResponse.json({
    success: true,
    message: 'Account setup completed successfully',
    redirectUrl: '/dashboard',
  })

  response.cookies.set('session', session.session_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
```

## Middleware Implementation

### Account Completion Middleware

**File:** `src/lib/middleware/account-completion.ts`

**Process:**

1. Check if user has active session
2. Get user from database
3. Check if account is complete
4. Check if user is on completion page
5. Redirect to completion flow if needed

**Example:**

```typescript
export async function checkAccountCompletion(request: NextRequest) {
  // 1. Get session
  const session = getSessionFromCookie(request)
  if (!session) return null

  // 2. Get user
  const user = await getUserById(session.user_id)
  if (!user) return null

  // 3. Check if complete
  if (user.password_hash && user.account_completion_status === 'completed') {
    return null
  }

  // 4. Check if on completion page
  const pathname = request.nextUrl.pathname
  if (pathname.includes('/auth/complete-account')) {
    return null
  }

  // 5. Redirect
  const locale = pathname.split('/')[1] || 'en'
  return NextResponse.redirect(
    new URL(`/${locale}/auth/complete-account`, request.url)
  )
}
```

## Frontend Components

### Account Completion Form

**File:** `src/app/[locale]/auth/complete-account/complete-account-form.tsx`

**Features:**

- Multi-step form navigation
- Form state management
- Validation and error handling
- Loading states

**Example:**

```typescript
export function CompleteAccountForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const handleNext = async () => {
    // Validate current step
    const validation = validateStep(currentStep, formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    // Move to next step
    setCurrentStep(currentStep + 1)
  }

  const handleSubmit = async () => {
    // Submit to API
    const response = await fetch('/api/auth/complete-account', {
      method: 'POST',
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div>
      {currentStep === 1 && <Step1PrefilledData />}
      {currentStep === 2 && <Step2NewFields />}
      {currentStep === 3 && <Step3Verification />}
    </div>
  )
}
```

## Testing

### Unit Tests

Unit tests are located in `src/lib/auth/*.test.ts` files.

**Example:**

```typescript
import { validatePassword } from '@/lib/auth/account-completion-validation'

describe('validatePassword', () => {
  it('should accept valid password', () => {
    const result = validatePassword('SecurePass123!')
    expect(result.valid).toBe(true)
  })

  it('should reject weak password', () => {
    const result = validatePassword('weak')
    expect(result.valid).toBe(false)
  })
})
```

### Integration Tests

Integration tests are located in `src/__tests__/integration/account-completion-*.test.ts` files.

**Example:**

```typescript
describe('Account Completion End-to-End Flow', () => {
  it('should complete full flow from OAuth to dashboard', async () => {
    // Test complete flow
  })
})
```

### Property-Based Tests

Property-based tests are located in `src/lib/auth/*.property.test.ts` files.

**Example:**

```typescript
import fc from 'fast-check'

describe('Password strength invariant', () => {
  it('should validate all accepted passwords', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 8 }), (password) => {
        const result = validatePassword(password)
        if (result.valid) {
          expect(/[A-Z]/.test(password)).toBe(true)
          expect(/[a-z]/.test(password)).toBe(true)
          expect(/\d/.test(password)).toBe(true)
          expect(/[!@#$%^&*]/.test(password)).toBe(true)
        }
      })
    )
  })
})
```

## Running Tests

### Run all tests

```bash
npm run test
```

### Run specific test file

```bash
npm run test -- src/lib/auth/account-completion-validation.test.ts
```

### Run integration tests

```bash
npm run test -- src/__tests__/integration/
```

### Run with coverage

```bash
npm run test:coverage
```

## Debugging

### Enable debug logging

Set the `DEBUG` environment variable:

```bash
DEBUG=account-completion:* npm run dev
```

### Check database state

```sql
SELECT id, email, account_completion_status, account_completed_at
FROM users
WHERE account_completion_status != 'completed';
```

### Check audit logs

```sql
SELECT * FROM audit_logs
WHERE action = 'ACCOUNT_COMPLETION'
ORDER BY created_at DESC
LIMIT 10;
```

## Performance Optimization

### Database Queries

- Use indexes on `account_completion_status`, `email`, and `oauth_id`
- Use parameterized queries to prevent SQL injection
- Cache user data after completion for 5 minutes

### API Response Times

- Account completion endpoint should respond within 500ms
- Validation should complete within 100ms
- Database operations should complete within 200ms

### Frontend Performance

- Lazy load form components
- Debounce validation input
- Cache translations

## Security Best Practices

### Password Security

- Hash passwords using bcrypt with cost factor 12
- Never log or store passwords in plain text
- Validate password strength on both client and server

### Session Security

- Use HTTP-only cookies
- Set Secure flag for HTTPS
- Set SameSite=Strict to prevent CSRF
- Expire sessions after 30 days

### Data Validation

- Validate all inputs on both client and server
- Sanitize HTML to prevent XSS
- Use parameterized queries to prevent SQL injection

### Rate Limiting

- Limit to 5 requests per hour per IP
- Limit to 10 requests per hour per email
- Return 429 status code when limit exceeded

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Rollback plan documented

### Database Migration

```bash
# Run migration
npm run db:migrate

# Verify migration
npm run db:verify

# Rollback if needed
npm run db:rollback
```

### Feature Flags

Account completion can be toggled via feature flag:

```typescript
if (featureFlags.accountCompletion) {
  // Enable account completion flow
}
```

## Support

For questions or issues, please:

1. Check the API documentation
2. Review the test files for examples
3. Check the GitHub issues
4. Contact the development team
