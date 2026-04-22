"use client"

import { useCallback, useEffect, useState } from "react"

export interface RegistrationFormData {
    email: string
    password: string
    confirmPassword: string
    name: string
    birthDate: string
    phone: string
}

export interface RegistrationState {
    currentStep: number
    formData: RegistrationFormData
    errors: Record<string, string>
    isLoading: boolean
    isSubmitting: boolean
    sessionId?: string
    sessionExpired?: boolean
    sessionExpiresAt?: Date
}

const INITIAL_FORM_DATA: RegistrationFormData = {
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    birthDate: "",
    phone: "",
}

const SESSION_STORAGE_KEY = "registration_form_data"
const SESSION_ID_KEY = "registration_session_id"
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const SESSION_WARNING_TIME = 5 * 60 * 1000 // Warn 5 minutes before expiration

export function useRegistration() {
    const [state, setState] = useState<RegistrationState>({
        currentStep: 0,
        formData: INITIAL_FORM_DATA,
        errors: {},
        isLoading: false,
        isSubmitting: false,
        sessionId: undefined,
        sessionExpired: false,
        sessionExpiresAt: undefined,
    })

    // Load form data from session storage on mount
    useEffect(() => {
        const savedData = sessionStorage.getItem(SESSION_STORAGE_KEY)
        const savedSessionId = sessionStorage.getItem(SESSION_ID_KEY)

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData)
                setState(prev => ({
                    ...prev,
                    formData: parsed,
                    sessionId: savedSessionId || undefined,
                }))
            } catch (error) {
                console.error("Failed to load saved form data:", error)
            }
        }
    }, [])

    // Save form data to session storage whenever it changes
    useEffect(() => {
        // Don't save empty form data to session storage
        const hasData = Object.values(state.formData).some(
            value => value !== ""
        )
        if (hasData) {
            sessionStorage.setItem(
                SESSION_STORAGE_KEY,
                JSON.stringify(state.formData)
            )
        } else {
            // If all fields are empty, remove from session storage
            sessionStorage.removeItem(SESSION_STORAGE_KEY)
        }
    }, [state.formData])

    // Save session ID to session storage whenever it changes
    useEffect(() => {
        if (state.sessionId) {
            sessionStorage.setItem(SESSION_ID_KEY, state.sessionId)
        }
    }, [state.sessionId])

    // Monitor session expiration
    useEffect(() => {
        if (!state.sessionExpiresAt) return

        const checkExpiration = () => {
            const now = new Date()
            const expiresAt = new Date(state.sessionExpiresAt!)
            const timeUntilExpiration = expiresAt.getTime() - now.getTime()

            // Session has expired
            if (timeUntilExpiration <= 0) {
                setState(prev => ({
                    ...prev,
                    sessionExpired: true,
                }))
                return
            }

            // Warn user 5 minutes before expiration
            if (timeUntilExpiration <= SESSION_WARNING_TIME) {
                // Could trigger a warning notification here
                console.warn(
                    `Registration session will expire in ${Math.round(timeUntilExpiration / 1000 / 60)} minutes`
                )
            }
        }

        // Check expiration immediately and then every minute
        checkExpiration()
        const interval = setInterval(checkExpiration, 60000)

        return () => clearInterval(interval)
    }, [state.sessionExpiresAt])

    const updateFormData = useCallback(
        (updates: Partial<RegistrationFormData>) => {
            setState(prev => ({
                ...prev,
                formData: { ...prev.formData, ...updates },
            }))
        },
        []
    )

    const setError = useCallback((field: string, error: string | null) => {
        setState(prev => ({
            ...prev,
            errors: {
                ...prev.errors,
                [field]: error || undefined,
            },
        }))
    }, [])

    const clearErrors = useCallback(() => {
        setState(prev => ({
            ...prev,
            errors: {},
        }))
    }, [])

    const nextStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.min(prev.currentStep + 1, 3),
        }))
    }, [])

    const previousStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.max(prev.currentStep - 1, 0),
        }))
    }, [])

    const goToStep = useCallback((step: number) => {
        setState(prev => ({
            ...prev,
            currentStep: Math.max(0, Math.min(step, 3)),
        }))
    }, [])

    const setLoading = useCallback((isLoading: boolean) => {
        setState(prev => ({
            ...prev,
            isLoading,
        }))
    }, [])

    const setSubmitting = useCallback((isSubmitting: boolean) => {
        setState(prev => ({
            ...prev,
            isSubmitting,
        }))
    }, [])

    const reset = useCallback(() => {
        setState({
            currentStep: 0,
            formData: INITIAL_FORM_DATA,
            errors: {},
            isLoading: false,
            isSubmitting: false,
            sessionId: undefined,
            sessionExpired: false,
            sessionExpiresAt: undefined,
        })
        // Clear session storage immediately
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        sessionStorage.removeItem(SESSION_ID_KEY)
    }, [])

    /**
     * Set session information (called after server creates session)
     * @param sessionId - The session ID from the server
     * @param expiresAt - The session expiration time
     */
    const setSession = useCallback((sessionId: string, expiresAt: Date) => {
        setState(prev => ({
            ...prev,
            sessionId,
            sessionExpiresAt: expiresAt,
            sessionExpired: false,
        }))
    }, [])

    /**
     * Clear session information (called when session expires or is cleared)
     */
    const clearSession = useCallback(() => {
        setState(prev => ({
            ...prev,
            sessionId: undefined,
            sessionExpiresAt: undefined,
            sessionExpired: false,
        }))
        sessionStorage.removeItem(SESSION_ID_KEY)
    }, [])

    /**
     * Extend session expiration (called on user activity)
     * @param newExpiresAt - The new session expiration time
     */
    const extendSession = useCallback((newExpiresAt: Date) => {
        setState(prev => ({
            ...prev,
            sessionExpiresAt: newExpiresAt,
        }))
    }, [])

    return {
        ...state,
        updateFormData,
        setError,
        clearErrors,
        nextStep,
        previousStep,
        goToStep,
        setLoading,
        setSubmitting,
        reset,
        setSession,
        clearSession,
        extendSession,
    }
}
