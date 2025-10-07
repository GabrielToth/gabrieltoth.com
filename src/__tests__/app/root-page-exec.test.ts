import { describe, expect, it, vi } from "vitest"

describe("root page executes redirect", () => {
    it("calls permanentRedirect and throws", async () => {
        vi.resetModules()
        vi.doMock("next/navigation", () => ({
            permanentRedirect: () => {
                throw new Error("REDIRECT")
            },
        }))

        const mod = await import("@/app/page")
        expect(() => mod.default()).toThrowError("REDIRECT")
    })
})
