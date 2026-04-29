# Design Document: Secure Login Implementation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Login Form Component                                │   │
│  │  - Email input                                       │   │
│  │  - Password input with visibility toggle            │   │
│  │  - Remember Me checkbox                             │   │
│  │  - CSRF token (hidden)                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    POST /api/auth/login
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Next.js API)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Login Route Handler                                 │   │
│  │  - Input validation & sanitization                  │   │
│  │  - CSRF token validation                            │   │
│  │  - Rate limiting check                              │   │
│  │  - Database lookup                                  │   │
│  │  - Password verification (bcrypt)                   │   │
│  │  - Session creation                                 │   │
│  │  - Remember Me token generation                     │   │
│  │  - Audit logging                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌────────┐         ┌────────┐         ┌──────────┐
    │Database│         │ Redis  │         │Audit Log │
    │(Users) │         │(Cache) │         │(Logs)    │
    └────────┘         └────────┘         └──────────┘
```

### Component Architecture

#### 1. Frontend Components

**LoginForm Component** (`src/components/auth/login-form.tsx`)
- Renders email and password inputs
- Displays password visibility toggle button
- Shows Remember Me checkbox
- Handles form submission
- Displays error messages
- Shows loading state during submission

**PasswordVisibilityToggle Component** (`src/components/auth/password-visibility-toggle.tsx`)
- Eye icon button to toggle password visibility
- Keyboard accessible (Enter/Space)
- Accessible ARIA labels
- Visual feedback on state change

#### 2. Backend Components

**Login Route Handler** (`src/app/api/auth/login/route.ts`)
- Validates request method (POST only)
- Parses and validates request body
- Validates CSRF token
- Checks rate limiting
- Queries database for user
- Verifies password with bcrypt
- Creates session and Remember Me tokens
- Sets secure cookies
- Logs authentication event
- Returns response

**Rate Limiter** (`src/lib/auth/rate-limiter.ts`)
- Tracks failed attempts per IP
- Enforces 5 attempts per hour limit
- Resets counter on successful login
- Auto-resets after 1 hour inactivity
- Uses Redis for distributed caching

**CSRF Validator** (`src/lib/auth/csrf-validator.ts`)
- Generates cryptographically secure tokens
- Validates token format and expiration
- Stores tokens in secure cookies
- Prevents token reuse

**Session Manager** (`src/lib/auth/session-manager.ts`)
- Creates session tokens (1-hour expiration)
- Creates Remember Me tokens (30-day expiration)
- Stores tokens in secure cookies
- Validates token on subsequent requests
- Handles token refresh

**Audit Logger** (`src/lib/auth/audit-logger.ts`)
- Logs successful login attempts
- Logs failed login attempts
- Logs CSRF failures
- Logs rate limiting events
- Stores logs in database
- Supports log export for compliance

#### 3. Database Schema

**users table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**sessions table**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**remember_me_tokens table**
```sql
CREATE TABLE remember_me_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**audit_logs table**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**rate_limit_attempts table** (or Redis)
```sql
CREATE TABLE rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL,
  attempt_count INT DEFAULT 1,
  first_attempt_at TIMESTAMP DEFAULT NOW(),
  last_attempt_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ip_address)
);
```

## API Specification

### POST /api/auth/login

**Request**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": false,
  "csrfToken": "token_value"
}
```

**Response (Success - 200)**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Response (Invalid Credentials - 401)**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Response (Rate Limited - 429)**
```json
{
  "success": false,
  "error": "Too many login attempts. Please try again in 1 hour."
}
```

**Response (CSRF Failure - 403)**
```json
{
  "success": false,
  "error": "Invalid request. Please refresh and try again."
}
```

**Response (Validation Error - 400)**
```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "email": "Invalid email format"
  }
}
```

**Cookies Set**
- `session_token`: Session token (1 hour, HttpOnly, Secure, SameSite=Strict)
- `remember_me_token`: Remember Me token (30 days, HttpOnly, Secure, SameSite=Strict)
- `csrf_token`: CSRF token (HttpOnly, Secure, SameSite=Strict)

## Security Implementation

### Password Hashing
- Algorithm: bcrypt
- Cost factor: 12
- Salt: Automatically generated by bcrypt
- Comparison: Constant-time comparison to prevent timing attacks

### CSRF Protection
- Token generation: Cryptographically secure random (32 bytes)
- Token storage: Secure cookie (HttpOnly, Secure, SameSite)
- Token validation: Exact match with server-stored token
- Token expiration: Session-based (expires when session ends)

### Rate Limiting
- Tracking: Per IP address
- Limit: 5 failed attempts per hour
- Storage: Redis (distributed) or in-memory (local)
- Reset: Automatic after 1 hour or on successful login
- Response: 429 Too Many Requests with user-friendly message

### Session Management
- Session token: Cryptographically secure random (32 bytes)
- Session expiration: 1 hour
- Remember Me token: Cryptographically secure random (32 bytes)
- Remember Me expiration: 30 days
- Token storage: Secure cookies (HttpOnly, Secure, SameSite=Strict)
- Token validation: Hash comparison (tokens hashed in database)

### Input Validation
- Email: Valid email format, max 255 characters
- Password: Not empty, max 1024 characters
- CSRF token: Present, valid format
- Request body: Valid JSON, max 10KB
- Extra fields: Rejected (no prototype pollution)

### Error Messages
- Generic message for all authentication failures: "Invalid email or password"
- No indication of whether email exists or password is wrong
- No database error details exposed to user
- Actual failure reason logged internally for debugging

### Security Headers
- Content-Security-Policy: Prevent XSS
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY (prevent clickjacking)
- Strict-Transport-Security: HTTPS only (production)
- X-XSS-Protection: Legacy browser support
- Referrer-Policy: no-referrer
- Cache-Control: no-store, no-cache, must-revalidate

### Audit Logging
- Successful login: user_id, email, IP, user_agent, timestamp
- Failed login: email, IP, user_agent, failure reason, timestamp
- CSRF failure: IP, user_agent, timestamp
- Rate limiting: IP, attempt count, timestamp
- Remember Me creation: user_id, expiration, timestamp
- Remember Me validation: user_id, success/failure, timestamp
- Retention: 90+ days
- Format: Append-only, immutable

## Data Flow

### Successful Login Flow
```
1. User submits login form
2. Frontend validates email/password format
3. Frontend sends POST /api/auth/login with CSRF token
4. Backend validates CSRF token
5. Backend checks rate limiting
6. Backend queries database for user by email
7. Backend hashes provided password and compares with stored hash
8. Backend creates session token (1 hour)
9. Backend creates Remember Me token if checkbox selected (30 days)
10. Backend sets secure cookies
11. Backend logs successful login
12. Backend returns 200 with success message
13. Frontend redirects to dashboard
```

### Failed Login Flow
```
1. User submits login form
2. Frontend validates email/password format
3. Frontend sends POST /api/auth/login with CSRF token
4. Backend validates CSRF token
5. Backend checks rate limiting
6. Backend queries database for user by email
7. User not found OR password doesn't match
8. Backend increments rate limit counter
9. Backend logs failed login attempt
10. Backend returns 401 with generic error message
11. Frontend displays error message
12. User can retry (up to 5 times per hour)
```

### Rate Limiting Flow
```
1. User submits login form (6th attempt in 1 hour)
2. Backend checks rate limiting
3. Rate limit counter >= 5
4. Backend returns 429 Too Many Requests
5. Frontend displays user-friendly message
6. User must wait 1 hour before retrying
7. After 1 hour, counter resets automatically
```

## Environment Configuration

### Cloud Environment (Vercel/AWS)
- Database: Supabase PostgreSQL
- Cache: Redis (Upstash or similar)
- Session storage: Redis
- Rate limiting: Redis
- Audit logs: PostgreSQL
- HTTPS: Enforced
- Secure cookies: Enabled

### Local Environment
- Database: Local PostgreSQL or SQLite
- Cache: In-memory cache
- Session storage: In-memory
- Rate limiting: In-memory
- Audit logs: Local database
- HTTPS: Optional (localhost)
- Secure cookies: Conditional (based on NODE_ENV)

## Integration Points

### Database Integration
- Query users by email
- Store/retrieve session tokens
- Store/retrieve Remember Me tokens
- Log audit events
- Check rate limiting

### Authentication Middleware
- Validate session token on protected routes
- Validate Remember Me token
- Refresh session if needed
- Redirect to login if not authenticated

### Error Handling
- Database connection errors: Generic error message to user, detailed log internally
- Timeout errors: Graceful timeout handling, retry logic
- Concurrent requests: Race condition prevention with database locks

## Performance Considerations

- CSRF validation: < 50ms (in-memory or Redis)
- Rate limiting check: < 50ms (Redis or in-memory)
- Password hashing: ~200ms (bcrypt cost factor 12)
- Database query: < 100ms (indexed email lookup)
- Total endpoint response: < 500ms under normal conditions

## Testing Strategy

### Unit Tests
- Input validation functions
- Password hashing and comparison
- CSRF token generation and validation
- Rate limiting logic
- Session token generation

### Integration Tests
- Complete login flow (success)
- Complete login flow (failure)
- Rate limiting enforcement
- CSRF protection
- Remember Me functionality
- Session management

### Security Tests
- SQL injection attempts
- XSS payload injection
- CSRF token bypass
- Brute force attacks
- Timing attacks
- Information disclosure

### Performance Tests
- Response time under load
- Concurrent login attempts
- Database query optimization
- Cache effectiveness

## Deployment Considerations

- Database migrations for new tables
- Redis configuration for distributed caching
- Environment variables for secrets
- Security headers configuration
- HTTPS enforcement in production
- Audit log retention policy
- Monitoring and alerting setup
