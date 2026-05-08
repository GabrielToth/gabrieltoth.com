/**
 * AuthenticationScreen Component
 * Main authentication screen component that manages overall authentication state
 * and coordinates button row and email form rendering
 *
 * Validates: Requirements 1.0, 2.0, 3.0, 5.0
 */

import React, { useCallback, useRef, useState } from "react"
import { useAuthentication } from "../../hooks/useAuthentication"
import { useEmailAuth } from "../../hooks/useEmailAuth"
import { useGoogleAuth } from "../../hooks/useGoogleAuth"
import { useSSOAuth } from "../../hooks/useSSOAuth"
import {
    AuthenticationScreenProps,
    AuthenticationScreenState,
} from "../../types/auth"
import { AuthButtonRow } from "./AuthButtonRow"
import styles from "./AuthenticationScreen.module.css"
import { EmailAuthForm } from "./EmailAuthForm"

/**
 * AuthenticationScreen Component
 * Manages the overall authentication flow and state
 * Coordinates between button row and email form rendering
 * Handles error display and dismissal
 */
export const AuthenticationScreen: React.FC<AuthenticationScreenProps> = ({
    onAuthSuccess,
    onAuthError,
    redirectTo,
}) => {
    const [state, setState] = useState<AuthenticationScreenState>({
        showEmailForm: false,
        loadingProvider: null,
        error: null,
    })

    const emailFormRef = useRef<HTMLDivElement>(null)
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Initialize authentication hooks
    const { handleAuthSuccess, handleAuthError } = useAuthentication(redirectTo)

    const { handleGoogleClick: triggerGoogleAuth, error: googleError } =
        useGoogleAuth(handleAuthSuccess, handleAuthError)

    const { handleSSOClick: triggerSSOAuth, error: ssoError } = useSSOAuth(
        handleAuthSuccess,
        handleAuthError
    )

    const { handleEmailSubmit: triggerEmailAuth, error: emailError } =
        useEmailAuth(handleAuthSuccess, handleAuthError)

    /**
     * Handle email button click - show email form
     */
    const handleEmailClick = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            showEmailForm: true,
        }))
        // Focus management for accessibility
        setTimeout(() => {
            emailFormRef.current?.focus()
        }, 0)
    }, [])

    /**
     * Handle back button from email form - hide email form
     */
    const handleBackFromEmailForm = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            showEmailForm: false,
        }))
    }, [])

    /**
     * Handle error display with auto-dismiss after 5 seconds
     */
    const handleError = useCallback((errorMessage: string) => {
        // Clear any existing timeout
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current)
        }

        setState(prevState => ({
            ...prevState,
            error: errorMessage,
        }))

        // Auto-dismiss error after 5 seconds
        errorTimeoutRef.current = setTimeout(() => {
            setState(prevState => ({
                ...prevState,
                error: null,
            }))
        }, 5000)
    }, [])

    /**
     * Handle manual error dismissal
     */
    const handleDismissError = useCallback(() => {
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current)
        }
        setState(prevState => ({
            ...prevState,
            error: null,
        }))
    }, [])

    /**
     * Handle Google OAuth click
     */
    const handleGoogleClick = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            loadingProvider: "google",
        }))
        triggerGoogleAuth()
    }, [triggerGoogleAuth])

    /**
     * Handle SSO click
     */
    const handleSSOClick = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            loadingProvider: "sso",
        }))
        triggerSSOAuth()
    }, [triggerSSOAuth])

    /**
     * Handle email form submission
     */
    const handleEmailSubmit = useCallback(
        async (email: string, password: string) => {
            setState(prevState => ({
                ...prevState,
                loadingProvider: "email",
            }))
            try {
                await triggerEmailAuth(email, password)
            } catch (err) {
                const error =
                    err instanceof Error ? err : new Error(String(err))
                handleError(error.message)
            }
        },
        [triggerEmailAuth, handleError]
    )

    // Update error state when hook errors change
    React.useEffect(() => {
        if (googleError) {
            handleError(googleError.message)
        }
    }, [googleError, handleError])

    React.useEffect(() => {
        if (ssoError) {
            handleError(ssoError.message)
        }
    }, [ssoError, handleError])

    React.useEffect(() => {
        if (emailError) {
            handleError(emailError.message)
        }
    }, [emailError, handleError])

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Login to Your Account</h1>

            {state.error && (
                <div className={styles.errorAlert} role="alert">
                    <span className={styles.errorMessage}>{state.error}</span>
                    <button
                        className={styles.errorClose}
                        onClick={handleDismissError}
                        aria-label="Close error message"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className={styles.content}>
                {!state.showEmailForm ? (
                    <AuthButtonRow
                        onGoogleClick={handleGoogleClick}
                        onEmailClick={handleEmailClick}
                        onSSOClick={handleSSOClick}
                        loadingProvider={state.loadingProvider}
                        error={state.error}
                    />
                ) : (
                    <div
                        ref={emailFormRef}
                        className={styles.emailFormContainer}
                        tabIndex={-1}
                    >
                        <EmailAuthForm
                            onSubmit={handleEmailSubmit}
                            onBack={handleBackFromEmailForm}
                            isLoading={state.loadingProvider === "email"}
                            error={state.error}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
