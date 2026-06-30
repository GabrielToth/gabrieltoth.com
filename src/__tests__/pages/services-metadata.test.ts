import servicesEn from "../../i18n/en/services.json"
import servicesEs from "../../i18n/es/services.json"
import servicesDe from "../../i18n/de/services.json"
import servicesPtBr from "../../i18n/pt-BR/services.json"
import { describe, expect, it, vi } from "vitest"

const LOCALES = ["en", "pt-BR", "es", "de"] as const

// Map locales to their translations
const translationMap: Record<string, typeof servicesEn> = {
    en: servicesEn,
    "pt-BR": servicesPtBr,
    es: servicesEs,
    de: servicesDe,
}

// Mock next-intl/server with actual translations from i18n files
vi.mock("next-intl/server", () => ({
    getTranslations: (opts: { locale: string; namespace: string }) => {
        const translations = translationMap[opts.locale] ?? translationMap["en"]
        return (key: string) => {
            // Navigate nested keys like "landing.title"
            const keys = key.split(".")
            let value: any = translations
            for (const k of keys) {
                value = value?.[k as keyof typeof value]
            }
            return value ?? key
        }
    },
}))

describe("Services page - generateMetadata", () => {
    it.each(LOCALES)("returns metadata for locale '%s'", async locale => {
        // @ts-expect-error - Dynamic import of route with [locale] parameter
        const mod = await import("@/app/[locale]/services/page")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale }),
        })

        expect(metadata).toBeTruthy()
        expect(metadata.title).toBeTruthy()
        expect(metadata.description).toBeTruthy()
    })

    it.each(LOCALES)(
        "includes keywords array for locale '%s'",
        async locale => {
            // @ts-expect-error - Dynamic import of route with [locale] parameter
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect(metadata.keywords).toBeDefined()
            expect(Array.isArray(metadata.keywords)).toBe(true)
            const keywords = metadata.keywords as string[]
            expect(keywords.length).toBeGreaterThan(0)
        }
    )

    it.each(LOCALES)(
        "includes openGraph properties for locale '%s'",
        async locale => {
            // @ts-expect-error - Dynamic import of route with [locale] parameter
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect(metadata.openGraph).toBeDefined()
            expect((metadata.openGraph as any)?.type).toBe("website")
            expect((metadata.openGraph as any)?.title).toBeTruthy()
            expect((metadata.openGraph as any)?.description).toBeTruthy()
        }
    )

    it.each(LOCALES)(
        "openGraph locale matches provided locale '%s'",
        async locale => {
            // @ts-expect-error - Dynamic import of route with [locale] parameter
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect((metadata.openGraph as any)?.locale).toBe(locale)
        }
    )

    it("metadata includes Gabriel Toth in title for all locales", async () => {
        for (const locale of LOCALES) {
            // @ts-expect-error - Dynamic import of route with [locale] parameter
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect(String(metadata.title)).toContain("Gabriel Toth")
        }
    })

    it("all locales produce consistent metadata structure", async () => {
        for (const locale of LOCALES) {
            // @ts-expect-error - Dynamic import of route with [locale] parameter
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect(metadata.title).toBeTruthy()
            expect(metadata.description).toBeTruthy()
            expect(metadata.keywords).toBeTruthy()
            expect(metadata.openGraph).toBeTruthy()
        }
    })

    it("translated titles match i18n files for all locales", async () => {
        for (const locale of LOCALES) {
            // @ts-expect-error - Dynamic import of route with [locale] parameter
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            })

            const translations = translationMap[locale]
            const expectedTitle = `${translations.landing.title} - Gabriel Toth`
            expect(metadata.title).toBe(expectedTitle)
        }
    })

    it("translated descriptions match i18n files for all locales", async () => {
        for (const locale of LOCALES) {
            // @ts-expect-error - Dynamic import of route with [locale] parameter
            const mod = await import("@/app/[locale]/services/page")
            const metadata = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            })

            const translations = translationMap[locale]
            expect(metadata.description).toBe(translations.landing.description)
        }
    })
})
