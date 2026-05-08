/**
 * AuthenticationScreen Component Stories
 * Storybook stories for the AuthenticationScreen component
 *
 * Validates: Requirements 1.0, 2.0, 3.0, 4.0
 */

import type { Meta, StoryObj } from "@storybook/react"
import { AuthenticationScreen } from "../components/AuthenticationScreen"

const meta = {
    title: "Authentication/AuthenticationScreen",
    component: AuthenticationScreen,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof AuthenticationScreen>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default state - button row visible
 */
export const Default: Story = {
    args: {
        onAuthSuccess: user => console.log("Auth success:", user),
        onAuthError: error => console.log("Auth error:", error),
    },
}

/**
 * With redirect destination
 */
export const WithRedirect: Story = {
    args: {
        onAuthSuccess: user => console.log("Auth success:", user),
        onAuthError: error => console.log("Auth error:", error),
        redirectTo: "/dashboard",
    },
}

/**
 * Desktop layout
 */
export const DesktopLayout: Story = {
    args: {
        onAuthSuccess: user => console.log("Auth success:", user),
        onAuthError: error => console.log("Auth error:", error),
    },
    parameters: {
        viewport: {
            defaultViewport: "desktop",
        },
    },
}

/**
 * Tablet layout
 */
export const TabletLayout: Story = {
    args: {
        onAuthSuccess: user => console.log("Auth success:", user),
        onAuthError: error => console.log("Auth error:", error),
    },
    parameters: {
        viewport: {
            defaultViewport: "tablet",
        },
    },
}

/**
 * Mobile layout
 */
export const MobileLayout: Story = {
    args: {
        onAuthSuccess: user => console.log("Auth success:", user),
        onAuthError: error => console.log("Auth error:", error),
    },
    parameters: {
        viewport: {
            defaultViewport: "mobile1",
        },
    },
}

/**
 * Accessibility - Proper semantic HTML and ARIA labels
 */
export const Accessibility: Story = {
    args: {
        onAuthSuccess: user => console.log("Auth success:", user),
        onAuthError: error => console.log("Auth error:", error),
    },
    parameters: {
        a11y: {
            config: {
                rules: [
                    {
                        id: "color-contrast",
                        enabled: true,
                    },
                    {
                        id: "button-name",
                        enabled: true,
                    },
                    {
                        id: "heading-order",
                        enabled: true,
                    },
                ],
            },
        },
    },
}

/**
 * Interactive - With callbacks
 */
export const Interactive: Story = {
    args: {
        onAuthSuccess: user => alert(`Logged in as: ${user.email}`),
        onAuthError: error => alert(`Error: ${error.message}`),
    },
}

/**
 * Dark mode variant (if supported)
 */
export const DarkMode: Story = {
    args: {
        onAuthSuccess: user => console.log("Auth success:", user),
        onAuthError: error => console.log("Auth error:", error),
    },
    parameters: {
        backgrounds: {
            default: "dark",
        },
    },
}

/**
 * Light mode variant
 */
export const LightMode: Story = {
    args: {
        onAuthSuccess: user => console.log("Auth success:", user),
        onAuthError: error => console.log("Auth error:", error),
    },
    parameters: {
        backgrounds: {
            default: "light",
        },
    },
}
