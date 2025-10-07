import { describe, expect, it } from "vitest"

describe("policy and terms app pages imports", () => {
    it("imports privacy-policy and modules", async () => {
        const mods = await Promise.all([
            import("@/app/[locale]/privacy-policy/page"),
            import("@/app/[locale]/privacy-policy/privacy-policy-metadata"),
            import("@/app/[locale]/privacy-policy/privacy-policy-structured"),
        ])
        expect(mods.length).toBe(3)
    })

    it("imports terms-of-service and modules", async () => {
        const mods = await Promise.all([
            import("@/app/[locale]/terms-of-service/page"),
            import("@/app/[locale]/terms-of-service/terms-of-service-metadata"),
            import(
                "@/app/[locale]/terms-of-service/terms-of-service-structured"
            ),
            import("@/app/[locale]/terms-of-service/terms-of-service-types"),
        ])
        expect(mods.length).toBe(4)
    })
})
