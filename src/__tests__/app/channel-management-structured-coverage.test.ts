import { describe, expect, it, vi } from "vitest"

// Mock i18n server getTranslations
vi.mock("next-intl/server", () => {
    return {
        getTranslations: async ({ namespace }: any) => {
            const t = (key: string) => key
            ;(t as any).raw = (key: string) => {
                if (key === "faq.items") {
                    return [
                        { question: "Q1", answer: "A1" },
                        { question: "Q2", answer: "A2" },
                    ]
                }
                if (key === "pricing.plans") {
                    return [
                        {
                            name: "Express",
                            basePrice: 497,
                            description: "desc",
                            features: ["f1"],
                            popular: true,
                        },
                    ]
                }
                return []
            }
            return t as any
        },
    }
})

describe("channel-management structured coverage", () => {
    it("builds structured objects with locale-specific urls and currency", async () => {
        const { buildChannelManagementStructured } = await import(
            "@/app/[locale]/channel-management/channel-management-structured"
        )
        const { serviceStructuredData, faqs, breadcrumbs, offerCatalog } =
            await buildChannelManagementStructured("pt-BR" as any)
        expect(String(serviceStructuredData["url"])).toContain(
            "https://www.gabrieltoth.com/pt-BR/channel-management"
        )
        expect(faqs.length).toBeGreaterThan(0)
        expect(breadcrumbs[0].url).toBe("https://www.gabrieltoth.com/pt-BR")
        expect((offerCatalog as any).itemListElement?.[0]?.priceCurrency).toBe(
            "BRL"
        )
    })

    it("handles EN locale (no prefix) and USD currency", async () => {
        const { buildChannelManagementStructured } = await import(
            "@/app/[locale]/channel-management/channel-management-structured"
        )
        const { serviceStructuredData, breadcrumbs, offerCatalog } =
            await buildChannelManagementStructured("en" as any)
        expect(String(serviceStructuredData["url"])).toBe(
            "https://www.gabrieltoth.com/channel-management"
        )
        expect(breadcrumbs[0].url).toBe("https://www.gabrieltoth.com")
        expect((offerCatalog as any).itemListElement?.[0]?.priceCurrency).toBe(
            "USD"
        )
    })

    it("maps ES locale to EUR currency and prefixed urls", async () => {
        const { buildChannelManagementStructured } = await import(
            "@/app/[locale]/channel-management/channel-management-structured"
        )
        const { serviceStructuredData, breadcrumbs, offerCatalog } =
            await buildChannelManagementStructured("es" as any)
        expect(String(serviceStructuredData["url"])).toContain(
            "/es/channel-management"
        )
        expect(breadcrumbs[0].url).toBe("https://www.gabrieltoth.com/es")
        expect((offerCatalog as any).itemListElement?.[0]?.priceCurrency).toBe(
            "EUR"
        )
    })

    it("maps DE locale to EUR currency and prefixed urls", async () => {
        const { buildChannelManagementStructured } = await import(
            "@/app/[locale]/channel-management/channel-management-structured"
        )
        const { serviceStructuredData, breadcrumbs, offerCatalog } =
            await buildChannelManagementStructured("de" as any)
        expect(String(serviceStructuredData["url"])).toContain(
            "/de/channel-management"
        )
        expect(breadcrumbs[0].url).toBe("https://www.gabrieltoth.com/de")
        expect((offerCatalog as any).itemListElement?.[0]?.priceCurrency).toBe(
            "EUR"
        )
    })

    it("falls back currency to USD for unknown locale", async () => {
        const { buildChannelManagementStructured } = await import(
            "@/app/[locale]/channel-management/channel-management-structured"
        )
        const { offerCatalog } = await buildChannelManagementStructured(
            "fr" as any
        )
        expect((offerCatalog as any).itemListElement?.[0]?.priceCurrency).toBe(
            "USD"
        )
    })
})
