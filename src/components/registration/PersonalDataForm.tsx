"use client"

import { validateAndNormalizePhoneNumber, validateName } from "@/lib/validation"
import { useEffect, useState } from "react"

interface PersonalDataFormProps {
    name: string
    birthDate: string
    phone: string
    onNameChange: (name: string) => void
    onBirthDateChange: (birthDate: string) => void
    onPhoneChange: (phone: string) => void
    onValidationChange?: (isValid: boolean) => void
    disabled?: boolean
}

export function PersonalDataForm({
    name,
    birthDate,
    phone,
    onNameChange,
    onBirthDateChange,
    onPhoneChange,
    onValidationChange,
    disabled = false,
}: PersonalDataFormProps) {
    const [nameError, setNameError] = useState<string | null>(null)
    const [birthDateError, setBirthDateError] = useState<string | null>(null)
    const [phoneError, setPhoneError] = useState<string | null>(null)
    const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null)

    const nameValidation = validateName(name)
    const birthDateFormatValidation = validateBirthDateFormat(birthDate)
    const ageValidation = validateMinimumAge(birthDate)
    const phoneValidation = validateAndNormalizePhoneNumber(phone)

    useEffect(() => {
        const isValid =
            nameValidation.isValid &&
            birthDateFormatValidation.isValid &&
            ageValidation.isValid &&
            phoneValidation.isValid
        onValidationChange?.(isValid)

        if (!nameValidation.isValid && name) {
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
        name,
        birthDate,
        phone,
        nameValidation,
        birthDateFormatValidation,
        ageValidation,
        phoneValidation,
        onValidationChange,
    ])

    return (
        <div className="w-full space-y-4">
            {/* Full Name Input */}
            <div>
                <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-900 mb-2"
                >
                    Full Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => onNameChange(e.target.value)}
                    disabled={disabled}
                    placeholder="John Doe"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        nameError
                            ? "border-red-500 focus:ring-red-200"
                            : nameValidation.isValid && name
                              ? "border-green-500 focus:ring-green-200"
                              : "border-gray-300 focus:ring-blue-200"
                    }`}
                    aria-label="Full name"
                    aria-describedby={nameError ? "name-error" : undefined}
                />
                {nameError && (
                    <p id="name-error" className="mt-1 text-sm text-red-600">
                        {nameError}
                    </p>
                )}
                {nameValidation.isValid && name && (
                    <p className="mt-1 text-sm text-green-600">✓ Valid name</p>
                )}
            </div>

            {/* Birth Date Input */}
            <div>
                <label
                    htmlFor="birthDate"
                    className="block text-sm font-medium text-gray-900 mb-2"
                >
                    Birth Date
                </label>
                <input
                    id="birthDate"
                    type="text"
                    value={birthDate}
                    onChange={e => onBirthDateChange(e.target.value)}
                    disabled={disabled}
                    placeholder="DD/MM/YYYY"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        birthDateError
                            ? "border-red-500 focus:ring-red-200"
                            : birthDateFormatValidation.isValid &&
                                ageValidation.isValid &&
                                birthDate
                              ? "border-green-500 focus:ring-green-200"
                              : "border-gray-300 focus:ring-blue-200"
                    }`}
                    aria-label="Birth date"
                    aria-describedby={
                        birthDateError ? "birthDate-error" : undefined
                    }
                />
                {birthDateError && (
                    <p
                        id="birthDate-error"
                        className="mt-1 text-sm text-red-600"
                    >
                        {birthDateError}
                    </p>
                )}
                {birthDateFormatValidation.isValid &&
                    ageValidation.isValid &&
                    birthDate && (
                        <p className="mt-1 text-sm text-green-600">
                            ✓ Valid birth date
                        </p>
                    )}
                <p className="mt-1 text-xs text-gray-500">
                    Format: DD/MM/YYYY (e.g., 15/03/1990). You must be at least
                    13 years old.
                </p>
            </div>

            {/* Phone Number Input */}
            <div>
                <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-900 mb-2"
                >
                    Phone Number
                </label>
                <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => onPhoneChange(e.target.value)}
                    disabled={disabled}
                    placeholder="+1 (555) 123-4567"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        phoneError
                            ? "border-red-500 focus:ring-red-200"
                            : phoneValidation.isValid && phone
                              ? "border-green-500 focus:ring-green-200"
                              : "border-gray-300 focus:ring-blue-200"
                    }`}
                    aria-label="Phone number"
                    aria-describedby={phoneError ? "phone-error" : undefined}
                />
                {phoneError && (
                    <p id="phone-error" className="mt-1 text-sm text-red-600">
                        {phoneError}
                    </p>
                )}
                {phoneValidation.isValid && phone && (
                    <p className="mt-1 text-sm text-green-600">
                        ✓ Valid phone ({normalizedPhone})
                    </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    Supports international formats (e.g., +1 555 123 4567, +55
                    11 98765-4321)
                </p>
            </div>
        </div>
    )
}
