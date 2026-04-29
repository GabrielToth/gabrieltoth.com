# Security Testing Guide

## Overview

This guide provides comprehensive instructions for security testing all new routes and features in the project. Security testing is **MANDATORY** for all implementations.

## Quick Start

### 1. After Implementing a New Route

```bash
# Create security tests
touch src/__tests__/security/[feature]-security.test.ts

# Run security tests
npm run test -- src/__tests__/security/[feature]-security.test.ts

# Run all security tests
npm run test -- src/__tests__/security/

# Run with coverage
npm run test:coverage -- src/__tests__/security/
```

### 2. Security Test Checklist

Before marking a feature as complete, verify:

- [ ] SQL Injection tests pass
- [ ] XSS tests pass
- [ ] CSRF tests pass
- [ ] Rate limiting tests pass
- [ ] Authentication tests pass
- [ ] Authorization tests pass
- [ ] Information disclosure tests pass
- [ ] Timing attack tests pass
- [ ] Input validation tests pass
- [ ] Cryptography tests pass
- [ ] All tests have >80% coverage

## Attack Vectors to Test

### 1. SQL Injection

**What it is**: Inserting malicious SQL code into input fields

**Test cases**:
```typescript
// OR clause bypass
"' OR '1'='1"

// UNION SELECT
"' UNION SELECT * FROM users--"

// DROP TABLE
"'; DROP TABLE users;--"

// Comment bypass
"admin'--"

// Time-based blind
"' AND SLEEP(5)--"
```

**How to test**:
```typescript
it("should prevent SQL injection with OR clause", async () => {
    const response = await POST({
        email: "' OR '1'='1",
        password: "test"
    })
    expect(response.status).toBe(400)
})
```

### 2. XSS (Cross-Site Scripting)

**What it is**: Injecting JavaScript code that executes in the browser

**Test cases**:
```typescript
// Script tag
"<script>alert('xss')</script>"

// Event handler
'" onload="alert(\'xss\')"'

// JavaScript protocol
"javascript:alert('xss')"

// Data URI
"data:text/html,<script>alert('xss')</script>"

// SVG
'<svg onload="alert(\'xss\')">'
```

**How to test**:
```typescript
it("should prevent XSS in email field", async () => {
    const response = await POST({
        email: "<script>alert('xss')</script>",
        password: "test"
    })
    expect(response.status).toBe(400)
    expect(response.body).not.toContain("<script>")
})
```

### 3. CSRF (Cross-Site Request Forgery)

**What it is**: Tricking users into performing unwanted actions

**Test cases**:
```typescript
// Missing CSRF token
{ email: "test@test.com", password: "test" }

// Invalid CSRF token
{ email: "test@test.com", password: "test", csrfToken: "invalid" }

// Tampered CSRF token
{ email: "test@test.com", password: "test", csrfToken: "valid_token_xxxxx" }
```

**How to test**:
```typescript
it("should reject requests without CSRF token", async () => {
    const response = await POST({
        email: "test@test.com",
        password: "test"
        // csrfToken missing
    })
    expect([400, 403]).toContain(response.status)
})
```

### 4. Brute Force / Rate Limiting

**What it is**: Making many login attempts to guess passwords

**Test cases**:
```typescript
// 6+ attempts in 1 hour
for (let i = 0; i < 6; i++) {
    await POST({ email: "test@test.com", password: "wrong" })
}

// Different IPs
await POST({ email: "test@test.com", password: "wrong" }, { ip: "1.1.1.1" })
await POST({ email: "test@test.com", password: "wrong" }, { ip: "2.2.2.2" })
```

**How to test**:
```typescript
it("should block after 5 failed attempts", async () => {
    for (let i = 0; i < 6; i++) {
        const response = await POST({
            email: "test@test.com",
            password: "wrong"
        })
        if (i < 5) {
            expect(response.status).toBe(401)
        } else {
            expect(response.status).toBe(429)
        }
    }
})
```

### 5. Information Disclosure

**What it is**: Revealing sensitive information through error messages

**Test cases**:
```typescript
// User enumeration
POST({ email: "exists@test.com", password: "wrong" })
POST({ email: "notexists@test.com", password: "wrong" })
// Both should return same error

// Database errors
POST({ email: "test@test.com", password: "test" })
// Should not contain "Connection refused" or "SQL error"

// Stack traces
POST({ email: "test@test.com", password: "test" })
// Should not contain "at " or "Error:"
```

**How to test**:
```typescript
it("should not reveal if email exists", async () => {
    const response1 = await POST({
        email: "exists@test.com",
        password: "wrong"
    })
    const response2 = await POST({
        email: "notexists@test.com",
        password: "wrong"
    })
    expect(response1.body.error).toBe(response2.body.error)
})
```

### 6. Timing Attacks

**What it is**: Measuring response time to guess information

**Test cases**:
```typescript
// Correct password timing
const start1 = Date.now()
await POST({ email: "test@test.com", password: "correct" })
const time1 = Date.now() - start1

// Wrong password timing
const start2 = Date.now()
await POST({ email: "test@test.com", password: "wrong" })
const time2 = Date.now() - start2

// Times should be similar
expect(Math.abs(time1 - time2)).toBeLessThan(100)
```

**How to test**:
```typescript
it("should use constant-time comparison", async () => {
    const start1 = Date.now()
    await POST({ email: "test@test.com", password: "correct" })
    const time1 = Date.now() - start1

    const start2 = Date.now()
    await POST({ email: "test@test.com", password: "wrong" })
    const time2 = Date.now() - start2

    expect(Math.abs(time1 - time2)).toBeLessThan(100)
})
```

### 7. Authentication Bypass

**What it is**: Bypassing authentication checks

**Test cases**:
```typescript
// Null byte injection
"test@example.com\x00"

// Unicode bypass
"test@example.com\u0000"

// Case sensitivity
"TEST@EXAMPLE.COM" vs "test@example.com"
```

**How to test**:
```typescript
it("should prevent null byte injection", async () => {
    const response = await POST({
        email: "test@example.com\x00",
        password: "test"
    })
    expect(response.status).toBe(400)
})
```

### 8. Input Validation

**What it is**: Not properly validating user input

**Test cases**:
```typescript
// Oversized input
"a".repeat(10000) + "@example.com"

// Invalid content type
Content-Type: text/plain

// Null values
{ email: null, password: "test" }

// Array instead of string
{ email: ["test@example.com"], password: "test" }
```

**How to test**:
```typescript
it("should reject oversized email", async () => {
    const longEmail = "a".repeat(10000) + "@example.com"
    const response = await POST({
        email: longEmail,
        password: "test"
    })
    expect(response.status).toBe(400)
})
```

## Security Test File Structure

```
src/__tests__/security/
├── login-security.test.ts          # Login endpoint tests
├── api-security.test.ts             # General API tests
├── injection-attacks.test.ts        # SQL/NoSQL/Command injection
├── xss-attacks.test.ts              # XSS vulnerability tests
├── csrf-protection.test.ts          # CSRF token validation
├── rate-limiting.test.ts            # Rate limit enforcement
├── data-exposure.test.ts            # Sensitive data leaks
├── authentication.test.ts           # Auth bypass attempts
└── cryptography.test.ts             # Encryption & hashing
```

## Running Security Tests

### Run All Security Tests
```bash
npm run test -- src/__tests__/security/
```

### Run Specific Test File
```bash
npm run test -- src/__tests__/security/login-security.test.ts
```

### Run with Coverage
```bash
npm run test:coverage -- src/__tests__/security/
```

### Run with Watch Mode
```bash
npm run test -- src/__tests__/security/ --watch
```

### Run with Verbose Output
```bash
npm run test -- src/__tests__/security/ --verbose
```

## Security Test Naming Convention

### ✅ Good Examples
```typescript
it("should prevent SQL injection with OR clause", async () => {})
it("should reject XSS payload in email field", async () => {})
it("should block brute force after 5 attempts", async () => {})
it("should not reveal if email exists", async () => {})
it("should use constant-time password comparison", async () => {})
```

### ❌ Bad Examples
```typescript
it("should handle bad input", async () => {})
it("should be secure", async () => {})
it("should work correctly", async () => {})
it("test security", async () => {})
```

## OWASP Top 10 Coverage

Ensure your tests cover these vulnerabilities:

1. **Broken Access Control**
   - [ ] Unauthorized access tests
   - [ ] Privilege escalation tests
   - [ ] Cross-user access tests

2. **Cryptographic Failures**
   - [ ] Weak encryption tests
   - [ ] Hardcoded secrets tests
   - [ ] Weak hashing tests

3. **Injection**
   - [ ] SQL Injection tests
   - [ ] NoSQL Injection tests
   - [ ] Command Injection tests

4. **Insecure Design**
   - [ ] Threat modeling tests
   - [ ] Security requirement tests

5. **Security Misconfiguration**
   - [ ] Security headers tests
   - [ ] Default credentials tests
   - [ ] Unnecessary services tests

6. **Vulnerable Components**
   - [ ] Dependency audit
   - [ ] Known vulnerability tests

7. **Authentication Failures**
   - [ ] Weak password tests
   - [ ] Session management tests
   - [ ] MFA bypass tests

8. **Data Integrity Failures**
   - [ ] Data validation tests
   - [ ] Serialization tests

9. **Logging & Monitoring Failures**
   - [ ] Audit log tests
   - [ ] Security event logging tests

10. **SSRF**
    - [ ] Server-side request forgery tests
    - [ ] URL validation tests

## Security Test Documentation Template

```typescript
/**
 * Security Test: [Attack Name]
 * 
 * Attack Vector: [Description of attack]
 * Severity: [CRITICAL/HIGH/MEDIUM/LOW]
 * OWASP: [OWASP Category]
 * 
 * Payload: [Example payload]
 * Expected: [Expected response]
 * 
 * Reference: [Link to documentation]
 */
it("should prevent [attack]", async () => {
    // Test implementation
})
```

## Tools for Security Testing

### Automated Testing
- **Jest**: Unit and integration testing
- **Supertest**: HTTP assertion library
- **OWASP ZAP**: Automated security scanning

### Manual Testing
- **Burp Suite**: Penetration testing
- **Postman**: API testing
- **curl**: Command-line HTTP client

### Dependency Scanning
- **npm audit**: Vulnerability scanning
- **Snyk**: Continuous monitoring
- **OWASP Dependency-Check**: Dependency analysis

### Code Analysis
- **ESLint**: Static code analysis
- **SonarQube**: Code quality & security
- **Semgrep**: Pattern-based scanning

## Continuous Security Testing

### Pre-commit Hook
```bash
npm run test -- src/__tests__/security/
```

### CI/CD Pipeline
```yaml
- name: Run Security Tests
  run: npm run test -- src/__tests__/security/

- name: Run Dependency Audit
  run: npm audit

- name: Run OWASP Scan
  run: npm run security:scan
```

### Regular Audits
- Weekly: `npm audit`
- Monthly: Penetration testing
- Quarterly: Security review

## Checklist Before Deployment

- [ ] All security tests pass
- [ ] Test coverage >80%
- [ ] No known vulnerabilities
- [ ] Security headers present
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] Logging configured
- [ ] Error handling generic
- [ ] No hardcoded secrets
- [ ] Dependencies updated

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [SANS Top 25](https://www.sans.org/top25-software-errors/)

## Questions?

For security questions or concerns, refer to:
- OWASP documentation
- Security team
- Code review process
- Security testing guide

---

**Last Updated**: April 29, 2026
**Status**: Active
**Maintained By**: Security Team
