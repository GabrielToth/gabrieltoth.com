import { describe, expect, it } from "vitest"

describe("root app pages imports", () => {
    it("imports top-level pages", async () => {
        const mods = await Promise.all([
            import("@/app/channel-management/page"),
            import("@/app/editors/page"),
            import("@/app/pc-optimization/page"),
            import("@/app/privacy-policy/page"),
            import("@/app/terms-of-service/page"),
        ])
        expect(mods.length).toBe(5)
    })
})
