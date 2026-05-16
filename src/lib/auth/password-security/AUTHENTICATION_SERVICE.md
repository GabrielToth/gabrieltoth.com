# Authentication Service: Main Controller

## Overview

The `AuthenticationService` is the main controller that orchestrates all password security components into a cohesive authentication system. It coordinates:

- **CAPTCHA validation** (bot protection)
- **Rate limiting** (brute force protection)
- **Password hashing** (Argon2id with salt and pepper)
- **Password validation** (with algorithm detection)
- **Algorithm migration** (Bcrypt → Argon2id)
- **Audit logging** (security events)
- **Error handling** (generic messages, no user enumeration)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  AuthenticationService                       │
│                   (Main Controller)                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  CAPTCHA         │ │  Rate Limiter    │ │  Password        │
│  Validator       │ │                  │ │  Validator       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Cloudflare      │ │  Supabase        │ │  Argon2id        │
│  Turnstile       │ │  Database        │ │  Hasher          │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │  Audit Logs      │
                    │  (Supabase)      │
                    └──────────────────┘
```

## Usage

### Registration

```typescript
import { getAuthenticationService } from '@/lib/auth/password-security'

const service = getAuthenticationService()

const result = await service.register({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  captchaToken: 'token_from_frontend'
})

if (result.success) {
  console.log('User registered:', result.userId)
} else {
  console.error('Registration failed:', result.error)
}
```

### Login

```typescript
import { getAuthenticationService } from '@/lib/auth/password-security'

const service = getAuthenticationService()

const result = await service.login({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  captchaToken: 'token_from_frontend'
})

if (result.success) {
  console.log('User logged in:', result.userId)
  
  if (result.requiresMigration) {
    console.log('Password was migrated from Bcrypt to Argon2id')
  }
} else if (result.isLocked) {
  console.error('Account locked for', result.unlockTimeSeconds, 'seconds')
} else {
  console.error('Login failed:', result.error)
}
```

## Registration Flow

```
1. Validate CAPTCHA token
   ├─ If missing: Return 400 Bad Request
   └─ If invalid: Return 400 Bad Request

2. Validate input (email, password format)
   ├─ If invalid: Return 400 Bad Request
   └─ If valid: Continue

3. Check if email already exists
   ├─ If exists: Return 409 Conflict (generic error)
   └─ If new: Continue

4. Hash password with Argon2id
   ├─ If error: Return 500 Internal Server Error
   └─ If success: Continue

5. Create user record in database
   ├─ If error: Return 500 Internal Server Error
   └─ If success: Continue

6. Log registration event
   └─ Continue (don't fail if logging fails)

7. Return 201 Created with user data
```

## Login Flow

```
1. Validate CAPTCHA token
   ├─ If missing: Return 400 Bad Request
   ├─ If invalid (not degraded): Return 400 Bad Request
   └─ If invalid (degraded): Activate degraded mode, continue

2. Check rate limits
   ├─ If locked: Return 429 Too Many Requests
   └─ If allowed: Continue

3. Validate input (email, password format)
   ├─ If invalid: Record failure, return 401 Unauthorized
   └─ If valid: Continue

4. Look up user by email
   ├─ If not found: Record failure, return 401 Unauthorized
   └─ If found: Continue

5. Validate password against stored hash
   ├─ If invalid: Record failure, return 401 Unauthorized
   └─ If valid: Continue

6. Trigger algorithm migration if needed
   ├─ If Bcrypt detected: Migrate to Argon2id (async)
   └─ If Argon2id: No migration needed

7. Reset rate limit counter
   └─ Continue (don't fail if reset fails)

8. Log authentication event
   └─ Continue (don't fail if logging fails)

9. Return 200 OK with user data
```

## Security Features

### 1. CAPTCHA Protection
- Validates CAPTCHA token before processing credentials
- Prevents automated registration and login attacks
- Supports graceful degradation if CAPTCHA service is unavailable
- Returns generic error messages (no CAPTCHA failure indication)

### 2. Rate Limiting
- Tracks failed attempts by email address
- Locks account after 5 failures in 15 minutes
- Automatically unlocks after 15 minutes
- Resets counter on successful login
- Returns 429 Too Many Requests when locked

### 3. Password Hashing
- Uses Argon2id for new passwords (never Bcrypt)
- Automatically generates cryptographically secure salt
- Applies server-side pepper before hashing
- Configurable memory, time, and parallelism parameters
- Tuned for Vercel Free Plan (2-3 seconds per hash)

### 4. Password Validation
- Uses constant-time comparison to prevent timing attacks
- Detects hash algorithm (Argon2id vs Bcrypt)
- Applies pepper before validation
- Returns generic error messages (no algorithm revelation)

### 5. Algorithm Migration
- Automatically detects Bcrypt hashes during login
- Triggers async migration to Argon2id on successful login
- Doesn't block authentication if migration fails
- Logs migration events for audit trail

### 6. Error Handling
- Returns generic error messages (prevents user enumeration)
- Same error for "user not found" vs "wrong password"
- Same error for "rate limited" vs "locked"
- Doesn't reveal hash algorithm in error messages
- Logs detailed errors internally for debugging

### 7. Audit Logging
- Logs registration events with algorithm and timing
- Logs authentication success/failure
- Logs rate limit triggers with attempt count
- Logs algorithm migrations
- Logs CAPTCHA failures and degraded mode activation
- All logs include timestamp and user identifier

## Configuration

The Authentication Service uses configuration from the `ConfigurationManager`:

```typescript
interface SecurityConfig {
  argon2id: {
    memory: number      // 16-256 MB (default: 64)
    time: number        // 2-10 iterations (default: 3)
    parallelism: number // 1-4 threads (default: 2)
  }
  pepper: string        // Server-side secret (min 32 chars)
  rateLimiting: {
    failureThreshold: number        // 5 failures
    windowMinutes: number           // 15 minutes
    lockoutMinutes: number          // 15 minutes
    captchaEscalationThreshold: number // 3 failures
  }
  captchaProvider: 'cloudflare' | 'google'
}
```

### Environment Variables

```bash
# Argon2id Parameters
ARGON2_MEMORY_COST=64              # MB (tuned for Vercel Free)
ARGON2_TIME_COST=3                 # iterations
ARGON2_PARALLELISM=2               # threads

# Security
PEPPER_SECRET=your-secure-pepper-min-32-chars

# CAPTCHA
CAPTCHA_PROVIDER=cloudflare        # or 'google'
CAPTCHA_SECRET_KEY=your-secret-key

# Database
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Response Types

### AuthenticationResult

```typescript
interface AuthenticationResult {
  success: boolean
  userId?: string
  email?: string
  error?: string
  errorCode?: string
  statusCode: number
  isLocked?: boolean
  unlockTimeSeconds?: number
  requiresMigration?: boolean
  degradedMode?: boolean
}
```

### Status Codes

- **201 Created**: Registration successful
- **200 OK**: Login successful
- **400 Bad Request**: Invalid input, missing CAPTCHA, invalid CAPTCHA
- **401 Unauthorized**: Invalid credentials, user not found
- **409 Conflict**: Email already exists
- **429 Too Many Requests**: Account locked due to rate limiting
- **500 Internal Server Error**: Database error, hashing error, etc.

## Error Codes

- `CAPTCHA_REQUIRED`: CAPTCHA token is missing
- `REGISTRATION_FAILED`: Generic registration failure
- `INVALID_EMAIL`: Email format is invalid
- `INVALID_PASSWORD`: Password format is invalid
- `DATABASE_ERROR`: Database connection or query error
- `HASHING_ERROR`: Password hashing error
- `AUTH_FAILED`: Generic authentication failure
- `TOO_MANY_ATTEMPTS`: Account locked due to rate limiting
- `INTERNAL_ERROR`: Unexpected server error

## Performance

### Hashing Performance
- **Argon2id**: 2-3 seconds per hash (tuned for Vercel Free)
- **Bcrypt validation**: 1-2 seconds per validation
- **Argon2id validation**: 2-3 seconds per validation

### Database Performance
- **User lookup**: ~10-50ms
- **Rate limit check**: ~10-50ms
- **Audit log insert**: ~10-50ms

### Total Request Time
- **Registration**: 2-4 seconds (mostly hashing)
- **Login**: 2-4 seconds (mostly validation)
- **Rate limited**: <100ms (no hashing)

## Testing

### Unit Tests

```bash
npm run test -- src/lib/auth/password-security/authentication-service.test.ts
```

### Integration Tests

```bash
npm run test -- src/app/api/auth/login/route.test.ts
npm run test -- src/app/api/auth/register/route.test.ts
```

### Manual Testing

```typescript
// Test registration
const registerResult = await service.register({
  email: 'test@example.com',
  password: 'TestPassword123!',
  captchaToken: 'valid_token'
})

// Test login
const loginResult = await service.login({
  email: 'test@example.com',
  password: 'TestPassword123!',
  captchaToken: 'valid_token'
})

// Test rate limiting
for (let i = 0; i < 6; i++) {
  const result = await service.login({
    email: 'test@example.com',
    password: 'WrongPassword',
    captchaToken: 'valid_token'
  })
  console.log(`Attempt ${i + 1}:`, result.statusCode)
}
// Should see: 401, 401, 401, 401, 401, 429
```

## Troubleshooting

### "PEPPER_SECRET must be >= 32 characters"
- Set `PEPPER_SECRET` environment variable with at least 32 characters
- In Docker: Add to `docker-compose.yml` environment section
- In Vercel: Add to Environment Variables in project settings

### "CAPTCHA_SECRET_KEY environment variable is not configured"
- Set `CAPTCHA_SECRET_KEY` environment variable
- Get the key from Cloudflare Turnstile or Google reCAPTCHA dashboard
- In Docker: Add to `docker-compose.yml` environment section
- In Vercel: Add to Environment Variables in project settings

### "Missing Supabase configuration"
- Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- In Docker: Add to `docker-compose.yml` environment section
- In Vercel: Add to Environment Variables in project settings

### "Account locked" error
- Wait 15 minutes for automatic unlock
- Or use `getRateLimiter().unlockAccount(email)` for admin unlock

### "Password hashing exceeded 10 seconds"
- Reduce `ARGON2_MEMORY_COST` or `ARGON2_TIME_COST`
- Check server resources (CPU, memory)
- Consider upgrading from Vercel Free Plan

## Requirements Coverage

This service implements the following requirements:

- ✅ Requirement 1: Argon2id Password Hashing
- ✅ Requirement 3: Pepper Security Layer
- ✅ Requirement 6: Password Hash Validation
- ✅ Requirement 7: Brute Force Protection with Rate Limiting
- ✅ Requirement 8: Input Validation
- ✅ Requirement 9: Security Against Attack Vectors
- ✅ Requirement 10: Constant-Time Comparison
- ✅ Requirement 11: Algorithm Migration on Successful Login
- ✅ Requirement 14: Error Handling and Logging
- ✅ Requirement 20: CAPTCHA Protection Against Automated Attacks

## Related Components

- `ConfigurationManager`: Loads and validates security configuration
- `RateLimiter`: Tracks failed attempts and enforces lockouts
- `PasswordValidator`: Validates passwords against stored hashes
- `Argon2idHasher`: Hashes passwords with Argon2id
- `BcryptValidator`: Validates legacy Bcrypt hashes
- `PasswordMigrationTrigger`: Migrates Bcrypt to Argon2id
- `CAPTCHAVerifier`: Verifies CAPTCHA tokens
- `AuditLogger`: Logs security events

## Future Enhancements

- [ ] Support for multiple pepper values (rotation)
- [ ] Configurable CAPTCHA escalation thresholds
- [ ] IP-based rate limiting (in addition to email-based)
- [ ] Passwordless authentication (email links, WebAuthn)
- [ ] Multi-factor authentication (TOTP, SMS)
- [ ] Account recovery flows
- [ ] Session management and token refresh
- [ ] Device fingerprinting and anomaly detection
