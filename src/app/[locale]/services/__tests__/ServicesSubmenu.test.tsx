import ServicesSubmenu from "@/app/[locale]/services/services-submenu"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Mock next-intl to provide specific translation values for services
vi.mock("next-intl", () => ({
    useTranslations: (namespace: string) => {
        const translations: Record<string, Record<string, string>> = {
            services: {
                "landing.channelManagementTitle": "ViraTrend",
                "landing.channelManagementDescription":
                    "Social media management and content strategy",
                "landing.pcOptimizationTitle": "PC Optimization",
                "landing.pcOptimizationDescription":
                    "Performance tuning and system optimization",
                "landing.affiliateTitle": "Amazon Affiliate",
                "landing.affiliateDescription":
                    "Affiliate marketing strategies",
                "landing.iqTestTitle": "IQ Test",
                "landing.iqTestDescription": "Cognitive assessment platform",
                "landing.personalityTestTitle": "Personality Test",
                "landing.personalityTestDescription":
                    "Psychological profiling tools",
            },
        }

        const nsTranslations = translations[namespace] ?? {}

        return (key: string) => {
            return nsTranslations[key] ?? key
        }
    },
    useLocale: () => "en",
    useMessages: () => ({}),
    useFormatter: () => ({
        dateTime: (date: Date) => date.toISOString(),
        number: (num: number) => num.toString(),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
        children,
}))

describe("ServicesSubmenu", () => {
    const categories = [
        { key: "channel-management", title: "ViraTrend" },
        { key: "pc-optimization", title: "PC Optimization" },
        { key: "amazon-affiliate", title: "Amazon Affiliate" },
        { key: "iq-test", title: "IQ Test" },
        { key: "personality-test", title: "Personality Test" },
    ] as const

    const locales = ["en", "pt-BR", "es", "de"] as const

    it.each(locales)(
        "renders all 5 service categories for locale '%s'",
        locale => {
            render(<ServicesSubmenu locale={locale} />)

            // Check that all category labels are rendered
            for (const category of categories) {
                expect(screen.getByText(category.title)).toBeInTheDocument()
            }
        }
    )

    it.each(locales)("renders 5 links for locale '%s'", locale => {
        render(<ServicesSubmenu locale={locale} />)

        const links = screen.getAllByRole("link")
        expect(links).toHaveLength(5)
    })

    it.each([
        { locale: "en" as const, expected: "/en/channel-management" },
        {
            locale: "pt-BR" as const,
            expected: "/pt-BR/gerenciamento-de-canais",
        },
        { locale: "es" as const, expected: "/es/gestion-de-canales" },
        { locale: "de" as const, expected: "/de/kanalverwaltung" },
    ])(
        "localizes channel-management link for '$locale'",
        ({ locale, expected }) => {
            render(<ServicesSubmenu locale={locale} />)

            const links = screen.getAllByRole("link")
            const channelLink = links.find(
                link => link.getAttribute("href") === expected
            )
            expect(channelLink).toBeTruthy()
            expect(channelLink).toHaveAttribute("href", expected)
        }
    )

    it.each([
        { locale: "en" as const, expected: "/en/pc-optimization" },
        { locale: "pt-BR" as const, expected: "/pt-BR/otimizacao-de-pc" },
        { locale: "es" as const, expected: "/es/optimizacion-de-pc" },
        { locale: "de" as const, expected: "/de/pc-optimierung" },
    ])(
        "localizes pc-optimization link for '$locale'",
        ({ locale, expected }) => {
            render(<ServicesSubmenu locale={locale} />)

            const links = screen.getAllByRole("link")
            const link = links.find(l => l.getAttribute("href") === expected)
            expect(link).toBeTruthy()
            expect(link).toHaveAttribute("href", expected)
        }
    )

    it.each([
        { locale: "en" as const, expected: "/en/amazon-affiliate" },
        { locale: "pt-BR" as const, expected: "/pt-BR/afiliados-amazon" },
        { locale: "es" as const, expected: "/es/afiliados-amazon" },
        { locale: "de" as const, expected: "/de/amazon-partner" },
    ])(
        "localizes amazon-affiliate link for '$locale'",
        ({ locale, expected }) => {
            render(<ServicesSubmenu locale={locale} />)

            const links = screen.getAllByRole("link")
            const link = links.find(l => l.getAttribute("href") === expected)
            expect(link).toBeTruthy()
            expect(link).toHaveAttribute("href", expected)
        }
    )

    it.each([
        { locale: "en" as const, expected: "/en/iq-test" },
        { locale: "pt-BR" as const, expected: "/pt-BR/teste-de-qi" },
        { locale: "es" as const, expected: "/es/prueba-de-ci" },
        { locale: "de" as const, expected: "/de/iq-test" },
    ])("localizes iq-test link for '$locale'", ({ locale, expected }) => {
        render(<ServicesSubmenu locale={locale} />)

        const links = screen.getAllByRole("link")
        const link = links.find(l => l.getAttribute("href") === expected)
        expect(link).toBeTruthy()
        expect(link).toHaveAttribute("href", expected)
    })

    it.each([
        { locale: "en" as const, expected: "/en/personality-test" },
        {
            locale: "pt-BR" as const,
            expected: "/pt-BR/teste-de-personalidade",
        },
        {
            locale: "es" as const,
            expected: "/es/prueba-de-personalidad",
        },
        { locale: "de" as const, expected: "/de/personlichkeitstest" },
    ])(
        "localizes personality-test link for '$locale'",
        ({ locale, expected }) => {
            render(<ServicesSubmenu locale={locale} />)

            const links = screen.getAllByRole("link")
            const link = links.find(l => l.getAttribute("href") === expected)
            expect(link).toBeTruthy()
            expect(link).toHaveAttribute("href", expected)
        }
    )
})
