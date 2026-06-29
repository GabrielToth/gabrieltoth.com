/**
 * AuthButtonRow Component
 * Renders all authentication method buttons in a horizontal row
 * Manages button layout, spacing, and responsive behavior
 *
 * Validates: Requirements 1.0, 1.1, 4.0
 */

import React, { useMemo } from "react"
import { AuthButtonRowProps, AuthProvider } from "../../../types/auth"
import { AuthButton } from "./AuthButton"
import styles from "./AuthButtonRow.module.css"

// Import icons from react-icons
import { LockKeyhole } from "lucide-react"
import { FaApple, FaEnvelope, FaFacebook, FaGoogle } from "react-icons/fa"

/**
 * AuthButtonRow Component
 * Displays all authentication buttons in a responsive row layout
 * Renders 5 buttons: Google, Email, SSO, Apple (disabled), Facebook (disabled)
 */
export const AuthButtonRow: React.FC<AuthButtonRowProps> = ({
    onGoogleClick,
    onEmailClick,
    onSSOClick,
    loadingProvider,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error,
}) => {
    // Define button configurations with icons and labels
    const buttonConfigs = useMemo(
        () => [
            {
                provider: "google" as AuthProvider,
                icon: <FaGoogle size={24} />,
                label: "Sign in with Google",
                onClick: onGoogleClick,
                isDisabled: false,
            },
            {
                provider: "email" as AuthProvider,
                icon: <FaEnvelope size={24} />,
                label: "Sign in with email",
                onClick: onEmailClick,
                isDisabled: false,
            },
            {
                provider: "sso" as AuthProvider,
                icon: <LockKeyhole size={24} />,
                label: "Sign in with Single Sign-On",
                onClick: onSSOClick,
                isDisabled: false,
            },
            {
                provider: "apple" as AuthProvider,
                icon: <FaApple size={24} />,
                label: "Sign in with Apple (coming soon)",
                onClick: () => {},
                isDisabled: true,
            },
            {
                provider: "facebook" as AuthProvider,
                icon: <FaFacebook size={24} />,
                label: "Sign in with Facebook (coming soon)",
                onClick: () => {},
                isDisabled: true,
            },
        ],
        [onGoogleClick, onEmailClick, onSSOClick]
    )

    return (
        <div
            className={styles.buttonRow}
            role="group"
            aria-label="Authentication methods"
        >
            {buttonConfigs.map(config => (
                <AuthButton
                    key={config.provider}
                    provider={config.provider}
                    icon={config.icon}
                    ariaLabel={config.label}
                    onClick={config.onClick}
                    isDisabled={config.isDisabled}
                    isLoading={loadingProvider === config.provider}
                />
            ))}
        </div>
    )
}
