"use client"

import { useRegistration } from "@/hooks/useRegistration"
import { useEffect, useState } from "react"
import { AuthenticationEntry } from "./AuthenticationEntry"
import { EmailInput } from "./EmailInput"
import { ErrorDisplay } from "./ErrorDisplay"
import { GoogleOAuthFlow } from "./GoogleOAuthFlow"
import { NavigationButtons } from "./NavigationButtons"
import { PasswordSetup } from "./PasswordSetup"
import { PersonalDataForm } from "./PersonalDataForm"
import { ProgressIndicator } from "./ProgressIndicator"
import { SuccessMessage } from "./SuccessMessage"
import { VerificationReview } from "./VerificationReview"

export function RegistrationFlow() {
    const registration = useRegistration()
    const [generalError, setGeneralError] = useState<string | null>(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const [authMethod, setAuthMethod] = useState<"email" | "google" | null>(
        null
    )
    const [stepValidation, setStepValidation] = useState({
        email: false,
        password: false,
        personal: false,
    })
    const [sessionWarning, setSessionWarning] = useState(false)

    // Initialize registration session on mount
    useEffect(() => {
        const initializeSession = async () => {
            try {
                // Check if there's an existing session
                const response = await fetch("/api/auth/registration-session")
                if (response.ok) {
                    const data = await response.json()
                    if (data.data) {
                        registration.setSession(
                            data.data.sessionId,
                            new Date(data.data.expiresAt)
                        )
                        // Restore form data from session if available
                        if (data.data.email) {
                            registration.updateFormData({
                                email: data.data.email,
                                name: data.data.name || "",
                                phone: data.data.phone || "",
                            })
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to initialize session:", error)
            }
        }

        initializeSession()
    }, [registration])

    // Monitor session expiration and show warning
    useEffect(() => {
        if (!registration.sessionExpiresAt) return

        const checkSessionExpiration = () => {
            const now = new Date()
            const expiresAt = new Date(registration.sessionExpiresAt!)
            const timeUntilExpiration = expiresAt.getTime() - now.getTime()

            // Show warning 5 minutes before expiration
            if (
                timeUntilExpiration > 0 &&
                timeUntilExpiration <= 5 * 60 * 1000
            ) {
                setSessionWarning(true)
            } else if (timeUntilExpiration > 5 * 60 * 1000) {
                setSessionWarning(false)
            }

            // Session has expired
            if (timeUntilExpiration <= 0) {
                registration.clearSession()
                setGeneralError(
                    "Your registration session has expired. Please start over."
                )
                registration.reset()
            }
        }

        checkSessionExpiration()
        const interval = setInterval(checkSessionExpiration, 30000) // Check every 30 seconds

        return () => clearInterval(interval)
    }, [registration.sessionExpiresAt, registration])

    const handleEmailValidation = (isValid: boolean) => {
        setStepValidation(prev => ({ ...prev, email: isValid }))
    }

    const handlePasswordValidation = (isValid: boolean) => {
        setStepValidation(prev => ({ ...prev, password: isValid }))
    }

    const handlePersonalValidation = (isValid: boolean) => {
        setStepValidation(prev => ({ ...prev, personal: isValid }))
    }

    const handleNext = async () => {
        if (authMethod === "email") {
            if (registration.currentStep === 1 && !stepValidation.email) {
                setGeneralError("Please enter a valid email address")
                return
            }

            if (registration.currentStep === 2 && !stepValidation.password) {
                setGeneralError("Please enter a valid password")
                return
            }

            if (registration.currentStep === 3 && !stepValidation.personal) {
                setGeneralError("Please enter valid personal information")
                return
            }

            if (registration.currentStep === 4) {
                // Submit registration
                await handleSubmit()
                return
            }
        } else if (authMethod === "google") {
            if (registration.currentStep === 2) {
                // Submit registration
                await handleSubmit()
                return
            }
        }

        setGeneralError(null)
        registration.nextStep()

        // Update session with new step
        if (registration.sessionId) {
            try {
                await fetch("/api/auth/registration-session", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentStep: registration.currentStep + 1,
                    }),
                })
            } catch (error) {
                console.error("Failed to update session:", error)
            }
        }
    }

    const handleSubmit = async () => {
        registration.setSubmitting(true)
        setGeneralError(null)

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: registration.formData.email,
                    password: registration.formData.password,
                    name: registration.formData.name,
                    birthDate: registration.formData.birthDate,
                    phone: registration.formData.phone,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setGeneralError(
                    data.error || "Registration failed. Please try again."
                )
                return
            }

            // Success - clear session
            if (registration.sessionId) {
                try {
                    await fetch("/api/auth/registration-session", {
                        method: "DELETE",
                    })
                } catch (error) {
                    console.error("Failed to clear session:", error)
                }
            }

            registration.reset()
            setShowSuccess(true)
        } catch (error) {
            console.error("Registration error:", error)
            setGeneralError("An unexpected error occurred. Please try again.")
        } finally {
            registration.setSubmitting(false)
        }
    }

    const handleCancel = () => {
        if (
            confirm("Are you sure you want to cancel? Your data will be lost.")
        ) {
            // Clear session
            if (registration.sessionId) {
                fetch("/api/auth/registration-session", {
                    method: "DELETE",
                }).catch(error =>
                    console.error("Failed to clear session:", error)
                )
            }

            registration.reset()
            setGeneralError(null)
            setAuthMethod(null)
        }
    }

    const handleEdit = (
        field: "email" | "password" | "name" | "birthDate" | "phone"
    ) => {
        // For email auth: email=0, password=1, personal=2, verification=3
        // For google auth: personal=0, verification=1
        if (authMethod === "google") {
            // Google auth only has personal info step
            if (
                field === "name" ||
                field === "birthDate" ||
                field === "phone"
            ) {
                registration.goToStep(0)
            }
        } else {
            // Email auth has multiple steps
            const stepMap = {
                email: 0,
                password: 1,
                name: 2,
                birthDate: 2,
                phone: 2,
            }
            registration.goToStep(stepMap[field])
        }
    }

    const handleEmailSelected = () => {
        setAuthMethod("email")
        registration.nextStep()
    }

    const handleGoogleSelected = () => {
        setAuthMethod("google")
        registration.nextStep()
    }

    const handleGoogleComplete = (data: {
        email: string
        name: string
        birthDate: string
        phone: string
    }) => {
        registration.updateFormData({
            email: data.email,
            name: data.name,
            birthDate: data.birthDate,
            phone: data.phone,
        })
        registration.nextStep()
    }

    const handleBackFromAuth = () => {
        setAuthMethod(null)
        registration.previousStep()
    }

    if (registration.sessionExpired) {
        return (
            <div className="flex items-center justify-center pt-20 pb-12 px-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <div className="mb-4 flex justify-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-red-600 dark:text-red-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Session Expired
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Your registration session has expired. Please start
                        over.
                    </p>
                    <a
                        href="/register"
                        className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Start Over
                    </a>
                </div>
            </div>
        )
    }

    if (showSuccess) {
        return (
            <SuccessMessage
                message="Account created successfully! Redirecting to login..."
                redirectUrl="/login"
                redirectDelay={2000}
            />
        )
    }

    // If user is in the registration process, hide the header/menu
    if (authMethod) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div
                    className="w-full max-w-md"
                    role="main"
                    aria-label="Registration form"
                >
                    {/* Progress Indicator */}
                    <ProgressIndicator
                        currentStep={
                            authMethod === "google"
                                ? registration.currentStep
                                : registration.currentStep
                        }
                    />

                    {/* Error Display */}
                    <ErrorDisplay
                        error={generalError}
                        onDismiss={() => setGeneralError(null)}
                    />

                    {/* Session Warning */}
                    {sessionWarning && (
                        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-start gap-3">
                            <div className="shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5">
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                    Your session will expire soon. Please
                                    complete your registration.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="mt-8">
                        {/* Email Registration Flow */}
                        {authMethod === "email" && (
                            <>
                                {registration.currentStep === 1 && (
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-4">
                                            Email Address
                                        </h2>
                                        <EmailInput
                                            value={registration.formData.email}
                                            onChange={email =>
                                                registration.updateFormData({
                                                    email,
                                                })
                                            }
                                            onValidationChange={
                                                handleEmailValidation
                                            }
                                            disabled={registration.isSubmitting}
                                        />
                                    </div>
                                )}

                                {registration.currentStep === 2 && (
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-4">
                                            Password Setup
                                        </h2>
                                        <PasswordSetup
                                            value={
                                                registration.formData.password
                                            }
                                            confirmValue={
                                                registration.formData
                                                    .confirmPassword
                                            }
                                            onChange={password =>
                                                registration.updateFormData({
                                                    password,
                                                })
                                            }
                                            onConfirmChange={confirmPassword =>
                                                registration.updateFormData({
                                                    confirmPassword,
                                                })
                                            }
                                            onValidationChange={
                                                handlePasswordValidation
                                            }
                                            disabled={registration.isSubmitting}
                                        />
                                    </div>
                                )}

                                {registration.currentStep === 3 && (
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-4">
                                            Personal Information
                                        </h2>
                                        <PersonalDataForm
                                            name={registration.formData.name}
                                            birthDate={
                                                registration.formData.birthDate
                                            }
                                            phone={registration.formData.phone}
                                            onNameChange={name =>
                                                registration.updateFormData({
                                                    name,
                                                })
                                            }
                                            onBirthDateChange={birthDate =>
                                                registration.updateFormData({
                                                    birthDate,
                                                })
                                            }
                                            onPhoneChange={phone =>
                                                registration.updateFormData({
                                                    phone,
                                                })
                                            }
                                            onValidationChange={
                                                handlePersonalValidation
                                            }
                                            disabled={registration.isSubmitting}
                                        />
                                    </div>
                                )}

                                {registration.currentStep === 4 && (
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-4">
                                            Review Information
                                        </h2>
                                        <VerificationReview
                                            email={registration.formData.email}
                                            name={registration.formData.name}
                                            birthDate={
                                                registration.formData.birthDate
                                            }
                                            phone={registration.formData.phone}
                                            onEdit={handleEdit}
                                            disabled={registration.isSubmitting}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Google OAuth Flow */}
                        {authMethod === "google" && (
                            <>
                                {registration.currentStep === 1 && (
                                    <GoogleOAuthFlow
                                        googleClientId={
                                            process.env
                                                .NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
                                            ""
                                        }
                                        onComplete={handleGoogleComplete}
                                        onBack={handleBackFromAuth}
                                    />
                                )}

                                {registration.currentStep === 2 && (
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-4">
                                            Review Information
                                        </h2>
                                        <VerificationReview
                                            email={registration.formData.email}
                                            name={registration.formData.name}
                                            birthDate={
                                                registration.formData.birthDate
                                            }
                                            phone={registration.formData.phone}
                                            onEdit={handleEdit}
                                            disabled={registration.isSubmitting}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <NavigationButtons
                        onBack={
                            authMethod === "email"
                                ? registration.currentStep > 1
                                    ? registration.previousStep
                                    : handleBackFromAuth
                                : registration.currentStep > 1
                                  ? registration.previousStep
                                  : handleBackFromAuth
                        }
                        onNext={handleNext}
                        nextLabel={
                            authMethod === "email"
                                ? registration.currentStep === 4
                                    ? "Create Account"
                                    : "Next"
                                : registration.currentStep === 2
                                  ? "Create Account"
                                  : "Next"
                        }
                        nextDisabled={
                            authMethod === "email"
                                ? registration.currentStep === 1
                                    ? !stepValidation.email
                                    : registration.currentStep === 2
                                      ? !stepValidation.password
                                      : registration.currentStep === 3
                                        ? !stepValidation.personal
                                        : false
                                : false
                        }
                        isLoading={registration.isSubmitting}
                        showCancel={true}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        )
    }

    // Initial registration page with menu visible
    return (
        <div className="flex items-center justify-center pt-20 pb-12 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                        Create Account
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                        Join us today and get started in just a few steps
                    </p>

                    <AuthenticationEntry
                        onEmailSelected={handleEmailSelected}
                        onGoogleSelected={handleGoogleSelected}
                        isLoading={registration.isSubmitting}
                    />

                    <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
