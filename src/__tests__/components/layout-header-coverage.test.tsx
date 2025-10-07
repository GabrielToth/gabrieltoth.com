import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Basic mocks
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children, ...rest }: any) => (
        <a href={typeof href === "string" ? href : String(href)} {...rest}>
            {children}
        </a>
    ),
}))
vi.mock("@/components/theme/theme-toggle-client", () => ({
    ThemeToggleClient: () => <button data-testid="theme-toggle">theme</button>,
}))
vi.mock("@/components/ui/language-selector", () => ({
    __esModule: true,
    default: () => <div data-testid="language-selector-stub" />,
}))
vi.mock("next-intl", () => ({
    useTranslations: () => (k: string) => k,
}))

describe("components/layout/header coverage", () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it("homepage: home links point to #hero and services dropdown toggles", async () => {
        vi.doMock("next/navigation", () => ({ usePathname: () => "/en" }))
        vi.doMock("@/hooks/use-locale", () => ({
            useLocale: () => ({ locale: "en" }),
        }))

        const Mod = await import("@/components/layout/header")
        render(React.createElement(Mod.default))

        const homeBrand = screen.getByTestId("nav-home") as HTMLAnchorElement
        const homeDesktop = screen.getByTestId(
            "nav-home-desktop"
        ) as HTMLAnchorElement
        expect(homeBrand.getAttribute("href")).toBe("#hero")
        expect(homeDesktop.getAttribute("href")).toBe("#hero")

        // Toggle services dropdown
        const servicesBtn = screen.getByTestId("services-button")
        fireEvent.click(servicesBtn)
        // Links should appear
        expect(
            await screen.findByTestId("services-link-channel-management")
        ).toBeTruthy()
        // Close by clicking a link
        fireEvent.click(screen.getByTestId("services-link-pc-optimization"))
    })

    it("non-homepage: home links point to /<locale> and mobile menu works", async () => {
        vi.doMock("next/navigation", () => ({
            usePathname: () => "/en/pc-optimization",
        }))
        vi.doMock("@/hooks/use-locale", () => ({
            useLocale: () => ({ locale: "en" }),
        }))

        const Mod = await import("@/components/layout/header")
        render(React.createElement(Mod.default))

        const homeDesktop = screen.getByTestId(
            "nav-home-desktop"
        ) as HTMLAnchorElement
        expect(homeDesktop.getAttribute("href")).toBe("/en")

        const aboutLink = screen.getByTestId("nav-about") as HTMLAnchorElement
        expect(aboutLink.getAttribute("href")).toBe("/en#about")

        // Open mobile menu
        fireEvent.click(screen.getByTestId("mobile-menu-toggle"))
        expect(screen.getByTestId("mobile-nav")).toBeInTheDocument()
        // Services links present in mobile list
        expect(screen.getByTestId("services-link-support")).toBeInTheDocument()
    })
})
