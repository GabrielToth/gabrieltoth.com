/**
 * useAccountCompletion Hook
 *
 * Manages form state for account completion flow.
 * Handles step navigation, field updates, validation, and form submission.
 *
 * Validates: Requirements 4.10
 */

import { validateAccountCompletionData } from "@/lib/auth/account-completion-validation"
import { useCallback, useState } from "react"

interface PrefilledData {
    email: string
    name: string
    picture?: string
}

interface EditedData {
    email: string
    name: string
}

interface NewFields {
    password: string
    phone: string
    birthDate: string
}

interface AccountCompletionState {
    currentStep: 1 | 2 | 3
    tempToken: string
    prefilledData: PrefilledData
    editedData: EditedData
    newFields: NewFields
    errors: Record<string, string>
    isLoading: boolean
    isSubmitting: boolean
}

interface SubmitResult {
    success: boolean
    error?: string
    redirectUrl?: string
}

/**
 * Hook for managing account completion form state
 */
export function useAccountCompletion() {
    // Get temp token from URL or session
    const getTempToken = useCallback(() => {
        if (typeof window === "undefined") return ""

        const params = new URLSearchParams(window.location.search)
        return params.get("token") || ""
    }, [])

    // Get prefilled data from session or URL
    const getPrefilled = useCallback(() => {
        if (typeof window === "undefined") {
            return {
                email: "",
                name: "",
                picture: undefined,
            }
        }

        // Try to get from session storage first
        const stored = sessionStorage.getItem("accountCompletion_prefilled")
        if (stored) {
            try {
                return JSON.parse(stored)
            } catch {
                // Fall through to default
            }
        }

        // Try to get from URL params
        const params = new URLSearchParams(window.location.search)
        return {
            email: params.get("email") || "",
            name: params.get("name") || "",
            picture: params.get("picture") || undefined,
        }
    }, [])

    const [state, setState] = useState<AccountCompletionState>({
        currentStep: 1,
        tempToken: getTempToken(),
        prefilledData: getPrefilled(),
        editedData: {
            email: getPrefilled().email,
            name: getPrefilled().name,
        },
        newFields: {
            password: "",
            phone: "",
            birthDate: "",
        },
        errors: {},
        isLoading: false,
        isSubmitting: false,
    })

    const setCurrentStep = useCallback((step: 1 | 2 | 3) => {
        setState(prev => ({ ...prev, currentStep: step }))
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
                    [field]: "", // Clear error for this field
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
                    [field]: "", // Clear error for this field
                },
            }))
        },
        []
    )

    const validateStep = useCallback(
        (step: number): boolean => {
            const newErrors: Record<string, string> = {}

            if (step === 1) {
                // Validate pre-filled data
                if (!state.editedData.email) {
                    newErrors.email = "Email is required"
                } else if (
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.editedData.email)
                ) {
                    newErrors.email = "Invalid email format"
                }

                if (!state.editedData.name) {
                    newErrors.name = "Name is required"
                } else if (
                    state.editedData.name.length < 2 ||
                    state.editedData.name.length > 100
                ) {
                    newErrors.name = "Name must be between 2 and 100 characters"
                }
            } else if (step === 2) {
                // Validate new fields
                const validation = validateAccountCompletionData({
                    email: state.editedData.email,
                    name: state.editedData.name,
                    password: state.newFields.password,
                    phone: state.newFields.phone,
                    birthDate: state.newFields.birthDate,
                })

                if (!validation.valid) {
                    Object.assign(newErrors, validation.errors)
                }
            } else if (step === 3) {
                // Final validation of all data
                const validation = validateAccountCompletionData({
                    email: state.editedData.email,
                    name: state.editedData.name,
                    password: state.newFields.password,
                    phone: state.newFields.phone,
                    birthDate: state.newFields.birthDate,
                })

                if (!validation.valid) {
                    Object.assign(newErrors, validation.errors)
                }
            }

            setState(prev => ({
                ...prev,
                errors: newErrors,
            }))

            return Object.keys(newErrors).length === 0
        },
        [state]
    )

    const submitForm = useCallback(async (): Promise<SubmitResult> => {
        setState(prev => ({ ...prev, isSubmitting: true }))

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
                return {
                    success: false,
                    error: data.error || "Failed to complete account setup",
                }
            }

            // Clear session storage on success
            if (typeof window !== "undefined") {
                sessionStorage.removeItem("accountCompletion_prefilled")
            }

            return {
                success: true,
                redirectUrl: data.redirectUrl || "/dashboard",
            }
        } catch (error) {
            console.error("Form submission error:", error)
            return {
                success: false,
                error: "An error occurred. Please try again later.",
            }
        } finally {
            setState(prev => ({ ...prev, isSubmitting: false }))
        }
    }, [state.tempToken, state.editedData, state.newFields])

    const resetForm = useCallback(() => {
        setState({
            currentStep: 1,
            tempToken: getTempToken(),
            prefilledData: getPrefilled(),
            editedData: {
                email: getPrefilled().email,
                name: getPrefilled().name,
            },
            newFields: {
                password: "",
                phone: "",
                birthDate: "",
            },
            errors: {},
            isLoading: false,
            isSubmitting: false,
        })
    }, [getTempToken, getPrefilled])

    return {
        currentStep: state.currentStep,
        tempToken: state.tempToken,
        prefilledData: state.prefilledData,
        editedData: state.editedData,
        newFields: state.newFields,
        errors: state.errors,
        isLoading: state.isLoading,
        isSubmitting: state.isSubmitting,
        setCurrentStep,
        updatePrefilledField,
        updateNewField,
        validateStep,
        submitForm,
        resetForm,
    }
}
