import { describe, expect, it } from "vitest"

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
    })
})
