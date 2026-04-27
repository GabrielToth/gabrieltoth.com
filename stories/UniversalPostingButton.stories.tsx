import UniversalPostingButton from "@/components/publish/UniversalPostingButton"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof UniversalPostingButton> = {
    title: "Publish/UniversalPostingButton",
    component: UniversalPostingButton,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        linkedNetworksCount: {
            control: { type: "number", min: 0, max: 10 },
            description: "Number of linked social networks",
        },
        isDisabled: {
            control: "boolean",
            description: "Whether the button is disabled",
        },
        onOpen: {
            action: "opened",
            description: "Callback when button is clicked",
        },
    },
}

export default meta
type Story = StoryObj<typeof UniversalPostingButton>

export const Default: Story = {
    args: {
        linkedNetworksCount: 3,
        isDisabled: false,
    },
}

export const NoNetworks: Story = {
    args: {
        linkedNetworksCount: 0,
        isDisabled: true,
    },
}

export const SingleNetwork: Story = {
    args: {
        linkedNetworksCount: 1,
        isDisabled: false,
    },
}

export const ManyNetworks: Story = {
    args: {
        linkedNetworksCount: 8,
        isDisabled: false,
    },
}

export const Disabled: Story = {
    args: {
        linkedNetworksCount: 3,
        isDisabled: true,
    },
}
