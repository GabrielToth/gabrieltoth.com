/**
 * AuthButtonRow Component Stories
 * Storybook stories for the AuthButtonRow component
 *
 * Validates: Requirements 1.0, 1.1, 4.0
 */

import type { Meta, StoryObj } from "@storybook/nextjs"
import { AuthButtonRow } from "../components/AuthenticationScreen/AuthButtonRow"

const meta = {
    title: "Authentication/AuthButtonRow",
    component: AuthButtonRow,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof AuthButtonRow>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default state - all buttons enabled
 */
export const Default: Story = {
    args: {
        onGoogleClick: () => console.log("Google clicked"),
        onEmailClick: () => console.log("Email clicked"),
        onSSOClick: () => console.log("SSO clicked"),
        loadingProvider: null,
        error: null,
    },
}

/**
 * Loading state - Google button loading
 */
export const GoogleLoading: Story = {
    args: {
        onGoogleClick: () => console.log("Google clicked"),
        onEmailClick: () => console.log("Email clicked"),
        onSSOClick: () => console.log("SSO clicked"),
        loadingProvider: "google",
        error: null,
    },
}

/**
 * Loading state - Email button loading
 */
export const EmailLoading: Story = {
    args: {
        onGoogleClick: () => console.log("Google clicked"),
        onEmailClick: () => console.log("Email clicked"),
        onSSOClick: () => console.log("SSO clicked"),
        loadingProvider: "email",
        error: null,
    },
}

/**
 * Loading state - SSO button loading
 */
export const SSOLoading: Story = {
    args: {
        onGoogleClick: () => console.log("Google clicked"),
        onEmailClick: () => console.log("Email clicked"),
        onSSOClick: () => console.log("SSO clicked"),
        loadingProvider: "sso",
        error: null,
    },
}

/**
 * Desktop layout - all buttons in single row
 */
export const DesktopLayout: Story = {
    args: {
        onGoogleClick: () => console.log("Google clicked"),
        onEmailClick: () => console.log("Email clicked"),
        onSSOClick: () => console.log("SSO clicked"),
        loadingProvider: null,
        error: null,
    },
    parameters: {
        viewport: {
            defaultViewport: "desktop",
        },
    },
}

/**
 * Tablet layout - all buttons in single row with smaller spacing
 */
export const TabletLayout: Story = {
    args: {
        onGoogleClick: () => console.log("Google clicked"),
        onEmailClick: () => console.log("Email clicked"),
        onSSOClick: () => console.log("SSO clicked"),
        loadingProvider: null,
        error: null,
    },
    parameters: {
        viewport: {
            defaultViewport: "tablet",
        },
    },
}

/**
 * Mobile layout - buttons wrap to multiple rows
 */
export const MobileLayout: Story = {
    args: {
        onGoogleClick: () => console.log("Google clicked"),
        onEmailClick: () => console.log("Email clicked"),
        onSSOClick: () => console.log("SSO clicked"),
        loadingProvider: null,
        error: null,
    },
    parameters: {
        viewport: {
            defaultViewport: "mobile1",
        },
    },
}

/**
 * Accessibility - Proper ARIA labels
 */
export const Accessibility: Story = {
    args: {
        onGoogleClick: () => console.log("Google clicked"),
        onEmailClick: () => console.log("Email clicked"),
        onSSOClick: () => console.log("SSO clicked"),
        loadingProvider: null,
        error: null,
    },
    parameters: {
        a11y: {
            config: {
                rules: [
                    {
                        id: "aria-required-attr",
                        enabled: true,
                    },
                    {
                        id: "button-name",
                        enabled: true,
                    },
                ],
            },
        },
    },
}

/**
 * Interactive - Click handlers
 */
export const Interactive: Story = {
    args: {
        onGoogleClick: () => alert("Google authentication initiated"),
        onEmailClick: () => alert("Email form will be shown"),
        onSSOClick: () => alert("SSO authentication initiated"),
        loadingProvider: null,
        error: null,
    },
}
