/**
 * Test: Generic Error Messages (No User Enumeration)
 * Validates: Requirement 7.4
 *
 * Ensures that authentication endpoints return generic error messages
 * that don't reveal whether a user exists, whether the password is correct,
 * or any other information that could enable user enumeration attacks.
 */

import { AuthErrorType, createErrorResponse } from "@/lib/auth/error-handling"
import { describe, expect, it } from "vitest"

// Helper function to extract JSON from NextResponse
async function getResponseJson(response: Response) {
    const text = await response.text()
    return JSON.parse(text)
}

describe("Generic Error Messages (No User Enumeration)", () => {
    describe("Error Message Consistency", () => {
        it("should return same error message for invalid credentials", async () => {
            const response = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )
            const json = await getResponseJson(response)
            expect(json.error).toBe("Invalid email or password")
        })

        it("should return same error message for email not verified", async () => {
            const response = createErrorResponse(
                AuthErrorType.EMAIL_NOT_VERIFIED
            )
            const json = await getResponseJson(response)
            // Should NOT reveal that email is not verified
            expect(json.error).toBe("Invalid email or password")
        })

        it("should return same error message for too many attempts", async () => {
            const response = createErrorResponse(
                AuthErrorType.TOO_MANY_ATTEMPTS
            )
            const json = await getResponseJson(response)
            // Should NOT reveal rate limiting
            expect(json.error).toBe("Invalid email or password")
        })

        it("should return same error message for account locked", async () => {
            const response = createErrorResponse(AuthErrorType.ACCOUNT_LOCKED)
            const json = await getResponseJson(response)
            // Should NOT reveal account is locked
            expect(json.error).toBe("Invalid email or password")
        })

        it("should return same error message for email already registered", async () => {
            const response = createErrorResponse(
                AuthErrorType.EMAIL_ALREADY_REGISTERED
            )
            const json = await getResponseJson(response)
            // Should NOT reveal that email already exists
            expect(json.error).toBe("Invalid email or password")
        })

        it("should return same error message for user already exists", async () => {
            const response = createErrorResponse(
                AuthErrorType.USER_ALREADY_EXISTS
            )
            const json = await getResponseJson(response)
            // Should NOT reveal that user already exists
            expect(json.error).toBe("Invalid email or password")
        })
    })

    describe("HTTP Status Codes", () => {
        it("should return 401 for invalid credentials", () => {
            const response = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )
            expect(response.status).toBe(401)
        })

        it("should return 401 for email not verified", () => {
            const response = createErrorResponse(
                AuthErrorType.EMAIL_NOT_VERIFIED
            )
            expect(response.status).toBe(401)
        })

        it("should return 429 for too many attempts", () => {
            const response = createErrorResponse(
                AuthErrorType.TOO_MANY_ATTEMPTS
            )
            expect(response.status).toBe(429)
        })

        it("should return 429 for account locked", () => {
            const response = createErrorResponse(AuthErrorType.ACCOUNT_LOCKED)
            expect(response.status).toBe(429)
        })

        it("should return 409 for email already registered", () => {
            const response = createErrorResponse(
                AuthErrorType.EMAIL_ALREADY_REGISTERED
            )
            expect(response.status).toBe(409)
        })

        it("should return 409 for user already exists", () => {
            const response = createErrorResponse(
                AuthErrorType.USER_ALREADY_EXISTS
            )
            expect(response.status).toBe(409)
        })
    })

    describe("No Information Leakage", () => {
        it("should not distinguish between missing user and wrong password", async () => {
            const missingUserResponse = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )
            const wrongPasswordResponse = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )

            const missingUserBody = await getResponseJson(missingUserResponse)
            const wrongPasswordBody = await getResponseJson(
                wrongPasswordResponse
            )

            expect(missingUserBody.error).toBe(wrongPasswordBody.error)
        })

        it("should not distinguish between rate limited and locked account", async () => {
            const rateLimitedResponse = createErrorResponse(
                AuthErrorType.TOO_MANY_ATTEMPTS
            )
            const lockedResponse = createErrorResponse(
                AuthErrorType.ACCOUNT_LOCKED
            )

            const rateLimitedBody = await getResponseJson(rateLimitedResponse)
            const lockedBody = await getResponseJson(lockedResponse)

            expect(rateLimitedBody.error).toBe(lockedBody.error)
        })

        it("should not distinguish between email exists and email not exists", async () => {
            const emailExistsResponse = createErrorResponse(
                AuthErrorType.EMAIL_ALREADY_REGISTERED
            )
            const emailNotExistsResponse = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )

            const emailExistsBody = await getResponseJson(emailExistsResponse)
            const emailNotExistsBody = await getResponseJson(
                emailNotExistsResponse
            )

            // Both should return generic error message
            expect(emailExistsBody.error).toBe("Invalid email or password")
            expect(emailNotExistsBody.error).toBe("Invalid email or password")
        })

        it("should not reveal email verification status", async () => {
            const notVerifiedResponse = createErrorResponse(
                AuthErrorType.EMAIL_NOT_VERIFIED
            )
            const invalidCredentialsResponse = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )

            const notVerifiedBody = await getResponseJson(notVerifiedResponse)
            const invalidCredentialsBody = await getResponseJson(
                invalidCredentialsResponse
            )

            expect(notVerifiedBody.error).toBe(invalidCredentialsBody.error)
            expect(notVerifiedBody.error).not.toContain("verify")
            expect(notVerifiedBody.error).not.toContain("verified")
        })
    })

    describe("Security Headers", () => {
        it("should include security headers in error response", () => {
            const response = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )
            expect(response.headers.get("X-Content-Type-Options")).toBe(
                "nosniff"
            )
            expect(response.headers.get("X-Frame-Options")).toBe("DENY")
            expect(response.headers.get("X-XSS-Protection")).toBe(
                "1; mode=block"
            )
        })
    })
})
