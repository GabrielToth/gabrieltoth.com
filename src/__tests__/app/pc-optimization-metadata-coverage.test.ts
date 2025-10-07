import { describe, expect, it } from "vitest"

describe("pc-optimization metadata coverage", () => {
    it("generates metadata for all locales and fallback", async () => {
        const { generateMetadata } = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-metadata"
        )
        const locales = ["en", "pt-BR", "es", "de"] as const
        for (const locale of locales) {
            const meta = await generateMetadata({
                params: Promise.resolve({ locale } as any),
            } as any)
            expect(meta.title).toBeTruthy()
            expect(meta.description).toBeTruthy()
            expect((meta as any).openGraph?.locale).toBe(locale)
            expect((meta as any).alternates?.languages?.[locale]).toBeTruthy()
        }
        // Fallback when unknown locale
        const metaFallback = await generateMetadata({
            params: Promise.resolve({ locale: "xx" } as any),
        } as any)
        expect(metaFallback.title).toBeTruthy()
        expect(metaFallback.description).toBeTruthy()
    })
})
