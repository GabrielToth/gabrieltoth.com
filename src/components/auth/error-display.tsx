/**
 * ErrorDisplay Component
 * Reusable error display component for authentication forms
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 *
 * Features:
 * - Display validation errors below form fields
 * - Display generic error messages for server errors
 * - Clear errors when user corrects input
 * - Accessible error messages with ARIA attributes
 */

import { AlertCircle, XCircle } from "lucide-react"

interface ErrorDisplayProps {
    /**
     * Error message to display
     */
    error: string | null | undefined

    /**
     * Variant of error display
     * - "inline": Small error below form field
     * - "banner": Large error banner at top of form
     */
    variant?: "inline" | "banner"

    /**
     * ID for aria-describedby attribute
     */
    id?: string

    /**
     * Additional CSS classes
     */
    className?: string
}

/**
 * ErrorDisplay Component
 * Requirement 15.1, 15.2, 15.3, 15.4, 15.5
 *
 * Displays error messages in a consistent, accessible way
 */
export function ErrorDisplay({
    error,
    variant = "inline",
    id,
    className = "",
}: ErrorDisplayProps) {
    if (!error) {
        return null
    }

    if (variant === "banner") {
        return (
            <div
                id={id}
                className={`rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 ${className}`}
                role="alert"
                aria-live="polite"
            >
                <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                        {error}
                    </p>
                </div>
            </div>
        )
    }

    // Inline variant
    return (
        <div
            id={id}
            className={`flex items-start gap-2 ${className}`}
            role="alert"
            aria-live="polite"
        >
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
    )
}

/**
 * FieldError Component
 * Specialized component for form field validation errors
 * Requirement 15.5
 */
interface FieldErrorProps {
    /**
     * Error message to display
     */
    error: string | null | undefined

    /**
     * Field name for ID generation
     */
    fieldName: string

    /**
     * Additional CSS classes
     */
    className?: string
}

export function FieldError({
    error,
    fieldName,
    className = "",
}: FieldErrorProps) {
    if (!error) {
        return null
    }

    return (
        <ErrorDisplay
            error={error}
            variant="inline"
            id={`${fieldName}-error`}
            className={className}
        />
    )
}

/**
 * ServerError Component
 * Specialized component for server-side errors
 * Requirement 15.1, 15.2, 15.3, 15.4
 */
interface ServerErrorProps {
    /**
     * Error message to display
     */
    error: string | null | undefined

    /**
     * Additional CSS classes
     */
    className?: string

    /**
     * Optional callback when error is dismissed
     */
    onDismiss?: () => void
}

export function ServerError({
    error,
    className = "",
    onDismiss,
}: ServerErrorProps) {
    if (!error) {
        return null
    }

    return (
        <div
            className={`rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 ${className}`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                        {error}
                    </p>
                </div>
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                        aria-label="Dismiss error"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    )
}

/**
 * SuccessMessage Component
 * Component for displaying success messages
 */
interface SuccessMessageProps {
    /**
     * Success message to display
     */
    message: string | null | undefined

    /**
     * Additional CSS classes
     */
    className?: string

    /**
     * Optional callback when message is dismissed
     */
    onDismiss?: () => void
}

export function SuccessMessage({
    message,
    className = "",
    onDismiss,
}: SuccessMessageProps) {
    if (!message) {
        return null
    }

    return (
        <div
            className={`rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 ${className}`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                        {message}
                    </p>
                </div>
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                        aria-label="Dismiss message"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    )
}
