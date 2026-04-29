# Server-Side Validation & Protection Against Script Modifications

## Overview

This guide explains the server-side validation implemented to protect against script modifications and injection attacks. Even if a user modifies the client-side code, the server validates all requests.

## Security Layers

### Layer 1: Type Validation
Prevents script modifications by validating field types

### Layer 2: Field Validation
Prevents injection attacks by rejecting unexpected fields

### Layer 3: Length Validation
Prevents buffer overflow attacks by limiting field sizes

### Layer 4: Format Validation
Validates data format (email, phone, etc.)

### Layer 5: Business Logic Validation
Checks database constraints and business rules

## Implementation Details

### Type Validation

**What it prevents**:
- Scripts changing `email` from string to array
- Scripts changing `password` from string to number
- Scripts changing `rememberMe` from boolean to string
- Scripts sending invalid JSON

**Example Attack**:
```javascript
// ❌ ATTACK: Script modifies request
fetch('/api/auth/login', {
    body: JSON.stringify({
        email: ["test@example.com"],  // Array instead of string
        password: 12345,               // Number instead of string
        rememberMe: "true",            // String instead of boolean
    })
})
```

**Server Response**:
```
Status: 400 Bad Request
Error: "Invalid input"
```

**Implementation**:
```typescript
// Validate email type
if (typeof email !== "string") {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
}

// Validate password type
if (typeof password !== "string") {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
}

// Validate rememberMe type
if (rememberMe !== undefined && typeof rememberMe !== "boolean") {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
}
```

### Field Validation

**What it prevents**:
- Scripts adding extra fields to bypass validation
- Scripts injecting admin flags
- Scripts injecting verified status
- Prototype pollution attacks

**Example Attack**:
```javascript
// ❌ ATTACK: Script injects extra fields
fetch('/api/auth/login', {
    body: JSON.stringify({
        email: "test@example.com",
        password: "Test@1234",
        rememberMe: false,
        csrfToken: "token",
        isAdmin: true,           // Extra field
        role: "admin",           // Extra field
        isVerified: true,        // Extra field
    })
})
```

**Server Response**:
```
Status: 400 Bad Request
Error: "Invalid input"
```

**Implementation**:
```typescript
// Validate no extra fields
const allowedFields = new Set(["email", "password", "rememberMe", "csrfToken"])
const providedFields = Object.keys(bodyObj)
const hasExtraFields = providedFields.some(field => !allowedFields.has(field))
if (hasExtraFields) {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
}
```

### Length Validation

**What it prevents**:
- Buffer overflow attacks
- DoS attacks via oversized payloads
- Memory exhaustion

**Example Attack**:
```javascript
// ❌ ATTACK: Script sends oversized email
fetch('/api/auth/login', {
    body: JSON.stringify({
        email: "a".repeat(10000) + "@example.com",  // 10KB email
        password: "Test@1234",
    })
})
```

**Server Response**:
```
Status: 400 Bad Request
Error: "Invalid input"
```

**Implementation**:
```typescript
// Validate email length
if (email.length === 0 || email.length > 255) {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
}

// Validate password length
if (password.length === 0 || password.length > 1024) {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
}
```

### Format Validation

**What it prevents**:
- Invalid email formats
- Invalid phone numbers
- Invalid dates

**Example Attack**:
```javascript
// ❌ ATTACK: Script sends invalid email
fetch('/api/auth/login', {
    body: JSON.stringify({
        email: "not-an-email",
        password: "Test@1234",
    })
})
```

**Server Response**:
```
Status: 400 Bad Request
Error: "Invalid email format"
```

**Implementation**:
```typescript
const emailValidation = validateEmail(email)
if (!emailValidation.isValid) {
    return createErrorResponse(
        AuthErrorType.INVALID_EMAIL,
        "email",
        emailValidation.error
    )
}
```

## Attack Scenarios & Responses

### Scenario 1: Type Mismatch Attack

**Attack**:
```javascript
fetch('/api/auth/login', {
    body: JSON.stringify({
        email: ["test@example.com"],
        password: 12345,
        rememberMe: "true",
    })
})
```

**Server Validation**:
1. Check email type → Array (not string) ❌
2. Return error immediately

**Response**:
```json
{
    "success": false,
    "error": "Invalid input"
}
```

### Scenario 2: Extra Fields Attack

**Attack**:
```javascript
fetch('/api/auth/register', {
    body: JSON.stringify({
        email: "test@example.com",
        password: "Test@1234",
        name: "Test User",
        phone: "+5511999999999",
        email_verified: true,  // Extra field
        isAdmin: true,         // Extra field
    })
})
```

**Server Validation**:
1. Check allowed fields → Found extra fields ❌
2. Return error immediately

**Response**:
```json
{
    "success": false,
    "error": "Invalid input"
}
```

### Scenario 3: Buffer Overflow Attack

**Attack**:
```javascript
fetch('/api/auth/login', {
    body: JSON.stringify({
        email: "a".repeat(10000) + "@example.com",
        password: "Test@1234",
    })
})
```

**Server Validation**:
1. Check email length → 10,000+ characters (max 255) ❌
2. Return error immediately

**Response**:
```json
{
    "success": false,
    "error": "Invalid input"
}
```

### Scenario 4: Prototype Pollution Attack

**Attack**:
```javascript
fetch('/api/auth/login', {
    body: JSON.stringify({
        email: "test@example.com",
        password: "Test@1234",
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
    })
})
```

**Server Validation**:
1. Check allowed fields → Found extra fields (__proto__, constructor) ❌
2. Return error immediately

**Response**:
```json
{
    "success": false,
    "error": "Invalid input"
}
```

## Validation Flow

```
Request Received
    ↓
Parse JSON
    ↓
Validate Body Type (object, not array/null)
    ↓
Validate Field Types (string, boolean, etc.)
    ↓
Validate No Extra Fields
    ↓
Validate Field Lengths
    ↓
Validate Field Formats
    ↓
Rate Limiting Check
    ↓
Database Lookup
    ↓
Business Logic Validation
    ↓
Response
```

## Protected Endpoints

### POST /api/auth/login
- ✅ Type validation
- ✅ Field validation
- ✅ Length validation
- ✅ Format validation
- ✅ Rate limiting
- ✅ Bcrypt comparison

### POST /api/auth/register
- ✅ Type validation
- ✅ Field validation
- ✅ Length validation
- ✅ Format validation
- ✅ Rate limiting
- ✅ Email uniqueness check

## Field Limits

### Login Endpoint
```
email:      0-255 characters (string)
password:   0-1024 characters (string)
rememberMe: boolean (optional)
csrfToken:  string (optional)
```

### Register Endpoint
```
email:      0-255 characters (string)
password:   0-1024 characters (string)
name:       0-255 characters (string)
phone:      0-20 characters (string)
birth_date: 0-10 characters (string, optional)
full_name:  string (optional)
auth_method: string (optional)
```

## Testing Server-Side Validation

### Manual Testing

```bash
# Test type mismatch
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": ["test@example.com"],
    "password": "Test@1234"
  }'
# Expected: 400 Bad Request

# Test extra fields
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "isAdmin": true
  }'
# Expected: 400 Bad Request

# Test oversized input
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$(printf 'a%.0s' {1..1000})'@example.com",
    "password": "Test@1234"
  }'
# Expected: 400 Bad Request
```

### Automated Testing

```bash
# Run validation tests
npm run test -- src/__tests__/security/request-validation.test.ts

# Run with coverage
npm run test:coverage -- src/__tests__/security/request-validation.test.ts
```

## Security Checklist

- [ ] Type validation implemented
- [ ] Field validation implemented
- [ ] Length validation implemented
- [ ] Format validation implemented
- [ ] Rate limiting implemented
- [ ] Error messages are generic
- [ ] No sensitive data in errors
- [ ] Tests cover all attack vectors
- [ ] Tests pass
- [ ] Code reviewed

## Best Practices

### ✅ DO

- Validate all input on server
- Check field types explicitly
- Reject extra fields
- Limit field lengths
- Use generic error messages
- Log security events
- Test with malicious payloads
- Keep validation rules updated

### ❌ DON'T

- Trust client-side validation only
- Assume field types
- Accept extra fields
- Allow unlimited field lengths
- Expose validation details
- Skip server-side checks
- Use weak validation
- Ignore security warnings

## Common Mistakes

### ❌ WRONG: Trusting Client-Side Only
```typescript
// Client validates, server doesn't
// Attacker can bypass client validation
```

### ✅ CORRECT: Server-Side Validation
```typescript
// Server validates all input
// Client validation is just UX improvement
```

### ❌ WRONG: Assuming Field Types
```typescript
const { email, password } = body
// No type checking - could be anything
```

### ✅ CORRECT: Explicit Type Checking
```typescript
if (typeof email !== "string" || typeof password !== "string") {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
}
```

### ❌ WRONG: Accepting Extra Fields
```typescript
const { email, password, ...rest } = body
// Extra fields could contain malicious data
```

### ✅ CORRECT: Rejecting Extra Fields
```typescript
const allowedFields = new Set(["email", "password"])
const hasExtra = Object.keys(body).some(k => !allowedFields.has(k))
if (hasExtra) {
    return createErrorResponse(AuthErrorType.INVALID_INPUT)
}
```

## References

- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [CWE-20: Improper Input Validation](https://cwe.mitre.org/data/definitions/20.html)
- [CWE-1025: Comparison Using Wrong Factors](https://cwe.mitre.org/data/definitions/1025.html)
- [Prototype Pollution](https://portswigger.net/research/prototype-pollution-the-dangerous-and-underrated-vulnerability-of-the-javascript-ecosystem)

---

**Last Updated**: April 29, 2026
**Status**: Active
**Maintained By**: Security Team
