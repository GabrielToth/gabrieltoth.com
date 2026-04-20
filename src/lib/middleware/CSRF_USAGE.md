# CSRF Protection Usage Guide

This guide explains how to implement CSRF protection in Next.js API routes.

## Overview

CSRF (Cross-Site Request Forgery) protection is implemented through:
1. **Token Generation**: Generate CSRF tokens on GET requests
2. **Token Storage**: Store tokens in session (in-memory or Redis)
3. **Token Validation**: Validate tokens on POST/PUT/DELETE requests
4. **Token Regeneration**: Regenerate tokens after successful form submission

## Requirements

- Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

## Implementation

### 1. GET Endpoints (Generate CSRF Token)

#### Option A: Using Form Injection Utilities (Recommended)

For GET endpoints that render forms, use the convenient form injection utilities:

```typescript
import { NextRequest } from "next/server"
import {
    createRegistrationFormResponse,
    createLoginFormResponse,
    createPasswordResetFormResponse,
    createForgotPasswordFormResponse,
    injectCsrfIntoFormResponse,
} from "@/lib/middleware/csrf-form-injection"

// Registration form
export async function GET(request: NextRequest) {
    return createRegistrationFormResponse(request)
}

// Login form
export async function GET(request: NextRequest) {
    return createLoginFormResponse(request)
}

// Password reset form
export async function GET(request: NextRequest) {
    const resetToken = request.nextUrl.searchParams.get("token")
    return createPasswordResetFormResponse(request, resetToken || undefined)
}

// Forgot password form
export async function GET(request: NextRequest) {
    return createForgotPasswordFormResponse(request)
}

// Custom form with additional data
export async function GET(request: NextRequest) {
    return injectCsrfIntoFormResponse(request, {
        email: "user@example.com",
        name: "John Doe",
    })
}
```

#### Option B: Manual Implementation

For GET endpoints that render forms or provide data to forms:

```typescript
import { NextRequest, NextResponse } from "next/server"
import {
    getOrGenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"

export async function GET(request: NextRequest) {
    // Get or generate CSRF token
    const csrfToken = getOrGenerateCsrfToken(request)

    if (!csrfToken) {
        return NextResponse.json(
            { success: false, error: "No active session" },
            { status: 401 }
        )
    }

    // Create response
    const response = NextResponse.json({
        success: true,
        data: {
            csrfToken, // Include in response body
            // ... other data
        },
    })

    // Add token to response header
    return addCsrfTokenToResponse(response, csrfToken)
}
```

### 2. POST/PUT/DELETE Endpoints (Validate CSRF Token)

#### Option A: Using Form Injection Utilities (Recommended)

For extracting CSRF tokens from form submissions:

```typescript
import { NextRequest, NextResponse } from "next/server"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import { extractCsrfFromFormData } from "@/lib/middleware/csrf-form-injection"

export async function POST(request: NextRequest) {
    // Validate CSRF token
    const { valid } = await validateCsrfFromRequest(request)

    if (!valid) {
        return createCsrfErrorResponse()
    }

    // Extract CSRF token and form data
    const body = await request.json()
    const { csrfToken, data } = extractCsrfFromFormData(body)

    // Process the request with clean data
    try {
        // ... your business logic here using 'data'

        // Create success response
        const response = NextResponse.json({
            success: true,
            message: "Operation completed successfully",
        })

        // Regenerate CSRF token after successful operation
        const newCsrfToken = regenerateCsrfToken(request)

        if (newCsrfToken) {
            return addCsrfTokenToResponse(response, newCsrfToken)
        }

        return response
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Operation failed" },
            { status: 500 }
        )
    }
}
```

#### Option B: Manual Implementation

For state-changing endpoints:

```typescript
import { NextRequest, NextResponse } from "next/server"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"

export async function POST(request: NextRequest) {
    // Validate CSRF token
    const { valid } = await validateCsrfFromRequest(request)

    if (!valid) {
        return createCsrfErrorResponse()
    }

    // Process the request
    try {
        // ... your business logic here

        // Create success response
        const response = NextResponse.json({
            success: true,
            message: "Operation completed successfully",
        })

        // Regenerate CSRF token after successful operation
        const newCsrfToken = regenerateCsrfToken(request)

        if (newCsrfToken) {
            return addCsrfTokenToResponse(response, newCsrfToken)
        }

        return response
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Operation failed" },
            { status: 500 }
        )
    }
}
```

## Client-Side Usage

### Fetching CSRF Token

```typescript
// Get CSRF token from API
const response = await fetch("/api/auth/csrf")
const data = await response.json()
const csrfToken = data.data.csrfToken

// Or get from response header
const csrfTokenFromHeader = response.headers.get("X-CSRF-Token")
```

### Sending CSRF Token in Requests

#### Option 1: In Request Header (Recommended)

```typescript
await fetch("/api/auth/login", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
    }),
})
```

#### Option 2: In Request Body

```typescript
await fetch("/api/auth/login", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        csrfToken: csrfToken,
        email: "user@example.com",
        password: "password123",
    }),
})
```

#### Option 3: In Form Data

```typescript
const formData = new FormData()
formData.append("csrfToken", csrfToken)
formData.append("email", "user@example.com")
formData.append("password", "password123")

await fetch("/api/auth/login", {
    method: "POST",
    body: formData,
})
```

## React Component Example

```typescript
"use client"

import { useState, useEffect } from "react"

export function LoginForm() {
    const [csrfToken, setCsrfToken] = useState<string>("")

    // Fetch CSRF token on component mount
    useEffect(() => {
        async function fetchCsrfToken() {
            const response = await fetch("/api/auth/csrf")
            const data = await response.json()
            setCsrfToken(data.data.csrfToken)
        }
        fetchCsrfToken()
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({
                email: "user@example.com",
                password: "password123",
            }),
        })

        if (response.ok) {
            // Update CSRF token from response
            const newToken = response.headers.get("X-CSRF-Token")
            if (newToken) {
                setCsrfToken(newToken)
            }
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
        </form>
    )
}
```

## Security Notes

1. **Token Storage**: Tokens are stored in-memory by default. For production, use Redis or a database.
2. **Token Expiration**: Tokens expire after 24 hours (same as session duration).
3. **Token Regeneration**: Always regenerate tokens after successful form submission.
4. **HTTPS Only**: CSRF protection should only be used over HTTPS in production.
5. **SameSite Cookies**: Use `SameSite=Strict` or `SameSite=Lax` for session cookies.

## Testing

See `api-csrf-middleware.test.ts` for comprehensive test examples.

## Error Handling

If CSRF validation fails, the API returns:

```json
{
    "success": false,
    "error": "Invalid CSRF token"
}
```

Status code: `403 Forbidden`

## Complete Example: Registration Endpoint

### Using Form Injection Utilities (Recommended)

```typescript
import { NextRequest, NextResponse } from "next/server"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import {
    createRegistrationFormResponse,
    extractCsrfFromFormData,
} from "@/lib/middleware/csrf-form-injection"
import { hashPassword } from "@/lib/auth/password-hashing"
import { createClient } from "@/lib/supabase/server"

// GET endpoint - Provide CSRF token for registration form
export async function GET(request: NextRequest) {
    return createRegistrationFormResponse(request)
}

// POST endpoint - Process registration with CSRF validation
export async function POST(request: NextRequest) {
    // 1. Validate CSRF token
    const { valid } = await validateCsrfFromRequest(request)

    if (!valid) {
        return createCsrfErrorResponse()
    }

    // 2. Parse request body and extract CSRF token
    const body = await request.json()
    const { data } = extractCsrfFromFormData(body)
    const { name, email, password } = data

    // 3. Validate input
    // ... validation logic

    // 4. Hash password
    const passwordHash = await hashPassword(password)

    // 5. Create user in database
    const supabase = createClient()
    const { data: userData, error } = await supabase
        .from("users")
        .insert({
            name,
            email,
            password_hash: passwordHash,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json(
            { success: false, error: "Registration failed" },
            { status: 500 }
        )
    }

    // 6. Create success response
    const response = NextResponse.json({
        success: true,
        message: "Registration successful",
        data: {
            userId: userData.id,
            email: userData.email,
        },
    })

    // 7. Regenerate CSRF token
    const newCsrfToken = regenerateCsrfToken(request)

    if (newCsrfToken) {
        return addCsrfTokenToResponse(response, newCsrfToken)
    }

    return response
}
```

### Manual Implementation

```typescript
import { NextRequest, NextResponse } from "next/server"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import { hashPassword } from "@/lib/auth/password-hashing"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    // 1. Validate CSRF token
    const { valid } = await validateCsrfFromRequest(request)

    if (!valid) {
        return createCsrfErrorResponse()
    }

    // 2. Parse request body
    const body = await request.json()
    const { name, email, password } = body

    // 3. Validate input
    // ... validation logic

    // 4. Hash password
    const passwordHash = await hashPassword(password)

    // 5. Create user in database
    const supabase = createClient()
    const { data, error } = await supabase
        .from("users")
        .insert({
            name,
            email,
            password_hash: passwordHash,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json(
            { success: false, error: "Registration failed" },
            { status: 500 }
        )
    }

    // 6. Create success response
    const response = NextResponse.json({
        success: true,
        message: "Registration successful",
        data: {
            userId: data.id,
            email: data.email,
        },
    })

    // 7. Regenerate CSRF token
    const newCsrfToken = regenerateCsrfToken(request)

    if (newCsrfToken) {
        return addCsrfTokenToResponse(response, newCsrfToken)
    }

    return response
}
```
