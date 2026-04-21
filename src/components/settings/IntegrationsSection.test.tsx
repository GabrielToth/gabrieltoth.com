import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { IntegrationsSection } from "./IntegrationsSection"
import { Integration } from "./SettingsContainer"

describe("IntegrationsSection", () => {
    const mockIntegrations: Integration[] = [
        {
            id: "1",
            name: "Zapier",
            icon: "zapier",
            isConnected: true,
            connectedAt: new Date(),
        },
        {
            id: "2",
            name: "Slack",
            icon: "slack",
            isConnected: false,
        },
        {
            id: "3",
            name: "Google Analytics",
            icon: "google",
            isConnected: true,
            connectedAt: new Date(),
        },
    ]

    const mockOnDisconnect = vi.fn()
    const mockOnConnect = vi.fn()

    it("renders integrations section", () => {
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText("Integrations")).toBeInTheDocument()
        expect(
            screen.getByText("Connect third-party apps to extend functionality")
        ).toBeInTheDocument()
    })

    it("displays connected integrations", () => {
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText("Zapier")).toBeInTheDocument()
        expect(screen.getByText("Google Analytics")).toBeInTheDocument()
    })

    it("displays connected status badge", () => {
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const connectedBadges = screen.getAllByText("Connected")
        expect(connectedBadges.length).toBeGreaterThan(0)
    })

    it("displays disconnect button for connected integrations", () => {
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const disconnectButtons = screen.getAllByRole("button", {
            name: /disconnect/i,
        })
        expect(disconnectButtons.length).toBeGreaterThan(0)
    })

    it("shows confirmation dialog when disconnect is clicked", async () => {
        const user = userEvent.setup()
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const disconnectButtons = screen.getAllByRole("button", {
            name: /disconnect/i,
        })
        await user.click(disconnectButtons[0])

        await waitFor(() => {
            expect(
                screen.getByRole("button", { name: /confirm/i })
            ).toBeInTheDocument()
        })
    })

    it("calls onDisconnect when confirmed", async () => {
        const user = userEvent.setup()
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const disconnectButtons = screen.getAllByRole("button", {
            name: /disconnect/i,
        })
        await user.click(disconnectButtons[0])

        const confirmButton = screen.getByRole("button", { name: /confirm/i })
        await user.click(confirmButton)

        await waitFor(() => {
            expect(mockOnDisconnect).toHaveBeenCalled()
        })
    })

    it("displays available integrations section", () => {
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText(/available apps/i)).toBeInTheDocument()
    })

    it("displays available status for disconnected integrations", () => {
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText("Slack")).toBeInTheDocument()
        expect(screen.getByText("Available")).toBeInTheDocument()
    })

    it("displays Add Integration button", () => {
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(
            screen.getByRole("button", { name: /add integration/i })
        ).toBeInTheDocument()
    })

    it("calls onConnect when Add Integration is clicked", async () => {
        const user = userEvent.setup()
        render(
            <IntegrationsSection
                integrations={mockIntegrations}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const addButton = screen.getByRole("button", {
            name: /add integration/i,
        })
        await user.click(addButton)

        expect(mockOnConnect).toHaveBeenCalled()
    })
})
