/**
 * useAuth Hook Tests
 * Unit tests for the useAuth custom hook
 *
 * Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAuth } from "./use-auth"

// Mock logger
vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}))

// Mock fetch
global.fetch = vi.fn()

describe("useAuth Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(global.fetch as any).mockClear()
        ;(global.fetch as any).mockReset()
    })

    it("returns initial loading state", () => {
        ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: null }),
        })

        const { result } = renderHook(() => useAuth())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
    })

    it("fetches user data on mount", async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    id: "user-123",
                    google_email: "user@example.com",
                    google_name: "Test User",
                    google_picture: "https://example.com/pic.jpg",
                },
            }),
        })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/auth/me",
            expect.objectContaining({
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
        )
    })

    it("returns user data when authenticated", async () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
        }

        ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: userData,
            }),
        })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.user).toEqual(userData)
        expect(result.current.isAuthenticated).toBe(true)
    })

    it("returns null user when not authenticated", async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
    })

    it("handles fetch errors", async () => {
        ;(global.fetch as any).mockRejectedValueOnce(new Error("Network error"))

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.user).toBeNull()
        expect(result.current.error).toBeTruthy()
        expect(result.current.isAuthenticated).toBe(false)
    })

    it("provides logout function", async () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
        }

        ;(global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: userData,
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.logout).toBeDefined()
        expect(typeof result.current.logout).toBe("function")
    })

    it("logout function calls /api/auth/logout", async () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
        }

        ;(global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: userData,
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        await result.current.logout()

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/auth/logout",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })
        )
    })

    it("clears user data after logout", async () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
        }

        let callCount = 0
        ;(global.fetch as any).mockImplementation(async (url: string) => {
            callCount++
            if (callCount === 1) {
                // First call - /api/auth/me
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: userData,
                    }),
                }
            } else {
                // Second call - /api/auth/logout
                return {
                    ok: true,
                    json: async () => ({ success: true }),
                }
            }
        })

        const { result } = renderHook(() => useAuth())

        // Wait for user to be loaded
        await waitFor(() => {
            expect(result.current.user).toEqual(userData)
        })

        await result.current.logout()

        // Wait for user to be cleared
        await waitFor(() => {
            expect(result.current.user).toBeNull()
        })

        expect(result.current.isAuthenticated).toBe(false)
    })

    it("handles logout errors", async () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
        }

        let callCount = 0
        ;(global.fetch as any).mockImplementation(async (url: string) => {
            callCount++
            if (callCount === 1) {
                // First call - /api/auth/me
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: userData,
                    }),
                }
            } else {
                // Second call - /api/auth/logout (fails)
                return {
                    ok: false,
                    json: async () => ({ error: "Logout failed" }),
                }
            }
        })

        const { result } = renderHook(() => useAuth())

        // Wait for user to be loaded
        await waitFor(() => {
            expect(result.current.user).toEqual(userData)
        })

        await expect(result.current.logout()).rejects.toThrow()
    })
})
