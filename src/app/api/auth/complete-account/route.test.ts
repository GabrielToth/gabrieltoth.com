/**
 * Account Completion API Endpoint Tests
 *
 * Tests for POST /api/auth/complete-account
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import { createSession } from "@/lib/auth/session"
import { generateTempToken, validateTempToken } from "@/lib/auth/temp-token"
import { getUserByEmail, updateUserAccountCompletion } from "@/lib/auth/user"
import { rateLimitByKey } from "@/lib/rate-limit"
import bcrypt from "bcrypt"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// Mock dependencies
vi.mock("@/lib/auth/temp-token")
vi.mock("@/lib/auth/session")
vi.mock("@/lib/auth/user")
vi.mock("@/lib/auth/audit-logging")
vi.mock("@/lib/rate-limit")
vi.mock("bcrypt")
vi.mock("@/lib/logger")
vi.mock("@/lib/auth/audit-logging")
vi.mock("@/lib/rate-limit")
vi.mock("bcrypt")
vi.mock("@/lib/logger")

describe("POST /api/auth/complete-account", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock rate limiting to always succeed
        vi.mocked(rateLimitByKey).mockResolvedValue({ success: true } as never)
    })

    describe("Successful account completion", () => {
        it("should complete account with valid data", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            })

            const mockUser = {
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session-id-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                mockUser as never
            )
            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.message).toContain(
                "Account setup completed successfully"
            )
            expect(data.redirectUrl).toBe("/dashboard")
        })
    })

    describe("Validation errors", () => {
        it("should reject invalid email format", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "invalid-email",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.success).toBe(false)
            expect(data.field).toBe("email")
        })

        it("should reject weak password", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "weak",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.success).toBe(false)
            expect(data.field).toBe("password")
        })

        it("should reject invalid phone number", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.success).toBe(false)
            expect(data.field).toBe("phone")
        })

        it("should reject invalid birth date", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "2020-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.success).toBe(false)
            expect(data.field).toBe("birthDate")
        })

        it("should reject missing required fields", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        // Missing birthDate
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.success).toBe(false)
        })
    })

    describe("Token validation errors", () => {
        it("should reject invalid temp token", async () => {
            // Arrange
            vi.mocked(validateTempToken).mockImplementation(() => {
                throw new Error("Invalid token")
            })

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken: "invalid-token",
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.success).toBe(false)
            expect(data.error).toContain("session has expired")
        })

        it("should reject expired temp token", async () => {
            // Arrange
            vi.mocked(validateTempToken).mockImplementation(() => {
                throw new Error("Registration session expired")
            })

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken: "expired-token",
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.success).toBe(false)
        })
    })

    describe("Email uniqueness", () => {
        it("should reject duplicate email", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            const existingUser = {
                id: "existing-user-123",
                email: "newuser@example.com",
                password_hash: "hashed",
                oauth_provider: null,
                oauth_id: null,
                name: "Existing User",
                account_completion_status: "completed",
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "newuser@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(409)
            const data = await response.json()
            expect(data.success).toBe(false)
            expect(data.error).toContain("already in use")
        })

        it("should allow same email as OAuth email", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            const mockUser = {
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session-id-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                mockUser as never
            )
            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data.success).toBe(true)
        })
    })

    describe("Database errors", () => {
        it("should handle user update failure", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
            vi.mocked(updateUserAccountCompletion).mockRejectedValue(
                new Error("Database error")
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(500)
            const data = await response.json()
            expect(data.success).toBe(false)
        })

        it("should handle session creation failure", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            const mockUser = {
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                mockUser as never
            )
            vi.mocked(createSession).mockRejectedValue(
                new Error("Session creation failed")
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(500)
            const data = await response.json()
            expect(data.success).toBe(false)
        })
    })

    describe("Session cookie", () => {
        it("should set HTTP-only session cookie", async () => {
            // Arrange
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            })

            const mockUser = {
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session-id-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                mockUser as never
            )
            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "user@example.com",
                        name: "John Doe",
                        password: "SecurePass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            // Act
            const response = await POST(request)

            // Assert
            expect(response.status).toBe(200)
            const setCookieHeader = response.headers.get("set-cookie")
            expect(setCookieHeader).toBeDefined()
            expect(setCookieHeader).toContain("session=session-id-123")
            expect(setCookieHeader).toContain("HttpOnly")
            expect(setCookieHeader).toContain("SameSite=strict")
        })
    })
})
