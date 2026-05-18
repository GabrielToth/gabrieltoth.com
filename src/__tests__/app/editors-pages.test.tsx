import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/layout/footer", () => ({ default: () => null }))
vi.mock("@/components/seo/structured-data", () => ({ default: () => null }))

describe("editors app pages imports", () => {
    it("imports page and modules", async () => {
        const mods = await Promise.all([
            import("@/app/[locale]/editors/page"),
            import("@/app/[locale]/editors/editors-card"),
            import("@/app/[locale]/editors/editors-form"),
            import("@/app/[locale]/editors/editors-metadata"),
            import("@/app/[locale]/editors/editors-structured"),
            import("@/app/[locale]/editors/editors-types"),
            import("@/app/[locale]/editors/editors-view"),
            import("@/app/[locale]/editors/editors-whatsapp"),
        ])
        expect(mods.length).toBe(8)
    }, 60_000)
})
