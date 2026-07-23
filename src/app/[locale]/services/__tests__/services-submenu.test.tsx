import ServicesSubmenu from "@/app/[locale]/services/services-submenu"
import enServices from "@/i18n/en/services.json"
import deServices from "@/i18n/de/services.json"
import esServices from "@/i18n/es/services.json"
import ptBRServices from "@/i18n/pt-BR/services.json"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/url-mapping", () => ({
    getLocalizedPath: vi.fn(
        (key: string, locale: string) => `/${locale}/${key}`
    ),
}))

const LOCALES = ["en", "pt-BR", "es", "de"] as const

const LOCALE_MESSAGES: Record<string, Record<string, any>> = {
    en: { services: enServices },
    "pt-BR": { services: ptBRServices },
    es: { services: esServices },
    de: { services: deServices },
}

const CATEGORIES = [
    { key: "channel-management" },
    { key: "pc-optimization" },
    { key: "amazon-affiliate" },
]

describe("ServicesSubmenu", () => {
    for (const locale of LOCALES) {
        it(`renders all 3 categories for locale '${locale}'`, () => {
            render(
                <NextIntlClientProvider
                    locale={locale}
                    messages={LOCALE_MESSAGES[locale]}
                >
                    <ServicesSubmenu locale={locale} />
                </NextIntlClientProvider>
            )
            const links = screen.getAllByRole("link")
            expect(links).toHaveLength(3)
        })

        it(`renders with correct structure for locale '${locale}'`, () => {
            const { container } = render(
                <NextIntlClientProvider
                    locale={locale}
                    messages={LOCALE_MESSAGES[locale]}
                >
                    <ServicesSubmenu locale={locale} />
                </NextIntlClientProvider>
            )

            const headings = container.querySelectorAll("h3")
            expect(headings).toHaveLength(3)
            const paragraphs = container.querySelectorAll("p")
            expect(paragraphs).toHaveLength(3)
        })

        it(`all category links point to correct localized paths for '${locale}'`, () => {
            render(
                <NextIntlClientProvider
                    locale={locale}
                    messages={LOCALE_MESSAGES[locale]}
                >
                    <ServicesSubmenu locale={locale} />
                </NextIntlClientProvider>
            )

            const links = screen.getAllByRole("link")
            links.forEach((link, i) => {
                expect(link.getAttribute("href")).toBe(
                    `/${locale}/${CATEGORIES[i].key}`
                )
            })
        })

        it(`each link has h3 and p elements for '${locale}'`, () => {
            const { container } = render(
                <NextIntlClientProvider
                    locale={locale}
                    messages={LOCALE_MESSAGES[locale]}
                >
                    <ServicesSubmenu locale={locale} />
                </NextIntlClientProvider>
            )

            const headings = container.querySelectorAll("h3")
            expect(headings).toHaveLength(3)
            const paragraphs = container.querySelectorAll("p")
            expect(paragraphs).toHaveLength(3)
        })
    }

    it("renders category descriptions present in output", () => {
        const { container } = render(
            <NextIntlClientProvider
                locale="en"
                messages={LOCALE_MESSAGES["en"]}
            >
                <ServicesSubmenu locale="en" />
            </NextIntlClientProvider>
        )

        // Check that there are descriptions rendered (at least one p tag with content)
        const paragraphs = container.querySelectorAll("p")
        expect(paragraphs.length).toBeGreaterThan(0)
        paragraphs.forEach(p => {
            expect(p.textContent).toBeTruthy()
            expect(p.textContent?.length).toBeGreaterThan(0)
        })
    })

    it("applies hover styles through CSS classes", () => {
        const { container } = render(
            <NextIntlClientProvider
                locale="en"
                messages={LOCALE_MESSAGES["en"]}
            >
                <ServicesSubmenu locale="en" />
            </NextIntlClientProvider>
        )

        const links = container.querySelectorAll("a")
        links.forEach(link => {
            expect(link.className).toContain("group")
            expect(link.className).toContain("border-neutral-700")
            expect(link.className).toContain("hover:border-primary")
        })
    })

    it("renders with correct grid layout classes", () => {
        const { container } = render(
            <NextIntlClientProvider
                locale="en"
                messages={LOCALE_MESSAGES["en"]}
            >
                <ServicesSubmenu locale="en" />
            </NextIntlClientProvider>
        )

        const gridDiv = container.querySelector("div")
        expect(gridDiv?.className).toContain("grid")
        expect(gridDiv?.className).toContain("md:grid-cols-2")
        expect(gridDiv?.className).toContain("lg:grid-cols-3")
        expect(gridDiv?.className).toContain("gap-4")
    })

    it("renders all links with href attributes", () => {
        render(
            <NextIntlClientProvider
                locale="en"
                messages={LOCALE_MESSAGES["en"]}
            >
                <ServicesSubmenu locale="en" />
            </NextIntlClientProvider>
        )

        const links = screen.getAllByRole("link")
        links.forEach(link => {
            expect(link).toHaveAttribute("href")
            expect(link.getAttribute("href")).toBeTruthy()
        })
    })

    it("renders with consistent styling across locales", () => {
        for (const locale of LOCALES) {
            const { container } = render(
                <NextIntlClientProvider
                    locale={locale}
                    messages={LOCALE_MESSAGES[locale]}
                >
                    <ServicesSubmenu locale={locale} />
                </NextIntlClientProvider>
            )

            const gridDiv = container.querySelector("div")
            expect(gridDiv?.className).toContain("grid")
            expect(gridDiv?.className).toContain("gap-4")
        }
    })
})
