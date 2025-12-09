import { describe, expect, it, vi } from "vitest"

describe("root-level redirects execute permanentRedirect", () => {
    it("/channel-management redirects", async () => {
        vi.resetModules()
        vi.doMock("next/navigation", () => ({
            permanentRedirect: () => {
                throw new Error("REDIRECT")
            },
        }))
        const mod = await import("@/app/channel-management/page")
        expect(() => mod.default()).toThrowError("REDIRECT")
    })

    it("/editors redirects", async () => {
        vi.resetModules()
        vi.doMock("next/navigation", () => ({
            permanentRedirect: () => {
                throw new Error("REDIRECT")
            },
        }))
        const mod = await import("@/app/editors/page")
        expect(() => mod.default()).toThrowError("REDIRECT")
    })

    it("/pc-optimization redirects", async () => {
        vi.resetModules()
        vi.doMock("next/navigation", () => ({
            permanentRedirect: () => {
                throw new Error("REDIRECT")
            },
        }))
        const mod = await import("@/app/pc-optimization/page")
        expect(() => mod.default()).toThrowError("REDIRECT")
    })

    it("/privacy-policy redirects", async () => {
        vi.resetModules()
        vi.doMock("next/navigation", () => ({
            permanentRedirect: () => {
                throw new Error("REDIRECT")
            },
        }))
        const mod = await import("@/app/privacy-policy/page")
        expect(() => mod.default()).toThrowError("REDIRECT")
    })

    it("/terms-of-service redirects", async () => {
        vi.resetModules()
        vi.doMock("next/navigation", () => ({
            permanentRedirect: () => {
                throw new Error("REDIRECT")
            },
        }))
        const mod = await import("@/app/terms-of-service/page")
        expect(() => mod.default()).toThrowError("REDIRECT")
    })
})
