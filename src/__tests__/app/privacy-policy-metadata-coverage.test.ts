import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => {
        const t = (key: string) => (key === "title" ? "Privacy Policy" : key)
        ;(t as any).raw = (key: string) =>
            key === "sections"
                ? [{ title: "Intro", content: "This policy explains..." }]
                : []
        return t as any
    },
}))

describe("privacy-policy metadata coverage", () => {
    it("generates metadata for locales and maps alternates", async () => {
        const { generateMetadata } = await import(
            "@/app/[locale]/privacy-policy/privacy-policy-metadata"
        )
        for (const locale of ["en", "pt-BR", "es", "de"] as const) {
            const meta = await generateMetadata({
                params: Promise.resolve({ locale } as any),
            } as any)
            expect(meta.title).toBeTruthy()
            expect(meta.description).toMatch(/policy|Privacy/i)
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
            expect((meta as any).alternates?.languages?.[locale]).toBeTruthy()
        }
    })
})
