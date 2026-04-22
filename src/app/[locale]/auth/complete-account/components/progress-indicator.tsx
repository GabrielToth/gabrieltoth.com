/**
 * Progress Indicator Component
 *
 * Displays the current step and progress bar for the account completion flow.
 *
 * Validates: Requirements 4.6
 */

"use client"

import { useTranslations } from "next-intl"

interface ProgressIndicatorProps {
    currentStep: number
    totalSteps: number
}

const STEP_LABELS = {
    1: "completeAccount.step1.title",
    2: "completeAccount.step2.title",
    3: "completeAccount.step3.title",
}

export default function ProgressIndicator({
    currentStep,
    totalSteps,
}: ProgressIndicatorProps) {
    const t = useTranslations("auth")
    const progressPercentage = (currentStep / totalSteps) * 100

    return (
        <div className="space-y-4">
            {/* Step Counter */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t(STEP_LABELS[currentStep as keyof typeof STEP_LABELS])}
                </h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentStep} of {totalSteps}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                    className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={currentStep}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps}
                />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between gap-2">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNumber = index + 1
                    const isCompleted = stepNumber < currentStep
                    const isCurrent = stepNumber === currentStep

                    return (
                        <div
                            key={stepNumber}
                            className={`flex-1 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-colors ${
                                isCurrent
                                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                                    : isCompleted
                                      ? "bg-green-600 dark:bg-green-500 text-white"
                                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                        >
                            {isCompleted ? (
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                stepNumber
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
