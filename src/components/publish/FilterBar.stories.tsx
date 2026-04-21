import type { Meta, StoryObj } from "@storybook/react"
import type { SocialChannel } from "./FilterBar"
import { FilterBar } from "./FilterBar"

const meta = {
    title: "Publish/FilterBar",
    component: FilterBar,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

const mockChannels: SocialChannel[] = [
    {
        id: "1",
        platform: "facebook",
        accountId: "fb123",
        accountName: "My Facebook Page",
        isConnected: true,
    },
    {
        id: "2",
        platform: "instagram",
        accountId: "ig123",
        accountName: "My Instagram",
        isConnected: true,
    },
    {
        id: "3",
        platform: "twitter",
        accountId: "tw123",
        accountName: "My Twitter",
        isConnected: true,
    },
    {
        id: "4",
        platform: "tiktok",
        accountId: "tt123",
        accountName: "My TikTok",
        isConnected: false,
    },
    {
        id: "5",
        platform: "linkedin",
        accountId: "li123",
        accountName: "My LinkedIn",
        isConnected: true,
    },
]

export const Default: Story = {
    args: {
        channels: mockChannels,
        selectedChannels: [],
        onFilterChange: () => {},
    },
}

export const WithSelectedFilters: Story = {
    args: {
        channels: mockChannels,
        selectedChannels: ["facebook", "instagram"],
        onFilterChange: () => {},
    },
}

export const NoConnectedChannels: Story = {
    args: {
        channels: [
            {
                id: "1",
                platform: "facebook",
                accountId: "fb123",
                accountName: "My Facebook",
                isConnected: false,
            },
        ],
        selectedChannels: [],
        onFilterChange: () => {},
    },
}
