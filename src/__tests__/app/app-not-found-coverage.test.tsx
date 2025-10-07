import { fireEvent, render, screen } from "@testing-library/react"
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

describe("app/not-found coverage", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        history.replaceState(null, "", "/en/missing")
    })

    it("renders content, shows Go Back on mount and calls history.back", async () => {
        const Mod = await import("@/app/not-found")
        const backSpy = vi
            .spyOn(window.history, "back")
            .mockImplementation(() => {})
        render(React.createElement(Mod.default))

        // Wait for the mounted-only back button to appear
        const backBtn = await screen.findByRole("button", {
            name: /go back|voltar/i,
        })
        fireEvent.click(backBtn)
        expect(backSpy).toHaveBeenCalled()

        // Validate main heading and links
        expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument()
        expect(
            screen.getByRole("link", { name: /Página Inicial \(PT\)/i })
        ).toHaveAttribute("href", "/pt-BR")
        expect(
            screen.getByRole("link", { name: /Home Page \(EN\)/i })
        ).toHaveAttribute("href", "/")
    })
})
