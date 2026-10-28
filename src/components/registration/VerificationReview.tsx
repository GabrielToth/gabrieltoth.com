"use client"

import { useTranslations } from "next-intl"

interface VerificationReviewProps {
    email: string
    name: string
    birthDate: string
    phone: string
    onEdit: (
        field: "email" | "password" | "name" | "birthDate" | "phone"
    ) => void
    onCreateAccount?: () => void
    disabled?: boolean
}

export function VerificationReview({
    email,
    name,
    birthDate,
    phone,
    onEdit,
    onCreateAccount,
    disabled = false,
}: VerificationReviewProps) {
    const t = useTranslations("auth.registrationFlow")
    const fields = [
        { label: t("stepEmailAddress"), value: email, field: "email" as const },
        { label: t("fullName"), value: name, field: "name" as const },
        {
            label: t("birthDate"),
            value: birthDate,
            field: "birthDate" as const,
        },
        { label: t("phoneNumber"), value: phone, field: "phone" as const },
        {
            label: t("password"),
            value: "••••••••",
            field: "password" as const,
            isPassword: true,
        },
    ]

    return (
        <div className="w-full space-y-4">
            <div className="bg-primary/5 dark:bg-primary/10 border dark:border-white/10 dark:border-border rounded-lg p-4 mb-6">
                <p className="text-sm text-primary dark:text-primary">
                    Please review your information before creating your account.
                    You can edit any field by clicking the Edit button.
                </p>
            </div>

            <div className="space-y-3">
                {fields.map(field => (
                    <div
                        key={field.field}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-muted dark:bg-muted rounded-lg border border-border dark:border-input gap-4 sm:gap-0"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                                {field.label}
                            </p>
                            <p className="text-base font-semibold text-foreground dark:text-foreground mt-1 break-words">
                                {field.isPassword
                                    ? t("passwordIsSet")
                                    : field.value}
                            </p>
                        </div>
                        <button
                            onClick={() => onEdit(field.field)}
                            disabled={disabled}
                            className="px-4 py-2 text-sm font-medium text-primary dark:text-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-auto flex items-center justify-center"
                            aria-label={t("editField", {
                                field: field.label,
                            })}
                        >
                            {t("edit")}
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-900 dark:text-green-100">
                    {t("allValidated")}
                </p>
            </div>

            <button
                onClick={onCreateAccount ?? (() => {})}
                disabled={disabled}
                className="w-full mt-6 px-4 py-3 text-base font-semibold text-white bg-primary hover:bg-primary rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                aria-label={t("createAccount")}
            >
                {t("createAccount")}
            </button>
        </div>
    )
}
