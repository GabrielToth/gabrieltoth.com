import { describe, expect, it, vi } from "vitest"

const LOCALES = ["en", "pt-BR", "es", "de"] as const

// Mock getTranslations to return actual translation keys/values
vi.mock("next-intl/server", () => {
    return {
        getTranslations: vi.fn((opts: any) => {
            return Object.assign((k: string) => {
                // Return the key as a fallback for testing
                // The actual component will use real translations at runtime
                return k
            }, {
                raw: (_k: string) => [{ title: "T", content: "C" }],
            }) as any
        }),
    }
})

describe("Services page - generateMetadata", () => {
    for (const locale of LOCALES) {
        it(`returns metadata object for locale '${locale}'`, async () => {
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)

            expect(metadata).toBeTruthy()
            expect(metadata.title).toBeTruthy()
        })

        it(`includes description in metadata for locale '${locale}'`, async () => {
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)

            expect(metadata.description).toBeTruthy()
            expect(typeof metadata.description).toBe("string")
        })

        it(`includes keywords array in metadata for locale '${locale}'`, async () => {
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)

            expect(metadata.keywords).toBeDefined()
            expect(Array.isArray(metadata.keywords)).toBe(true)
            const keywords = metadata.keywords as string[]
            expect(keywords.length).toBeGreaterThan(0)
        })

        it(`includes openGraph properties for locale '${locale}'`, async () => {
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)

            expect(metadata.openGraph).toBeDefined()
            expect((metadata.openGraph as any)?.type).toBe("website")
            expect((metadata.openGraph as any)?.title).toBeTruthy()
            expect((metadata.openGraph as any)?.description).toBeTruthy()
        })

        it(`openGraph locale matches provided locale '${locale}'`, async () => {
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)

            expect((metadata.openGraph as any)?.locale).toBe(locale)
        })
    }

    it("metadata includes Gabriel Toth in title", async () => {
        const mod = await import("@/app/[locale]/services/page")

        for (const locale of LOCALES) {
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)

            expect(String(metadata.title)).toContain("Gabriel Toth")
        }
    })

    it("keywords include service categories", async () => {
        const mod = await import("@/app/[locale]/services/page")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)

        const keywords = metadata.keywords as string[]
        // Should include key service-related terms
        expect(keywords.length).toBeGreaterThan(5)
        expect(keywords.some(k => k.toLowerCase().includes("service"))).toBe(true)
    })

    it("all locales produce consistent metadata structure", async () => {
        const mod = await import("@/app/[locale]/services/page")

        for (const locale of LOCALES) {
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)

            // All should have required fields
            expect(metadata.title).toBeTruthy()
            expect(metadata.description).toBeTruthy()
            expect(metadata.keywords).toBeTruthy()
            expect(metadata.openGraph).toBeTruthy()
        }
    })

    it("openGraph type is always 'website'", async () => {
        const mod = await import("@/app/[locale]/services/page")

        for (const locale of LOCALES) {
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)

            expect((metadata.openGraph as any)?.type).toBe("website")
        }
    })
})
