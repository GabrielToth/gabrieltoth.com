import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { ChannelConnector, type SocialChannel } from "./ChannelConnector"

const meta = {
    title: "Dashboard/ChannelConnector",
    component: ChannelConnector,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ChannelConnector>

export default meta
type Story = StoryObj<typeof meta>

const defaultChannels: SocialChannel[] = [
    { id: "facebook", name: "Facebook", icon: "f", isConnected: true },
    { id: "instagram", name: "Instagram", icon: "📷", isConnected: false },
    { id: "twitter", name: "Twitter/X", icon: "𝕏", isConnected: true },
    { id: "tiktok", name: "TikTok", icon: "♪", isConnected: false },
    { id: "linkedin", name: "LinkedIn", icon: "in", isConnected: false },
]

function ChannelConnectorDemo() {
    const [channels, setChannels] = useState(defaultChannels)

    const handleConnect = (channelId: string) => {
        setChannels(
            channels.map(ch =>
                ch.id === channelId ? { ...ch, isConnected: true } : ch
            )
        )
    }

    const handleDisconnect = (channelId: string) => {
        setChannels(
            channels.map(ch =>
                ch.id === channelId ? { ...ch, isConnected: false } : ch
            )
        )
    }

    return (
        <div className="w-full max-w-xs">
            <ChannelConnector
                channels={channels}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
            />
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                    Connected channels:{" "}
                    <strong>
                        {channels.filter(c => c.isConnected).length} of{" "}
                        {channels.length}
                    </strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    {channels
                        .filter(c => c.isConnected)
                        .map(c => (
                            <li key={c.id}>✓ {c.name}</li>
                        ))}
                </ul>
            </div>
        </div>
    )
}

export const Default: Story = {
    render: () => <ChannelConnectorDemo />,
}

export const AllConnected: Story = {
    args: {
        channels: defaultChannels.map(ch => ({ ...ch, isConnected: true })),
        onConnect: () => {},
        onDisconnect: () => {},
    },
}

export const AllDisconnected: Story = {
    args: {
        channels: defaultChannels.map(ch => ({ ...ch, isConnected: false })),
        onConnect: () => {},
        onDisconnect: () => {},
    },
}

export const SingleChannel: Story = {
    args: {
        channels: [
            { id: "facebook", name: "Facebook", icon: "f", isConnected: false },
        ],
        onConnect: () => {},
        onDisconnect: () => {},
    },
}

export const TwoChannels: Story = {
    args: {
        channels: [
            { id: "facebook", name: "Facebook", icon: "f", isConnected: true },
            {
                id: "instagram",
                name: "Instagram",
                icon: "📷",
                isConnected: false,
            },
        ],
        onConnect: () => {},
        onDisconnect: () => {},
    },
}

export const ManyChannels: Story = {
    args: {
        channels: [
            { id: "facebook", name: "Facebook", icon: "f", isConnected: true },
            {
                id: "instagram",
                name: "Instagram",
                icon: "📷",
                isConnected: false,
            },
            { id: "twitter", name: "Twitter/X", icon: "𝕏", isConnected: true },
            { id: "tiktok", name: "TikTok", icon: "♪", isConnected: false },
            {
                id: "linkedin",
                name: "LinkedIn",
                icon: "in",
                isConnected: false,
            },
            { id: "youtube", name: "YouTube", icon: "▶️", isConnected: true },
            {
                id: "pinterest",
                name: "Pinterest",
                icon: "P",
                isConnected: false,
            },
            {
                id: "snapchat",
                name: "Snapchat",
                icon: "👻",
                isConnected: false,
            },
        ],
        onConnect: () => {},
        onDisconnect: () => {},
    },
}

export const Interactive: Story = {
    render: () => {
        const [channels, setChannels] = useState(defaultChannels)

        const handleConnect = (channelId: string) => {
            setChannels(
                channels.map(ch =>
                    ch.id === channelId ? { ...ch, isConnected: true } : ch
                )
            )
        }

        const handleDisconnect = (channelId: string) => {
            setChannels(
                channels.map(ch =>
                    ch.id === channelId ? { ...ch, isConnected: false } : ch
                )
            )
        }

        return (
            <div className="w-full max-w-xs">
                <ChannelConnector
                    channels={channels}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                />
                <div className="mt-6 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-700">
                        Click any channel icon to connect or disconnect.
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                        Status: {channels.filter(c => c.isConnected).length} of{" "}
                        {channels.length} connected
                    </p>
                </div>
            </div>
        )
    },
}

export const WithCustomIcons: Story = {
    args: {
        channels: [
            {
                id: "facebook",
                name: "Facebook",
                icon: "🔵",
                isConnected: true,
            },
            {
                id: "instagram",
                name: "Instagram",
                icon: "🟣",
                isConnected: false,
            },
            {
                id: "twitter",
                name: "Twitter/X",
                icon: "⚫",
                isConnected: true,
            },
            {
                id: "tiktok",
                name: "TikTok",
                icon: "🎵",
                isConnected: false,
            },
            {
                id: "linkedin",
                name: "LinkedIn",
                icon: "🔷",
                isConnected: false,
            },
        ],
        onConnect: () => {},
        onDisconnect: () => {},
    },
}
