"use client"

interface StepProgressBarProps {
    currentStep: number
    progressSteps: number[]
    getStepTitle: (step: number) => string
}

export default function StepProgressBar({
    currentStep,
    progressSteps,
    getStepTitle,
}: StepProgressBarProps) {
    return (
        <div className="flex items-center gap-1 px-1 flex-shrink-0">
            {progressSteps.map(step => (
                <div key={step} className="flex-1">
                    <div
                        className={`h-1.5 rounded-full transition-colors ${
                            step <= currentStep
                                ? "bg-primary/50"
                                : "bg-accent dark:bg-muted"
                        }`}
                    />
                    {step === currentStep && (
                        <p className="mt-1 text-xs font-medium text-primary dark:text-primary truncate">
                            {getStepTitle(step)}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}
