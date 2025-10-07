import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const t: any = (k: string) => k
    t.raw = (key: string) => {
        if (key.includes("faq")) return [{ question: "Q", answer: "A" }]
        if (key.includes("pricing.plans"))
            return [
                {
                    name: "Plan",
                    basePrice: 1,
                    description: "D",
                    features: ["F"],
                    popular: true,
                },
            ]
        return []
    }
    return { getTranslations: vi.fn().mockResolvedValue(t) }
})

vi.mock(
    "@/app/[locale]/channel-management/channel-management-structured",
    () => ({
        buildChannelManagementStructured: vi.fn(async () => ({
            serviceStructuredData: { a: 1 },
            faqs: [{ question: "Q", answer: "A" }],
            breadcrumbs: [{ name: "Home", url: "/" }],
            offerCatalog: { b: 2 },
        })),
    })
)

describe("channel-management page coverage", () => {
    it("renders default export with mocked structured data", async () => {
        const mod = await import("../../app/[locale]/channel-management/page")
        const jsx = await mod.default({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(jsx).toBeTruthy()
    }, 20000)
})
