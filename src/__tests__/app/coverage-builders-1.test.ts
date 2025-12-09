import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const fakeT: any = (k: string) => k
    fakeT.raw = (key: string) => {
        if (key.includes("faq")) {
            return [{ question: "Q", answer: "A" }]
        }
        if (key.includes("breadcrumbs")) {
            return [{ name: "Home", href: "/" }]
        }
        if (key.includes("pricing.plans")) {
            return [
                {
                    name: "Plan",
                    basePrice: 100,
                    description: "Desc",
                    features: ["F1"],
                    popular: true,
                },
            ]
        }
        if (key.includes("sections")) {
            return [{ title: "T", content: "C" }]
        }
        return []
    }
    return { getTranslations: vi.fn().mockResolvedValue(fakeT) }
})

describe("structured builders coverage", () => {
    it("buildChannelManagementStructured returns objects", async () => {
        const mod =
            await import("@/app/[locale]/channel-management/channel-management-structured")
        const result = await mod.buildChannelManagementStructured("en")
        expect(result.serviceStructuredData).toBeTruthy()
        expect(result.offerCatalog).toBeTruthy()
        expect(result.faqs.length).toBeGreaterThan(0)
        expect(result.breadcrumbs.length).toBeGreaterThan(0)
    })

    it("buildPrivacyPolicyStructured returns objects", async () => {
        const mod =
            await import("@/app/[locale]/privacy-policy/privacy-policy-structured")
        const result = await mod.buildPrivacyPolicyStructured("en")
        expect(result.webPageStructuredData).toBeTruthy()
        expect(result.sections.length).toBeGreaterThan(0)
        expect(result.breadcrumbs.length).toBeGreaterThan(0)
    })

    it("buildTermsOfServiceStructured returns objects", async () => {
        const mod =
            await import("@/app/[locale]/terms-of-service/terms-of-service-structured")
        const result = await mod.buildTermsOfServiceStructured("en")
        expect(result.webPageStructuredData).toBeTruthy()
        expect(result.content.title).toBeTruthy()
        expect(result.breadcrumbs.length).toBeGreaterThan(0)
    })

    it("buildPCOptimizationStructured returns objects", async () => {
        const mod =
            await import("@/app/[locale]/pc-optimization/pc-optimization-structured")
        const result = await mod.buildPCOptimizationStructured("en")
        expect(result.howTo).toBeTruthy()
        expect(result.offerCatalog).toBeTruthy()
        expect(result.breadcrumbs.length).toBeGreaterThan(0)
    })
})
