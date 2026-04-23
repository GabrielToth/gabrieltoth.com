/**
 * Account Completion Form Container
 *
 * Manages the multi-step form flow for account completion.
 * Handles step navigation, form submission, and error handling.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

"use client"

import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import ProgressIndicator from "./components/progress-indicator"
import { useAccountCompletion } from "./hooks/useAccountCompletion"
import Step1Prefilled from "./steps/step-1-prefilled"
import Step2NewFields from "./steps/step-2-new-fields"
import Step3Verification from "./steps/step-3-verification"

interface CompleteAccountFormProps {
    locale: string
}

export default function CompleteAccountForm({
    locale,
}: CompleteAccountFormProps) {
    const t = useTranslations("auth")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const {
        currentStep,
        tempToken,
        prefilledData,
        editedData,
        newFields,
        errors,
        setCurrentStep,
        updatePrefilledField,
        updateNewField,
        validateStep,
        submitForm,
        resetForm,
    } = useAccountCompletion()

    // Load temp token from URL or session on mount
    useEffect(() => {
        const loadTempToken = async () => {
            try {
                // Try to get temp token from URL params or session
                const params = new URLSearchParams(window.location.search)
                const tokenFromUrl = params.get("token")

                if (tokenFromUrl) {
                    // Token is in URL, form will use it
                    return
                }

                // If no token in URL, check if we have one in session
                // This would be set by the middleware
                const response = await fetch("/api/auth/me")
                if (!response.ok) {
                    setError(t("completeAccount.errors.invalidToken"))
                    return
                }
            } catch (err) {
                console.error("Failed to load temp token:", err)
                setError(t("completeAccount.errors.serverError"))
            }
        }

        loadTempToken()
    }, [t])

    const handleContinue = useCallback(async () => {
        setError(null)

        // Validate current step
        const isValid = validateStep(currentStep)
        if (!isValid) {
            setError(t("completeAccount.errors.validationFailed"))
            return
        }

        // Move to next step
        if (currentStep < 3) {
            setCurrentStep((currentStep + 1) as 1 | 2 | 3)
        }
    }, [currentStep, validateStep, setCurrentStep, t])

    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as 1 | 2 | 3)
        }
    }, [currentStep, setCurrentStep])

    const handleEditSection = useCallback(
        (section: "prefilled" | "newFields") => {
            if (section === "prefilled") {
                setCurrentStep(1)
            } else {
                setCurrentStep(2)
            }
        },
        [setCurrentStep]
    )

    const handleSubmit = useCallback(async () => {
        setError(null)
        setIsLoading(true)

        try {
            // Validate all data before submission
            const isValid = validateStep(3)
            if (!isValid) {
                setError(t("completeAccount.errors.validationFailed"))
                setIsLoading(false)
                return
            }

            // Submit form
            const result = await submitForm()

            if (result.success) {
                setSuccessMessage(t("completeAccount.step3.success"))
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = result.redirectUrl || "/dashboard"
                }, 1500)
            } else {
                setError(
                    result.error || t("completeAccount.errors.serverError")
                )
            }
        } catch (err) {
            console.error("Form submission error:", err)
            setError(t("completeAccount.errors.serverError"))
        } finally {
            setIsLoading(false)
        }
    }, [validateStep, submitForm, t])

    const handleReset = useCallback(() => {
        resetForm()
        setError(null)
        setSuccessMessage(null)
    }, [resetForm])

    return (
        <div className="space-y-8">
            {/* Progress Indicator */}
            <ProgressIndicator currentStep={currentStep} totalSteps={3} />

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                        {error}
                    </p>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 text-sm">
                        {successMessage}
                    </p>
                </div>
            )}

            {/* Step Content */}
            <div className="min-h-96">
                {currentStep === 1 && (
                    <Step1Prefilled
                        prefilledData={prefilledData}
                        editedData={editedData}
                        errors={errors}
                        onUpdateField={updatePrefilledField}
                        onContinue={handleContinue}
                        isLoading={isLoading}
                    />
                )}

                {currentStep === 2 && (
                    <Step2NewFields
                        newFields={newFields}
                        errors={errors}
                        onUpdateField={updateNewField}
                        onContinue={handleContinue}
                        onBack={handleBack}
                        isLoading={isLoading}
                    />
                )}

                {currentStep === 3 && (
                    <Step3Verification
                        prefilledData={prefilledData}
                        editedData={editedData}
                        newFields={newFields}
                        errors={errors}
                        onEditSection={handleEditSection}
                        onSubmit={handleSubmit}
                        onBack={handleBack}
                        isLoading={isLoading}
                    />
                )}
            </div>

            {/* Back to Login Link */}
            {currentStep === 1 && (
                <div className="text-center">
                    <a
                        href={`/${locale}/login`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                        {t("completeAccount.backToLogin")}
                    </a>
                </div>
            )}
        </div>
    )
}
