import { describe, expect, it, vi } from "vitest"

// Mock next-intl/server where imported
vi.mock("next-intl/server", () => ({
    getTranslations: vi
        .fn()
        .mockResolvedValue({ raw: vi.fn().mockReturnValue({}) }),
}))

// Home root page
describe("app pages basic import", () => {
    it("imports root page without executing SSR", async () => {
        const mod = await import("@/app/[locale]/page")
        expect(typeof mod.default).toBe("function")
        expect(mod.generateMetadata).toBeDefined()
    })

    it("imports layout and not-found", async () => {
        const layout = await import("@/app/[locale]/layout")
        const notFound = await import("@/app/[locale]/not-found")
        expect(layout).toBeTruthy()
        expect(notFound).toBeTruthy()
    })
})
