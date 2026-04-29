/**
 * Security Tests for Request Validation
 *
 * Tests for protection against script modifications and injection attacks:
 * - Type validation (prevent script modifications)
 * - Field validation (prevent injection)
 * - Length validation (prevent buffer overflow)
 * - Extra field detection (prevent injection)
 */

import { POST as loginPOST } from "@/app/api/auth/login/route"
import { POST as registerPOST } from "@/app/api/auth/register/route"
import { NextRequest } from "next/server"

jest.mock("@supabase/supabase-js")
jest.mock("@/lib/rate-limit")
jest.mock("@/lib/auth/audit-logging")

describe("Request Validation - Protection Against Script Modifications", () => {
    // ============================================================================
    // TYPE VALIDATION TESTS
    // ============================================================================
    describe("Type Validation (Prevent Script Modifications)", () => {
        /**
         * Security Test: Email as Array
         * Attack Vector: Sending array instead of string
         * Severity: HIGH
         */
        it("should reject email as array in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: ["test@example.com"],
                    password: "Test@1234",
                    rememberMe: false,
                    csrfToken: "token",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Password as Number
         * Attack Vector: Sending number instead of string
         * Severity: HIGH
         */
        it("should reject password as number in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: 12345,
                    rememberMe: false,
                    csrfToken: "token",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: RememberMe as String
         * Attack Vector: Sending string instead of boolean
         * Severity: MEDIUM
         */
        it("should reject rememberMe as string in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "Test@1234",
                    rememberMe: "true",
                    csrfToken: "token",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Body as Array
         * Attack Vector: Sending array instead of object
         * Severity: HIGH
         */
        it("should reject body as array in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify(["test@example.com", "Test@1234"]),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Body as Null
         * Attack Vector: Sending null
         * Severity: HIGH
         */
        it("should reject body as null in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify(null),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Invalid JSON
         * Attack Vector: Sending invalid JSON
         * Severity: MEDIUM
         */
        it("should reject invalid JSON in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: "{invalid json}",
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })
    })

    // ============================================================================
    // FIELD VALIDATION TESTS
    // ============================================================================
    describe("Field Validation (Prevent Injection)", () => {
        /**
         * Security Test: Extra Fields in Request
         * Attack Vector: Sending unexpected fields
         * Severity: MEDIUM
         */
        it("should reject extra fields in login request", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "Test@1234",
                    rememberMe: false,
                    csrfToken: "token",
                    admin: true,
                    role: "admin",
                    isVerified: true,
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Injection via Extra Fields
         * Attack Vector: Trying to inject admin flag
         * Severity: CRITICAL
         */
        it("should prevent admin flag injection in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "Test@1234",
                    rememberMe: false,
                    csrfToken: "token",
                    isAdmin: true,
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Injection via Extra Fields in Register
         * Attack Vector: Trying to inject verified flag
         * Severity: CRITICAL
         */
        it("should prevent email_verified injection in register", async () => {
            const request = new NextRequest(
                "http://localhost/api/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: "test@example.com",
                        password: "Test@1234",
                        name: "Test User",
                        phone: "+5511999999999",
                        email_verified: true,
                        isAdmin: true,
                    }),
                }
            )

            const response = await registerPOST(request)
            expect(response.status).toBe(400)
        })
    })

    // ============================================================================
    // LENGTH VALIDATION TESTS
    // ============================================================================
    describe("Length Validation (Prevent Buffer Overflow)", () => {
        /**
         * Security Test: Oversized Email
         * Attack Vector: Email longer than 255 characters
         * Severity: MEDIUM
         */
        it("should reject oversized email in login", async () => {
            const longEmail = "a".repeat(300) + "@example.com"

            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: longEmail,
                    password: "Test@1234",
                    rememberMe: false,
                    csrfToken: "token",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Oversized Password
         * Attack Vector: Password longer than 1024 characters
         * Severity: MEDIUM
         */
        it("should reject oversized password in login", async () => {
            const longPassword = "a".repeat(2000)

            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: longPassword,
                    rememberMe: false,
                    csrfToken: "token",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Oversized Name in Register
         * Attack Vector: Name longer than 255 characters
         * Severity: MEDIUM
         */
        it("should reject oversized name in register", async () => {
            const longName = "a".repeat(300)

            const request = new NextRequest(
                "http://localhost/api/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: "test@example.com",
                        password: "Test@1234",
                        name: longName,
                        phone: "+5511999999999",
                    }),
                }
            )

            const response = await registerPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Oversized Phone in Register
         * Attack Vector: Phone longer than 20 characters
         * Severity: MEDIUM
         */
        it("should reject oversized phone in register", async () => {
            const longPhone = "+55" + "1".repeat(30)

            const request = new NextRequest(
                "http://localhost/api/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: "test@example.com",
                        password: "Test@1234",
                        name: "Test User",
                        phone: longPhone,
                    }),
                }
            )

            const response = await registerPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Empty Email
         * Attack Vector: Empty string
         * Severity: MEDIUM
         */
        it("should reject empty email in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "",
                    password: "Test@1234",
                    rememberMe: false,
                    csrfToken: "token",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Empty Password
         * Attack Vector: Empty string
         * Severity: MEDIUM
         */
        it("should reject empty password in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "",
                    rememberMe: false,
                    csrfToken: "token",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })
    })

    // ============================================================================
    // COMPLEX ATTACK SCENARIOS
    // ============================================================================
    describe("Complex Attack Scenarios", () => {
        /**
         * Security Test: Multiple Attack Vectors Combined
         * Attack Vector: Type mismatch + extra fields + oversized input
         * Severity: HIGH
         */
        it("should reject request with multiple attack vectors", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: ["test@example.com"],
                    password: 12345,
                    rememberMe: "true",
                    csrfToken: 999,
                    admin: true,
                    isVerified: true,
                    role: "admin",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Prototype Pollution
         * Attack Vector: __proto__ field injection
         * Severity: CRITICAL
         */
        it("should prevent prototype pollution in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "Test@1234",
                    rememberMe: false,
                    csrfToken: "token",
                    __proto__: { isAdmin: true },
                    constructor: { prototype: { isAdmin: true } },
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Nested Object Injection
         * Attack Vector: Nested objects in fields
         * Severity: HIGH
         */
        it("should reject nested objects in login", async () => {
            const request = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: { value: "test@example.com" },
                    password: "Test@1234",
                    rememberMe: false,
                    csrfToken: "token",
                }),
            })

            const response = await loginPOST(request)
            expect(response.status).toBe(400)
        })
    })

    // ============================================================================
    // REGISTER-SPECIFIC TESTS
    // ============================================================================
    describe("Register Endpoint Specific Tests", () => {
        /**
         * Security Test: Type Validation in Register
         * Attack Vector: Wrong types for all fields
         * Severity: HIGH
         */
        it("should reject wrong types in register", async () => {
            const request = new NextRequest(
                "http://localhost/api/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: 123,
                        password: true,
                        name: ["Test"],
                        phone: { number: "+5511999999999" },
                    }),
                }
            )

            const response = await registerPOST(request)
            expect(response.status).toBe(400)
        })

        /**
         * Security Test: Optional Field Type Validation
         * Attack Vector: Wrong type for optional field
         * Severity: MEDIUM
         */
        it("should reject wrong type for optional birth_date in register", async () => {
            const request = new NextRequest(
                "http://localhost/api/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: "test@example.com",
                        password: "Test@1234",
                        name: "Test User",
                        phone: "+5511999999999",
                        birth_date: 19900101,
                    }),
                }
            )

            const response = await registerPOST(request)
            expect(response.status).toBe(400)
        })
    })
})
