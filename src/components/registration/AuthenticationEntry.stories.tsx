import type { Meta, StoryObj } from "@storybook/react"
import { AuthenticationEntry } from "./AuthenticationEntry"

const meta = {
    title: "Registration/AuthenticationEntry",
    component: AuthenticationEntry,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof AuthenticationEntry>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        onEmailSelected: () => alert("Email selected"),
        onGoogleSelected: () => alert("Google selected"),
        isLoading: false,
    },
}

export const Loading: Story = {
    args: {
        onEmailSelected: () => alert("Email selected"),
        onGoogleSelected: () => alert("Google selected"),
        isLoading: true,
    },
}
