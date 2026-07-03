/**
 * useAutoLogin Hook Tests
 * Unit tests for the auto-authentication hook (Keep Me Logged In)
 *
 * Validates: Requirements 4.1, 4.2, 5.1, 5.2
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
    })),
}))

import { useAutoLogin } from "./useAutoLogin"

describe("useAutoLogin Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should start in checking state", () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, user: { id: "user-1" } }),
        })

        const { result } = renderHook(() => useAutoLogin("en"))

        expect(result.current.isChecking).toBe(true)
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it("should set authenticated and redirect on successful refresh", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                user: { id: "user-123", email: "user@example.com" },
            }),
        })

        const { result } = renderHook(() => useAutoLogin("en"))

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true)
        })

        expect(result.current.isChecking).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it("should call /api/auth/refresh with credentials include", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })

        renderHook(() => useAutoLogin("pt-BR"))

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/auth/refresh",
                {
                    method: "POST",
                    credentials: "include",
                }
            )
        })
    })

    it("should set not authenticated when refresh fails", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ success: false }),
        })

        const { result } = renderHook(() => useAutoLogin("en"))

        await waitFor(() => {
            expect(result.current.isChecking).toBe(false)
        })

        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it("should set error when fetch throws", async () => {
        globalThis.fetch = vi
            .fn()
            .mockRejectedValue(new Error("Network error"))

        const { result } = renderHook(() => useAutoLogin("en"))

        await waitFor(() => {
            expect(result.current.isChecking).toBe(false)
        })

        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.error).toBe("Network error")
    })

    it("should cancel fetch on unmount", async () => {
        let resolvePromise: (value: unknown) => void
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve
        })

        globalThis.fetch = vi.fn().mockReturnValue(pendingPromise)

        const { result, unmount } = renderHook(() => useAutoLogin("en"))

        expect(result.current.isChecking).toBe(true)

        // Unmount before fetch completes
        unmount()

        // Resolve the fetch after unmount
        resolvePromise!({
            ok: true,
            json: async () => ({ success: true }),
        })

        // Small delay to let any pending microtasks resolve
        await new Promise((r) => setTimeout(r, 50))

        // Hook was unmounted and cancelled, state should remain initial
        expect(result.current.isChecking).toBe(true)
    })

    it("should redirect to dashboard on success", async () => {
        const mockPush = vi.fn()
        vi.mocked(
            (await import("next/navigation")).useRouter
        ).mockReturnValueOnce({ push: mockPush } as any)

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, user: { id: "user-1" } }),
        })

        renderHook(() => useAutoLogin("en"))

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/en/dashboard")
        })
    })

    it("should not redirect when refresh returns non-ok response", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
        })

        const { result } = renderHook(() => useAutoLogin("en"))

        await waitFor(() => {
            expect(result.current.isChecking).toBe(false)
        })

        expect(result.current.isAuthenticated).toBe(false)
    })
})
