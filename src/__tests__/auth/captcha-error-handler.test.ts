/**
 * Tests for CAPTCHA Error Handler
 * Validates: Requirements 20.3, 20.4, 20.11, 14.1, 14.5
 */

import {
    CAPTCHAErrorType,
    createCAPTCHAErrorDetails,
    getCAPTCHAErrorResponse,
    getCAPTCHAErrorStatusCode,
    handleCAPTCHAError,
    isConfigurationError,
    logCAPTCHAFailure,
} from "@/lib/auth/captcha-error-handler"

describe("CAPTCHA Error Handler", () => {
    describe("getCAPTCHAErrorResponse", () => {
        it("should return 400 status code", () => {
            const response = getCAPTCHAErrorResponse()
            expect(response.status).toBe(400)
        })

        it("should return generic error message", async () => {
            const response = getCAPTCHAErrorResponse()
            const body = await response.json()
            expect(body.error).toBe("Invalid request")
            expect(body.success).toBe(false)
        })

        it("should not reveal CAPTCHA failure", async () => {
            const response = getCAPTCHAErrorResponse()
            const body = await response.json()
            expect(body.error).not.toContain("CAPTCHA")
            expect(body.error).not.toContain("token")
            expect(body.error).not.toContain("verification")
        })

        it("should include security headers", () => {
            const response = getCAPTCHAErrorResponse()
            expect(response.headers.get("X-Content-Type-Options")).toBe(
                "nosniff"
            )
            expect(response.headers.get("X-Frame-Options")).toBe("DENY")
            expect(response.headers.get("X-XSS-Protection")).toBe(
                "1; mode=block"
            )
        })
    })

    describe("getCAPTCHAErrorStatusCode", () => {
        it("should return 400 for missing token", () => {
            const code = getCAPTCHAErrorStatusCode(
                CAPTCHAErrorType.MISSING_TOKEN
            )
            expect(code).toBe(400)
        })

        it("should return 400 for invalid token", () => {
            const code = getCAPTCHAErrorStatusCode(
                CAPTCHAErrorType.INVALID_TOKEN
            )
            expect(code).toBe(400)
        })

        it("should return 400 for expired token", () => {
            const code = getCAPTCHAErrorStatusCode(
                CAPTCHAErrorType.EXPIRED_TOKEN
            )
            expect(code).toBe(400)
        })

        it("should return 503 for network error", () => {
            const code = getCAPTCHAErrorStatusCode(
                CAPTCHAErrorType.NETWORK_ERROR
            )
            expect(code).toBe(503)
        })

        it("should return 500 for configuration error", () => {
            const code = getCAPTCHAErrorStatusCode(
                CAPTCHAErrorType.CONFIG_ERROR
            )
            expect(code).toBe(500)
        })

        it("should return 400 for service error", () => {
            const code = getCAPTCHAErrorStatusCode(
                CAPTCHAErrorType.SERVICE_ERROR
            )
            expect(code).toBe(400)
        })
    })

    describe("isConfigurationError", () => {
        it("should return true for configuration error", () => {
            const result = isConfigurationError(CAPTCHAErrorType.CONFIG_ERROR)
            expect(result).toBe(true)
        })

        it("should return false for other errors", () => {
            expect(isConfigurationError(CAPTCHAErrorType.MISSING_TOKEN)).toBe(
                false
            )
            expect(isConfigurationError(CAPTCHAErrorType.INVALID_TOKEN)).toBe(
                false
            )
            expect(isConfigurationError(CAPTCHAErrorType.EXPIRED_TOKEN)).toBe(
                false
            )
            expect(isConfigurationError(CAPTCHAErrorType.NETWORK_ERROR)).toBe(
                false
            )
            expect(isConfigurationError(CAPTCHAErrorType.SERVICE_ERROR)).toBe(
                false
            )
        })
    })

    describe("createCAPTCHAErrorDetails", () => {
        it("should map missing token reason to error type", () => {
            const details = createCAPTCHAErrorDetails("Token is missing")
            expect(details.errorType).toBe(CAPTCHAErrorType.MISSING_TOKEN)
            expect(details.failureReason).toBe(CAPTCHAErrorType.MISSING_TOKEN)
        })

        it("should map expired token reason to error type", () => {
            const details = createCAPTCHAErrorDetails("Token expired")
            expect(details.errorType).toBe(CAPTCHAErrorType.EXPIRED_TOKEN)
            expect(details.failureReason).toBe(CAPTCHAErrorType.EXPIRED_TOKEN)
        })

        it("should map service error reason to error type", () => {
            const details = createCAPTCHAErrorDetails(
                "Cloudflare verification failed"
            )
            expect(details.errorType).toBe(CAPTCHAErrorType.SERVICE_ERROR)
            expect(details.failureReason).toBe(CAPTCHAErrorType.SERVICE_ERROR)
        })

        it("should map network error reason to error type", () => {
            const details = createCAPTCHAErrorDetails(
                "CAPTCHA service unavailable"
            )
            expect(details.errorType).toBe(CAPTCHAErrorType.NETWORK_ERROR)
            expect(details.failureReason).toBe(CAPTCHAErrorType.NETWORK_ERROR)
        })

        it("should default to invalid token for unknown reason", () => {
            const details = createCAPTCHAErrorDetails("unknown reason")
            expect(details.errorType).toBe(CAPTCHAErrorType.INVALID_TOKEN)
            expect(details.failureReason).toBe(CAPTCHAErrorType.INVALID_TOKEN)
        })

        it("should include cloudflare errors if provided", () => {
            const errors = ["invalid-input-response"]
            const details = createCAPTCHAErrorDetails(
                "Cloudflare verification failed",
                errors
            )
            expect(details.cloudflareErrors).toEqual(errors)
        })

        it("should include hostname if provided", () => {
            const hostname = "example.com"
            const details = createCAPTCHAErrorDetails(
                "Cloudflare verification failed",
                undefined,
                hostname
            )
            expect(details.hostname).toBe(hostname)
        })

        it("should set timestamp to current time", () => {
            const before = new Date()
            const details = createCAPTCHAErrorDetails("Token is missing")
            const after = new Date()

            expect(details.timestamp.getTime()).toBeGreaterThanOrEqual(
                before.getTime()
            )
            expect(details.timestamp.getTime()).toBeLessThanOrEqual(
                after.getTime()
            )
        })
    })

    describe("logCAPTCHAFailure", () => {
        it("should not throw when logging", () => {
            const errorDetails = {
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }

            expect(() => {
                logCAPTCHAFailure(errorDetails, "test@example.com", "127.0.0.1")
            }).not.toThrow()
        })

        it("should not throw when email is undefined", () => {
            const errorDetails = {
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }

            expect(() => {
                logCAPTCHAFailure(errorDetails, undefined, "127.0.0.1")
            }).not.toThrow()
        })

        it("should not throw when clientIp is undefined", () => {
            const errorDetails = {
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }

            expect(() => {
                logCAPTCHAFailure(errorDetails, "test@example.com", undefined)
            }).not.toThrow()
        })
    })

    describe("handleCAPTCHAError", () => {
        it("should return 400 status code", () => {
            const errorDetails = {
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }

            const response = handleCAPTCHAError(errorDetails)
            expect(response.status).toBe(400)
        })

        it("should return generic error message", async () => {
            const errorDetails = {
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }

            const response = handleCAPTCHAError(errorDetails)
            const body = await response.json()
            expect(body.error).toBe("Invalid request")
            expect(body.success).toBe(false)
        })

        it("should not reveal error details", async () => {
            const errorDetails = {
                errorType: CAPTCHAErrorType.EXPIRED_TOKEN,
                failureReason: "expired_token",
                timestamp: new Date(),
            }

            const response = handleCAPTCHAError(errorDetails)
            const body = await response.json()
            expect(body.error).not.toContain("expired")
            expect(body.error).not.toContain("token")
            expect(body.error).not.toContain("CAPTCHA")
        })

        it("should include security headers", () => {
            const errorDetails = {
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }

            const response = handleCAPTCHAError(errorDetails)
            expect(response.headers.get("X-Content-Type-Options")).toBe(
                "nosniff"
            )
            expect(response.headers.get("X-Frame-Options")).toBe("DENY")
            expect(response.headers.get("X-XSS-Protection")).toBe(
                "1; mode=block"
            )
        })

        it("should accept optional email and clientIp", () => {
            const errorDetails = {
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }

            expect(() => {
                handleCAPTCHAError(
                    errorDetails,
                    "test@example.com",
                    "127.0.0.1"
                )
            }).not.toThrow()
        })
    })

    describe("Generic error response consistency", () => {
        it("should return same error message for all error types", async () => {
            const errorTypes = [
                CAPTCHAErrorType.MISSING_TOKEN,
                CAPTCHAErrorType.INVALID_TOKEN,
                CAPTCHAErrorType.EXPIRED_TOKEN,
                CAPTCHAErrorType.SERVICE_ERROR,
            ]

            const responses = await Promise.all(
                errorTypes.map(async errorType => {
                    const response = handleCAPTCHAError({
                        errorType,
                        failureReason: errorType,
                        timestamp: new Date(),
                    })
                    return response.json()
                })
            )

            // All should have same error message
            const firstError = responses[0].error
            responses.forEach(response => {
                expect(response.error).toBe(firstError)
            })
        })

        it("should not distinguish between missing and invalid tokens", async () => {
            const missingResponse = await handleCAPTCHAError({
                errorType: CAPTCHAErrorType.MISSING_TOKEN,
                failureReason: "missing_token",
                timestamp: new Date(),
            }).json()

            const invalidResponse = await handleCAPTCHAError({
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }).json()

            expect(missingResponse.error).toBe(invalidResponse.error)
        })

        it("should not distinguish between expired and invalid tokens", async () => {
            const expiredResponse = await handleCAPTCHAError({
                errorType: CAPTCHAErrorType.EXPIRED_TOKEN,
                failureReason: "expired_token",
                timestamp: new Date(),
            }).json()

            const invalidResponse = await handleCAPTCHAError({
                errorType: CAPTCHAErrorType.INVALID_TOKEN,
                failureReason: "invalid_token",
                timestamp: new Date(),
            }).json()

            expect(expiredResponse.error).toBe(invalidResponse.error)
        })
    })
})
