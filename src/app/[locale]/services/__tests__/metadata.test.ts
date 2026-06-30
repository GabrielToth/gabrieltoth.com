<<<<<<< HEAD
import { generateMetadata } from "@/app/[locale]/services/page"
import { describe, expect, it, vi } from "vitest"

// Mock next-intl/server for generateMetadata
vi.mock("next-intl/server", () => ({
    getTranslations: async ({
        locale,
        namespace,
    }: {
        locale: string
        namespace: string
    }) => {
        const translations: Record<string, Record<string, string>> = {
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
                    "Desde la gestión de canales hasta el desarrollo personalizado, ofrezco una gama de servicios para ayudarte a crecer tu presencia online y alcanzar tus objetivos.",
            },
            de: {
                "landing.title": "Dienstleistungen",
                "landing.description":
                    "Von der Kanalverwaltung bis zur individuellen Entwicklung biete ich eine Reihe von Dienstleistungen an, die Ihnen helfen, Ihre Online-Präsenz auszubauen und Ihre Ziele zu erreichen.",
            },
        }

        const nsTranslations = translations[locale] ?? {}

        return (key: string) => {
            const fullKey = `${namespace}.${key}`
            // Strip the "services." prefix since the returned function
            // already scopes to the namespace
            return nsTranslations[key] ?? fullKey
        }
    },
}))

describe("generateMetadata", () => {
    it.each([
        {
            locale: "en" as const,
            expectedTitle: "Services - Gabriel Toth",
            expectedDescription:
                "From channel management to custom development, I offer a range of services to help you grow your online presence and achieve your goals.",
        },
        {
            locale: "pt-BR" as const,
            expectedTitle: "Serviços - Gabriel Toth",
            expectedDescription:
                "Do gerenciamento de canais ao desenvolvimento personalizado, ofereço uma gama de serviços para ajudar você a crescer sua presença online e alcançar seus objetivos.",
        },
        {
            locale: "es" as const,
            expectedTitle: "Servicios - Gabriel Toth",
            expectedDescription:
                "Desde la gestión de canales hasta el desarrollo personalizado, ofrezco una gama de servicios para ayudarte a crecer tu presencia online y alcanzar tus objetivos.",
        },
        {
            locale: "de" as const,
            expectedTitle: "Dienstleistungen - Gabriel Toth",
            expectedDescription:
                "Von der Kanalverwaltung bis zur individuellen Entwicklung biete ich eine Reihe von Dienstleistungen an, die Ihnen helfen, Ihre Online-Präsenz auszubauen und Ihre Ziele zu erreichen.",
        },
    ])(
        "returns correct title and description for locale '$locale'",
        async ({ locale, expectedTitle, expectedDescription }) => {
            const params = Promise.resolve({ locale })
            const metadata = await generateMetadata({ params })

            expect(metadata.title).toBe(expectedTitle)
            expect(metadata.description).toBe(expectedDescription)
        }
    )

    it("includes keywords", async () => {
        const params = Promise.resolve({ locale: "en" as const })
        const metadata = await generateMetadata({ params })

        expect(metadata.keywords).toBeDefined()
        expect(Array.isArray(metadata.keywords)).toBe(true)
        expect(metadata.keywords).toContain("services")
        expect(metadata.keywords).toContain("channel management")
        expect(metadata.keywords).toContain("pc optimization")
    })

    it("includes openGraph data", async () => {
        const params = Promise.resolve({ locale: "en" as const })
        const metadata = await generateMetadata({ params })

        expect(metadata.openGraph).toBeDefined()
        expect(metadata.openGraph?.title).toBe("Services")
        expect(metadata.openGraph?.description).toBe(
            "From channel management to custom development, I offer a range of services to help you grow your online presence and achieve your goals."
        )
        expect((metadata.openGraph as Record<string, unknown>)?.type).toBe(
            "website"
        )
    })

    it("sets locale-specific openGraph locale", async () => {
        const params = Promise.resolve({ locale: "pt-BR" as const })
        const metadata = await generateMetadata({ params })

        expect(metadata.openGraph?.locale).toBe("pt-BR")
=======
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
>>>>>>> fix/issue-70-services-tests
    })
})
