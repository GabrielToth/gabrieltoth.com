import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ChannelsSection } from "./ChannelsSection"
import { SocialChannel } from "./SettingsContainer"

describe("ChannelsSection", () => {
    const mockChannels: SocialChannel[] = [
        {
            id: "1",
            platform: "facebook",
            accountId: "123456",
            accountName: "John's Facebook",
            isConnected: true,
            connectedAt: new Date(),
        },
        {
            id: "2",
            platform: "instagram",
            accountId: "789012",
            accountName: "john_instagram",
            isConnected: true,
            connectedAt: new Date(),
        },
        {
            id: "3",
            platform: "twitter",
            accountId: "345678",
            accountName: "@johndoe",
            isConnected: false,
        },
    ]

    const mockOnDisconnect = vi.fn()
    const mockOnConnect = vi.fn()

    it("renders channels section", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText("Connected Channels")).toBeInTheDocument()
        expect(
            screen.getByText("Manage your connected social media accounts")
        ).toBeInTheDocument()
    })

    it("displays connected channels", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText("Facebook")).toBeInTheDocument()
        expect(screen.getByText("John's Facebook")).toBeInTheDocument()
        expect(screen.getByText("Instagram")).toBeInTheDocument()
        expect(screen.getByText("john_instagram")).toBeInTheDocument()
    })

    it("displays connected status badge", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const connectedBadges = screen.getAllByText("Connected")
        expect(connectedBadges.length).toBeGreaterThan(0)
    })

    it("displays disconnect button for connected channels", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
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
            <ChannelsSection
                channels={mockChannels}
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
            <ChannelsSection
                channels={mockChannels}
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

    it("displays Add Channel button", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(
            screen.getByRole("button", { name: /add channel/i })
        ).toBeInTheDocument()
    })

    it("calls onConnect when Add Channel is clicked", async () => {
        const user = userEvent.setup()
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const addButton = screen.getByRole("button", { name: /add channel/i })
        await user.click(addButton)

        expect(mockOnConnect).toHaveBeenCalled()
    })

    it("displays available channels section", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText(/available channels/i)).toBeInTheDocument()
    })

    it("displays not connected status for disconnected channels", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText("Not Connected")).toBeInTheDocument()
    })
})
