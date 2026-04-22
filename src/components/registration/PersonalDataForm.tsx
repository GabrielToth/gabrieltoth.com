"use client"

import { validateAndNormalizePhoneNumber, validateName } from "@/lib/validation"
import { useEffect, useState } from "react"

interface PersonalDataFormProps {
    name: string
    phone: string
    onNameChange: (name: string) => void
    onPhoneChange: (phone: string) => void
    onValidationChange?: (isValid: boolean) => void
    disabled?: boolean
}

export function PersonalDataForm({
    name,
    phone,
    onNameChange,
    onPhoneChange,
    onValidationChange,
    disabled = false,
}: PersonalDataFormProps) {
    const [nameError, setNameError] = useState<string | null>(null)
    const [phoneError, setPhoneError] = useState<string | null>(null)
    const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null)

    const nameValidation = validateName(name)
    const phoneValidation = validateAndNormalizePhoneNumber(phone)

    useEffect(() => {
        const isValid = nameValidation.isValid && phoneValidation.isValid
        onValidationChange?.(isValid)

        if (!nameValidation.isValid && name) {
            setNameError(nameValidation.error || "Invalid name")
        } else {
            setNameError(null)
        }

        if (!phoneValidation.isValid && phone) {
            setPhoneError(phoneValidation.error || "Invalid phone number")
            setNormalizedPhone(null)
        } else {
            setPhoneError(null)
            setNormalizedPhone(phoneValidation.normalized || null)
        }
    }, [name, phone, nameValidation, phoneValidation, onValidationChange])

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
