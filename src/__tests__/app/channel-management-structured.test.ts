import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const tFn: any = (k: string) => k
    tFn.raw = (k: string) => {
        if (k === "faq.items") return [{ question: "Q", answer: "A" }]
        if (k === "pricing.plans")
            return [
                {
                    name: "P1",
                    basePrice: 10,
                    description: "D",
                    features: ["F1"],
                },
            ]
        return []
    }
    return { getTranslations: vi.fn().mockResolvedValue(tFn) }
})

describe("buildChannelManagementStructured", () => {
    it("returns structured objects", async () => {
        const mod =
            await import("@/app/[locale]/channel-management/channel-management-structured")
        const res = await mod.buildChannelManagementStructured("en" as any)
        expect(res.faqs[0].question).toBe("Q")
        expect(res.offerCatalog["@type"]).toBe("OfferCatalog")
        expect(Array.isArray(res.breadcrumbs)).toBe(true)
    })

    it("handles breadcrumb names for pt-BR and es", async () => {
        const mod =
            await import("@/app/[locale]/channel-management/channel-management-structured")
        const pt = await mod.buildChannelManagementStructured("pt-BR" as any)
        const es = await mod.buildChannelManagementStructured("es" as any)
        expect(pt.breadcrumbs[0].name).toBeDefined()
        expect(es.breadcrumbs[0].name).toBeDefined()
    })
})
