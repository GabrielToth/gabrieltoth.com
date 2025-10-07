import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => {
        const t = (k: string) => k
        ;(t as any).raw = (k: string) => {
            if (k === "pricing.plans") {
                return [
                    {
                        name: "P1",
                        basePrice: 100,
                        description: "d",
                        features: ["f1"],
                    },
                ]
            }
            return []
        }
        return t as any
    },
}))

describe("[locale]/pc-optimization page executes", () => {
    it("imports default export and generateMetadata", async () => {
        const mod = await import("@/app/[locale]/pc-optimization/page")
        expect(mod.default).toBeTruthy()
        expect(mod.generateMetadata).toBeTruthy()
    })

    it("executes default export with params", async () => {
        const mod = await import("@/app/[locale]/pc-optimization/page")
        const tree = await mod.default({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(tree).toBeTruthy()
    })
})
