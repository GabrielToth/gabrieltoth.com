import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    return {
        getTranslations: vi.fn().mockResolvedValue(
            Object.assign((k: string) => k, {
                raw: (k: string) => {
                    if (
                        k.endsWith("faq.items") ||
                        k.endsWith("structuredData.faqs")
                    ) {
                        return [{ question: "Q?", answer: "A." }]
                    }
                    if (k.endsWith("sections")) {
                        return [{ title: "T", content: "C" }]
                    }
                    if (k.endsWith("pricing.plans")) {
                        return [
                            {
                                name: "P",
                                basePrice: 10,
                                description: "d",
                                features: ["f"],
                            },
                        ]
                    }
                    return {}
                },
            }) as any
        ),
    }
})

async function ensureSchemasFromStructured(modPath: string) {
    const mod: any = await import(modPath)
    const locales = ["en", "pt-BR", "es", "de"] as const
    for (const locale of locales) {
        const data = await mod.default?.({
            params: Promise.resolve({ locale }),
        })
        // Some structured builders are named builds; import them directly
        const fn =
            mod.buildChannelManagementStructured ||
            mod.buildPCOptimizationStructured ||
            mod.buildPrivacyPolicyStructured ||
            mod.buildTermsOfServiceStructured ||
            mod.buildIQTestStructured

        if (fn) {
            const res = await fn(locale)
            // schemas must exist in either customData/howTo/offerCatalog/webPageStructuredData/jobStructuredData
            const hasAnySchema = Boolean(
                (res as any).howTo ||
                    (res as any).offerCatalog ||
                    (res as any).webPageStructuredData ||
                    (res as any).jobStructuredData ||
                    (res as any).serviceStructuredData
            )
            expect(hasAnySchema).toBe(true)
            // breadcrumbs must exist for service pages
            if ((res as any).breadcrumbs) {
                expect((res as any).breadcrumbs.length).toBeGreaterThan(0)
            }
        }
    }
}

describe("structured data presence on pages", () => {
    it("channel-management structured present", async () => {
        await ensureSchemasFromStructured(
            "@/app/[locale]/channel-management/channel-management-structured"
        )
    })
    it("pc-optimization structured present", async () => {
        await ensureSchemasFromStructured(
            "@/app/[locale]/pc-optimization/pc-optimization-structured"
        )
    })
    it("privacy-policy structured present", async () => {
        await ensureSchemasFromStructured(
            "@/app/[locale]/privacy-policy/privacy-policy-structured"
        )
    })
    it("terms-of-service structured present", async () => {
        await ensureSchemasFromStructured(
            "@/app/[locale]/terms-of-service/terms-of-service-structured"
        )
    })
    it("iq-test structured present", async () => {
        await ensureSchemasFromStructured(
            "@/app/[locale]/iq-test/iq-test-structured"
        )
    })
})
