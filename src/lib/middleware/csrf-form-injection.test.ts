/**
 * Unit Tests for CSRF Form Injection Utilities
 * Tests CSRF token injection into form responses
 *
 * Requirements: 6.1, 6.4
 */

import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as apiCsrfMiddleware from "./api-csrf-middleware"
import {
    createForgotPasswordFormResponse,
    createLoginFormResponse,
    createPasswordResetFormResponse,
    createRegistrationFormResponse,
    extractCsrfFromFormData,
    injectCsrfIntoFormResponse,
} from "./csrf-form-injection"

// Mock the api-csrf-middleware module
vi.mock("./api-csrf-middleware", () => ({
    getOrGenerateCsrfToken: vi.fn(),
    addCsrfTokenToResponse: vi.fn(response => response),
}))

describe("CSRF Form Injection Utilities", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("injectCsrfIntoFormResponse", () => {
        it("should inject CSRF token into form response with no additional data", async () => {
            // Arrange
            const mockCsrfToken = "test-csrf-token-123"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest("http://localhost:3000/api/test")

            // Act
            const response = injectCsrfIntoFormResponse(request)
            const body = await response.json()

            // Assert
            expect(body).toEqual({
                success: true,
                csrfToken: mockCsrfToken,
            })
            expect(
                apiCsrfMiddleware.getOrGenerateCsrfToken
            ).toHaveBeenCalledWith(request)
            expect(
                apiCsrfMiddleware.addCsrfTokenToResponse
            ).toHaveBeenCalledWith(expect.any(Object), mockCsrfToken)
        })

        it("should inject CSRF token with additional form data", async () => {
            // Arrange
            const mockCsrfToken = "test-csrf-token-456"
            const formData = {
                email: "user@example.com",
                name: "John Doe",
            }
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest("http://localhost:3000/api/test")

            // Act
            const response = injectCsrfIntoFormResponse(request, formData)
            const body = await response.json()

            // Assert
            expect(body).toEqual({
                success: true,
                csrfToken: mockCsrfToken,
                data: formData,
            })
        })

        it("should return 401 error when no session exists", async () => {
            // Arrange
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                null
            )

            const request = new NextRequest("http://localhost:3000/api/test")

            // Act
            const response = injectCsrfIntoFormResponse(request)
            const body = await response.json()

            // Assert
            expect(response.status).toBe(401)
            expect(body).toEqual({
                success: false,
                error: "No active session. Please log in first.",
            })
        })

        it("should handle empty form data object", async () => {
            // Arrange
            const mockCsrfToken = "test-csrf-token-789"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest("http://localhost:3000/api/test")

            // Act
            const response = injectCsrfIntoFormResponse(request, {})
            const body = await response.json()

            // Assert
            expect(body).toEqual({
                success: true,
                csrfToken: mockCsrfToken,
                data: {},
            })
        })
    })

    describe("createRegistrationFormResponse", () => {
        it("should create registration form response with CSRF token", async () => {
            // Arrange
            const mockCsrfToken = "registration-csrf-token"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/register"
            )

            // Act
            const response = createRegistrationFormResponse(request)
            const body = await response.json()

            // Assert
            expect(body).toEqual({
                success: true,
                csrfToken: mockCsrfToken,
            })
            expect(
                apiCsrfMiddleware.getOrGenerateCsrfToken
            ).toHaveBeenCalledWith(request)
        })

        it("should return 401 when no session for registration form", async () => {
            // Arrange
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                null
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/register"
            )

            // Act
            const response = createRegistrationFormResponse(request)
            const body = await response.json()

            // Assert
            expect(response.status).toBe(401)
            expect(body.success).toBe(false)
        })
    })

    describe("createLoginFormResponse", () => {
        it("should create login form response with CSRF token", async () => {
            // Arrange
            const mockCsrfToken = "login-csrf-token"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/login"
            )

            // Act
            const response = createLoginFormResponse(request)
            const body = await response.json()

            // Assert
            expect(body).toEqual({
                success: true,
                csrfToken: mockCsrfToken,
            })
        })

        it("should return 401 when no session for login form", async () => {
            // Arrange
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                null
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/login"
            )

            // Act
            const response = createLoginFormResponse(request)

            // Assert
            expect(response.status).toBe(401)
        })
    })

    describe("createPasswordResetFormResponse", () => {
        it("should create password reset form response with CSRF token and reset token", async () => {
            // Arrange
            const mockCsrfToken = "reset-csrf-token"
            const resetToken = "password-reset-token-abc"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/reset-password"
            )

            // Act
            const response = createPasswordResetFormResponse(
                request,
                resetToken
            )
            const body = await response.json()

            // Assert
            expect(body).toEqual({
                success: true,
                csrfToken: mockCsrfToken,
                data: {
                    resetToken,
                },
            })
        })

        it("should create password reset form response without reset token", async () => {
            // Arrange
            const mockCsrfToken = "reset-csrf-token-2"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/reset-password"
            )

            // Act
            const response = createPasswordResetFormResponse(request)
            const body = await response.json()

            // Assert
            expect(body).toEqual({
                success: true,
                csrfToken: mockCsrfToken,
            })
        })

        it("should return 401 when no session for password reset form", async () => {
            // Arrange
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                null
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/reset-password"
            )

            // Act
            const response = createPasswordResetFormResponse(request)

            // Assert
            expect(response.status).toBe(401)
        })
    })

    describe("createForgotPasswordFormResponse", () => {
        it("should create forgot password form response with CSRF token", async () => {
            // Arrange
            const mockCsrfToken = "forgot-password-csrf-token"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/forgot-password"
            )

            // Act
            const response = createForgotPasswordFormResponse(request)
            const body = await response.json()

            // Assert
            expect(body).toEqual({
                success: true,
                csrfToken: mockCsrfToken,
            })
        })

        it("should return 401 when no session for forgot password form", async () => {
            // Arrange
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                null
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/forgot-password"
            )

            // Act
            const response = createForgotPasswordFormResponse(request)

            // Assert
            expect(response.status).toBe(401)
        })
    })

    describe("extractCsrfFromFormData", () => {
        it("should extract CSRF token from form data", () => {
            // Arrange
            const formData = {
                csrfToken: "extracted-csrf-token",
                email: "user@example.com",
                password: "password123",
            }

            // Act
            const result = extractCsrfFromFormData(formData)

            // Assert
            expect(result.csrfToken).toBe("extracted-csrf-token")
            expect(result.data).toEqual({
                email: "user@example.com",
                password: "password123",
            })
        })

        it("should handle form data without CSRF token", () => {
            // Arrange
            const formData = {
                email: "user@example.com",
                password: "password123",
            }

            // Act
            const result = extractCsrfFromFormData(formData)

            // Assert
            expect(result.csrfToken).toBeUndefined()
            expect(result.data).toEqual({
                email: "user@example.com",
                password: "password123",
            })
        })

        it("should handle empty form data", () => {
            // Arrange
            const formData = {}

            // Act
            const result = extractCsrfFromFormData(formData)

            // Assert
            expect(result.csrfToken).toBeUndefined()
            expect(result.data).toEqual({})
        })

        it("should handle form data with only CSRF token", () => {
            // Arrange
            const formData = {
                csrfToken: "only-csrf-token",
            }

            // Act
            const result = extractCsrfFromFormData(formData)

            // Assert
            expect(result.csrfToken).toBe("only-csrf-token")
            expect(result.data).toEqual({})
        })

        it("should preserve all other fields when extracting CSRF token", () => {
            // Arrange
            const formData = {
                csrfToken: "token-123",
                name: "John Doe",
                email: "john@example.com",
                age: 30,
                active: true,
                metadata: { key: "value" },
            }

            // Act
            const result = extractCsrfFromFormData(formData)

            // Assert
            expect(result.csrfToken).toBe("token-123")
            expect(result.data).toEqual({
                name: "John Doe",
                email: "john@example.com",
                age: 30,
                active: true,
                metadata: { key: "value" },
            })
        })
    })

    describe("Integration scenarios", () => {
        it("should work in a typical registration flow", async () => {
            // Arrange
            const mockCsrfToken = "registration-flow-token"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/register"
            )

            // Act - GET request to get form with CSRF token
            const getResponse = createRegistrationFormResponse(request)
            const getBody = await getResponse.json()

            // Assert
            expect(getBody.success).toBe(true)
            expect(getBody.csrfToken).toBe(mockCsrfToken)

            // Simulate client extracting and sending back
            const submittedData = {
                csrfToken: getBody.csrfToken,
                name: "Jane Doe",
                email: "jane@example.com",
                password: "SecurePass123!",
            }

            const extracted = extractCsrfFromFormData(submittedData)
            expect(extracted.csrfToken).toBe(mockCsrfToken)
            expect(extracted.data).toEqual({
                name: "Jane Doe",
                email: "jane@example.com",
                password: "SecurePass123!",
            })
        })

        it("should work in a typical password reset flow", async () => {
            // Arrange
            const mockCsrfToken = "reset-flow-token"
            const resetToken = "reset-token-xyz"
            vi.mocked(apiCsrfMiddleware.getOrGenerateCsrfToken).mockReturnValue(
                mockCsrfToken
            )

            const request = new NextRequest(
                `http://localhost:3000/api/auth/reset-password?token=${resetToken}`
            )

            // Act - GET request to get form with CSRF token and reset token
            const getResponse = createPasswordResetFormResponse(
                request,
                resetToken
            )
            const getBody = await getResponse.json()

            // Assert
            expect(getBody.success).toBe(true)
            expect(getBody.csrfToken).toBe(mockCsrfToken)
            expect(getBody.data?.resetToken).toBe(resetToken)
        })
    })
})
