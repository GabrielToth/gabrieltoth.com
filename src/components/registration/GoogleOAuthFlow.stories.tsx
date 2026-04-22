import type { Meta, StoryObj } from "@storybook/react"
import { GoogleOAuthFlow } from "./GoogleOAuthFlow"

const meta = {
    title: "Registration/GoogleOAuthFlow",
    component: GoogleOAuthFlow,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof GoogleOAuthFlow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        googleClientId: "test-client-id.apps.googleusercontent.com",
        onComplete: data => console.log("Completed:", data),
        onBack: () => console.log("Back clicked"),
    },
}
