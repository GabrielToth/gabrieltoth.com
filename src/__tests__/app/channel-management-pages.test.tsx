import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/layout/footer", () => ({
    default: () => null,
}))
vi.mock("@/components/seo/structured-data", () => ({
    default: () => null,
}))
vi.mock("@/components/ui/breadcrumbs", () => ({
    default: () => null,
}))

describe("channel-management app pages imports", () => {
    it("imports main page file", async () => {
        const mod = await import("@/app/[locale]/channel-management/page")
        expect(mod).toBeTruthy()
    }, 60_000)

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
    }, 60_000)
})
