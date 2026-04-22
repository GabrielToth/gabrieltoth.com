"use client"

interface VerificationReviewProps {
    email: string
    name: string
    birthDate: string
    phone: string
    onEdit: (
        field: "email" | "password" | "name" | "birthDate" | "phone"
    ) => void
    onCreateAccount: () => void
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
    const fields = [
        { label: "Email Address", value: email, field: "email" as const },
        { label: "Full Name", value: name, field: "name" as const },
        {
            label: "Birth Date",
            value: birthDate,
            field: "birthDate" as const,
        },
        { label: "Phone Number", value: phone, field: "phone" as const },
        {
            label: "Password",
            value: "••••••••",
            field: "password" as const,
            isPassword: true,
        },
    ]

    return (
        <div className="w-full space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                    Please review your information before creating your account.
                    You can edit any field by clicking the Edit button.
                </p>
            </div>

            <div className="space-y-3">
                {fields.map(field => (
                    <div
                        key={field.field}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 gap-4 sm:gap-0"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {field.label}
                            </p>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1 break-words">
                                {field.isPassword
                                    ? "Password is set and secured"
                                    : field.value}
                            </p>
                        </div>
                        <button
                            onClick={() => onEdit(field.field)}
                            disabled={disabled}
                            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-auto flex items-center justify-center"
                            aria-label={`Edit ${field.label}`}
                        >
                            Edit
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-900 dark:text-green-100">
                    ✓ All information has been validated and is ready for
                    account creation.
                </p>
            </div>

            <button
                onClick={onCreateAccount}
                disabled={disabled}
                className="w-full mt-6 px-4 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                aria-label="Create Account"
            >
                Create Account
            </button>
        </div>
    )
}
