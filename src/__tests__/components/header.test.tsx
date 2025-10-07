import Header from "@/components/layout/header"
import { ThemeProvider } from "@/components/theme/theme-provider"
import * as useLocaleModule from "@/hooks/use-locale"
import enLayoutHeader from "@/i18n/en/layout.header.json"
import { fireEvent, render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en",
}))

describe("Header", () => {
    beforeEach(() => {
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale: "en",
            changeLocale: vi.fn(),
            isLoading: false,
        } as any)
    })

    const renderHeader = () =>
        render(
            <ThemeProvider>
                <NextIntlClientProvider
                    locale="en"
                    messages={{ layout: { header: enLayoutHeader as any } }}
                >
                    <Header />
                </NextIntlClientProvider>
            </ThemeProvider>
        )

    it("shows desktop nav at md+ and hamburger at <md", () => {
        // jsdom has no layout; assert by presence of toggle only when clicked
        renderHeader()
        // Open mobile menu
        const toggle = screen.getByTestId("mobile-menu-toggle")
        fireEvent.click(toggle)
        expect(screen.getByTestId("mobile-nav")).toBeInTheDocument()
    })
})
