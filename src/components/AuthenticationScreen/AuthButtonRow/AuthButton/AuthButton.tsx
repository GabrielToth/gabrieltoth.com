/**
 * AuthButton Component
 * Individual authentication button component
 * Handles rendering, state management, and user interactions
 *
 * Validates: Requirements 1.0, 1.2, 4.0
 */

import React, { useCallback } from "react"
import { AuthButtonProps } from "../../../../types/auth"
import styles from "./AuthButton.module.css"

/**
 * AuthButton Component
 * Renders a single authentication button with support for different states:
 * - Enabled state: default, hover, focus, active
 * - Disabled state: grayed out, no hover effect
 * - Loading state: spinner animation, disabled interaction
 *
 * Props:
 * - provider: Authentication provider type (google, email, sso, apple, facebook)
 * - isDisabled: Whether the button is disabled
 * - isLoading: Whether the button is in loading state
 * - onClick: Callback function when button is clicked
 * - ariaLabel: Accessible label for screen readers
 * - icon: React node to render as the button icon
 */
const AuthButtonComponent: React.FC<AuthButtonProps> = ({
    provider,
    isDisabled,
    isLoading,
    onClick,
    ariaLabel,
    icon,
}) => {
    // Memoize the click handler to prevent unnecessary re-renders
    const handleClick = useCallback(() => {
        if (!isDisabled && !isLoading) {
            onClick()
        }
    }, [onClick, isDisabled, isLoading])

    // Determine if button should be disabled
    const isButtonDisabled = isDisabled || isLoading

    // Build className with conditional loading state
    const buttonClassName = [styles.button, isLoading && styles.loading]
        .filter(Boolean)
        .join(" ")

    return (
        <button
            className={buttonClassName}
            disabled={isButtonDisabled}
            onClick={handleClick}
            aria-label={ariaLabel}
            aria-disabled={isDisabled}
            aria-busy={isLoading}
            type="button"
            data-provider={provider}
        >
            <span className={styles.icon}>{icon}</span>
        </button>
    )
}

AuthButtonComponent.displayName = "AuthButton"

export const AuthButton = React.memo(AuthButtonComponent)
