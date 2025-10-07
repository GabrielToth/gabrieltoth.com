import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => {
        const t = (key: string) => key
        ;(t as any).raw = (key: string) => {
            if (key === "pricing.plans") {
                return [
                    {
                        name: "Express",
                        basePrice: 497,
                        description: "desc",
                        features: ["f1", "f2"],
                    },
                ]
            }
            return []
        }
        return t as any
    },
}))

describe("pc-optimization structured coverage", () => {
    it("builds howTo, offerCatalog and breadcrumbs for locales", async () => {
        const { buildPCOptimizationStructured } = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-structured"
        )
        for (const locale of ["en", "pt-BR", "es", "de"] as const) {
            const { howTo, offerCatalog, breadcrumbs } =
                await buildPCOptimizationStructured(locale as any)
            expect(howTo["@type"]).toBe("HowTo")
            expect(
                (offerCatalog as any).itemListElement?.length
            ).toBeGreaterThan(0)
            expect(breadcrumbs[0].url).toContain("/pc-optimization")
        }
    })
})
