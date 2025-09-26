import { ThemeProvider } from "@/components/theme/theme-provider"
import { ThemeToggleClient } from "@/components/theme/theme-toggle-client"
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it } from "vitest"

const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Render ThemeProvider with a child subtree containing ThemeToggle
    return <ThemeProvider>{children}</ThemeProvider>
}

describe("ThemeProvider + ThemeToggle", () => {
    beforeEach(() => {
        localStorage.clear()
        document.documentElement.className = ""
    })

    it("defaults to dark and toggles to light, persisting to localStorage", () => {
        render(
            <Wrapper>
                <ThemeToggleClient />
            </Wrapper>
        )

        // Defaults to dark class on html during first render
        expect(document.documentElement.classList.contains("dark")).toBe(true)

        const button = screen.getByRole("button", {
            name: /switch to light mode/i,
        })
        fireEvent.click(button)

        expect(document.documentElement.classList.contains("light")).toBe(true)
        expect(localStorage.getItem("theme")).toBe("light")
    })
})
