import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => {
        const t = (key: string) => (key === "title" ? "Terms of Service" : key)
        ;(t as any).raw = (key: string) => {
            if (key === "breadcrumbs") {
                return [
                    { name: "Home", href: "/" },
                    { name: "Terms of Service", href: "/terms-of-service" },
                ]
            }
            if (key === "sections") {
                return {
                    acceptance: { title: "Acceptance", text: "Accept terms" },
                    services: { title: "Services", text: "..." },
                    responsibilities: {
                        title: "Responsibilities",
                        text: "...",
                    },
                    limitations: { title: "Limitations", text: "..." },
                    privacy: { title: "Privacy", text: "..." },
                    modifications: { title: "Modifications", text: "..." },
                    termination: { title: "Termination", text: "..." },
                    governing: { title: "Governing", text: "..." },
                    contact: { title: "Contact", text: "..." },
                }
            }
            return []
        }
        return t as any
    },
}))

describe("terms-of-service coverage", () => {
    it("generates metadata for locales", async () => {
        const { generateMetadata } = await import(
            "@/app/[locale]/terms-of-service/terms-of-service-metadata"
        )
        for (const locale of ["en", "pt-BR", "es", "de"] as const) {
            const meta = await generateMetadata({
                params: Promise.resolve({ locale } as any),
            } as any)
            expect(meta.title).toBeTruthy()
            const expectedOg =
                locale === "en"
                    ? "en_US"
                    : locale === "pt-BR"
                      ? "pt_BR"
                      : locale === "es"
                        ? "es_ES"
                        : locale === "de"
                          ? "de_DE"
                          : locale
            expect((meta as any).openGraph?.locale).toBe(expectedOg)
        }
    })

    it("builds structured data and content across locales", async () => {
        const { buildTermsOfServiceStructured } = await import(
            "@/app/[locale]/terms-of-service/terms-of-service-structured"
        )
        for (const locale of ["en", "pt-BR", "es", "de"] as const) {
            const { breadcrumbs, webPageStructuredData, content } =
                await buildTermsOfServiceStructured(locale as any)
            expect(breadcrumbs.length).toBeGreaterThan(0)
            expect((webPageStructuredData as any)["@type"]).toBe("WebPage")
            expect(content.acceptance?.text).toBeTruthy()
        }
    })
})
