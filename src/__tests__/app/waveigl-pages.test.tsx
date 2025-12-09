import { describe, expect, it } from "vitest"

describe("waveigl-support app pages imports", () => {
    it("imports waveigl pages and modules", async () => {
        const mods = await Promise.all([
            import("@/app/[locale]/waveigl-support/page"),
            import("@/app/[locale]/waveigl-support/waveigl-support-breadcrumbs"),
            import("@/app/[locale]/waveigl-support/waveigl-support-client-page"),
            import("@/app/[locale]/waveigl-support/waveigl-support-metadata"),
            import("@/app/[locale]/waveigl-support/waveigl-support-types"),
            import("@/app/[locale]/waveigl-support/waveigl-support-view"),
        ])
        expect(mods.length).toBe(6)
    })
})
