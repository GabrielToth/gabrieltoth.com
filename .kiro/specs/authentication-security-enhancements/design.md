# Design Document: Authentication Security Enhancements

## Overview

This document specifies the design for enhancing the authentication system security in the gabrieltoth.com application. The enhancements focus on implementing robust logout functionality with rate limiting, comprehensive route protection, secure session management, and audit logging.

The system builds upon the existing Next.js 16.2.4 App Router architecture with Supabase PostgreSQL, extending the current session-based authentication with CSRF protection and in-memory rate limiting.

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Login Page   │  │  Dashboard   │  │ Logout Button│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Middleware                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  proxy.ts (Rate Limiting + Security Headers)         │  │
│  │  - checkRateLimit()                                   │  │
│  │  - rateLimitStore Map                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  auth-middleware.ts (Session Validation)             │  │
│  │  - validateSession()                                  │  │
│  │  - authMiddleware()                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handlers                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/auth/logout                                     │  │
│  │  - Validate CSRF token                                │  │
│  │  - Check rate limit                                   │  │
│  │  - Delete session from database                       │  │
│  │  - Clear session cookie                               │  │
│  │  - Create audit log                                   │  │
│  │  - Return redirect instruction                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dashboard Routes                                     │  │
│  │  - /dashboard                                         │  │
│  │  - /dashboard/publish                                 │  │
│  │  - /dashboard/insights                                │  │
│  │  - /dashboard/settings                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   sessions   │  │  audit_logs  │  │    users     │     │
│  │              │  │              │  │              │     │
│  │ session_id   │  │ event_type   │  │ id           │     │
│  │ user_id      │  │ user_id      │  │ email        │     │
│  │ created_at   │  │ ip_address   │  │ ...          │     │
│  │ expires_at   │  │ timestamp    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### 1. Rate Limiting Layer (proxy.ts)

**Purpose**: Prevent denial-of-service attacks by limiting request frequency per user.

**Components**:
- `rateLimitStore`: In-memory Map storing request counts per user+endpoint
- `checkRateLimit()`: Validates if request is within rate limit
- `getRateLimitKey()`: Generates composite key from IP/user and endpoint

**Data Structure**:
```typescript
interface RateLimitRecord {
    count: number
    resetTime: number
}

// Key format: "userId:endpoint" or "ip:endpoint"
const rateLimitStore = new Map<string, RateLimitRecord>()
```

**Rate Limit Configuration**:
- Logout endpoint: 5 requests per 60 seconds per user
- Window: 60,000 milliseconds (60 seconds)
- Tracking: By session token user ID (authenticated) or IP (unauthenticated)

#### 2. Session Management Layer (session.ts)

**Purpose**: Manage session lifecycle including creation, validation, and removal.

**Key Functions**:
- `createSession(userId)`: Creates new session with 30-day expiration
- `validateSession(sessionId)`: Validates session exists and not expired
- `removeSession(sessionId)`: Deletes session from database
- `getSessionFromCookie(request)`: Extracts and validates session from cookie

**Session Data Model**:
```typescript
interface Session {
    id: string
    user_id: string
    session_id: string
    created_at: Date
    expires_at: Date
}
```

**Cookie Configuration**:
```typescript
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    path: "/",
}
```

#### 3. Authentication Middleware (auth-middleware.ts)

**Purpose**: Protect routes by validating sessions before route handlers execute.

**Key Functions**:
- `authMiddleware(request)`: Validates session and redirects if invalid
- `validateSession(sessionId)`: Queries database and checks expiration
- `getAuthenticatedUser(request)`: Returns user ID from valid session

**Middleware Flow**:
```
Request → Extract session cookie → Validate session → Check expiration
    ↓                                    ↓                    ↓
No cookie                          Not found            Expired
    ↓                                    ↓                    ↓
Redirect /auth/login           Redirect /auth/login   Redirect /auth/login
                                                             
                                Valid session
                                      ↓
                              Allow request to proceed
```

#### 4. Logout API Route (/api/auth/logout)

**Purpose**: Handle logout requests with security validations and cleanup.

**Request Flow**:
```typescript
POST /api/auth/logout
Headers: {
    Cookie: "session=<session_id>",
    "X-CSRF-Token": "<csrf_token>"
}

Response (Success):
{
    success: true,
    redirect: "/auth/login"
}
Status: 200

Response (Rate Limited):
{
    error: "Too many logout attempts. Please try again later."
}
Status: 429

Response (No Session):
{
    error: "No active session"
}
Status: 401

Response (Invalid Session):
{
    error: "Invalid session"
}
Status: 401
```

**Processing Steps**:
1. Extract session token from cookie
2. Validate CSRF token
3. Check rate limit (5 requests per 60 seconds)
4. Validate session exists and not expired
5. Delete session from database
6. Clear session cookie (maxAge=0, value="")
7. Create audit log entry
8. Return success with redirect instruction

#### 5. Audit Logging System

**Purpose**: Record security-relevant events for compliance and analysis.

**Audit Log Schema**:
```typescript
interface AuditLog {
    id: string
    event_type: string // "LOGOUT"
    user_id: string
    ip_address: string
    timestamp: Date
    metadata?: Record<string, unknown>
}
```

**Logging Strategy**:
- Log all successful logouts
- Log all failed logout attempts (rate limited, invalid session)
- Include user ID, IP address, timestamp
- Do not log sensitive data (passwords, tokens)
- Continue logout process even if audit logging fails

#### 6. Dashboard Route Protection

**Purpose**: Ensure all dashboard routes require valid authentication.

**Protected Routes**:
- `/dashboard` - Main dashboard
- `/dashboard/publish` - Content publishing
- `/dashboard/insights` - Analytics
- `/dashboard/settings` - User settings

**Protection Mechanism**:
```typescript
// In middleware.ts
export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    
    // Check if route is protected
    if (pathname.startsWith('/dashboard')) {
        const authResponse = await authMiddleware(request)
        if (authResponse) {
            return authResponse // Redirect to login
        }
    }
    
    // Continue to route handler
    return NextResponse.next()
}
```

## Data Models

### Sessions Table

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
);
```

### Rate Limit Store (In-Memory)

```typescript
// Key: "userId:logout" or "ip:logout"
// Value: { count: number, resetTime: number }
const rateLimitStore = new Map<string, RateLimitRecord>()
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
    error: string
    code?: string
    details?: Record<string, unknown>
}
```

### Error Scenarios

| Scenario | HTTP Status | Error Message | Action |
|----------|-------------|---------------|--------|
| Rate limited | 429 | "Too many logout attempts. Please try again later." | Block request |
| No session cookie | 401 | "No active session" | Return error |
| Invalid session | 401 | "Invalid session" | Return error |
| Expired session | 401 | "Invalid session" | Return error |
| CSRF validation failed | 403 | "Invalid CSRF token" | Block request |
| Database error | 500 | "An error occurred. Please try again." | Log error, return generic message |
| Audit log failure | N/A | N/A | Log error, continue logout |

### Error Logging Strategy

```typescript
// Log errors with context but without sensitive data
logger.error("Logout failed", {
    context: "Auth",
    error: error as Error,
    data: {
        userId: session?.user_id,
        ipAddress: getClientIp(request),
        reason: "rate_limited" | "invalid_session" | "database_error"
    }
})
```

## Security Considerations

### 1. Session Cookie Security

**Attributes**:
- `httpOnly: true` - Prevents JavaScript access
- `secure: true` (production) - HTTPS only
- `sameSite: "strict"` - Prevents CSRF attacks
- `path: "/"` - Available to all routes
- `maxAge: 30 days` - Automatic expiration

**Cookie Clearing on Logout**:
```typescript
response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Immediate expiration
    path: "/"
})
```

### 2. CSRF Protection

**Validation Flow**:
1. Extract CSRF token from request header
2. Extract session token from cookie
3. Validate CSRF token matches session
4. Reject request if validation fails

**Implementation**:
```typescript
const csrfToken = request.headers.get("X-CSRF-Token")
const sessionToken = request.cookies.get("session")?.value

const isValid = await validateCsrfToken(csrfToken, sessionToken)
if (!isValid) {
    return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
    )
}
```

### 3. Rate Limiting

**Strategy**:
- Track by user ID (authenticated) or IP (unauthenticated)
- Use sliding window algorithm
- Store in-memory for performance
- Reset after window expires

**Implementation**:
```typescript
function checkRateLimit(
    identifier: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number
): boolean {
    const key = `${identifier}:${endpoint}`
    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
        return true
    }

    if (record.count < maxRequests) {
        record.count++
        return true
    }

    return false // Rate limit exceeded
}
```

### 4. Session Validation

**Validation Checks**:
1. Session exists in database
2. Session not expired (expires_at > now)
3. Session belongs to valid user
4. Cookie attributes are secure

**Database Query**:
```typescript
const session = await queryOne<Session>(
    `SELECT user_id, expires_at 
     FROM sessions 
     WHERE session_id = $1`,
    [sessionId]
)

if (!session || new Date(session.expires_at) < new Date()) {
    return null // Invalid or expired
}
```

### 5. Audit Logging

**Security Principles**:
- Log all authentication events
- Include sufficient context for investigation
- Do not log sensitive data (passwords, full tokens)
- Continue operation if logging fails
- Implement log rotation and retention policies

**Logged Information**:
- Event type (LOGOUT)
- User ID
- IP address
- Timestamp
- User agent (optional)
- Success/failure status

## Performance Considerations

### 1. Rate Limiting Performance

**In-Memory Storage**:
- O(1) lookup and update
- No database queries
- Automatic cleanup of expired entries

**Optimization**:
```typescript
// Periodic cleanup of expired entries
setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key)
        }
    }
}, 60000) // Every 60 seconds
```

### 2. Session Validation Performance

**Database Indexing**:
- Index on `session_id` for fast lookup
- Index on `expires_at` for cleanup queries
- Index on `user_id` for user session queries

**Caching Strategy** (Future Enhancement):
- Cache valid sessions in Redis
- TTL matches session expiration
- Invalidate on logout

### 3. Middleware Performance

**Optimization**:
- Early return for public routes
- Parallel validation checks where possible
- Minimize database queries

**Route Matching**:
```typescript
// Fast path matching
const isProtectedRoute = pathname.startsWith('/dashboard')
if (!isProtectedRoute) {
    return NextResponse.next() // Skip validation
}
```

## Testing Strategy

### 1. Unit Tests

**Rate Limiting**:
- Test request counting per user
- Test window expiration and reset
- Test composite key generation
- Test concurrent requests

**Session Management**:
- Test session creation
- Test session validation
- Test session deletion
- Test expiration checking

**Cookie Handling**:
- Test cookie attributes
- Test cookie clearing
- Test secure flag in production

### 2. Integration Tests

**Logout Flow**:
- Test complete logout process
- Test redirect after logout
- Test session invalidation
- Test audit log creation

**Route Protection**:
- Test dashboard access with valid session
- Test dashboard access without session
- Test dashboard access with expired session
- Test dashboard access with invalid session

### 3. Property-Based Tests

**Properties to Test**:
- For any user, rate limit enforces 5 requests per 60 seconds
- For any valid session, logout deletes it from database
- For any logout, session cookie is cleared
- For any protected route, authentication is required
- For any successful logout, audit log is created

### 4. Security Tests

**Attack Vectors**:
- Session hijacking attempts
- Token replay attacks
- Brute force logout attempts
- CSRF attacks
- Cookie tampering
- SQL injection in session queries

## Deployment Considerations

### 1. Environment Variables

```bash
# Required
NODE_ENV=production
DATABASE_URL=postgresql://...
CSRF_SECRET=<random-secret>

# Optional
RATE_LIMIT_ENABLED=true
AUDIT_LOG_ENABLED=true
SESSION_EXPIRATION_DAYS=30
```

### 2. Database Migrations

**Migration Steps**:
1. Create audit_logs table if not exists
2. Add indexes to sessions table
3. Verify foreign key constraints
4. Test rollback procedure

### 3. Monitoring

**Metrics to Track**:
- Logout request rate
- Rate limit hit rate
- Session validation failures
- Audit log write failures
- Average logout response time

**Alerts**:
- High rate limit hit rate (potential attack)
- Audit log write failures
- Database connection errors
- Slow logout response times

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Rate Limit Enforcement

*For any* user identifier and 60-second time window, when the user makes more than 5 logout requests, the 6th and subsequent requests SHALL be rejected with HTTP status 429 until the window expires.

**Validates: Requirements 1.2, 1.3**

### Property 2: Rate Limit Window Reset

*For any* user identifier, when the 60-second rate limit window expires, the request count SHALL reset to zero and new requests SHALL be allowed.

**Validates: Requirements 1.4**

### Property 3: Session Deletion on Logout

*For any* valid session token, when a logout request is successfully processed, the session SHALL be deleted from the sessions database table and no longer exist in subsequent queries.

**Validates: Requirements 2.1**

### Property 4: Cookie Clearing on Logout

*For any* successful logout response, the session cookie SHALL have maxAge set to 0 and value set to empty string.

**Validates: Requirements 2.2, 2.3**

### Property 5: Deleted Session Authentication Failure

*For any* session token that has been deleted from the database, subsequent authentication attempts using that token SHALL fail and return unauthorized status.

**Validates: Requirements 2.4**

### Property 6: Invalid Session Logout Handling

*For any* logout request with an invalid or expired session token, the system SHALL return HTTP status 401 without modifying any database records.

**Validates: Requirements 2.5**

### Property 7: Logout Redirect Instruction

*For any* successful logout response, the response body SHALL include a redirect instruction to /auth/login.

**Validates: Requirements 3.1**

### Property 8: Protected Route Post-Logout Redirect

*For any* protected route accessed after logout (without valid session), the system SHALL redirect to /auth/login.

**Validates: Requirements 3.4**

### Property 9: Dashboard Route Session Validation

*For any* request to a dashboard route (/dashboard/*), the system SHALL validate the presence and validity of a session token before allowing access.

**Validates: Requirements 4.1**

### Property 10: Dashboard Route Unauthenticated Redirect

*For any* request to a dashboard route without a session token, the system SHALL redirect to /auth/login with HTTP status 302.

**Validates: Requirements 4.2**

### Property 11: Dashboard Route Invalid Token Redirect

*For any* request to a dashboard route with an invalid session token, the system SHALL redirect to /auth/login with HTTP status 302.

**Validates: Requirements 4.3**

### Property 12: Dashboard Route Expired Token Redirect

*For any* request to a dashboard route with an expired session token, the system SHALL redirect to /auth/login with HTTP status 302.

**Validates: Requirements 4.4**

### Property 13: Dashboard Route Valid Token Access

*For any* request to a dashboard route with a valid and non-expired session token, the system SHALL allow access to the requested route.

**Validates: Requirements 4.6**

### Property 14: Rate Limit Composite Key Format

*For any* user identifier and endpoint name, the rate limit key SHALL be formatted as "identifier:endpoint".

**Validates: Requirements 5.5**

### Property 15: Audit Log Creation on Logout

*For any* successful logout, the system SHALL create an audit log entry with event_type "LOGOUT".

**Validates: Requirements 7.1**

### Property 16: Audit Log User Identifier

*For any* logout audit log entry, the entry SHALL contain the user_id of the user who logged out.

**Validates: Requirements 7.2**

### Property 17: Audit Log IP Address

*For any* logout audit log entry, the entry SHALL contain the client IP address from which the logout request originated.

**Validates: Requirements 7.3**

### Property 18: Audit Log Timestamp

*For any* logout audit log entry, the entry SHALL contain a timestamp of when the logout action occurred.

**Validates: Requirements 7.4**

### Property 19: Audit Log Failure Resilience

*For any* logout request where audit log creation fails, the logout process SHALL complete successfully and the audit failure SHALL be logged as an error.

**Validates: Requirements 7.5**

### Property 20: Rate Limited Error Message

*For any* logout request that is rate limited, the error response SHALL contain the exact message "Too many logout attempts. Please try again later."

**Validates: Requirements 8.1**

### Property 21: Missing Session Error Message

*For any* logout request without a session token, the error response SHALL contain the exact message "No active session".

**Validates: Requirements 8.2**

### Property 22: Invalid Session Error Message

*For any* logout request with an invalid session token, the error response SHALL contain the exact message "Invalid session".

**Validates: Requirements 8.3**

### Property 23: Generic Error Message for Unexpected Errors

*For any* logout request that fails due to an unexpected error, the error response SHALL contain a generic message that does not expose internal system details.

**Validates: Requirements 8.4**

### Property 24: Error Logging Privacy

*For any* logout error that is logged, the log entry SHALL contain sufficient context for debugging but SHALL NOT contain sensitive user data such as passwords or full token values.

**Validates: Requirements 8.5**

### Property 25: Session Cookie HttpOnly Attribute

*For any* session cookie created by the system, the httpOnly attribute SHALL be set to true.

**Validates: Requirements 9.1**

### Property 26: Session Cookie Secure Attribute in Production

*For any* session cookie created when the application runs in production environment, the secure attribute SHALL be set to true.

**Validates: Requirements 9.2**

### Property 27: Session Cookie SameSite Attribute

*For any* session cookie created by the system, the sameSite attribute SHALL be set to "strict".

**Validates: Requirements 9.3**

### Property 28: Session Cookie Path Attribute

*For any* session cookie created by the system, the path attribute SHALL be set to "/".

**Validates: Requirements 9.4**

### Property 29: Cleared Cookie Security Attributes

*For any* session cookie cleared during logout, the cookie SHALL maintain the same security attributes (httpOnly, secure, sameSite, path) as the original cookie.

**Validates: Requirements 9.5**

### Property 30: Middleware Execution Order

*For any* request to a protected route, the session validation middleware SHALL execute before the route handler.

**Validates: Requirements 10.1**

### Property 31: Middleware Database Query

*For any* session validation performed by middleware, the system SHALL query the sessions database table for the session token.

**Validates: Requirements 10.2**

### Property 32: Middleware Expiration Check

*For any* session token found in the database by middleware, the system SHALL verify that the expires_at timestamp is in the future.

**Validates: Requirements 10.3**

### Property 33: Middleware Request Blocking

*For any* session token determined to be invalid or expired by middleware, the system SHALL prevent the request from reaching the route handler.

**Validates: Requirements 10.4**

### Property 34: Middleware Universal Dashboard Protection

*For any* dashboard route (/dashboard, /dashboard/publish, /dashboard/insights, /dashboard/settings), the middleware SHALL execute session validation without exception.

**Validates: Requirements 10.5**

## Implementation Notes

### 1. Rate Limiting Extension

Extend the existing `checkRateLimit` function in `proxy.ts`:

```typescript
// Add logout endpoint rate limiting
if (pathname === "/api/auth/logout") {
    const sessionToken = request.cookies.get("session")?.value
    const identifier = sessionToken 
        ? await getUserIdFromSession(sessionToken)
        : ip
    
    if (!checkRateLimit(identifier, "logout", 5, 60000)) {
        return NextResponse.json(
            { error: "Too many logout attempts. Please try again later." },
            { status: 429 }
        )
    }
}
```

### 2. Logout API Route Implementation

Create `/api/auth/logout/route.ts`:

```typescript
export async function POST(request: NextRequest) {
    try {
        // 1. Extract session token
        const sessionToken = request.cookies.get("session")?.value
        
        if (!sessionToken) {
            return NextResponse.json(
                { error: "No active session" },
                { status: 401 }
            )
        }
        
        // 2. Validate CSRF token
        const csrfToken = request.headers.get("X-CSRF-Token")
        const isValidCsrf = await validateCsrfToken(csrfToken, sessionToken)
        
        if (!isValidCsrf) {
            return NextResponse.json(
                { error: "Invalid CSRF token" },
                { status: 403 }
            )
        }
        
        // 3. Validate session
        const session = await validateSession(sessionToken)
        
        if (!session) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 }
            )
        }
        
        // 4. Delete session
        await removeSession(sessionToken)
        
        // 5. Create audit log (non-blocking)
        const ipAddress = getClientIp(request)
        createAuditLog({
            event_type: "LOGOUT",
            user_id: session.user_id,
            ip_address: ipAddress,
            timestamp: new Date()
        }).catch(error => {
            logger.error("Audit log creation failed", {
                context: "Auth",
                error
            })
        })
        
        // 6. Clear cookie and return response
        const response = NextResponse.json({
            success: true,
            redirect: "/auth/login"
        })
        
        response.cookies.set("session", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
            path: "/"
        })
        
        return response
        
    } catch (error) {
        logger.error("Logout failed", {
            context: "Auth",
            error: error as Error
        })
        
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        )
    }
}
```

### 3. Middleware Configuration

Update `middleware.ts` to protect dashboard routes:

```typescript
export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    
    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
        const sessionToken = request.cookies.get("session")?.value
        
        if (!sessionToken) {
            return NextResponse.redirect(
                new URL("/auth/login", request.url),
                { status: 302 }
            )
        }
        
        const session = await validateSession(sessionToken)
        
        if (!session) {
            return NextResponse.redirect(
                new URL("/auth/login", request.url),
                { status: 302 }
            )
        }
    }
    
    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*']
}
```

## Future Enhancements

### 1. Redis-Based Rate Limiting

Replace in-memory rate limiting with Redis for:
- Distributed rate limiting across multiple servers
- Persistent rate limit data
- Better scalability

### 2. Session Caching

Implement Redis caching for session validation:
- Reduce database queries
- Improve response times
- Automatic TTL management

### 3. Advanced Audit Logging

Enhance audit logging with:
- User agent tracking
- Geolocation data
- Device fingerprinting
- Anomaly detection

### 4. Multi-Factor Authentication

Add MFA support for:
- Enhanced security
- Compliance requirements
- User opt-in

### 5. Session Management Dashboard

Build admin interface for:
- View active sessions
- Force logout users
- Monitor suspicious activity
- Generate security reports

## Conclusion

This design provides a comprehensive security enhancement to the authentication system, focusing on robust logout functionality, rate limiting, route protection, and audit logging. The implementation follows security best practices including secure cookie handling, CSRF protection, and proper error handling while maintaining performance and scalability.

The property-based testing approach ensures that security guarantees hold across all possible inputs and scenarios, providing confidence in the system's correctness and resilience against attacks.
