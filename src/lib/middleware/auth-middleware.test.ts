import { describe, expect, it, vi } from "vitest"
import { authMiddleware, getAuthenticatedUser } from "./auth-middleware"

describe("authMiddleware", () => {
    it("should return null if session cookie exists", async () => {
        const mockRequest = {
            cookies: {
                get: vi.fn((name: string) => {
                    if (name === "session") {
                        return { value: "token" }
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
            "http://localhost:3000/auth/login"
        )
    })
})

describe("getAuthenticatedUser", () => {
    it("should return user ID from cookie if authenticated", async () => {
        const mockRequest = {
            cookies: {
                get: vi.fn((name: string) => {
                    if (name === "session") {
                        return { value: "user_123:random-token" }
                    }
                    return undefined
                }),
            },
        } as any

        const result = await getAuthenticatedUser(mockRequest)
        expect(result).toBe("user_123")
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

    it("should return the full cookie value if no colon separator", async () => {
        const mockRequest = {
            cookies: {
                get: vi.fn((name: string) => {
                    if (name === "session") {
                        return { value: "simple-token" }
                    }
                    return undefined
                }),
            },
        } as any

        const result = await getAuthenticatedUser(mockRequest)
        expect(result).toBe("simple-token")
    })
})
