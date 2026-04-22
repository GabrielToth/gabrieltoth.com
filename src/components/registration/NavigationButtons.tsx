"use client"

interface NavigationButtonsProps {
    onBack?: () => void
    onNext?: () => void
    onCancel?: () => void
    nextLabel?: string
    backDisabled?: boolean
    nextDisabled?: boolean
    isLoading?: boolean
    showCancel?: boolean
}

export function NavigationButtons({
    onBack,
    onNext,
    onCancel,
    nextLabel = "Next",
    backDisabled = false,
    nextDisabled = false,
    isLoading = false,
    showCancel = true,
}: NavigationButtonsProps) {
    return (
        <div className="flex gap-3 mt-8">
            {onBack && (
                <button
                    onClick={onBack}
                    disabled={backDisabled || isLoading}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Go back to previous step"
                >
                    Back
                </button>
            )}

            {showCancel && onCancel && (
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-6 py-2 border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Cancel registration"
                >
                    Cancel
                </button>
            )}

            <div className="flex-1" />

            {onNext && (
                <button
                    onClick={onNext}
                    disabled={nextDisabled || isLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    aria-label={nextLabel}
                >
                    {isLoading && (
                        <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    )}
                    {nextLabel}
                </button>
            )}
        </div>
    )
}
