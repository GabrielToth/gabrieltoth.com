"use client"

import { useEffect, useState } from "react"
import { ErrorDisplay } from "./ErrorDisplay"
import { NavigationButtons } from "./NavigationButtons"
import { PersonalDataForm } from "./PersonalDataForm"

interface GoogleOAuthFlowProps {
    onComplete: (data: {
        email: string
        name: string
        birthDate: string
        phone: string
    }) => void
    onBack: () => void
    googleClientId: string
}

export function GoogleOAuthFlow({
    onComplete,
    onBack,
    googleClientId,
}: GoogleOAuthFlowProps) {
    const [step, setStep] = useState<"authorization" | "personal">(
        "authorization"
    )
    const [googleData, setGoogleData] = useState<{
        email: string
        name: string
    } | null>(null)
    const [personalData, setPersonalData] = useState({
        name: "",
        birthDate: "",
        phone: "",
    })
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [personalValidation, setPersonalValidation] = useState(false)

    // Handle OAuth callback
    useEffect(() => {
        const handleOAuthCallback = async () => {
            const params = new URLSearchParams(window.location.search)
            const code = params.get("code")
            const state = params.get("state")

            if (!code) {
                return
            }

            setIsLoading(true)
            try {
                const response = await fetch("/api/auth/google/callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, state }),
                })

                const data = await response.json()

                if (!response.ok) {
                    setError(
                        data.error ||
                            "Google authorization failed. Please try again."
                    )
                    return
                }

                // Pre-fill name from Google
                setGoogleData({
                    email: data.data.email,
                    name: data.data.name,
                })
                setPersonalData(prev => ({
                    ...prev,
                    name: data.data.name,
                }))
                setStep("personal")

                // Clean up URL
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                )
            } catch (err) {
                console.error("OAuth callback error:", err)
                setError("Google authorization failed. Please try again.")
            } finally {
                setIsLoading(false)
            }
        }

        handleOAuthCallback()
    }, [])

    const handleStartOAuth = () => {
        setIsLoading(true)
        setError(null)

        try {
            // Generate state for CSRF protection
            const state = Math.random().toString(36).substring(7)
            sessionStorage.setItem("oauth_state", state)

            // Construct Google OAuth URL
            const params = new URLSearchParams({
                client_id: googleClientId,
                redirect_uri:
                    typeof window !== "undefined"
                        ? `${window.location.origin}/register`
                        : "",
                response_type: "code",
                scope: "email profile",
                state,
            })

            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
        } catch (err) {
            console.error("OAuth error:", err)
            setError("Failed to start Google authorization. Please try again.")
            setIsLoading(false)
        }
    }

    const handleNext = () => {
        if (personalValidation && googleData) {
            onComplete({
                email: googleData.email,
                name: personalData.name,
                birthDate: personalData.birthDate,
                phone: personalData.phone,
            })
        }
    }

    if (step === "authorization") {
        return (
            <div className="w-full space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Sign up with Google
                    </h2>
                    <p className="text-gray-600">
                        Click the button below to authorize with your Google
                        account
                    </p>
                </div>

                {error && (
                    <ErrorDisplay
                        error={error}
                        onDismiss={() => setError(null)}
                    />
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleStartOAuth}
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-white hover:bg-slate-100 disabled:bg-white disabled:opacity-50 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                                Authorizing...
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Authorize with Google
                            </>
                        )}
                    </button>

                    <button
                        onClick={onBack}
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 disabled:opacity-50 text-gray-900 font-semibold rounded-lg transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Complete Your Profile
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                    We've pre-filled your name from Google. Please complete the
                    remaining information.
                </p>
            </div>

            {error && (
                <ErrorDisplay error={error} onDismiss={() => setError(null)} />
            )}

            <PersonalDataForm
                name={personalData.name}
                birthDate={personalData.birthDate}
                phone={personalData.phone}
                onNameChange={name =>
                    setPersonalData(prev => ({ ...prev, name }))
                }
                onBirthDateChange={birthDate =>
                    setPersonalData(prev => ({ ...prev, birthDate }))
                }
                onPhoneChange={phone =>
                    setPersonalData(prev => ({ ...prev, phone }))
                }
                onValidationChange={setPersonalValidation}
                disabled={isLoading}
            />

            <NavigationButtons
                onBack={onBack}
                onNext={handleNext}
                nextLabel="Next"
                nextDisabled={!personalValidation}
                isLoading={isLoading}
                showCancel={false}
            />
        </div>
    )
}
