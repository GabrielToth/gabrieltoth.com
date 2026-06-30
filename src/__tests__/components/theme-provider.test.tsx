// Unmock theme-provider so the real ThemeProvider and useTheme are used
vi.unmock("@/components/theme/theme-provider")

import { ThemeProvider, useTheme } from "@/components/theme/theme-provider"
import { ThemeToggleClient } from "@/components/theme/theme-toggle-client"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Render ThemeProvider with a child subtree containing ThemeToggle
    return <ThemeProvider>{children}</ThemeProvider>
}

describe("ThemeProvider + ThemeToggle", () => {
    beforeEach(() => {
        localStorage.clear()
        document.documentElement.className = ""
    })

    it("defaults to dark and toggles to light, persisting to localStorage", async () => {
        render(
            <Wrapper>
                <ThemeToggleClient />
            </Wrapper>
        )

        // Defaults to dark class on html — wait for useEffect to run
        await waitFor(() => {
            expect(document.documentElement.classList.contains("dark")).toBe(
                true
            )
        })

        const button = screen.getByRole("button", {
            name: /switch to light mode/i,
        })
        fireEvent.click(button)

        await waitFor(() => {
            expect(document.documentElement.classList.contains("light")).toBe(
                true
            )
        })
        expect(localStorage.getItem("theme")).toBe("light")
    })

    it("throws when useTheme is used outside of ThemeProvider", () => {
        const Bad = () => {
            useTheme()
            return null
        }
        expect(() => render(<Bad />)).toThrow(
            /useTheme must be used within a ThemeProvider/i
        )
    })
})
