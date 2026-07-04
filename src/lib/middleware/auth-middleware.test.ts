import { describe, expect, it, vi } from "vitest"
import { authMiddleware, getAuthenticatedUser } from "./auth-middleware"

const validToken =
    "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"

describe("authMiddleware", () => {
    it("should return null if session cookie exists", async () => {
        const mockRequest = {
            cookies: {
                get: vi.fn((name: string) => {
                    if (name === "auth_session") {
                        return { value: validToken }
                    }
                    return undefined
                }),
            },
        } as any

        const result = await authMiddleware(mockRequest)
        expect(result).toBeNull()
    })

    it("should redirect to /auth/login if no session cookie", async () => {
        const mockRequest = {
            cookies: {
                get: vi.fn(() => undefined),
            },
            url: "http://localhost:3000/dashboard",
        } as any

        const result = await authMiddleware(mockRequest)
        expect(result).toBeInstanceOf(Response)
        expect(result?.status).toBe(302)
        expect(result?.headers.get("Location")).toBe(
            "http://localhost:3000/en/login"
        )
    })
})

describe("getAuthenticatedUser", () => {
    it("should return partial hash from cookie if authenticated", async () => {
        const mockRequest = {
            cookies: {
                get: vi.fn((name: string) => {
                    if (name === "auth_session") {
                        return { value: validToken }
                    }
                    return undefined
                }),
            },
        } as any

        const result = await getAuthenticatedUser(mockRequest)
        expect(result).toBe(validToken.substring(0, 8))
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

    it("should return null for invalid token format", async () => {
        const mockRequest = {
            cookies: {
                get: vi.fn((name: string) => {
                    if (name === "auth_session") {
                        return { value: "invalid-token-format" }
                    }
                    return undefined
                }),
            },
        } as any

        const result = await getAuthenticatedUser(mockRequest)
        expect(result).toBeNull()
    })
})
