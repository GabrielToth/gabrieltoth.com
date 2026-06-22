import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ChannelsSection } from "./ChannelsSection"
import { SocialChannel } from "./SettingsContainer"

// Mock Icon component
vi.mock("@/components/ui/icon", () => ({
    Icon: ({ name }: { name: string }) => (
        <div data-testid={`icon-${name}`}>{name}</div>
    ),
}))

vi.mock("@/components/ui/dynamic-icon", () => ({
    DynamicIcon: ({ name }: { name: string }) => (
        <div data-testid={`dynamic-icon-${name}`}>{name}</div>
    ),
}))

vi.mock("next-intl", () => ({
    useTranslations: (ns: string) => {
        const translations: Record<string, Record<string, string>> = {
            dashboard: {
                "youtube.connectYouTube":
                    "Connect your YouTube channel to manage videos, view analytics, and publish content directly from the dashboard.",
                "youtube.connect": "Connect YouTube",
                "youtube.connecting": "Connecting...",
                "youtube.disconnect": "Disconnect",
                "youtube.disconnecting": "Disconnecting...",
                "youtube.confirmDisconnect": "Confirm",
                "youtube.cancel": "Cancel",
                "youtube.connected": "Connected",
                "youtube.notConnected": "Not Connected",
                "youtube.noChannel": "No channel connected",
                "youtube.connectedSince": "Connected since",
            },
        }
        const t = translations[ns] ?? {}
        return (key: string) => t[key] ?? key
    },
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

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

    beforeEach(() => {
        mockFetch.mockReset()
    })

    it("renders YouTube connect section", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const descriptions = screen.getAllByText(
            "Connect your YouTube channel to manage videos, view analytics, and publish content directly from the dashboard."
        )
        expect(descriptions.length).toBeGreaterThan(0)
    })

    it("shows YouTube connect button when no youtube channel", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(
            screen.getByRole("button", { name: /connect youtube/i })
        ).toBeInTheDocument()
    })

    it("shows YouTube channel info when connected", () => {
        const channelsWithYoutube: SocialChannel[] = [
            ...mockChannels,
            {
                id: "4",
                platform: "youtube",
                accountId: "UC123",
                accountName: "My YouTube Channel",
                isConnected: true,
                connectedAt: new Date(),
            },
        ]
        render(
            <ChannelsSection
                channels={channelsWithYoutube}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText("My YouTube Channel")).toBeInTheDocument()
        const disconnectButtons = screen.getAllByRole("button", {
            name: /disconnect/i,
        })
        expect(disconnectButtons.length).toBeGreaterThan(0)
    })

    it("calls YouTube start API on connect click", async () => {
        const user = userEvent.setup()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                authorizationUrl: "https://accounts.google.com/o/oauth2/auth?....",
            }),
        })

        const channelsWithYoutube: SocialChannel[] = [
            ...mockChannels,
            {
                id: "4",
                platform: "youtube",
                accountId: "",
                accountName: "",
                isConnected: false,
            },
        ]
        render(
            <ChannelsSection
                channels={channelsWithYoutube}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const connectButton = screen.getByRole("button", {
            name: /connect youtube/i,
        })
        await user.click(connectButton)

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith("/api/youtube/link/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })
        })
    })

    it("displays other connected channels", () => {
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

    it("displays available channels section", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        expect(screen.getByText("Not Connected (1)")).toBeInTheDocument()
    })

    it("displays not connected status for disconnected channels", () => {
        render(
            <ChannelsSection
                channels={mockChannels}
                onDisconnect={mockOnDisconnect}
                onConnect={mockOnConnect}
            />
        )

        const notConnected = screen.getAllByText("Not Connected")
        expect(notConnected.length).toBeGreaterThan(0)
    })
})
