/**
 * Unit tests for Authentication Middleware
 */

import { db } from "@/lib/db"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getAuthenticatedUser, validateSession } from "./auth-middleware"

vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(),
    },
}))

describe("Authentication Middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("validateSession", () => {
        it("should return session if valid", async () => {
            const mockSession = {
                user_id: "123",
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            ;(db.queryOne as any).mockResolvedValueOnce(mockSession)

            const result = await validateSession("valid-token")

            expect(result).toEqual(mockSession)
        })

        it("should return null if session not found", async () => {
            ;(db.queryOne as any).mockResolvedValueOnce(null)

            const result = await validateSession("invalid-token")

            expect(result).toBeNull()
        })

        it("should return null if session is expired", async () => {
            const mockSession = {
                user_id: "123",
                expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
            }

            ;(db.queryOne as any).mockResolvedValueOnce(mockSession)

            const result = await validateSession("expired-token")

            expect(result).toBeNull()
        })

        it("should handle database errors gracefully", async () => {
            ;(db.queryOne as any).mockRejectedValueOnce(
                new Error("Database error")
            )

            const result = await validateSession("token")

            expect(result).toBeNull()
        })
    })

    describe("getAuthenticatedUser", () => {
        it("should return user ID if authenticated", async () => {
            const mockSession = {
                user_id: "123",
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            ;(db.queryOne as any).mockResolvedValueOnce(mockSession)

            // Mock NextRequest
            const mockRequest = {
                cookies: {
                    get: vi.fn((name: string) => {
                        if (name === "session") {
                            return { value: "valid-token" }
                        }
                        return undefined
                    }),
                },
            } as any

            const result = await getAuthenticatedUser(mockRequest)

            expect(result).toBe("123")
        })

        it("should return null if no session cookie", async () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn(() => undefined),
                },
            } as any

            const result = await getAuthenticatedUser(mockRequest)

            expect(result).toBeNull()
        })

        it("should return null if session is invalid", async () => {
            ;(db.queryOne as any).mockResolvedValueOnce(null)

            const mockRequest = {
                cookies: {
                    get: vi.fn((name: string) => {
                        if (name === "session") {
                            return { value: "invalid-token" }
                        }
                        return undefined
                    }),
                },
            } as any

            const result = await getAuthenticatedUser(mockRequest)

            expect(result).toBeNull()
        })
    })
})
