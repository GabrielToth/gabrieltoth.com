import type { Meta, StoryObj } from "@storybook/react"
import { ProgressIndicator } from "./ProgressIndicator"

const meta = {
    title: "Registration/ProgressIndicator",
    component: ProgressIndicator,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        currentStep: {
            control: { type: "number", min: 0, max: 3 },
            description: "Current step in the registration process (0-3)",
        },
        totalSteps: {
            control: { type: "number", min: 1, max: 5 },
            description: "Total number of steps",
        },
    },
} satisfies Meta<typeof ProgressIndicator>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Step 1: Email Input
 * Shows the first step of the registration process with the email step highlighted.
 */
export const Step1Email: Story = {
    args: {
        currentStep: 0,
        totalSteps: 4,
    },
}

/**
 * Step 2: Password Setup
 * Shows the second step with email completed (green checkmark) and password highlighted.
 */
export const Step2Password: Story = {
    args: {
        currentStep: 1,
        totalSteps: 4,
    },
}

/**
 * Step 3: Personal Information
 * Shows the third step with email and password completed, personal data highlighted.
 */
export const Step3Personal: Story = {
    args: {
        currentStep: 2,
        totalSteps: 4,
    },
}

/**
 * Step 4: Verification Review
 * Shows the final step with all previous steps completed and review highlighted.
 */
export const Step4Review: Story = {
    args: {
        currentStep: 3,
        totalSteps: 4,
    },
}

/**
 * All Steps Completed
 * Shows all steps completed with green checkmarks.
 */
export const AllStepsCompleted: Story = {
    args: {
        currentStep: 4,
        totalSteps: 4,
    },
}
