"use client"

import {
    validateAndNormalizePhoneNumber,
    validateBirthDateFormat,
    validateMinimumAge,
    validateName,
} from "@/lib/validation"
import { useTranslations } from "next-intl"
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
    const t = useTranslations("auth.registrationFlow")

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
                    className="block text-sm sm:text-base font-medium text-foreground dark:text-foreground mb-2"
                >
                    {t("fullName")}
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => onNameChange(e.target.value)}
                    disabled={disabled}
                    placeholder={t("fullNamePlaceholder")}
                    className={`w-full px-4 py-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all min-h-[44px] sm:min-h-auto ${
                        nameError
                            ? "border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-900"
                            : nameValidation.isValid && name
                              ? "border-green-500 focus:ring-green-200 dark:border-green-400 dark:focus:ring-green-900"
                              : "border-input dark:border-input focus:ring-ring dark:focus:ring-ring"
                    } bg-card text-foreground dark:text-foreground`}
                    aria-label={t("fullNameLabel")}
                    aria-describedby={nameError ? "name-error" : undefined}
                    required
                />
                {nameError && (
                    <p
                        id="name-error"
                        className="mt-2 text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {nameError}
                    </p>
                )}
                {nameValidation.isValid && name && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        {t("validName")}
                    </p>
                )}
            </div>

            {/* Birth Date Input */}
            <div>
                <label
                    htmlFor="birthDate"
                    className="block text-sm sm:text-base font-medium text-foreground dark:text-foreground mb-2"
                >
                    {t("birthDate")}
                </label>
                <input
                    id="birthDate"
                    type="text"
                    value={birthDate}
                    onChange={e => onBirthDateChange(e.target.value)}
                    disabled={disabled}
                    placeholder={t("birthDatePlaceholder")}
                    className={`w-full px-4 py-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all min-h-[44px] sm:min-h-auto ${
                        birthDateError
                            ? "border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-900"
                            : birthDateFormatValidation.isValid &&
                                ageValidation.isValid &&
                                birthDate
                              ? "border-green-500 focus:ring-green-200 dark:border-green-400 dark:focus:ring-green-900"
                              : "border-input dark:border-input focus:ring-ring dark:focus:ring-ring"
                    } bg-card text-foreground dark:text-foreground`}
                    aria-label={t("birthDateLabel")}
                    aria-describedby={
                        birthDateError ? "birthDate-error" : "birthDate-hint"
                    }
                    required
                />
                {birthDateError && (
                    <p
                        id="birthDate-error"
                        className="mt-2 text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {birthDateError}
                    </p>
                )}
                {birthDateFormatValidation.isValid &&
                    ageValidation.isValid &&
                    birthDate && (
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                            {t("validBirthDate")}
                        </p>
                    )}
                <p
                    id="birthDate-hint"
                    className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground"
                >
                    Format: DD/MM/YYYY (e.g., 15/03/1990). You must be at least
                    13 years old.
                </p>
            </div>

            {/* Phone Number Input */}
            <div>
                <label
                    htmlFor="phone"
                    className="block text-sm sm:text-base font-medium text-foreground dark:text-foreground mb-2"
                >
                    {t("phoneNumber")}
                </label>
                <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => onPhoneChange(e.target.value)}
                    disabled={disabled}
                    placeholder={t("phonePlaceholder")}
                    className={`w-full px-4 py-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all min-h-[44px] sm:min-h-auto ${
                        phoneError
                            ? "border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-900"
                            : phoneValidation.isValid && phone
                              ? "border-green-500 focus:ring-green-200 dark:border-green-400 dark:focus:ring-green-900"
                              : "border-input dark:border-input focus:ring-ring dark:focus:ring-ring"
                    } bg-card text-foreground dark:text-foreground`}
                    aria-label={t("phoneLabel")}
                    aria-describedby={phoneError ? "phone-error" : "phone-hint"}
                    required
                />
                {phoneError && (
                    <p
                        id="phone-error"
                        className="mt-2 text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {phoneError}
                    </p>
                )}
                {phoneValidation.isValid && phone && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        {t("validPhone", {
                            phone: normalizedPhone ?? phone,
                        })}
                    </p>
                )}
                <p
                    id="phone-hint"
                    className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground"
                >
                    {t("phoneHint")}
                </p>
            </div>
        </div>
    )
}
