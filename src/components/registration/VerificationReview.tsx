"use client"

interface VerificationReviewProps {
    email: string
    name: string
    phone: string
    onEdit: (field: "email" | "password" | "name" | "phone") => void
    disabled?: boolean
}

export function VerificationReview({
    email,
    name,
    phone,
    onEdit,
    disabled = false,
}: VerificationReviewProps) {
    const fields = [
        { label: "Email Address", value: email, field: "email" as const },
        { label: "Full Name", value: name, field: "name" as const },
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                    Please review your information before creating your account.
                    You can edit any field by clicking the Edit button.
                </p>
            </div>

            <div className="space-y-3">
                {fields.map(field => (
                    <div
                        key={field.field}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">
                                {field.label}
                            </p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                                {field.isPassword
                                    ? "Password is set and secured"
                                    : field.value}
                            </p>
                        </div>
                        <button
                            onClick={() => onEdit(field.field)}
                            disabled={disabled}
                            className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Edit ${field.label}`}
                        >
                            Edit
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-900">
                    ✓ All information has been validated and is ready for
                    account creation.
                </p>
            </div>
        </div>
    )
}
