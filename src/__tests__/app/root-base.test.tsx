import { describe, expect, it, vi } from "vitest"

// Mock next/font/google Geist to avoid function call failure
vi.mock("next/font/google", () => ({
    Geist: () => ({ variable: "--font-geist-sans" }),
    Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}))

describe("root base app files", () => {
    it("imports app/layout, app/not-found, app/page", async () => {
        const mods = await Promise.all([
            import("@/app/layout"),
            import("@/app/not-found"),
            import("@/app/page"),
        ])
        expect(mods.length).toBe(3)
    })
})
