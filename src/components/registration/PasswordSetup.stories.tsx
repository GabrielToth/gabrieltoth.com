import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { PasswordSetup } from "./PasswordSetup"

const meta = {
    title: "Registration/PasswordSetup",
    component: PasswordSetup,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: { type: "text" },
            description: "Current password value",
        },
        confirmValue: {
            control: { type: "text" },
            description: "Password confirmation value",
        },
        disabled: {
            control: { type: "boolean" },
            description: "Whether the inputs are disabled",
        },
    },
} satisfies Meta<typeof PasswordSetup>

export default meta
type Story = StoryObj<typeof meta>

function PasswordSetupDemo(args: any) {
    const [password, setPassword] = useState(args.value || "")
    const [confirmPassword, setConfirmPassword] = useState(
        args.confirmValue || ""
    )
    const [isValid, setIsValid] = useState(false)

    return (
        <div className="w-full max-w-md">
            <PasswordSetup
                {...args}
                value={password}
                confirmValue={confirmPassword}
                onChange={setPassword}
                onConfirmChange={setConfirmPassword}
                onValidationChange={setIsValid}
            />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    <strong>Password:</strong> {password ? "***" : "(empty)"}
                </p>
                <p className="text-sm text-gray-600">
                    <strong>Confirm:</strong>{" "}
                    {confirmPassword ? "***" : "(empty)"}
                </p>
                <p className="text-sm text-gray-600">
                    <strong>Valid:</strong> {isValid ? "Yes" : "No"}
                </p>
            </div>
        </div>
    )
}

/**
 * Empty State
 * Shows the password setup form in its initial empty state.
 */
export const Empty: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "",
        confirmValue: "",
        disabled: false,
    },
}

/**
 * Weak Password
 * Shows a password that doesn't meet requirements (too short, no uppercase, etc.).
 */
export const WeakPassword: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "pass",
        confirmValue: "",
        disabled: false,
    },
}

/**
 * Fair Password Strength
 * Shows a password with fair strength (meets 2 requirements).
 */
export const FairPasswordStrength: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "Password1",
        confirmValue: "",
        disabled: false,
    },
}

/**
 * Good Password Strength
 * Shows a password with good strength (meets 3 requirements).
 */
export const GoodPasswordStrength: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "Password123",
        confirmValue: "",
        disabled: false,
    },
}

/**
 * Strong Password Strength
 * Shows a password with strong strength (meets all 4 requirements).
 */
export const StrongPasswordStrength: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "SecurePass123!",
        confirmValue: "",
        disabled: false,
    },
}

/**
 * Passwords Match
 * Shows matching password and confirmation fields with validation success.
 */
export const PasswordsMatch: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "SecurePass123!",
        confirmValue: "SecurePass123!",
        disabled: false,
    },
}

/**
 * Passwords Don't Match
 * Shows mismatched password and confirmation fields with error message.
 */
export const PasswordsMismatch: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "SecurePass123!",
        confirmValue: "DifferentPass123!",
        disabled: false,
    },
}

/**
 * Missing Uppercase Letter
 * Shows a password missing an uppercase letter requirement.
 */
export const MissingUppercase: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "securepass123!",
        confirmValue: "",
        disabled: false,
    },
}

/**
 * Missing Number
 * Shows a password missing a number requirement.
 */
export const MissingNumber: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "SecurePass!",
        confirmValue: "",
        disabled: false,
    },
}

/**
 * Missing Special Character
 * Shows a password missing a special character requirement.
 */
export const MissingSpecialChar: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "SecurePass123",
        confirmValue: "",
        disabled: false,
    },
}

/**
 * Disabled State
 * Shows the password setup form in a disabled state.
 */
export const Disabled: Story = {
    render: args => <PasswordSetupDemo {...args} />,
    args: {
        value: "SecurePass123!",
        confirmValue: "SecurePass123!",
        disabled: true,
    },
}
