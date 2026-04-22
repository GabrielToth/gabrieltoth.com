"use client"

import React from "react"

interface ProgressIndicatorProps {
    currentStep: number
    totalSteps?: number
}

const steps = ["Email", "Password", "Personal", "Review"]

export function ProgressIndicator({
    currentStep,
    totalSteps = 4,
}: ProgressIndicatorProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8">
            {/* Desktop: Horizontal layout */}
            <div className="hidden md:flex w-full max-w-2xl gap-4">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center flex-1">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                                    index < currentStep
                                        ? "bg-green-500 text-white"
                                        : index === currentStep
                                          ? "bg-blue-500 text-white ring-4 ring-blue-200"
                                          : "bg-gray-200 text-gray-600"
                                }`}
                            >
                                {index < currentStep ? "✓" : index + 1}
                            </div>
                            <p
                                className={`mt-2 text-sm font-medium ${
                                    index <= currentStep
                                        ? "text-gray-900"
                                        : "text-gray-500"
                                }`}
                            >
                                {step}
                            </p>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-1 mt-6 ${
                                    index < currentStep
                                        ? "bg-green-500"
                                        : "bg-gray-200"
                                }`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Mobile: Vertical layout */}
            <div className="md:hidden w-full">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">
                        Step {currentStep + 1} of {totalSteps}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                        {steps[currentStep]}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${((currentStep + 1) / totalSteps) * 100}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
