import ServicesSubmenu from "@/app/[locale]/services/services-submenu"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/url-mapping", () => ({
    getLocalizedPath: vi.fn(
        (key: string, locale: string) => `/${locale}/${key}`
    ),
}))

const LOCALES = ["en", "pt-BR", "es", "de"] as const

const CATEGORIES = [
    { key: "channel-management" },
    { key: "pc-optimization" },
    { key: "amazon-affiliate" },
    { key: "iq-test" },
    { key: "personality-test" },
]

describe("ServicesSubmenu", () => {
    for (const locale of LOCALES) {
        it(`renders without error for locale ${locale}`, () => {
            const { container } = render(
                <ServicesSubmenu locale={locale} />
            )
            expect(container).toBeTruthy()
        })

        it(`renders 5 category links for locale ${locale}`, () => {
            render(<ServicesSubmenu locale={locale} />)
            const links = screen.getAllByRole("link")
            expect(links).toHaveLength(5)
        })

        it(`each link has an h3 and p element for locale ${locale}`, () => {
            const { container } = render(
                <ServicesSubmenu locale={locale} />
            )
            const headings = container.querySelectorAll("h3")
            expect(headings).toHaveLength(5)
            const paragraphs = container.querySelectorAll("p")
            expect(paragraphs).toHaveLength(5)
        })
    }

    it("each link href uses getLocalizedPath output", () => {
        render(<ServicesSubmenu locale="en" />)
        const links = screen.getAllByRole("link")
        links.forEach((link, i) => {
            expect(link.getAttribute("href")).toBe(
                `/en/${CATEGORIES[i].key}`
            )
        })
    })
})
