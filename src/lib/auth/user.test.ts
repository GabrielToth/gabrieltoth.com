/**
 * User Management Tests
 * Tests for user creation and updates via Google OAuth
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import * as db from "@/lib/db"
import { GoogleUserData, User } from "@/types/auth"
import { fc } from "@fast-check/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    getUserByEmail,
    getUserByGoogleId,
    getUserById,
    upsertUser,
} from "./user"

// Mock the database module
vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(),
    },
}))

// Mock the logger module
vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
    },
}))

describe("User Management", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("upsertUser()", () => {
        describe("Unit Tests", () => {
            it("should create a new user when google_id does not exist", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "John Doe",
                    google_picture: "https://example.com/photo.jpg",
                }

                const expectedUser: User = {
                    id: "user-id-1",
                    google_id: googleData.google_id,
                    google_email: googleData.google_email,
                    google_name: googleData.google_name,
                    google_picture: googleData.google_picture,
                    created_at: new Date(),
                    updated_at: new Date(),
                }

                // Mock: user does not exist
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)
                // Mock: user created
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedUser)

                const result = await upsertUser(googleData)

                expect(result).toEqual(expectedUser)
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(2)
            })

            it("should return existing user when google_id exists and profile unchanged", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "John Doe",
                    google_picture: "https://example.com/photo.jpg",
                }

                const existingUser: User = {
                    id: "user-id-1",
                    google_id: googleData.google_id,
                    google_email: googleData.google_email,
                    google_name: googleData.google_name,
                    google_picture: googleData.google_picture,
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                }

                // Mock: user exists
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(existingUser)

                const result = await upsertUser(googleData)

                expect(result).toEqual(existingUser)
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(1)
            })

            it("should update user when google_name changes", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "Jane Doe", // Changed name
                    google_picture: "https://example.com/photo.jpg",
                }

                const existingUser: User = {
                    id: "user-id-1",
                    google_id: googleData.google_id,
                    google_email: googleData.google_email,
                    google_name: "John Doe", // Old name
                    google_picture: googleData.google_picture,
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                }

                const updatedUser: User = {
                    ...existingUser,
                    google_name: googleData.google_name,
                    updated_at: new Date(),
                }

                // Mock: user exists
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(existingUser)
                // Mock: user updated
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(updatedUser)

                const result = await upsertUser(googleData)

                expect(result.google_name).toBe("Jane Doe")
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(2)
            })

            it("should update user when google_picture changes", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "John Doe",
                    google_picture: "https://example.com/new-photo.jpg", // Changed picture
                }

                const existingUser: User = {
                    id: "user-id-1",
                    google_id: googleData.google_id,
                    google_email: googleData.google_email,
                    google_name: googleData.google_name,
                    google_picture: "https://example.com/old-photo.jpg", // Old picture
                    created_at: new Date("2024-01-01"),
                    updated_at: new Date("2024-01-01"),
                }

                const updatedUser: User = {
                    ...existingUser,
                    google_picture: googleData.google_picture,
                    updated_at: new Date(),
                }

                // Mock: user exists
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(existingUser)
                // Mock: user updated
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(updatedUser)

                const result = await upsertUser(googleData)

                expect(result.google_picture).toBe(
                    "https://example.com/new-photo.jpg"
                )
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(2)
            })

            it("should handle missing google_picture (nullable field)", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "John Doe",
                    // google_picture is undefined
                }

                const expectedUser: User = {
                    id: "user-id-1",
                    google_id: googleData.google_id,
                    google_email: googleData.google_email,
                    google_name: googleData.google_name,
                    google_picture: undefined,
                    created_at: new Date(),
                    updated_at: new Date(),
                }

                // Mock: user does not exist
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)
                // Mock: user created
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedUser)

                const result = await upsertUser(googleData)

                expect(result.google_picture).toBeUndefined()
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(2)
            })

            it("should throw error when google_id is missing", async () => {
                const googleData: GoogleUserData = {
                    google_id: "", // Empty google_id
                    google_email: "user@example.com",
                    google_name: "John Doe",
                }

                await expect(upsertUser(googleData)).rejects.toThrow(
                    "Missing required Google user data"
                )
            })

            it("should throw error when google_email is missing", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "", // Empty email
                    google_name: "John Doe",
                }

                await expect(upsertUser(googleData)).rejects.toThrow(
                    "Missing required Google user data"
                )
            })

            it("should throw error when google_name is missing", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "", // Empty name
                }

                await expect(upsertUser(googleData)).rejects.toThrow(
                    "Missing required Google user data"
                )
            })

            it("should throw error when database query fails on check", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "John Doe",
                }

                // Mock: database error
                vi.mocked(db.db.queryOne).mockRejectedValueOnce(
                    new Error("Database connection failed")
                )

                await expect(upsertUser(googleData)).rejects.toThrow(
                    "Database connection failed"
                )
            })

            it("should throw error when user creation fails", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "John Doe",
                }

                // Mock: user does not exist
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)
                // Mock: creation returns null (failure)
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

                await expect(upsertUser(googleData)).rejects.toThrow(
                    "Failed to create user"
                )
            })

            it("should throw error when user update fails", async () => {
                const googleData: GoogleUserData = {
                    google_id: "123456789",
                    google_email: "user@example.com",
                    google_name: "Jane Doe",
                }

                const existingUser: User = {
                    id: "user-id-1",
                    google_id: googleData.google_id,
                    google_email: googleData.google_email,
                    google_name: "John Doe",
                    google_picture: undefined,
                    created_at: new Date(),
                    updated_at: new Date(),
                }

                // Mock: user exists
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(existingUser)
                // Mock: update returns null (failure)
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

                await expect(upsertUser(googleData)).rejects.toThrow(
                    "Failed to update user"
                )
            })
        })

        describe("Property-Based Tests", () => {
            it("Property 2: User Creation on First Login - For any new Google user, system creates user with all required fields", async () => {
                /**
                 * **Validates: Requirements 2.1, 2.2, 2.3**
                 *
                 * Property: For any new Google user logging in for the first time,
                 * the system SHALL create a new user record with all required fields
                 * (google_id, google_email, google_name, google_picture).
                 */
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            google_id: fc.string({ minLength: 1 }),
                            google_email: fc.emailAddress(),
                            google_name: fc.string({ minLength: 1 }),
                            google_picture: fc.option(fc.webUrl()),
                        }),
                        async googleData => {
                            const expectedUser: User = {
                                id: "user-id",
                                google_id: googleData.google_id,
                                google_email: googleData.google_email,
                                google_name: googleData.google_name,
                                google_picture:
                                    googleData.google_picture || undefined,
                                created_at: new Date(),
                                updated_at: new Date(),
                            }

                            // Mock: user does not exist
                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                null
                            )
                            // Mock: user created
                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                expectedUser
                            )

                            const result = await upsertUser(googleData)

                            // Verify all required fields are present
                            expect(result.google_id).toBe(googleData.google_id)
                            expect(result.google_email).toBe(
                                googleData.google_email
                            )
                            expect(result.google_name).toBe(
                                googleData.google_name
                            )
                            expect(result.id).toBeDefined()
                            expect(result.created_at).toBeDefined()
                            expect(result.updated_at).toBeDefined()

                            vi.clearAllMocks()
                        }
                    ),
                    { numRuns: 50 }
                )
            })

            it("Property 3: User Update on Subsequent Login - For any existing user, system updates profile if changed", async () => {
                /**
                 * **Validates: Requirements 2.4, 2.5**
                 *
                 * Property: For any existing user logging in again, if their Google
                 * profile data (name or picture) has changed, the system SHALL update
                 * the user record with the new data.
                 */
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            google_id: fc.string({ minLength: 1 }),
                            google_email: fc.emailAddress(),
                            old_name: fc.string({ minLength: 1 }),
                            new_name: fc.string({ minLength: 1 }),
                            old_picture: fc.option(fc.webUrl()),
                            new_picture: fc.option(fc.webUrl()),
                        }),
                        async ({
                            google_id,
                            google_email,
                            old_name,
                            new_name,
                            old_picture,
                            new_picture,
                        }) => {
                            // Skip if nothing changed
                            if (
                                old_name === new_name &&
                                old_picture === new_picture
                            )
                                return

                            const googleData: GoogleUserData = {
                                google_id,
                                google_email,
                                google_name: new_name,
                                google_picture: new_picture || undefined,
                            }

                            const existingUser: User = {
                                id: "user-id",
                                google_id,
                                google_email,
                                google_name: old_name,
                                google_picture: old_picture || undefined,
                                created_at: new Date("2024-01-01"),
                                updated_at: new Date("2024-01-01"),
                            }

                            const updatedUser: User = {
                                ...existingUser,
                                google_name: new_name,
                                google_picture: new_picture || undefined,
                                updated_at: new Date(),
                            }

                            // Mock: user exists
                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                existingUser
                            )
                            // Mock: user updated
                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                updatedUser
                            )

                            const result = await upsertUser(googleData)

                            // Verify profile was updated
                            expect(result.google_name).toBe(new_name)
                            expect(result.google_picture).toBe(
                                new_picture || undefined
                            )
                            // Verify user ID remains the same
                            expect(result.id).toBe(existingUser.id)

                            vi.clearAllMocks()
                        }
                    ),
                    { numRuns: 50 }
                )
            })

            it("should maintain unique google_id constraint for any user", async () => {
                /**
                 * Property: For any user in the database, the google_id SHALL be unique,
                 * ensuring that each Google account is associated with exactly one user record.
                 *
                 * **Validates: Requirements 3.4**
                 */
                await fc.assert(
                    fc.asyncProperty(
                        fc.string({ minLength: 1 }),
                        async google_id => {
                            const googleData1: GoogleUserData = {
                                google_id,
                                google_email: "user1@example.com",
                                google_name: "User One",
                            }

                            const googleData2: GoogleUserData = {
                                google_id, // Same google_id
                                google_email: "user1@example.com", // Same email
                                google_name: "User One Updated", // Updated name
                            }

                            const user1: User = {
                                id: "user-id-1",
                                google_id,
                                google_email: googleData1.google_email,
                                google_name: googleData1.google_name,
                                created_at: new Date(),
                                updated_at: new Date(),
                            }

                            const user1Updated: User = {
                                ...user1,
                                google_name: googleData2.google_name,
                                updated_at: new Date(),
                            }

                            // First upsert: create user
                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                null
                            )
                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                user1
                            )

                            const result1 = await upsertUser(googleData1)
                            expect(result1.google_id).toBe(google_id)

                            // Second upsert: should find existing user and update
                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                user1
                            )
                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                user1Updated
                            )

                            const result2 = await upsertUser(googleData2)
                            expect(result2.google_id).toBe(google_id)
                            expect(result2.id).toBe(user1.id) // Same user

                            vi.clearAllMocks()
                        }
                    ),
                    { numRuns: 50 }
                )
            })
        })
    })

    describe("getUserById()", () => {
        it("should return user when found", async () => {
            const userId = "user-id-1"
            const expectedUser: User = {
                id: userId,
                google_id: "123456789",
                google_email: "user@example.com",
                google_name: "John Doe",
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedUser)

            const result = await getUserById(userId)

            expect(result).toEqual(expectedUser)
        })

        it("should return null when user not found", async () => {
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await getUserById("non-existent-id")

            expect(result).toBeNull()
        })
    })

    describe("getUserByGoogleId()", () => {
        it("should return user when found", async () => {
            const googleId = "123456789"
            const expectedUser: User = {
                id: "user-id-1",
                google_id: googleId,
                google_email: "user@example.com",
                google_name: "John Doe",
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedUser)

            const result = await getUserByGoogleId(googleId)

            expect(result).toEqual(expectedUser)
        })

        it("should return null when user not found", async () => {
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await getUserByGoogleId("non-existent-id")

            expect(result).toBeNull()
        })
    })

    describe("getUserByEmail()", () => {
        it("should return user when found", async () => {
            const email = "user@example.com"
            const expectedUser: User = {
                id: "user-id-1",
                google_id: "123456789",
                google_email: email,
                google_name: "John Doe",
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedUser)

            const result = await getUserByEmail(email)

            expect(result).toEqual(expectedUser)
        })

        it("should return null when user not found", async () => {
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await getUserByEmail("non-existent@example.com")

            expect(result).toBeNull()
        })
    })
})
