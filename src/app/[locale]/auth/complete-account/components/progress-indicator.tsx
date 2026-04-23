/**
 * Progress Indicator Component
 *
 * Displays the current step and total steps in the account completion flow.
 * Shows visual progress bar and step labels.
 *
 * Validates: Requirements 3.3, 3.4
 */

"use client"

import { useTranslations } from "next-intl"

interface ProgressIndicatorProps {
    currentStep: number
    totalSteps: number
}

export default function ProgressIndicator({
    currentStep,
    totalSteps,
}: ProgressIndicatorProps) {
    const t = useTranslations("auth")

    const steps = [
        t("completeAccount.step1.title"),
        t("completeAccount.step2.title"),
        t("completeAccount.step3.title"),
    ]

    const progressPercentage = (currentStep / totalSteps) * 100

    return (
        <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                    className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={currentStep}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps}
                    aria-label={`Step ${currentStep} of ${totalSteps}`}
                />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between items-center">
                {steps.map((step, index) => {
                    const stepNumber = index + 1
                    const isCompleted = stepNumber < currentStep
                    const isCurrent = stepNumber === currentStep

                    return (
                        <div
                            key={stepNumber}
                            className="flex flex-col items-center flex-1"
                        >
                            {/* Step Circle */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                                    isCurrent
                                        ? "bg-blue-600 dark:bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-400"
                                        : isCompleted
                                          ? "bg-green-600 dark:bg-green-500 text-white"
                                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                }`}
                                aria-current={isCurrent ? "step" : undefined}
                            >
                                {isCompleted ? (
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        aria-hidden="true"
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

                            {/* Step Label */}
                            <p
                                className={`text-xs font-medium mt-2 text-center max-w-[80px] ${
                                    isCurrent
                                        ? "text-blue-600 dark:text-blue-400"
                                        : isCompleted
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                {step}
                            </p>

                            {/* Connector Line */}
                            {stepNumber < totalSteps && (
                                <div
                                    className={`absolute w-12 h-0.5 top-5 left-1/2 ml-6 ${
                                        isCompleted
                                            ? "bg-green-600 dark:bg-green-500"
                                            : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Step Counter */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {t("completeAccount.step")} {currentStep}{" "}
                {t("completeAccount.of")} {totalSteps}
            </div>
        </div>
    )
}
