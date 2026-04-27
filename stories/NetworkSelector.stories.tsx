import NetworkSelector from "@/components/publish/NetworkSelector"
import type { Meta, StoryObj } from "@storybook/react"

const mockNetworks = [
    { id: "1", platform: "youtube", status: "connected" as const },
    { id: "2", platform: "facebook", status: "connected" as const },
    { id: "3", platform: "instagram", status: "connected" as const },
    { id: "4", platform: "twitter", status: "expired" as const },
    { id: "5", platform: "linkedin", status: "disconnected" as const },
]

const mockGroups = [
    { id: "g1", name: "Social Media", networkIds: ["1", "2", "3"] },
    { id: "g2", name: "Professional", networkIds: ["5"] },
]

const meta: Meta<typeof NetworkSelector> = {
    title: "Publish/NetworkSelector",
    component: NetworkSelector,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        networks: {
            description: "Array of available networks",
        },
        groups: {
            description: "Array of network groups",
        },
        selectedNetworkIds: {
            description: "Array of selected network IDs",
        },
        onNetworkToggle: {
            action: "network-toggled",
            description: "Callback when network is toggled",
        },
        onGroupToggle: {
            action: "group-toggled",
            description: "Callback when group is toggled",
        },
        onSelectAll: {
            action: "select-all",
            description: "Callback when Select All is clicked",
        },
        onDeselectAll: {
            action: "deselect-all",
            description: "Callback when Deselect All is clicked",
        },
    },
}

export default meta
type Story = StoryObj<typeof NetworkSelector>

export const Default: Story = {
    args: {
        networks: mockNetworks,
        groups: mockGroups,
        selectedNetworkIds: [],
        onNetworkToggle: () => {},
        onGroupToggle: () => {},
        onSelectAll: () => {},
        onDeselectAll: () => {},
    },
}

export const WithSelection: Story = {
    args: {
        networks: mockNetworks,
        groups: mockGroups,
        selectedNetworkIds: ["1", "2", "3"],
        onNetworkToggle: () => {},
        onGroupToggle: () => {},
        onSelectAll: () => {},
        onDeselectAll: () => {},
    },
}

export const AllSelected: Story = {
    args: {
        networks: mockNetworks,
        groups: mockGroups,
        selectedNetworkIds: ["1", "2", "3", "4", "5"],
        onNetworkToggle: () => {},
        onGroupToggle: () => {},
        onSelectAll: () => {},
        onDeselectAll: () => {},
    },
}

export const NoGroups: Story = {
    args: {
        networks: mockNetworks,
        groups: [],
        selectedNetworkIds: ["1"],
        onNetworkToggle: () => {},
        onGroupToggle: () => {},
        onSelectAll: () => {},
        onDeselectAll: () => {},
    },
}

export const NoNetworks: Story = {
    args: {
        networks: [],
        groups: [],
        selectedNetworkIds: [],
        onNetworkToggle: () => {},
        onGroupToggle: () => {},
        onSelectAll: () => {},
        onDeselectAll: () => {},
    },
}
