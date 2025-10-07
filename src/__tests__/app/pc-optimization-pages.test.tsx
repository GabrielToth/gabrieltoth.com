import { describe, expect, it } from "vitest"

describe("pc-optimization app pages imports", () => {
    it("imports page and modules", async () => {
        const mods = await Promise.all([
            import("@/app/[locale]/pc-optimization/page"),
            import(
                "@/app/[locale]/pc-optimization/pc-optimization-breadcrumbs"
            ),
            import("@/app/[locale]/pc-optimization/pc-optimization-metadata"),
            import("@/app/[locale]/pc-optimization/pc-optimization-structured"),
            import("@/app/[locale]/pc-optimization/pc-optimization-types"),
            import("@/app/[locale]/pc-optimization/pc-optimization-view"),
            import("@/app/[locale]/pc-optimization/pc-optimization-whatsapp"),
            import("@/app/[locale]/pc-optimization/terms/page"),
            import("@/app/[locale]/pc-optimization/terms/terms-metadata"),
        ])
        expect(mods.length).toBe(9)
    })
})
