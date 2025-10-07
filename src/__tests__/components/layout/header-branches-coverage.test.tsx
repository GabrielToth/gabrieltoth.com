import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/en" }))
vi.mock("@/hooks/use-locale", () => ({ useLocale: () => ({ locale: "en" }) }))
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k }))
vi.mock("@/components/theme/theme-toggle-client", () => ({
    ThemeToggleClient: () => null,
}))
vi.mock("@/components/ui/language-selector", () => ({ default: () => null }))

describe("layout/header branches coverage", () => {
    it("toggles services dropdown and mobile menu", async () => {
        const mod = await import("@/components/layout/header")
        render(React.createElement(mod.default))

        // Open services dropdown
        fireEvent.click(screen.getByTestId("services-button"))
        expect(
            screen.getByTestId("services-link-channel-management")
        ).toBeInTheDocument()

        // Toggle mobile menu
        fireEvent.click(screen.getByTestId("mobile-menu-toggle"))
        expect(screen.getByTestId("mobile-nav")).toBeInTheDocument()
    })
})
