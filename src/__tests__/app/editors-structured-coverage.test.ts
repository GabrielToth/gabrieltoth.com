import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => {
        const t = (key: string) => key
        ;(t as any).raw = (key: string) => {
            if (key === "structuredData.jobPosting") {
                return { "@type": "JobPosting", title: "Editor" }
            }
            if (key === "faqs") {
                return [
                    { question: "Q1", answer: "A1" },
                    { question: "Q2", answer: "A2" },
                ]
            }
            return []
        }
        return t as any
    },
}))

describe("editors structured coverage", () => {
    it("builds breadcrumbs and returns structured data for EN and PT-BR", async () => {
        const { buildEditorsStructured } = await import(
            "@/app/[locale]/editors/editors-structured"
        )

        const en = await buildEditorsStructured("en" as any)
        expect(en.jobStructuredData).toBeTruthy()
        expect(en.faqs.length).toBe(2)
        expect(en.breadcrumbs[0].url).toBe("https://www.gabrieltoth.com")
        expect(en.breadcrumbs[1].url).toBe(
            "https://www.gabrieltoth.com/editors"
        )

        const pt = await buildEditorsStructured("pt-BR" as any)
        expect(pt.jobStructuredData).toBeTruthy()
        expect(pt.faqs.length).toBe(2)
        expect(pt.breadcrumbs[0].url).toBe("https://www.gabrieltoth.com/pt-BR")
        expect(pt.breadcrumbs[1].url).toBe(
            "https://www.gabrieltoth.com/pt-BR/editors"
        )
    })
})
