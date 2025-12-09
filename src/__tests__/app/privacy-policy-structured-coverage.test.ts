import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => {
        const t = (key: string) => (key === "title" ? "Privacy Policy" : key)
        ;(t as any).raw = (key: string) => {
            if (key === "breadcrumbs") {
                return [
                    { name: "Home", href: "/" },
                    { name: "Privacy Policy", href: "/privacy-policy" },
                ]
            }
            if (key === "sections") {
                return [{ title: "Intro", content: "This policy explains..." }]
            }
            return []
        }
        return t as any
    },
}))

describe("privacy-policy structured coverage", () => {
    it("builds breadcrumbs, sections and webPage data across locales", async () => {
        const { buildPrivacyPolicyStructured } =
            await import("@/app/[locale]/privacy-policy/privacy-policy-structured")
        for (const locale of ["en", "pt-BR", "es", "de"] as const) {
            const { breadcrumbs, webPageStructuredData, sections } =
                await buildPrivacyPolicyStructured(locale as any)
            expect(breadcrumbs.length).toBeGreaterThan(0)
            expect((webPageStructuredData as any)["@type"]).toBe("WebPage")
            expect(String((webPageStructuredData as any).url)).toContain(
                "/privacy-policy"
            )
            expect(sections.length).toBeGreaterThan(0)
        }
    })
})
