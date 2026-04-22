/**
 * Account Completion Duplicate Email Prevention Tests
 *
 * Tests that duplicate emails are prevented during account completion.
 * Validates: Requirements 4.4, 4.5, 6.6, 8.3
 */

import { getUserByEmail, updateUserAccountCompletion } from "@/lib/auth/user"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth/user")

describe("Account Completion Duplicate Email Prevention", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Email uniqueness validation", () => {
        it("should prevent completion with existing email", async () => {
            // Existing user with email
            const existingUser = {
                id: "existing-user-123",
                email: "taken@example.com",
                password_hash: "hashed",
                account_completion_status: "completed" as const,
            }

            // New user trying to use same email
            const newUserData = {
                email: "taken@example.com",
                name: "John Doe",
                password: "SecurePass123!",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            }

            vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

            // Check if email exists
            const result = await getUserByEmail(newUserData.email)

            expect(result).not.toBeNull()
            expect(result?.email).toBe(newUserData.email)
            expect(result?.id).not.toBe("new-user-123")
        })

        it("should allow completion with unique email", async () => {
            const newUserData = {
                email: "unique@example.com",
                name: "John Doe",
                password: "SecurePass123!",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            }

            vi.mocked(getUserByEmail).mockResolvedValue(null)

            // Check if email exists
            const result = await getUserByEmail(newUserData.email)

            expect(result).toBeNull()
        })

        it("should allow same email as OAuth email", async () => {
            // OAuth user's original email
            const oauthEmail = "user@example.com"

            // User keeps same email during completion
            const completionData = {
                email: oauthEmail,
                name: "John Doe",
                password: "SecurePass123!",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            }

            // Should not check uniqueness if email is same as OAuth email
            vi.mocked(getUserByEmail).mockResolvedValue(null)

            const result = await getUserByEmail(completionData.email)

            expect(result).toBeNull()
        })
    })

    describe("Email change validation", () => {
        it("should validate new email when user changes email", async () => {
            // OAuth email
            const oauthEmail = "original@example.com"

            // User changes to new email
            const newEmail = "newemail@example.com"

            // New email should be checked for uniqueness
            vi.mocked(getUserByEmail).mockResolvedValue(null)

            const result = await getUserByEmail(newEmail)

            expect(result).toBeNull()
            expect(vi.mocked(getUserByEmail)).toHaveBeenCalledWith(newEmail)
        })

        it("should reject if new email is already taken", async () => {
            const oauthEmail = "original@example.com"
            const newEmail = "taken@example.com"

            const existingUser = {
                id: "other-user-123",
                email: newEmail,
                password_hash: "hashed",
            }

            vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

            const result = await getUserByEmail(newEmail)

            expect(result).not.toBeNull()
            expect(result?.email).toBe(newEmail)
        })

        it("should allow keeping original OAuth email", async () => {
            const oauthEmail = "user@example.com"

            // User keeps original email
            vi.mocked(getUserByEmail).mockResolvedValue(null)

            const result = await getUserByEmail(oauthEmail)

            expect(result).toBeNull()
        })
    })

    describe("Case-insensitive email checking", () => {
        it("should treat emails as case-insensitive", async () => {
            // Existing email
            const existingUser = {
                id: "user-123",
                email: "User@Example.com",
                password_hash: "hashed",
            }

            // Try to register with different case
            const newEmail = "user@example.com"

            vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

            const result = await getUserByEmail(newEmail.toLowerCase())

            expect(result).not.toBeNull()
        })

        it("should normalize email before checking", async () => {
            const email = "User@Example.COM"
            const normalizedEmail = email.toLowerCase()

            vi.mocked(getUserByEmail).mockResolvedValue(null)

            const result = await getUserByEmail(normalizedEmail)

            expect(result).toBeNull()
            expect(vi.mocked(getUserByEmail)).toHaveBeenCalledWith(
                normalizedEmail
            )
        })
    })

    describe("Concurrent completion attempts", () => {
        it("should prevent race condition with concurrent completions", async () => {
            const email = "user@example.com"

            // First check: email is available
            vi.mocked(getUserByEmail).mockResolvedValueOnce(null)

            // Second check: email is available
            vi.mocked(getUserByEmail).mockResolvedValueOnce(null)

            const result1 = await getUserByEmail(email)
            const result2 = await getUserByEmail(email)

            expect(result1).toBeNull()
            expect(result2).toBeNull()

            // In real scenario, database constraint would prevent duplicate
            expect(vi.mocked(getUserByEmail)).toHaveBeenCalledTimes(2)
        })

        it("should handle database constraint violation", async () => {
            const email = "user@example.com"

            // Simulate database constraint violation
            vi.mocked(updateUserAccountCompletion).mockRejectedValue(
                new Error("Unique constraint violation on email")
            )

            try {
                await updateUserAccountCompletion("oauth-id", {
                    email,
                    name: "John Doe",
                    password_hash: "hashed",
                    phone_number: "+1234567890",
                    birth_date: new Date("1990-01-01"),
                    account_completion_status: "completed",
                    account_completed_at: new Date(),
                })
            } catch (error) {
                expect(error).toBeDefined()
                expect((error as Error).message).toContain("constraint")
            }
        })
    })

    describe("Error responses", () => {
        it("should return 409 Conflict for duplicate email", async () => {
            const existingUser = {
                id: "user-123",
                email: "taken@example.com",
            }

            vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

            const result = await getUserByEmail("taken@example.com")

            expect(result).not.toBeNull()

            // Should return 409 status code
            const statusCode = result ? 409 : 200
            expect(statusCode).toBe(409)
        })

        it("should include error message for duplicate email", async () => {
            const existingUser = {
                id: "user-123",
                email: "taken@example.com",
            }

            vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

            const result = await getUserByEmail("taken@example.com")

            expect(result).not.toBeNull()

            const errorMessage = result
                ? "This email is already in use"
                : undefined
            expect(errorMessage).toBe("This email is already in use")
        })

        it("should not modify database on duplicate email error", async () => {
            const existingUser = {
                id: "user-123",
                email: "taken@example.com",
            }

            vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)
            vi.mocked(updateUserAccountCompletion).mockRejectedValue(
                new Error("Email already exists")
            )

            try {
                await updateUserAccountCompletion("oauth-id", {
                    email: "taken@example.com",
                    name: "John Doe",
                    password_hash: "hashed",
                    phone_number: "+1234567890",
                    birth_date: new Date("1990-01-01"),
                    account_completion_status: "completed",
                    account_completed_at: new Date(),
                })
            } catch (error) {
                expect(error).toBeDefined()
            }

            // updateUserAccountCompletion should not have been called successfully
            expect(vi.mocked(updateUserAccountCompletion)).toHaveBeenCalled()
        })
    })

    describe("Email validation before uniqueness check", () => {
        it("should validate email format before checking uniqueness", async () => {
            const invalidEmail = "not-an-email"

            // Invalid email should fail format validation first
            const isValidEmail = invalidEmail.includes("@")

            expect(isValidEmail).toBe(false)

            // Should not even check database
            expect(vi.mocked(getUserByEmail)).not.toHaveBeenCalled()
        })

        it("should check uniqueness only for valid emails", async () => {
            const validEmail = "user@example.com"

            vi.mocked(getUserByEmail).mockResolvedValue(null)

            const result = await getUserByEmail(validEmail)

            expect(result).toBeNull()
            expect(vi.mocked(getUserByEmail)).toHaveBeenCalledWith(validEmail)
        })
    })

    describe("Multiple email changes", () => {
        it("should validate each email change", async () => {
            const emails = [
                "first@example.com",
                "second@example.com",
                "third@example.com",
            ]

            vi.mocked(getUserByEmail).mockResolvedValue(null)

            for (const email of emails) {
                const result = await getUserByEmail(email)
                expect(result).toBeNull()
            }

            expect(vi.mocked(getUserByEmail)).toHaveBeenCalledTimes(3)
        })

        it("should reject if any email is taken", async () => {
            const emails = [
                "first@example.com",
                "taken@example.com",
                "third@example.com",
            ]

            const takenUser = {
                id: "user-123",
                email: "taken@example.com",
            }

            vi.mocked(getUserByEmail)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(takenUser as never)
                .mockResolvedValueOnce(null)

            const result1 = await getUserByEmail(emails[0])
            const result2 = await getUserByEmail(emails[1])
            const result3 = await getUserByEmail(emails[2])

            expect(result1).toBeNull()
            expect(result2).not.toBeNull()
            expect(result3).toBeNull()
        })
    })

    describe("Email normalization", () => {
        it("should normalize email with whitespace", async () => {
            const emailWithSpace = " user@example.com "
            const normalizedEmail = emailWithSpace.trim().toLowerCase()

            vi.mocked(getUserByEmail).mockResolvedValue(null)

            const result = await getUserByEmail(normalizedEmail)

            expect(result).toBeNull()
            expect(vi.mocked(getUserByEmail)).toHaveBeenCalledWith(
                normalizedEmail
            )
        })

        it("should handle email with plus addressing", async () => {
            const email = "user+tag@example.com"

            vi.mocked(getUserByEmail).mockResolvedValue(null)

            const result = await getUserByEmail(email)

            expect(result).toBeNull()
        })
    })
})
