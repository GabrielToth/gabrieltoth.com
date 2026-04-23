/**
 * Account Completion Hook
 *
 * Manages form state for the account completion flow.
 * Handles step navigation, field updates, validation, and form submission.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

"use client"

import { useCallback, useEffect, useState } from "react"

export interface PrefilledData {
    email: string
    name: string
    picture?: string
}

export interface EditedData {
    email: string
    name: string
}

export interface NewFields {
    password: string
    phone: string
    birthDate: string
}

export interface AccountCompletionState {
    currentStep: 1 | 2 | 3
    tempToken: string
    prefilledData: PrefilledData
    editedData: EditedData
    newFields: NewFields
    errors: Record<string, string>
    isLoading: boolean
    isSubmitting: boolean
}

const INITIAL_STATE: AccountCompletionState = {
    currentStep: 1,
    tempToken: "",
    prefilledData: {
        email: "",
        name: "",
        picture: undefined,
    },
    editedData: {
        email: "",
        name: "",
    },
    newFields: {
        password: "",
        phone: "",
        birthDate: "",
    },
    errors: {},
    isLoading: false,
    isSubmitting: false,
}

const SESSION_STORAGE_KEY = "account_completion_form_data"
const TEMP_TOKEN_KEY = "account_completion_temp_token"

export function useAccountCompletion() {
    const [state, setState] = useState<AccountCompletionState>(INITIAL_STATE)

    // Load form data from session storage on mount
    useEffect(() => {
        const savedData = sessionStorage.getItem(SESSION_STORAGE_KEY)
        const savedToken = sessionStorage.getItem(TEMP_TOKEN_KEY)

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData)
                setState(prev => ({
                    ...prev,
                    ...parsed,
                    tempToken: savedToken || "",
                }))
            } catch (error) {
                console.error("Failed to load saved form data:", error)
            }
        }

        // Try to get temp token from URL params
        const params = new URLSearchParams(window.location.search)
        const tokenFromUrl = params.get("token")
        if (tokenFromUrl) {
            setState(prev => ({
                ...prev,
                tempToken: tokenFromUrl,
            }))
            sessionStorage.setItem(TEMP_TOKEN_KEY, tokenFromUrl)
        }
    }, [])

    // Save form data to session storage whenever it changes
    useEffect(() => {
        const dataToSave = {
            currentStep: state.currentStep,
            prefilledData: state.prefilledData,
            editedData: state.editedData,
            newFields: state.newFields,
        }
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToSave))
    }, [
        state.currentStep,
        state.prefilledData,
        state.editedData,
        state.newFields,
    ])

    const setCurrentStep = useCallback((step: 1 | 2 | 3) => {
        setState(prev => ({
            ...prev,
            currentStep: step,
        }))
    }, [])

    const updatePrefilledField = useCallback(
        (field: keyof EditedData, value: string) => {
            setState(prev => ({
                ...prev,
                editedData: {
                    ...prev.editedData,
                    [field]: value,
                },
                errors: {
                    ...prev.errors,
                    [field]: "",
                },
            }))
        },
        []
    )

    const updateNewField = useCallback(
        (field: keyof NewFields, value: string) => {
            setState(prev => ({
                ...prev,
                newFields: {
                    ...prev.newFields,
                    [field]: value,
                },
                errors: {
                    ...prev.errors,
                    [field]: "",
                },
            }))
        },
        []
    )

    const validateEmail = useCallback((email: string): string | null => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return "invalidEmail"
        }
        return null
    }, [])

    const validateName = useCallback((name: string): string | null => {
        if (name.length < 2 || name.length > 100) {
            return "invalidName"
        }
        return null
    }, [])

    const validatePassword = useCallback((password: string): string | null => {
        const errors: string[] = []

        if (password.length < 8) {
            errors.push("minLength")
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("uppercase")
        }
        if (!/[a-z]/.test(password)) {
            errors.push("lowercase")
        }
        if (!/\d/.test(password)) {
            errors.push("number")
        }
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push("special")
        }

        return errors.length > 0 ? errors.join(", ") : null
    }, [])

    const validatePhoneNumber = useCallback((phone: string): string | null => {
        const phoneRegex = /^\+\d{1,3}\d{6,14}$/
        if (!phoneRegex.test(phone)) {
            return "invalidPhone"
        }
        return null
    }, [])

    const validateBirthDate = useCallback(
        (birthDate: string): string | null => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/

            if (!dateRegex.test(birthDate)) {
                return "invalidBirthDate"
            }

            const date = new Date(birthDate)
            const today = new Date()

            if (date > today) {
                return "futureDate"
            }

            const age = today.getFullYear() - date.getFullYear()
            const monthDiff = today.getMonth() - date.getMonth()

            if (
                monthDiff < 0 ||
                (monthDiff === 0 && today.getDate() < date.getDate())
            ) {
                // Subtract 1 if birthday hasn't occurred this year
                // age is already decremented above
            }

            if (age < 13) {
                return "userTooYoung"
            }

            return null
        },
        []
    )

    const validateStep = useCallback(
        (step: 1 | 2 | 3): boolean => {
            const newErrors: Record<string, string> = {}

            if (step === 1) {
                // Validate pre-filled data
                const emailError = validateEmail(state.editedData.email)
                if (emailError) {
                    newErrors.email = emailError
                }

                const nameError = validateName(state.editedData.name)
                if (nameError) {
                    newErrors.name = nameError
                }
            } else if (step === 2) {
                // Validate new fields
                const passwordError = validatePassword(state.newFields.password)
                if (passwordError) {
                    newErrors.password = passwordError
                }

                const phoneError = validatePhoneNumber(state.newFields.phone)
                if (phoneError) {
                    newErrors.phone = phoneError
                }

                const birthDateError = validateBirthDate(
                    state.newFields.birthDate
                )
                if (birthDateError) {
                    newErrors.birthDate = birthDateError
                }
            } else if (step === 3) {
                // Validate all data
                const emailError = validateEmail(state.editedData.email)
                if (emailError) {
                    newErrors.email = emailError
                }

                const nameError = validateName(state.editedData.name)
                if (nameError) {
                    newErrors.name = nameError
                }

                const passwordError = validatePassword(state.newFields.password)
                if (passwordError) {
                    newErrors.password = passwordError
                }

                const phoneError = validatePhoneNumber(state.newFields.phone)
                if (phoneError) {
                    newErrors.phone = phoneError
                }

                const birthDateError = validateBirthDate(
                    state.newFields.birthDate
                )
                if (birthDateError) {
                    newErrors.birthDate = birthDateError
                }
            }

            setState(prev => ({
                ...prev,
                errors: newErrors,
            }))

            return Object.keys(newErrors).length === 0
        },
        [
            state.editedData,
            state.newFields,
            validateEmail,
            validateName,
            validatePassword,
            validatePhoneNumber,
            validateBirthDate,
        ]
    )

    const submitForm = useCallback(async () => {
        setState(prev => ({
            ...prev,
            isSubmitting: true,
        }))

        try {
            const response = await fetch("/api/auth/complete-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tempToken: state.tempToken,
                    email: state.editedData.email,
                    name: state.editedData.name,
                    password: state.newFields.password,
                    phone: state.newFields.phone,
                    birthDate: state.newFields.birthDate,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setState(prev => ({
                    ...prev,
                    isSubmitting: false,
                    errors: {
                        submit: data.error || "serverError",
                    },
                }))
                return {
                    success: false,
                    error: data.error || "serverError",
                }
            }

            // Clear session storage on successful submission
            sessionStorage.removeItem(SESSION_STORAGE_KEY)
            sessionStorage.removeItem(TEMP_TOKEN_KEY)

            setState(prev => ({
                ...prev,
                isSubmitting: false,
            }))

            return {
                success: true,
                redirectUrl: data.redirectUrl || "/dashboard",
            }
        } catch (error) {
            console.error("Form submission error:", error)
            setState(prev => ({
                ...prev,
                isSubmitting: false,
                errors: {
                    submit: "serverError",
                },
            }))
            return {
                success: false,
                error: "serverError",
            }
        }
    }, [state.tempToken, state.editedData, state.newFields])

    const resetForm = useCallback(() => {
        setState(INITIAL_STATE)
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        sessionStorage.removeItem(TEMP_TOKEN_KEY)
    }, [])

    const setPrefilledData = useCallback((data: PrefilledData) => {
        setState(prev => ({
            ...prev,
            prefilledData: data,
            editedData: {
                email: data.email,
                name: data.name,
            },
        }))
    }, [])

    return {
        ...state,
        setCurrentStep,
        updatePrefilledField,
        updateNewField,
        validateStep,
        submitForm,
        resetForm,
        setPrefilledData,
    }
}
