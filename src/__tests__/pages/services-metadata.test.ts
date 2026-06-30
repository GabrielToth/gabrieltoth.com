import { beforeAll, describe, expect, it, vi } from "vitest"

const LOCALES = ["en", "pt-BR", "es", "de"] as const

const mockTranslations: Record<string, Record<string, string>> = {
    en: {
        "landing.title": "Services",
        "landing.description":
            "From channel management to custom development, I offer a range of services to help you grow your online presence and achieve your goals.",
    },
    "pt-BR": {
        "landing.title": "Serviços",
        "landing.description":
            "Do gerenciamento de canais ao desenvolvimento personalizado, ofereço uma gama de serviços para ajudar você a crescer sua presença online e alcançar seus objetivos.",
    },
    es: {
        "landing.title": "Servicios",
        "landing.description":
            "Desde la gestión de canales hasta el desarrollo personalizado, ofrezco uma gama de servicios para ayudarte a crecer tu presencia online y alcanzar tus objetivos.",
    },
    de: {
        "landing.title": "Dienstleistungen",
        "landing.description":
            "Von der Kanalverwaltung bis zur individuellen Entwicklung biete ich eine Reihe von Dienstleistungen an, die Ihnen helfen, Ihre Online-Präsenz auszubauen und Ihre Ziele zu erreichen.",
    },
}

// Mock next-intl/server before importing the module
vi.mock("next-intl/server", () => ({
    getTranslations: (opts: { locale: string; namespace: string }) => {
        const translations = mockTranslations[opts.locale] ?? {}
        return (key: string) => translations[key] ?? key
    },
}))

// Lazy import after mocking
let generateMetadata: any

describe("Services page - generateMetadata", () => {
    beforeAll(async () => {
        // Dynamic import to avoid TypeScript resolution issues with [locale] in path
        // @ts-expect-error - dynamic import with path alias variable
        const mod = await import(`../../../app/[locale]/services/page`)
        generateMetadata = mod.generateMetadata
    })

    it.each(LOCALES)(
        "returns metadata object for locale '%s'",
        async locale => {
            const metadata = await generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect(metadata).toBeTruthy()
            expect(metadata.title).toBeTruthy()
        }
    )

    it.each(LOCALES)(
        "includes description in metadata for locale '%s'",
        async locale => {
            const metadata = await generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect(metadata.description).toBeTruthy()
            expect(typeof metadata.description).toBe("string")
        }
    )

    it.each(LOCALES)(
        "includes keywords array in metadata for locale '%s'",
        async locale => {
            const metadata = await generateMetadata({
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
            const metadata = await generateMetadata({
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
            const metadata = await generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect((metadata.openGraph as any)?.locale).toBe(locale)
        }
    )

    it("metadata includes Gabriel Toth in title for all locales", async () => {
        for (const locale of LOCALES) {
            const metadata = await generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect(String(metadata.title)).toContain("Gabriel Toth")
        }
    })

    it("keywords include service categories", async () => {
        const metadata = await generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        })

        const keywords = metadata.keywords as string[]
        expect(keywords.length).toBeGreaterThan(5)
        expect(keywords.some(k => k.toLowerCase().includes("service"))).toBe(
            true
        )
    })

    it("all locales produce consistent metadata structure", async () => {
        for (const locale of LOCALES) {
            const metadata = await generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect(metadata.title).toBeTruthy()
            expect(metadata.description).toBeTruthy()
            expect(metadata.keywords).toBeTruthy()
            expect(metadata.openGraph).toBeTruthy()
        }
    })

    it("openGraph type is always 'website'", async () => {
        for (const locale of LOCALES) {
            const metadata = await generateMetadata({
                params: Promise.resolve({ locale }),
            })

            expect((metadata.openGraph as any)?.type).toBe("website")
        }
    })
})
