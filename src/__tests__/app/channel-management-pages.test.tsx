import { describe, expect, it } from "vitest"

describe("channel-management app pages imports", () => {
    it("imports main page file", async () => {
        const mod = await import("@/app/[locale]/channel-management/page")
        expect(mod).toBeTruthy()
    }, 20000)
    it("imports related modules", async () => {
        const mods = await Promise.all([
            import("@/app/[locale]/channel-management/channel-management-calculate-price"),
            import("@/app/[locale]/channel-management/channel-management-metadata"),
            import("@/app/[locale]/channel-management/channel-management-section-types"),
            import("@/app/[locale]/channel-management/channel-management-structured"),
            import("@/app/[locale]/channel-management/channel-management-types"),
            import("@/app/[locale]/channel-management/channel-management-view"),
        ])
        expect(mods.length).toBe(6)
    })
})
