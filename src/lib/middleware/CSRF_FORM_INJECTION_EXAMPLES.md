# CSRF Form Injection - Usage Examples

This document provides practical examples of using the CSRF form injection utilities in your API routes.

## Quick Start

The CSRF form injection utilities provide convenient functions to inject CSRF tokens into form responses for registration, login, password reset, and forgot password forms.

## Example 1: Registration Form

### GET /api/auth/register - Provide CSRF token for registration form

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest } from "next/server"
import { createRegistrationFormResponse } from "@/lib/middleware/csrf-form-injection"

export async function GET(request: NextRequest) {
    // Returns: { success: true, csrfToken: "..." }
    // Also includes X-CSRF-Token header
    return createRegistrationFormResponse(request)
}
```

### POST /api/auth/register - Process registration with CSRF validation

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import { extractCsrfFromFormData } from "@/lib/middleware/csrf-form-injection"

export async function POST(request: NextRequest) {
    // 1. Validate CSRF token
    const { valid } = await validateCsrfFromRequest(request)
    if (!valid) {
        return createCsrfErrorResponse()
    }

    // 2. Extract CSRF token and clean form data
    const body = await request.json()
    const { data } = extractCsrfFromFormData(body)
    const { name, email, password } = data

    // 3. Process registration
    // ... your business logic here

    // 4. Return response with new CSRF token
    const response = NextResponse.json({
        success: true,
        message: "Registration successful",
    })

    const newCsrfToken = regenerateCsrfToken(request)
    if (newCsrfToken) {
        return addCsrfTokenToResponse(response, newCsrfToken)
    }

    return response
}
```

## Example 2: Login Form

### GET /api/auth/login - Provide CSRF token for login form

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server"
import { createLoginFormResponse } from "@/lib/middleware/csrf-form-injection"

export async function GET(request: NextRequest) {
    // Returns: { success: true, csrfToken: "..." }
    return createLoginFormResponse(request)
}
```

### POST /api/auth/login - Process login with CSRF validation

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import { extractCsrfFromFormData } from "@/lib/middleware/csrf-form-injection"

export async function POST(request: NextRequest) {
    // 1. Validate CSRF token
    const { valid } = await validateCsrfFromRequest(request)
    if (!valid) {
        return createCsrfErrorResponse()
    }

    // 2. Extract form data
    const body = await request.json()
    const { data } = extractCsrfFromFormData(body)
    const { email, password, rememberMe } = data

    // 3. Process login
    // ... your authentication logic here

    // 4. Return response with new CSRF token
    const response = NextResponse.json({
        success: true,
        message: "Login successful",
    })

    const newCsrfToken = regenerateCsrfToken(request)
    if (newCsrfToken) {
        return addCsrfTokenToResponse(response, newCsrfToken)
    }

    return response
}
```

## Example 3: Forgot Password Form

### GET /api/auth/forgot-password - Provide CSRF token

```typescript
// src/app/api/auth/forgot-password/route.ts
import { NextRequest } from "next/server"
import { createForgotPasswordFormResponse } from "@/lib/middleware/csrf-form-injection"

export async function GET(request: NextRequest) {
    // Returns: { success: true, csrfToken: "..." }
    return createForgotPasswordFormResponse(request)
}
```

### POST /api/auth/forgot-password - Process password reset request

```typescript
// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import { extractCsrfFromFormData } from "@/lib/middleware/csrf-form-injection"

export async function POST(request: NextRequest) {
    // 1. Validate CSRF token
    const { valid } = await validateCsrfFromRequest(request)
    if (!valid) {
        return createCsrfErrorResponse()
    }

    // 2. Extract form data
    const body = await request.json()
    const { data } = extractCsrfFromFormData(body)
    const { email } = data

    // 3. Process password reset request
    // ... send reset email logic here

    // 4. Return generic response (don't reveal if email exists)
    const response = NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent",
    })

    const newCsrfToken = regenerateCsrfToken(request)
    if (newCsrfToken) {
        return addCsrfTokenToResponse(response, newCsrfToken)
    }

    return response
}
```

## Example 4: Password Reset Form

### GET /api/auth/reset-password - Provide CSRF token with reset token

```typescript
// src/app/api/auth/reset-password/route.ts
import { NextRequest } from "next/server"
import { createPasswordResetFormResponse } from "@/lib/middleware/csrf-form-injection"

export async function GET(request: NextRequest) {
    // Get reset token from query parameter
    const resetToken = request.nextUrl.searchParams.get("token")

    // Returns: { success: true, csrfToken: "...", data: { resetToken: "..." } }
    return createPasswordResetFormResponse(request, resetToken || undefined)
}
```

### POST /api/auth/reset-password - Process password reset

```typescript
// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import { extractCsrfFromFormData } from "@/lib/middleware/csrf-form-injection"

export async function POST(request: NextRequest) {
    // 1. Validate CSRF token
    const { valid } = await validateCsrfFromRequest(request)
    if (!valid) {
        return createCsrfErrorResponse()
    }

    // 2. Extract form data
    const body = await request.json()
    const { data } = extractCsrfFromFormData(body)
    const { resetToken, password, confirmPassword } = data

    // 3. Validate reset token and update password
    // ... your password reset logic here

    // 4. Return response with new CSRF token
    const response = NextResponse.json({
        success: true,
        message: "Password reset successfully",
    })

    const newCsrfToken = regenerateCsrfToken(request)
    if (newCsrfToken) {
        return addCsrfTokenToResponse(response, newCsrfToken)
    }

    return response
}
```

## Example 5: Custom Form with Additional Data

### GET /api/custom-form - Inject CSRF token with custom data

```typescript
// src/app/api/custom-form/route.ts
import { NextRequest } from "next/server"
import { injectCsrfIntoFormResponse } from "@/lib/middleware/csrf-form-injection"

export async function GET(request: NextRequest) {
    // Include custom data along with CSRF token
    return injectCsrfIntoFormResponse(request, {
        userId: "123",
        email: "user@example.com",
        preferences: {
            theme: "dark",
            language: "en",
        },
    })

    // Returns:
    // {
    //   success: true,
    //   csrfToken: "...",
    //   data: {
    //     userId: "123",
    //     email: "user@example.com",
    //     preferences: { theme: "dark", language: "en" }
    //   }
    // }
}
```

## Client-Side Usage

### Fetching CSRF Token

```typescript
// Fetch CSRF token from registration endpoint
const response = await fetch("/api/auth/register")
const data = await response.json()

if (data.success) {
    const csrfToken = data.csrfToken
    // Or get from header
    const csrfTokenFromHeader = response.headers.get("X-CSRF-Token")
}
```

### Submitting Form with CSRF Token

```typescript
// Submit registration form with CSRF token
const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken, // Option 1: In header
    },
    body: JSON.stringify({
        csrfToken: csrfToken, // Option 2: In body
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass123!",
    }),
})

const result = await response.json()

if (result.success) {
    // Update CSRF token for next request
    const newCsrfToken = response.headers.get("X-CSRF-Token")
}
```

## React Component Example

```typescript
"use client"

import { useState, useEffect } from "react"

export function RegistrationForm() {
    const [csrfToken, setCsrfToken] = useState<string>("")

    // Fetch CSRF token on mount
    useEffect(() => {
        async function fetchCsrfToken() {
            const response = await fetch("/api/auth/register")
            const data = await response.json()
            if (data.success) {
                setCsrfToken(data.csrfToken)
            }
        }
        fetchCsrfToken()
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({
                name: "John Doe",
                email: "john@example.com",
                password: "SecurePass123!",
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

    return <form onSubmit={handleSubmit}>{/* Form fields */}</form>
}
```

## Benefits of Using Form Injection Utilities

1. **Simplified API**: One-line function calls instead of manual token generation
2. **Consistent Responses**: All form endpoints return the same response structure
3. **Type Safety**: TypeScript interfaces ensure correct usage
4. **Automatic Headers**: CSRF tokens are automatically added to response headers
5. **Clean Data Extraction**: `extractCsrfFromFormData` separates CSRF token from form data
6. **Error Handling**: Built-in session validation with appropriate error responses

## Migration from Manual Implementation

### Before (Manual)

```typescript
export async function GET(request: NextRequest) {
    const csrfToken = getOrGenerateCsrfToken(request)
    if (!csrfToken) {
        return NextResponse.json(
            { success: false, error: "No active session" },
            { status: 401 }
        )
    }
    const response = NextResponse.json({
        success: true,
        data: { csrfToken },
    })
    return addCsrfTokenToResponse(response, csrfToken)
}
```

### After (Using Utilities)

```typescript
export async function GET(request: NextRequest) {
    return createRegistrationFormResponse(request)
}
```

## See Also

- [CSRF_USAGE.md](./CSRF_USAGE.md) - Complete CSRF protection guide
- [api-csrf-middleware.ts](./api-csrf-middleware.ts) - Core CSRF middleware functions
- [csrf-form-injection.ts](./csrf-form-injection.ts) - Form injection utilities source code
