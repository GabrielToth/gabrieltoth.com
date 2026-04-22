"use client"

import {
    validateAndNormalizePhoneNumber,
    validateBirthDateFormat,
    validateMinimumAge,
    validateName,
} from "@/lib/validation"
import { useEffect, useState } from "react"

/**
 * GoogleOAuthPersonalInfo Component - Step 2: Personal Information
 *
 * Collects personal information for Google OAuth registration:
 * 1. Pre-fills full name from Google (editable)
 * 2. Collects birth date (DD/MM/YYYY format)
 * 3. Collects phone number (international format support)
 * 4. Real-time validation for all fields
 * 5. Displays specific validation errors for each field
 * 6. Enables/disables Next button based on validation
 *
 * Validates: Requirements 6.1-6.17, 17.1-17.5, 18.1-18.5
 */

interface RegistrationData {
    email: string
    fullName: string
    birthDate: string
    phone: string
}

interface GoogleOAuthPersonalInfoProps {
    googleEmail: string
    googleName: string
    onComplete: (data: RegistrationData) => void
    onBack: () => void
}

export function GoogleOAuthPersonalInfo({
    googleEmail,
    googleName,
    onComplete,
    onBack,
}: GoogleOAuthPersonalInfoProps) {
    const [fullName, setFullName] = useState(googleName)
    const [birthDate, setBirthDate] = useState("")
    const [phone, setPhone] = useState("")

    const [nameError, setNameError] = useState<string | null>(null)
    const [birthDateError, setBirthDateError] = useState<string | null>(null)
    const [phoneError, setPhoneError] = useState<string | null>(null)
    const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null)

    // Validate all fields
    const nameValidation = validateName(fullName)
    const birthDateFormatValidation = validateBirthDateFormat(birthDate)
    const ageValidation = validateMinimumAge(birthDate)
    const phoneValidation = validateAndNormalizePhoneNumber(phone)

    // Check if form is valid
    const isFormValid =
        nameValidation.isValid &&
        birthDateFormatValidation.isValid &&
        ageValidation.isValid &&
        phoneValidation.isValid

    // Update error messages when validation changes
    useEffect(() => {
        if (!nameValidation.isValid && fullName) {
            setNameError(nameValidation.error || "Invalid name")
        } else {
            setNameError(null)
        }

        if (!birthDateFormatValidation.isValid && birthDate) {
            setBirthDateError(
                birthDateFormatValidation.error || "Invalid birth date"
            )
        } else if (!ageValidation.isValid && birthDate) {
            setBirthDateError(ageValidation.error || "Invalid birth date")
        } else {
            setBirthDateError(null)
        }

        if (!phoneValidation.isValid && phone) {
            setPhoneError(phoneValidation.error || "Invalid phone number")
            setNormalizedPhone(null)
        } else {
            setPhoneError(null)
            setNormalizedPhone(phoneValidation.normalized || null)
        }
    }, [
        fullName,
        birthDate,
        phone,
        nameValidation,
        birthDateFormatValidation,
        ageValidation,
        phoneValidation,
    ])

    /**
     * Handle form submission
     */
    const handleNext = () => {
        if (!isFormValid) {
            return
        }

        onComplete({
            email: googleEmail,
            fullName,
            birthDate,
            phone: normalizedPhone || phone,
        })
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                    Complete Your Profile
                </h2>
                <p className="text-gray-400">
                    We've pre-filled your name from Google. Please provide your
                    birth date and phone number.
                </p>
            </div>

            {/* Form Fields */}
            <div className="w-full space-y-4">
                {/* Full Name Input - Pre-filled from Google */}
                <div>
                    <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-gray-200 mb-2"
                    >
                        Full Name
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                            nameError
                                ? "border-red-500 focus:ring-red-500"
                                : nameValidation.isValid && fullName
                                  ? "border-green-500 focus:ring-green-500"
                                  : "border-gray-700 focus:ring-blue-500"
                        }`}
                        aria-label="Full name"
                        aria-describedby={
                            nameError ? "fullName-error" : undefined
                        }
                    />
                    {nameError && (
                        <p
                            id="fullName-error"
                            className="mt-2 text-sm text-red-400"
                        >
                            {nameError}
                        </p>
                    )}
                    {nameValidation.isValid && fullName && (
                        <p className="mt-2 text-sm text-green-400">
                            ✓ Valid name
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        Pre-filled from your Google account. You can edit this
                        if needed.
                    </p>
                </div>

                {/* Birth Date Input */}
                <div>
                    <label
                        htmlFor="birthDate"
                        className="block text-sm font-medium text-gray-200 mb-2"
                    >
                        Birth Date
                    </label>
                    <input
                        id="birthDate"
                        type="text"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                            birthDateError
                                ? "border-red-500 focus:ring-red-500"
                                : birthDateFormatValidation.isValid &&
                                    ageValidation.isValid &&
                                    birthDate
                                  ? "border-green-500 focus:ring-green-500"
                                  : "border-gray-700 focus:ring-blue-500"
                        }`}
                        aria-label="Birth date"
                        aria-describedby={
                            birthDateError ? "birthDate-error" : undefined
                        }
                    />
                    {birthDateError && (
                        <p
                            id="birthDate-error"
                            className="mt-2 text-sm text-red-400"
                        >
                            {birthDateError}
                        </p>
                    )}
                    {birthDateFormatValidation.isValid &&
                        ageValidation.isValid &&
                        birthDate && (
                            <p className="mt-2 text-sm text-green-400">
                                ✓ Valid birth date
                            </p>
                        )}
                    <p className="mt-1 text-xs text-gray-500">
                        Format: DD/MM/YYYY (e.g., 15/03/1990). You must be at
                        least 13 years old.
                    </p>
                </div>

                {/* Phone Number Input */}
                <div>
                    <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-200 mb-2"
                    >
                        Phone Number
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                            phoneError
                                ? "border-red-500 focus:ring-red-500"
                                : phoneValidation.isValid && phone
                                  ? "border-green-500 focus:ring-green-500"
                                  : "border-gray-700 focus:ring-blue-500"
                        }`}
                        aria-label="Phone number"
                        aria-describedby={
                            phoneError ? "phone-error" : undefined
                        }
                    />
                    {phoneError && (
                        <p
                            id="phone-error"
                            className="mt-2 text-sm text-red-400"
                        >
                            {phoneError}
                        </p>
                    )}
                    {phoneValidation.isValid && phone && (
                        <p className="mt-2 text-sm text-green-400">
                            ✓ Valid phone ({normalizedPhone})
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        Supports international formats (e.g., +1 555 123 4567,
                        +55 11 98765-4321)
                    </p>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col gap-3 pt-4">
                {/* Next Button */}
                <button
                    onClick={handleNext}
                    disabled={!isFormValid}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                    aria-label="Proceed to next step"
                >
                    Next
                </button>

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    aria-label="Go back to previous step"
                >
                    Back
                </button>
            </div>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center">
                Your information is secure and will only be used to create your
                account.
            </p>
        </div>
    )
}
