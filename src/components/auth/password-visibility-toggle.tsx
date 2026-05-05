"use client"

/**
 * PasswordVisibilityToggle Component
 * Standalone password visibility toggle button for password inputs
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { Eye, EyeOff } from "lucide-react"

interface PasswordVisibilityToggleProps {
    /**
     * Whether the password is currently visible
     */
    isVisible: boolean

    /**
     * Callback when toggle is clicked
     */
    onToggle: (isVisible: boolean) => void

    /**
     * Whether the toggle is disabled
     */
    disabled?: boolean

    /**
     * Additional CSS classes
     */
    className?: string

    /**
     * ID for accessibility
     */
    id?: string
}

/**
 * PasswordVisibilityToggle Component
 * Requirement 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 *
 * Features:
 * - Eye icon button to toggle password visibility
 * - Keyboard accessible (Enter/Space)
 * - ARIA labels and descriptions
 * - Visual feedback on state change
 * - Not persisted across page reloads
 */
export function PasswordVisibilityToggle({
    isVisible,
    onToggle,
    disabled = false,
    className = "",
    id,
}: PasswordVisibilityToggleProps) {
    const handleClick = () => {
        onToggle(!isVisible)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        // Requirement 2.6: Keyboard accessibility (Enter/Space)
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onToggle(!isVisible)
        }
    }

    return (
        <button
            id={id}
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            // Requirement 2.5: ARIA labels
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
            aria-describedby={`${id}-description`}
            tabIndex={0}
        >
            {isVisible ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            <span id={`${id}-description`} className="sr-only">
                {isVisible
                    ? "Password is visible. Press to hide."
                    : "Password is hidden. Press to show."}
            </span>
        </button>
    )
}
