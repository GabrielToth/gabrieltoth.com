import { ThemeProvider } from "@/components/theme/theme-provider"
import LanguageSelector from "@/components/ui/language-selector"
import * as useLocaleModule from "@/hooks/use-locale"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("LanguageSelector", () => {
    beforeEach(() => {
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale: "en",
            changeLocale: vi.fn(),
            isLoading: false,
        } as any)
    })

    const renderSelector = (includeThemeToggle = true) =>
        render(
            <ThemeProvider>
                <LanguageSelector
                    variant="header"
                    includeThemeToggle={includeThemeToggle}
                />
            </ThemeProvider>
        )

    it("opens dropdown on click and shows theme when enabled", () => {
        renderSelector(true)
        const btn = screen.getByTestId("language-selector-button")
        fireEvent.click(btn)
        expect(
            screen.getByTestId("language-selector-dropdown")
        ).toBeInTheDocument()
        // Theme item is present when includeThemeToggle=true
        expect(
            screen.getByRole("menuitem", { name: /theme/i })
        ).toBeInTheDocument()
    })

    it("selects a different locale and closes dropdown", () => {
        const changeLocale = vi.fn()
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale: "en",
            changeLocale,
            isLoading: false,
        } as any)
        renderSelector(false)
        fireEvent.click(screen.getByTestId("language-selector-button"))
        const option = screen.getByTestId("language-selector-option-pt-BR")
        fireEvent.click(option)
        expect(changeLocale).toHaveBeenCalledWith("pt-BR")
    })
})
