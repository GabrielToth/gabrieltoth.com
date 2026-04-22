import type { Meta, StoryObj } from "@storybook/react"
import { SuccessMessage } from "./SuccessMessage"

const meta = {
    title: "Registration/SuccessMessage",
    component: SuccessMessage,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        message: {
            control: { type: "text" },
            description: "Success message to display",
        },
        redirectUrl: {
            control: { type: "text" },
            description: "URL to redirect to after countdown",
        },
        redirectDelay: {
            control: { type: "number", min: 1000, max: 10000, step: 1000 },
            description: "Delay in milliseconds before redirect",
        },
    },
} satisfies Meta<typeof SuccessMessage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default Success Message
 * Shows the default success message with 2-second countdown.
 */
export const DefaultSuccess: Story = {
    args: {
        message: "Account created successfully!",
        redirectUrl: "/login",
        redirectDelay: 2000,
    },
}

/**
 * Custom Success Message
 * Shows a custom success message.
 */
export const CustomMessage: Story = {
    args: {
        message: "Welcome! Your account has been created. You can now log in.",
        redirectUrl: "/login",
        redirectDelay: 2000,
    },
}

/**
 * Long Countdown
 * Shows the success message with a longer countdown (5 seconds).
 */
export const LongCountdown: Story = {
    args: {
        message: "Account created successfully!",
        redirectUrl: "/login",
        redirectDelay: 5000,
    },
}

/**
 * Short Countdown
 * Shows the success message with a short countdown (1 second).
 */
export const ShortCountdown: Story = {
    args: {
        message: "Account created successfully!",
        redirectUrl: "/login",
        redirectDelay: 1000,
    },
}

/**
 * Redirect to Dashboard
 * Shows the success message redirecting to the dashboard.
 */
export const RedirectToDashboard: Story = {
    args: {
        message:
            "Account created successfully! Redirecting to your dashboard...",
        redirectUrl: "/dashboard",
        redirectDelay: 2000,
    },
}

/**
 * Redirect to Verification
 * Shows the success message redirecting to email verification.
 */
export const RedirectToVerification: Story = {
    args: {
        message: "Account created! Please verify your email to continue.",
        redirectUrl: "/verify-email",
        redirectDelay: 3000,
    },
}

/**
 * Detailed Success Message
 * Shows a more detailed success message with additional information.
 */
export const DetailedMessage: Story = {
    args: {
        message:
            "Congratulations! Your account has been created successfully. A verification email has been sent to your inbox.",
        redirectUrl: "/login",
        redirectDelay: 4000,
    },
}

/**
 * Minimal Success Message
 * Shows a minimal success message.
 */
export const MinimalMessage: Story = {
    args: {
        message: "Success!",
        redirectUrl: "/login",
        redirectDelay: 2000,
    },
}
