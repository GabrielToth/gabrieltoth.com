/**
 * Unit Tests for User Manager
 * Tests specific examples and edge cases for user management functions
 *
 * Feature: oauth-password-requirement
 * **Validates: Requirements 2.5, 3.6, 11.3**
 */

import {
    createOAuthUser,
    getUserByEmail,
    getUserByOAuthId,
    updateUserPassword,
} from "@/lib/auth/user"
import { db } from "@/lib/db"
import { OAuthUser } from "@/types/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the database module
vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(),
        query: vi.fn(),
    },
}))

// Mock the logger module
vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
    },
}))

describe("User Manager - OAuth Functions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("createOAuthUser", () => {
        it("should create a user with all fields", async () => {
            const userData = {
                email: "test@example.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "Test User",
                picture: "https://example.com/photo.jpg",
            }

            const mockUser: OAuthUser = {
                id: "user-123",
                ...userData,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.queryOne).mockResolvedValue(mockUser)

            const result = await createOAuthUser(userData)

            expect(result).toEqual(mockUser)
            expect(db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO users"),
                [
                    userData.email,
                    userData.password_hash,
                    userData.oauth_provider,
                    userData.oauth_id,
                    userData.name,
                    userData.picture,
                    true, // email_verified for Google
                ]
            )
        })

        it("should create a user without optional picture field", async () => {
            const userData = {
                email: "test@example.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "facebook",
                oauth_id: "facebook-456",
                name: "Test User",
            }

            const mockUser: OAuthUser = {
                id: "user-456",
                ...userData,
                picture: null,
                email_verified: false,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.queryOne).mockResolvedValue(mockUser)

            const result = await createOAuthUser(userData)

            expect(result).toEqual(mockUser)
            expect(result.picture).toBeNull()
            expect(db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO users"),
                [
                    userData.email,
                    userData.password_hash,
                    userData.oauth_provider,
                    userData.oauth_id,
                    userData.name,
                    null, // picture is null
                    false, // email_verified for Facebook
                ]
            )
        })

        it("should set email_verified to true for Google OAuth", async () => {
            const userData = {
                email: "test@gmail.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "google",
                oauth_id: "google-789",
                name: "Google User",
            }

            const mockUser: OAuthUser = {
                id: "user-789",
                ...userData,
                picture: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.queryOne).mockResolvedValue(mockUser)

            const result = await createOAuthUser(userData)

            expect(result.email_verified).toBe(true)
        })

        it("should set email_verified to false for Facebook OAuth", async () => {
            const userData = {
                email: "test@example.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "facebook",
                oauth_id: "facebook-101",
                name: "Facebook User",
            }

            const mockUser: OAuthUser = {
                id: "user-101",
                ...userData,
                picture: null,
                email_verified: false,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.queryOne).mockResolvedValue(mockUser)

            const result = await createOAuthUser(userData)

            expect(result.email_verified).toBe(false)
        })

        it("should set email_verified to false for TikTok OAuth", async () => {
            const userData = {
                email: "test@example.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "tiktok",
                oauth_id: "tiktok-202",
                name: "TikTok User",
            }

            const mockUser: OAuthUser = {
                id: "user-202",
                ...userData,
                picture: null,
                email_verified: false,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.queryOne).mockResolvedValue(mockUser)

            const result = await createOAuthUser(userData)

            expect(result.email_verified).toBe(false)
        })

        it("should throw error if required fields are missing", async () => {
            const invalidData = {
                email: "test@example.com",
                // missing password_hash
                oauth_provider: "google",
                oauth_id: "google-999",
                name: "Test User",
            } as any

            await expect(createOAuthUser(invalidData)).rejects.toThrow(
                "Missing required fields"
            )
        })

        it("should throw error if oauth_provider is invalid", async () => {
            const invalidData = {
                email: "test@example.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "invalid-provider",
                oauth_id: "invalid-123",
                name: "Test User",
            }

            await expect(createOAuthUser(invalidData)).rejects.toThrow(
                "Invalid oauth_provider"
            )
        })

        it("should throw error if database operation fails", async () => {
            const userData = {
                email: "test@example.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "google",
                oauth_id: "google-error",
                name: "Test User",
            }

            vi.mocked(db.queryOne).mockRejectedValue(
                new Error("Database error")
            )

            await expect(createOAuthUser(userData)).rejects.toThrow(
                "Database error"
            )
        })
    })

    describe("getUserByEmail", () => {
        it("should retrieve user by email", async () => {
            const mockUser: OAuthUser = {
                id: "user-123",
                email: "test@example.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "Test User",
                picture: "https://example.com/photo.jpg",
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.queryOne).mockResolvedValue(mockUser)

            const result = await getUserByEmail("test@example.com")

            expect(result).toEqual(mockUser)
            expect(db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining("WHERE email = $1"),
                ["test@example.com"]
            )
        })

        it("should return null if user not found", async () => {
            vi.mocked(db.queryOne).mockResolvedValue(null)

            const result = await getUserByEmail("nonexistent@example.com")

            expect(result).toBeNull()
        })

        it("should throw error if database operation fails", async () => {
            vi.mocked(db.queryOne).mockRejectedValue(
                new Error("Database error")
            )

            await expect(getUserByEmail("test@example.com")).rejects.toThrow(
                "Database error"
            )
        })
    })

    describe("getUserByOAuthId", () => {
        it("should retrieve user by OAuth ID", async () => {
            const mockUser: OAuthUser = {
                id: "user-456",
                email: "test@example.com",
                password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
                oauth_provider: "facebook",
                oauth_id: "facebook-456",
                name: "Test User",
                picture: null,
                email_verified: false,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.queryOne).mockResolvedValue(mockUser)

            const result = await getUserByOAuthId("facebook", "facebook-456")

            expect(result).toEqual(mockUser)
            expect(db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining(
                    "WHERE oauth_provider = $1 AND oauth_id = $2"
                ),
                ["facebook", "facebook-456"]
            )
        })

        it("should return null if user not found", async () => {
            vi.mocked(db.queryOne).mockResolvedValue(null)

            const result = await getUserByOAuthId("google", "nonexistent-id")

            expect(result).toBeNull()
        })

        it("should throw error if required fields are missing", async () => {
            await expect(getUserByOAuthId("", "oauth-id")).rejects.toThrow(
                "Missing required fields"
            )
            await expect(getUserByOAuthId("google", "")).rejects.toThrow(
                "Missing required fields"
            )
        })

        it("should throw error if database operation fails", async () => {
            vi.mocked(db.queryOne).mockRejectedValue(
                new Error("Database error")
            )

            await expect(
                getUserByOAuthId("google", "google-123")
            ).rejects.toThrow("Database error")
        })
    })

    describe("updateUserPassword", () => {
        it("should update user password", async () => {
            const mockUser: OAuthUser = {
                id: "user-789",
                email: "test@example.com",
                password_hash: "$2b$12$newpasswordhash123456789",
                oauth_provider: "google",
                oauth_id: "google-789",
                name: "Test User",
                picture: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.queryOne).mockResolvedValue(mockUser)

            const result = await updateUserPassword(
                "user-789",
                "$2b$12$newpasswordhash123456789"
            )

            expect(result).toEqual(mockUser)
            expect(db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE users"),
                ["$2b$12$newpasswordhash123456789", "user-789"]
            )
        })

        it("should throw error if user not found", async () => {
            vi.mocked(db.queryOne).mockResolvedValue(null)

            await expect(
                updateUserPassword("nonexistent-id", "$2b$12$hash")
            ).rejects.toThrow("User not found or failed to update password")
        })

        it("should throw error if required fields are missing", async () => {
            await expect(updateUserPassword("", "$2b$12$hash")).rejects.toThrow(
                "Missing required fields"
            )
            await expect(updateUserPassword("user-id", "")).rejects.toThrow(
                "Missing required fields"
            )
        })

        it("should throw error if database operation fails", async () => {
            vi.mocked(db.queryOne).mockRejectedValue(
                new Error("Database error")
            )

            await expect(
                updateUserPassword("user-123", "$2b$12$hash")
            ).rejects.toThrow("Database error")
        })
    })
})
