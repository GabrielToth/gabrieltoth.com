import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn().mockResolvedValue((k: string) => k),
}))

describe("iq-test structured data builder coverage", () => {
    it("builds for en locale", async () => {
        const { buildIQTestStructured } = await import(
            "@/app/[locale]/iq-test/iq-test-structured"
        )
        const data = await buildIQTestStructured("en" as any)
        expect(data.breadcrumbs.length).toBeGreaterThan(0)
        expect(data.webPageStructuredData).toBeTruthy()
        expect(data.faqs.length).toBeGreaterThan(0)
    })

    it("builds for pt-BR locale", async () => {
        const { buildIQTestStructured } = await import(
            "@/app/[locale]/iq-test/iq-test-structured"
        )
        const data = await buildIQTestStructured("pt-BR" as any)
        expect(data.breadcrumbs.length).toBeGreaterThan(0)
        expect(data.webPageStructuredData).toBeTruthy()
        expect(data.faqs.length).toBeGreaterThan(0)
    })
})
