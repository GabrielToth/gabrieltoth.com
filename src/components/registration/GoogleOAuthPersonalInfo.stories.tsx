import type { Meta, StoryObj } from "@storybook/react"
import { GoogleOAuthPersonalInfo } from "./GoogleOAuthPersonalInfo"

const meta = {
    title: "Registration/GoogleOAuthPersonalInfo",
    component: GoogleOAuthPersonalInfo,
    parameters: {
        layout: "centered",
        backgrounds: {
            default: "dark",
            values: [
                {
                    name: "dark",
                    value: "#1a1f3a",
                },
            ],
        },
    },
    tags: ["autodocs"],
} satisfies Meta<typeof GoogleOAuthPersonalInfo>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default story showing the personal information form with pre-filled Google name
 */
export const Default: Story = {
    args: {
        googleEmail: "john.doe@gmail.com",
        googleName: "John Doe",
        onComplete: data => console.log("Form completed:", data),
        onBack: () => console.log("Back clicked"),
    },
    decorators: [
        Story => (
            <div className="w-full max-w-md bg-gray-900 rounded-lg p-8">
                <Story />
            </div>
        ),
    ],
}

/**
 * Story showing the form with a different Google name
 */
export const DifferentName: Story = {
    args: {
        googleEmail: "jane.smith@gmail.com",
        googleName: "Jane Smith",
        onComplete: data => console.log("Form completed:", data),
        onBack: () => console.log("Back clicked"),
    },
    decorators: [
        Story => (
            <div className="w-full max-w-md bg-gray-900 rounded-lg p-8">
                <Story />
            </div>
        ),
    ],
}

/**
 * Story showing the form with a name that has special characters
 */
export const SpecialCharacterName: Story = {
    args: {
        googleEmail: "marie.dupont@gmail.com",
        googleName: "Marie-Claire O'Brien",
        onComplete: data => console.log("Form completed:", data),
        onBack: () => console.log("Back clicked"),
    },
    decorators: [
        Story => (
            <div className="w-full max-w-md bg-gray-900 rounded-lg p-8">
                <Story />
            </div>
        ),
    ],
}

/**
 * Story showing the form on mobile viewport
 */
export const Mobile: Story = {
    args: {
        googleEmail: "john.doe@gmail.com",
        googleName: "John Doe",
        onComplete: data => console.log("Form completed:", data),
        onBack: () => console.log("Back clicked"),
    },
    parameters: {
        viewport: {
            defaultViewport: "mobile1",
        },
    },
    decorators: [
        Story => (
            <div className="w-full bg-gray-900 rounded-lg p-4">
                <Story />
            </div>
        ),
    ],
}

/**
 * Story showing the form on tablet viewport
 */
export const Tablet: Story = {
    args: {
        googleEmail: "john.doe@gmail.com",
        googleName: "John Doe",
        onComplete: data => console.log("Form completed:", data),
        onBack: () => console.log("Back clicked"),
    },
    parameters: {
        viewport: {
            defaultViewport: "tablet",
        },
    },
    decorators: [
        Story => (
            <div className="w-full max-w-2xl bg-gray-900 rounded-lg p-8">
                <Story />
            </div>
        ),
    ],
}
