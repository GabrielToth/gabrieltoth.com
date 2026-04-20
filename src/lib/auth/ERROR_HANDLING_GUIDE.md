# Error Handling Guide

This guide explains how to use the centralized error handling system for the authentication API endpoints and client-side components.

## Overview

The error handling system provides:
- **Consistent error responses** across all API endpoints
- **Generic error messages** that don't expose technical details
- **Appropriate HTTP status codes** for different error types
- **Server-side error logging** for debugging
- **Reusable client-side components** for displaying errors

## API Error Handling

### Using Error Handling Utilities

Import the error handling utilities in your API route:

```typescript
import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
    logValidationError,
    logAuthError,
} from "@/lib/auth/error-handling"
```

### Creating Error Responses

Use `createErrorResponse()` to return standardized error responses:

```typescript
// Validation error (400)
return createErrorResponse(AuthErrorType.INVALID_EMAIL, "email")

// Authentication error (401)
return createErrorResponse(AuthErrorType.INVALID_CREDENTIALS)

// Rate limiting error (429)
return createErrorResponse(AuthErrorType.TOO_MANY_ATTEMPTS)

// Server error (500)
return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
```

### Creating Success Responses

Use `createSuccessResponse()` for successful operations:

```typescript
// With data
return createSuccessResponse(
    { userId: "123", email: "user@example.com" },
    "Registration successful"
)

// Without data
return createSuccessResponse(undefined, "Logout successful")
```

### Handling Unexpected Errors

Use `handleUnexpectedError()` in catch blocks:

```typescript
try {
    // Your code here
} catch (err) {
    return handleUnexpectedError(err, "Auth", "/api/auth/login")
}
```

This will:
- Log the full error details server-side
- Return a generic error message to the client
- Include security headers in the response

### Logging Errors

Log validation and authentication errors for monitoring:

```typescript
// Log validation error
logValidationError("email", value, "Invalid format", "Auth")

// Log authentication error
logAuthError(AuthErrorType.INVALID_CREDENTIALS, email, clientIp, "Auth")
```

## Available Error Types

### Validation Errors (400)
- `INVALID_EMAIL` - Invalid email format
- `INVALID_PASSWORD` - Password doesn't meet requirements
- `PASSWORDS_MISMATCH` - Passwords don't match
- `INVALID_NAME` - Name contains invalid characters
- `FIELD_TOO_LONG` - Field exceeds 255 characters
- `REQUIRED_FIELD_EMPTY` - Required field is empty
- `INVALID_INPUT` - Generic invalid input

### Authentication Errors (401)
- `INVALID_CREDENTIALS` - Invalid email or password
- `EMAIL_NOT_VERIFIED` - Email not verified
- `SESSION_EXPIRED` - Session has expired
- `INVALID_SESSION` - Invalid session token
- `UNAUTHORIZED` - Generic unauthorized

### Rate Limiting Errors (429)
- `TOO_MANY_ATTEMPTS` - Too many attempts
- `ACCOUNT_LOCKED` - Account temporarily locked

### Conflict Errors (409)
- `EMAIL_ALREADY_REGISTERED` - Email already exists
- `USER_ALREADY_EXISTS` - User already exists

### Token Errors (400)
- `INVALID_TOKEN` - Invalid verification token
- `EXPIRED_TOKEN` - Token has expired
- `MISSING_TOKEN` - Token is missing

### Server Errors (500)
- `DATABASE_ERROR` - Database error
- `EMAIL_SERVICE_ERROR` - Email service error
- `INTERNAL_ERROR` - Generic internal error

## Client-Side Error Display

### Using Error Display Components

Import the error display components in your React components:

```typescript
import {
    ErrorDisplay,
    FieldError,
    ServerError,
    SuccessMessage,
} from "@/components/auth/error-display"
```

### Field Validation Errors

Use `FieldError` for inline validation errors below form fields:

```tsx
<Input
    id="email"
    name="email"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
/>
<FieldError error={errors.email} fieldName="email" />
```

### Server Errors

Use `ServerError` for displaying server-side errors at the top of forms:

```tsx
<ServerError error={serverError} />
```

With dismiss button:

```tsx
<ServerError
    error={serverError}
    onDismiss={() => setServerError(null)}
/>
```

### Success Messages

Use `SuccessMessage` for displaying success feedback:

```tsx
<SuccessMessage message="Password reset successfully" />
```

With dismiss button:

```tsx
<SuccessMessage
    message={successMessage}
    onDismiss={() => setSuccessMessage(null)}
/>
```

### Generic Error Display

Use `ErrorDisplay` for custom error displays:

```tsx
// Inline variant (small, below fields)
<ErrorDisplay error="Error message" variant="inline" />

// Banner variant (large, prominent)
<ErrorDisplay error="Error message" variant="banner" />
```

## Example: Complete API Endpoint

```typescript
import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
    logValidationError,
} from "@/lib/auth/error-handling"
import { validateEmail } from "@/lib/validation"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        // Validate input
        const emailValidation = validateEmail(email)
        if (!emailValidation.isValid) {
            logValidationError("email", email, emailValidation.error, "Auth")
            return createErrorResponse(
                AuthErrorType.INVALID_EMAIL,
                "email"
            )
        }

        // Your business logic here
        // ...

        // Return success
        return createSuccessResponse(
            { userId: "123" },
            "Operation successful"
        )
    } catch (err) {
        return handleUnexpectedError(err, "Auth", "/api/auth/endpoint")
    }
}
```

## Example: Complete Form Component

```tsx
"use client"

import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerError, FieldError } from "@/components/auth/error-display"
import { validateEmail } from "@/lib/validation"

export function MyForm() {
    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState<string | null>(null)
    const [serverError, setServerError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setServerError(null)

        // Validate
        const validation = validateEmail(email)
        if (!validation.isValid) {
            setEmailError(validation.error)
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/endpoint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                setServerError(data.error || "An error occurred")
                return
            }

            // Handle success
        } catch (error) {
            setServerError("An error occurred. Please try again later.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <ServerError error={serverError} />

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        setEmailError(null)
                    }}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    disabled={isLoading}
                />
                <FieldError error={emailError} fieldName="email" />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
            </Button>
        </form>
    )
}
```

## Security Best Practices

1. **Never expose technical details** in error messages
   - ❌ "Database connection failed at line 42"
   - ✅ "An error occurred. Please try again later"

2. **Don't reveal which field is incorrect** for authentication
   - ❌ "Email is correct but password is wrong"
   - ✅ "Invalid email or password"

3. **Log full error details server-side** for debugging
   - Use `handleUnexpectedError()` to log errors
   - Use `logValidationError()` and `logAuthError()` for specific errors

4. **Use appropriate HTTP status codes**
   - 400 for validation errors
   - 401 for authentication errors
   - 429 for rate limiting
   - 500 for server errors

5. **Include security headers** in all responses
   - The error handling utilities automatically include security headers

## Testing

The error handling system includes comprehensive unit tests:

- `src/lib/auth/error-handling.test.ts` - Tests for API utilities
- `src/components/auth/error-display.test.tsx` - Tests for UI components

Run tests with:

```bash
npm test -- src/lib/auth/error-handling.test.ts
npm test -- src/components/auth/error-display.test.tsx
```

## Requirements Validation

This error handling system validates the following requirements:

- **Requirement 15.1**: Generic error messages for server errors
- **Requirement 15.2**: Generic messages for authentication errors
- **Requirement 15.3**: Specific messages for rate limiting
- **Requirement 15.4**: Specific messages for token errors
- **Requirement 15.5**: Specific messages for validation errors
- **Requirement 15.6**: Server-side error logging
