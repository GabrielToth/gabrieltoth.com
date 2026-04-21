import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ChannelConnector, type SocialChannel } from "./ChannelConnector"

describe("ChannelConnector", () => {
    const mockChannels: SocialChannel[] = [
        { id: "facebook", name: "Facebook", icon: "f", isConnected: true },
        { id: "instagram", name: "Instagram", icon: "📷", isConnected: false },
        { id: "twitter", name: "Twitter/X", icon: "𝕏", isConnected: true },
        { id: "tiktok", name: "TikTok", icon: "♪", isConnected: false },
        { id: "linkedin", name: "LinkedIn", icon: "in", isConnected: false },
    ]

    it("renders all channels", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        expect(
            screen.getByLabelText(/facebook - connected/i)
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText(/instagram - disconnected/i)
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText(/twitter\/x - connected/i)
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText(/tiktok - disconnected/i)
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText(/linkedin - disconnected/i)
        ).toBeInTheDocument()
    })

    it("displays connection status summary", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        expect(
            screen.getByText(/2 of 5 channels connected/i)
        ).toBeInTheDocument()
    })

    it("shows checkmark for connected channels", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        const { container } = render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const connectedButtons = container.querySelectorAll(
            "button[aria-pressed='true']"
        )
        expect(connectedButtons.length).toBe(2)

        connectedButtons.forEach(button => {
            const checkmark = button.querySelector("svg")
            expect(checkmark).toBeInTheDocument()
        })
    })

    it("calls onConnect when disconnected channel is clicked", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const instagramButton = screen.getByLabelText(
            /instagram - disconnected/i
        )
        fireEvent.click(instagramButton)

        expect(onConnect).toHaveBeenCalledWith("instagram")
        expect(onDisconnect).not.toHaveBeenCalled()
    })

    it("calls onDisconnect when connected channel is clicked", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const facebookButton = screen.getByLabelText(/facebook - connected/i)
        fireEvent.click(facebookButton)

        expect(onDisconnect).toHaveBeenCalledWith("facebook")
        expect(onConnect).not.toHaveBeenCalled()
    })

    it("applies correct styling for connected channels", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const facebookButton = screen.getByLabelText(/facebook - connected/i)
        expect(facebookButton).toHaveClass("border-blue-500", "bg-blue-50")
    })

    it("applies correct styling for disconnected channels", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const instagramButton = screen.getByLabelText(
            /instagram - disconnected/i
        )
        expect(instagramButton).toHaveClass("border-gray-200", "bg-white")
    })

    it("renders section title", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        expect(screen.getByText(/connect channels/i)).toBeInTheDocument()
    })

    it("applies custom className", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()
        const { container } = render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                className="custom-class"
            />
        )

        const wrapper = container.firstChild
        expect(wrapper).toHaveClass("custom-class")
    })

    it("handles empty channels array", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={[]}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        expect(
            screen.getByText(/0 of 0 channels connected/i)
        ).toBeInTheDocument()
    })

    it("handles all channels connected", () => {
        const allConnected: SocialChannel[] = mockChannels.map(ch => ({
            ...ch,
            isConnected: true,
        }))
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={allConnected}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        expect(
            screen.getByText(/5 of 5 channels connected/i)
        ).toBeInTheDocument()
    })

    it("handles all channels disconnected", () => {
        const allDisconnected: SocialChannel[] = mockChannels.map(ch => ({
            ...ch,
            isConnected: false,
        }))
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={allDisconnected}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        expect(
            screen.getByText(/0 of 5 channels connected/i)
        ).toBeInTheDocument()
    })

    it("has proper accessibility attributes", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const facebookButton = screen.getByLabelText(/facebook - connected/i)
        expect(facebookButton).toHaveAttribute("aria-pressed", "true")

        const instagramButton = screen.getByLabelText(
            /instagram - disconnected/i
        )
        expect(instagramButton).toHaveAttribute("aria-pressed", "false")
    })

    it("renders channel icons", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        const { container } = render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const buttons = container.querySelectorAll("button")
        expect(buttons.length).toBe(mockChannels.length)

        mockChannels.forEach(channel => {
            const button = screen.getByLabelText(new RegExp(channel.name, "i"))
            expect(button.textContent).toContain(channel.icon)
        })
    })

    it("handles multiple channel clicks", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const instagramButton = screen.getByLabelText(
            /instagram - disconnected/i
        )
        const facebookButton = screen.getByLabelText(/facebook - connected/i)

        fireEvent.click(instagramButton)
        fireEvent.click(facebookButton)

        expect(onConnect).toHaveBeenCalledWith("instagram")
        expect(onDisconnect).toHaveBeenCalledWith("facebook")
    })

    it("renders with focus-visible styles", () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()

        render(
            <ChannelConnector
                channels={mockChannels}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        )

        const facebookButton = screen.getByLabelText(/facebook - connected/i)
        expect(facebookButton).toHaveClass("focus-visible:outline-none")
        expect(facebookButton).toHaveClass("focus-visible:ring-2")
    })
})
