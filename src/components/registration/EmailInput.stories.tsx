import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { EmailInput } from "./EmailInput"

const meta = {
    title: "Registration/EmailInput",
    component: EmailInput,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: { type: "text" },
            description: "Current email value",
        },
        disabled: {
            control: { type: "boolean" },
            description: "Whether the input is disabled",
        },
    },
} satisfies Meta<typeof EmailInput>

export default meta
type Story = StoryObj<typeof meta>

function EmailInputDemo(args: any) {
    const [value, setValue] = useState(args.value || "")
    const [isValid, setIsValid] = useState(false)

    return (
        <div className="w-full max-w-md">
            <EmailInput
                {...args}
                value={value}
                onChange={setValue}
                onValidationChange={setIsValid}
            />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    <strong>Value:</strong> {value || "(empty)"}
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
 * Shows the email input field in its initial empty state.
 */
export const Empty: Story = {
    render: args => <EmailInputDemo {...args} />,
    args: {
        value: "",
        disabled: false,
    },
}

/**
 * Valid Email
 * Shows a valid email address that has been verified as available.
 */
export const ValidEmail: Story = {
    render: args => <EmailInputDemo {...args} />,
    args: {
        value: "user@example.com",
        disabled: false,
    },
}

/**
 * Invalid Email Format
 * Shows an invalid email format with error message.
 */
export const InvalidEmailFormat: Story = {
    render: args => <EmailInputDemo {...args} />,
    args: {
        value: "invalid-email",
        disabled: false,
    },
}

/**
 * Loading State
 * Shows the loading spinner while checking email availability.
 */
export const LoadingState: Story = {
    render: args => <EmailInputDemo {...args} />,
    args: {
        value: "checking@example.com",
        disabled: false,
    },
}

/**
 * Disabled State
 * Shows the email input in a disabled state.
 */
export const Disabled: Story = {
    render: args => <EmailInputDemo {...args} />,
    args: {
        value: "user@example.com",
        disabled: true,
    },
}

/**
 * Email Already Registered
 * Shows an error when the email is already registered in the system.
 */
export const EmailAlreadyRegistered: Story = {
    render: args => <EmailInputDemo {...args} />,
    args: {
        value: "existing@example.com",
        disabled: false,
    },
}

/**
 * International Email Domain
 * Shows a valid email with an international domain extension.
 */
export const InternationalDomain: Story = {
    render: args => <EmailInputDemo {...args} />,
    args: {
        value: "user@example.co.uk",
        disabled: false,
    },
}
