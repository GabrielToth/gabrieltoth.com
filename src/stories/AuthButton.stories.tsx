/**
 * AuthButton Component Stories
 * Storybook stories for the AuthButton component
 *
 * Validates: Requirements 1.0, 4.0
 */

import type { Meta, StoryObj } from "@storybook/react"
import { LockKeyhole } from "lucide-react"
import { FaApple, FaEnvelope, FaFacebook, FaGoogle } from "react-icons/fa"
import { AuthButton } from "../components/AuthenticationScreen/AuthButtonRow/AuthButton"

const meta = {
    title: "Authentication/AuthButton",
    component: AuthButton,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof AuthButton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default state - Google button enabled
 */
export const GoogleDefault: Story = {
    args: {
        provider: "google",
        icon: <FaGoogle size={24} />,
        ariaLabel: "Sign in with Google",
        isDisabled: false,
        isLoading: false,
        onClick: () => console.log("Google clicked"),
    },
}

/**
 * Email button enabled
 */
export const EmailDefault: Story = {
    args: {
        provider: "email",
        icon: <FaEnvelope size={24} />,
        ariaLabel: "Sign in with email",
        isDisabled: false,
        isLoading: false,
        onClick: () => console.log("Email clicked"),
    },
}

/**
 * SSO button enabled
 */
export const SSODefault: Story = {
    args: {
        provider: "sso",
        icon: <LockKeyhole size={24} />,
        ariaLabel: "Sign in with Single Sign-On",
        isDisabled: false,
        isLoading: false,
        onClick: () => console.log("SSO clicked"),
    },
}

/**
 * Apple button disabled (coming soon)
 */
export const AppleDisabled: Story = {
    args: {
        provider: "apple",
        icon: <FaApple size={24} />,
        ariaLabel: "Sign in with Apple (coming soon)",
        isDisabled: true,
        isLoading: false,
        onClick: () => {},
    },
}

/**
 * Facebook button disabled (coming soon)
 */
export const FacebookDisabled: Story = {
    args: {
        provider: "facebook",
        icon: <FaFacebook size={24} />,
        ariaLabel: "Sign in with Facebook (coming soon)",
        isDisabled: true,
        isLoading: false,
        onClick: () => {},
    },
}

/**
 * Loading state - button with spinner
 */
export const GoogleLoading: Story = {
    args: {
        provider: "google",
        icon: <FaGoogle size={24} />,
        ariaLabel: "Sign in with Google",
        isDisabled: false,
        isLoading: true,
        onClick: () => console.log("Google clicked"),
    },
}

/**
 * Hover state - button with darker background
 */
export const GoogleHover: Story = {
    args: {
        provider: "google",
        icon: <FaGoogle size={24} />,
        ariaLabel: "Sign in with Google",
        isDisabled: false,
        isLoading: false,
        onClick: () => console.log("Google clicked"),
    },
    parameters: {
        pseudo: {
            hover: true,
        },
    },
}

/**
 * Focus state - button with focus outline
 */
export const GoogleFocus: Story = {
    args: {
        provider: "google",
        icon: <FaGoogle size={24} />,
        ariaLabel: "Sign in with Google",
        isDisabled: false,
        isLoading: false,
        onClick: () => console.log("Google clicked"),
    },
    parameters: {
        pseudo: {
            focus: true,
        },
    },
}

/**
 * All buttons in a row
 */
export const AllButtons: Story = {
    render: () => (
        <div
            style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                alignItems: "center",
                padding: "24px",
            }}
        >
            <AuthButton
                provider="google"
                icon={<FaGoogle size={24} />}
                ariaLabel="Sign in with Google"
                isDisabled={false}
                isLoading={false}
                onClick={() => console.log("Google clicked")}
            />
            <AuthButton
                provider="email"
                icon={<FaEnvelope size={24} />}
                ariaLabel="Sign in with email"
                isDisabled={false}
                isLoading={false}
                onClick={() => console.log("Email clicked")}
            />
            <AuthButton
                provider="sso"
                icon={<LockKeyhole size={24} />}
                ariaLabel="Sign in with Single Sign-On"
                isDisabled={false}
                isLoading={false}
                onClick={() => console.log("SSO clicked")}
            />
            <AuthButton
                provider="apple"
                icon={<FaApple size={24} />}
                ariaLabel="Sign in with Apple (coming soon)"
                isDisabled={true}
                isLoading={false}
                onClick={() => {}}
            />
            <AuthButton
                provider="facebook"
                icon={<FaFacebook size={24} />}
                ariaLabel="Sign in with Facebook (coming soon)"
                isDisabled={true}
                isLoading={false}
                onClick={() => {}}
            />
        </div>
    ),
}

/**
 * Mobile size buttons
 */
export const MobileSize: Story = {
    render: () => (
        <div
            style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                alignItems: "center",
                padding: "16px",
            }}
        >
            <AuthButton
                provider="google"
                icon={<FaGoogle size={20} />}
                ariaLabel="Sign in with Google"
                isDisabled={false}
                isLoading={false}
                onClick={() => console.log("Google clicked")}
            />
            <AuthButton
                provider="email"
                icon={<FaEnvelope size={20} />}
                ariaLabel="Sign in with email"
                isDisabled={false}
                isLoading={false}
                onClick={() => console.log("Email clicked")}
            />
            <AuthButton
                provider="sso"
                icon={<LockKeyhole size={20} />}
                ariaLabel="Sign in with Single Sign-On"
                isDisabled={false}
                isLoading={false}
                onClick={() => console.log("SSO clicked")}
            />
        </div>
    ),
}

/**
 * Accessibility - Focus visible
 */
export const AccessibilityFocus: Story = {
    args: {
        provider: "google",
        icon: <FaGoogle size={24} />,
        ariaLabel: "Sign in with Google",
        isDisabled: false,
        isLoading: false,
        onClick: () => console.log("Google clicked"),
    },
    parameters: {
        a11y: {
            config: {
                rules: [
                    {
                        id: "color-contrast",
                        enabled: true,
                    },
                ],
            },
        },
    },
}
