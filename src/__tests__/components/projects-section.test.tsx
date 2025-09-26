import ProjectsSection from "@/app/[locale]/home/projects-section"
import * as useLocaleModule from "@/hooks/use-locale"
import enHome from "@/i18n/en/home.json"
import { fireEvent, render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it } from "vitest"

describe("ProjectsSection", () => {
    const renderWithIntl = (locale: "en" | "pt-BR" = "en") => {
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale,
            changeLocale: vi.fn(),
            isLoading: false,
        } as any)

        return render(
            <NextIntlClientProvider
                locale={locale}
                messages={{ home: enHome as any }}
            >
                <ProjectsSection />
            </NextIntlClientProvider>
        )
    }

    it("renders initial project cards and toggles show more/less", () => {
        renderWithIntl("en")

        const title = screen.getByText((enHome as any).projects.title)
        expect(title).toBeInTheDocument()

        // There should be project cards
        const cardsBefore = screen.getAllByText(/View Project/i)
        expect(cardsBefore.length).toBeGreaterThan(0)

        // If Show More exists, clicking it should not crash and then Show Less appears
        const showMore = screen.queryByRole("button", { name: /Show More/i })
        if (showMore) {
            fireEvent.click(showMore)
            expect(
                screen.getByRole("button", { name: /Show Less/i })
            ).toBeInTheDocument()
        }
    })

    it("ensures first project link has a valid href (internal or external)", () => {
        renderWithIntl("en")
        const firstViewLink = screen.getAllByRole("link", {
            name: /View Project/i,
        })[0]
        const href = firstViewLink.getAttribute("href")
        expect(href).toBeTruthy()
    })
})
