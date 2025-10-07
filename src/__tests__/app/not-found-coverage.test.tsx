import { render, screen } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock next/link as basic anchor
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children, ...rest }: any) => (
        <a href={typeof href === "string" ? href : String(href)} {...rest}>
            {children}
        </a>
    ),
}))

describe("app/[locale]/not-found coverage", () => {
    beforeEach(() => {
        // Ensure clean DOM state per test
        vi.restoreAllMocks()
        // Reset location via history API
        history.replaceState(null, "", "/")
    })

    it("detects locale from path and renders translations (pt-BR)", async () => {
        history.replaceState(null, "", "/pt-BR/missing")
        const Mod = await import("@/app/[locale]/not-found")
        render(React.createElement(Mod.default))
        // Wait for mounted content
        expect(await screen.findByText(/Página Não Encontrada/i)).toBeTruthy()
        // Home link should include current locale
        const homeLink = screen.getByRole("link", {
            name: /página inicial|home page/i,
        }) as HTMLAnchorElement
        expect(homeLink.getAttribute("href")).toBe("/pt-BR")
    })

    it("falls back to cookie locale when path is unknown", async () => {
        history.replaceState(null, "", "/xx/unknown")
        // Mock cookie getter
        vi.spyOn(document, "cookie", "get").mockReturnValue("locale=es")
        const Mod = await import("@/app/[locale]/not-found")
        render(React.createElement(Mod.default))
        expect(await screen.findByText(/Página No Encontrada/i)).toBeTruthy()
        const viewBtns = screen.getAllByRole("link", { name: /ver página/i })
        expect(viewBtns.length).toBeGreaterThan(0)
    })

    it("falls back to browser language when no cookie (de)", async () => {
        history.replaceState(null, "", "/xx/another")
        // Cookie getter returns empty
        vi.spyOn(document, "cookie", "get").mockReturnValue("")
        // Mock navigator.language
        Object.defineProperty(window.navigator, "language", {
            configurable: true,
            value: "de-DE",
        })
        const Mod = await import("@/app/[locale]/not-found")
        render(React.createElement(Mod.default))
        expect(await screen.findByText(/Seite nicht gefunden/i)).toBeTruthy()
        // Check that CTA links include the resolved locale
        const anyLink = screen.getByRole("link", {
            name: /startseite|home page|página inicial/i,
        }) as HTMLAnchorElement
        expect(anyLink.getAttribute("href") || "").toMatch(/\/de$/)
    })

    it("falls back to default en when cookie missing and browser unsupported", async () => {
        history.replaceState(null, "", "/xx/unknown")
        vi.spyOn(document, "cookie", "get").mockReturnValue("")
        Object.defineProperty(window.navigator, "language", {
            configurable: true,
            value: "zh-CN",
        })
        const Mod = await import("@/app/[locale]/not-found")
        render(React.createElement(Mod.default))
        expect(await screen.findByText(/Page Not Found/i)).toBeTruthy()
        const homeLink = screen.getByRole("link", {
            name: /home page/i,
        }) as HTMLAnchorElement
        expect(homeLink.getAttribute("href")).toBe("/en")
    })
})
