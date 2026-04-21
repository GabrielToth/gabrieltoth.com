import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PreferencesSection } from "./PreferencesSection"
import { Preferences } from "./SettingsContainer"

describe("PreferencesSection", () => {
    const mockPreferences: Preferences = {
        notificationsEnabled: true,
        language: "en",
        theme: "auto",
    }

    const mockOnSave = vi.fn()

    it("renders preferences section", () => {
        render(
            <PreferencesSection
                preferences={mockPreferences}
                onSave={mockOnSave}
            />
        )

        expect(screen.getByText("Preferences")).toBeInTheDocument()
        expect(
            screen.getByText(
                "Customize your experience with language, theme, and notification settings"
            )
        ).toBeInTheDocument()
    })

    it("displays notifications toggle", () => {
        render(
            <PreferencesSection
                preferences={mockPreferences}
                onSave={mockOnSave}
            />
        )

        expect(screen.getByText("Notifications")).toBeInTheDocument()
        expect(
            screen.getByText(
                "Receive email notifications about your account activity"
            )
        ).toBeInTheDocument()
    })

    it("displays language select", () => {
        render(
            <PreferencesSection
                preferences={mockPreferences}
                onSave={mockOnSave}
            />
        )

        expect(screen.getByText("Language")).toBeInTheDocument()
        expect(screen.getByText("English")).toBeInTheDocument()
    })

    it("displays theme select", () => {
        render(
            <PreferencesSection
                preferences={mockPreferences}
                onSave={mockOnSave}
            />
        )

        expect(screen.getByText("Theme")).toBeInTheDocument()
        expect(screen.getByText("Light")).toBeInTheDocument()
        expect(screen.getByText("Dark")).toBeInTheDocument()
        expect(screen.getByText("Auto (System)")).toBeInTheDocument()
    })

    it("toggles notifications", async () => {
        const user = userEvent.setup()
        render(
            <PreferencesSection
                preferences={mockPreferences}
                onSave={mockOnSave}
            />
        )

        const toggleButton = screen.getByRole("button", {
            name: /toggle notifications/i,
        })
        await user.click(toggleButton)

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    notificationsEnabled: false,
                })
            )
        })
    })

    it("changes language", async () => {
        const user = userEvent.setup()
        render(
            <PreferencesSection
                preferences={mockPreferences}
                onSave={mockOnSave}
            />
        )

        const languageSelect = screen.getByDisplayValue("English")
        await user.click(languageSelect)

        const portugueseOption = screen.getByRole("option", {
            name: /portuguese/i,
        })
        await user.click(portugueseOption)

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    language: "pt",
                })
            )
        })
    })

    it("changes theme", async () => {
        const user = userEvent.setup()
        render(
            <PreferencesSection
                preferences={mockPreferences}
                onSave={mockOnSave}
            />
        )

        const themeSelect = screen.getByDisplayValue("Auto (System)")
        await user.click(themeSelect)

        const darkOption = screen.getByRole("option", { name: /dark/i })
        await user.click(darkOption)

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    theme: "dark",
                })
            )
        })
    })

    it("displays auto-save message", () => {
        render(
            <PreferencesSection
                preferences={mockPreferences}
                onSave={mockOnSave}
            />
        )

        expect(
            screen.getByText(
                "Your preferences are saved automatically when you make changes."
            )
        ).toBeInTheDocument()
    })
})
