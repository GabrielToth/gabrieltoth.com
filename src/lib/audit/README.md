# Audit Logging Utilities

This module provides non-blocking audit logging for authentication events.

## Features

- ✅ Non-blocking: Audit logging failures don't affect main application flow
- ✅ Comprehensive: Logs event_type, user_id, ip_address, timestamp, user_agent, and details
- ✅ Type-safe: Full TypeScript support with interfaces
- ✅ Error handling: Gracefully handles database failures
- ✅ Performance: Async operations with proper error catching

## Usage

### Basic Audit Logging

```typescript
import { createAuditLog } from "@/lib/audit/auth-audit"

// Create a custom audit log entry
await createAuditLog({
    event_type: "LOGOUT",
    user_id: "user-123",
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0...",
    details: { reason: "User initiated logout" }
})
```

### Logout Event

```typescript
import { logLogoutEvent } from "@/lib/audit/auth-audit"

// In your logout route handler
export async function POST(request: NextRequest) {
    // ... logout logic ...
    
    // Log the logout event (non-blocking)
    logLogoutEvent(
        session.user_id,
        clientIp,
        request.headers.get("user-agent") || undefined
    ).catch(() => {
        // Error already logged internally, continue with logout
    })
    
    return NextResponse.json({ success: true })
}
```

### Login Event

```typescript
import { logLoginEvent } from "@/lib/audit/auth-audit"

// Log successful login
await logLoginEvent(
    userId,
    ipAddress,
    userAgent,
    { method: "password" }
)
```

### Failed Login Attempt

```typescript
import { logFailedLoginAttempt } from "@/lib/audit/auth-audit"

// Log failed login
await logFailedLoginAttempt(
    userId,
    ipAddress,
    "Invalid password",
    userAgent
)
```

### Session Invalidation

```typescript
import { logSessionInvalidation } from "@/lib/audit/auth-audit"

// Log session invalidation
await logSessionInvalidation(
    userId,
    ipAddress,
    "Session expired",
    userAgent
)
```

## Non-Blocking Pattern

All audit logging functions are designed to be non-blocking:

```typescript
// Pattern 1: Fire and forget (recommended for most cases)
logLogoutEvent(userId, ipAddress).catch(() => {
    // Error already logged, no action needed
})

// Pattern 2: Await but don't fail on error
try {
    await logLogoutEvent(userId, ipAddress)
} catch {
    // Error already logged internally, continue
}

// Pattern 3: Promise.all for multiple logs
await Promise.all([
    logLogoutEvent(userId, ipAddress),
    logSessionInvalidation(userId, ipAddress, "User logout")
]).catch(() => {
    // Errors already logged, continue
})
```

## Database Schema

The audit_logs table structure:

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID,
    email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Event Types

Standard event types:

- `LOGOUT` - User logout
- `LOGIN` - Successful login
- `LOGIN_FAILED` - Failed login attempt
- `SESSION_INVALIDATED` - Session invalidated (expired, revoked)
- `CSRF_FAILURE` - CSRF token validation failed
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded

## Requirements Validation

This implementation satisfies:

- ✅ Requirement 7.1: Creates audit log with event_type "LOGOUT"
- ✅ Requirement 7.2: Records user_id
- ✅ Requirement 7.3: Records ip_address
- ✅ Requirement 7.4: Records timestamp
- ✅ Requirement 7.5: Non-blocking with error logging

## Testing

Comprehensive test coverage in `src/__tests__/lib/audit/auth-audit.test.ts`:

- Unit tests for all functions
- Non-blocking behavior validation
- Error handling verification
- Data validation tests

Run tests:

```bash
npm run test -- src/__tests__/lib/audit/auth-audit.test.ts
```
