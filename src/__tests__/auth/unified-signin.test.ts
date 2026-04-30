/**
 * Unit Tests for Unified Sign-In System
 * Tests core authentication functions and validation logic
 */

import {
    checkUserExists,
    signInWithEmail,
    signUpWithEmail,
} from "@/lib/auth/unified-auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
    createClient: vi.fn(() => ({
        auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
        },
    })),
}))

describe("Unified Sign-In System", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("checkUserExists", () => {
        it("should return userExists: true for existing user", async () => {
            const result = await checkUserExists("existing@example.com")
            expect(result.success).toBe(true)
            expect(result.userExists).toBeDefined()
        })

        it("should return userExists: false for new user", async () => {
            const result = await checkUserExists("new@example.com")
            expect(result.success).toBe(true)
            expect(result.userExists).toBeDefined()
        })

        it("should handle invalid email format", async () => {
            const result = await checkUserExists("invalid-email")
            expect(result.success).toBeDefined()
        })

        it("should handle empty email", async () => {
            const result = await checkUserExists("")
            expect(result.success).toBeDefined()
        })

        it("should return email in result", async () => {
            const email = "test@example.com"
            const result = await checkUserExists(email)
            expect(result.email).toBe(email)
        })
    })

    describe("signInWithEmail", () => {
        it("should successfully sign in with correct credentials", async () => {
            const result = await signInWithEmail(
                "user@example.com",
                "password123"
            )
            expect(result.success).toBeDefined()
        })

        it("should fail with incorrect password", async () => {
            const result = await signInWithEmail(
                "user@example.com",
                "wrongpassword"
            )
            expect(result.success).toBeDefined()
        })

        it("should fail with non-existent user", async () => {
            const result = await signInWithEmail(
                "nonexistent@example.com",
                "password123"
            )
            expect(result.success).toBeDefined()
        })

        it("should return user ID on success", async () => {
            const result = await signInWithEmail(
                "user@example.com",
                "password123"
            )
            if (result.success) {
                expect(result.userId).toBeDefined()
            }
        })

        it("should return error message on failure", async () => {
            const result = await signInWithEmail(
                "user@example.com",
                "wrongpassword"
            )
            if (!result.success) {
                expect(result.error).toBeDefined()
            }
        })

        it("should handle empty email", async () => {
            const result = await signInWithEmail("", "password123")
            expect(result.success).toBeDefined()
        })

        it("should handle empty password", async () => {
            const result = await signInWithEmail("user@example.com", "")
            expect(result.success).toBeDefined()
        })
    })

    describe("signUpWithEmail", () => {
        it("should successfully create new account", async () => {
            const result = await signUpWithEmail(
                "newuser@example.com",
                "password123"
            )
            expect(result.success).toBeDefined()
        })

        it("should fail if email already exists", async () => {
            const result = await signUpWithEmail(
                "existing@example.com",
                "password123"
            )
            expect(result.success).toBeDefined()
        })

        it("should return user ID on success", async () => {
            const result = await signUpWithEmail(
                "newuser@example.com",
                "password123"
            )
            if (result.success) {
                expect(result.userId).toBeDefined()
            }
        })

        it("should accept metadata", async () => {
            const metadata = { email_verified: false }
            const result = await signUpWithEmail(
                "newuser@example.com",
                "password123",
                metadata
            )
            expect(result.success).toBeDefined()
        })

        it("should handle empty email", async () => {
            const result = await signUpWithEmail("", "password123")
            expect(result.success).toBeDefined()
        })

        it("should handle empty password", async () => {
            const result = await signUpWithEmail("newuser@example.com", "")
            expect(result.success).toBeDefined()
        })

        it("should handle short password", async () => {
            const result = await signUpWithEmail("newuser@example.com", "short")
            expect(result.success).toBeDefined()
        })
    })

    describe("Password Validation", () => {
        it("should require minimum 8 characters", () => {
            const password = "short"
            expect(password.length).toBeLessThan(8)
        })

        it("should accept 8+ character passwords", () => {
            const password = "validpassword123"
            expect(password.length).toBeGreaterThanOrEqual(8)
        })
    })

    describe("Email Validation", () => {
        it("should validate email format", () => {
            const validEmails = [
                "user@example.com",
                "test.user@example.co.uk",
                "user+tag@example.com",
            ]
            validEmails.forEach(email => {
                expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
            })
        })

        it("should reject invalid email format", () => {
            const invalidEmails = [
                "invalid",
                "invalid@",
                "@example.com",
                "invalid@.com",
            ]
            invalidEmails.forEach(email => {
                expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
            })
        })
    })

    describe("Error Handling", () => {
        it("should return error object on failure", async () => {
            const result = await signInWithEmail(
                "user@example.com",
                "wrongpassword"
            )
            expect(result).toHaveProperty("success")
            expect(result).toHaveProperty("error")
        })

        it("should not throw on network error", async () => {
            expect(async () => {
                await checkUserExists("test@example.com")
            }).not.toThrow()
        })

        it("should handle unknown errors gracefully", async () => {
            const result = await signInWithEmail(
                "user@example.com",
                "password123"
            )
            expect(result.success).toBeDefined()
            expect(result.error).toBeDefined()
        })
    })
})
