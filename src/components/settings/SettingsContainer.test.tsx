import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { SettingsContainer } from "./SettingsContainer"

describe("SettingsContainer", () => {
    it("renders the settings container with header", () => {
        render(<SettingsContainer />)

        expect(screen.getByText("Settings")).toBeInTheDocument()
        expect(
            screen.getByText("Manage your account settings and preferences")
        ).toBeInTheDocument()
    })

    it("renders all settings tabs", () => {
        render(<SettingsContainer />)

        expect(
            screen.getByRole("tab", { name: /profile/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("tab", { name: /preferences/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("tab", { name: /channels/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("tab", { name: /security/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("tab", { name: /billing/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("tab", { name: /integrations/i })
        ).toBeInTheDocument()
    })

    it("renders profile section by default", async () => {
        render(<SettingsContainer />)

        await waitFor(() => {
            expect(screen.getByText("Profile Information")).toBeInTheDocument()
        })
    })

    it("switches to preferences tab when clicked", async () => {
        const user = userEvent.setup()
        render(<SettingsContainer />)

        const preferencesTab = screen.getByRole("tab", { name: /preferences/i })
        await user.click(preferencesTab)

        // Verify the tab is now selected
        expect(preferencesTab).toHaveAttribute("aria-selected", "true")
    })

    it("switches to integrations tab when clicked", async () => {
        render(<SettingsContainer />)

        const integrationsTab = screen.getByRole("tab", {
            name: /integrations/i,
        })
        integrationsTab.click()

        await waitFor(() => {
            expect(screen.getByText("Integrations")).toBeInTheDocument()
        })
    })

    it("renders children when provided", () => {
        render(
            <SettingsContainer>
                <div>Custom Content</div>
            </SettingsContainer>
        )

        expect(screen.getByText("Custom Content")).toBeInTheDocument()
    })
})
