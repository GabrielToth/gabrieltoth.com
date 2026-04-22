import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { ErrorDisplay } from "./ErrorDisplay"

const meta = {
    title: "Registration/ErrorDisplay",
    component: ErrorDisplay,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        error: {
            control: { type: "text" },
            description: "General error message to display",
        },
        fieldError: {
            control: { type: "text" },
            description: "Field-specific error message",
        },
    },
} satisfies Meta<typeof ErrorDisplay>

export default meta
type Story = StoryObj<typeof meta>

function ErrorDisplayDemo(args: any) {
    const [error, setError] = useState(args.error || null)
    const [fieldError, setFieldError] = useState(args.fieldError || null)

    return (
        <div className="w-full max-w-md space-y-4">
            <ErrorDisplay
                error={error}
                fieldError={fieldError}
                onDismiss={() => setError(null)}
            />
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <button
                    onClick={() =>
                        setError(
                            error
                                ? null
                                : "An error occurred. Please try again."
                        )
                    }
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Toggle General Error
                </button>
                <button
                    onClick={() =>
                        setFieldError(
                            fieldError ? null : "This field is required"
                        )
                    }
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                    Toggle Field Error
                </button>
            </div>
        </div>
    )
}

/**
 * No Errors
 * Shows the error display when there are no errors to display.
 */
export const NoErrors: Story = {
    args: {
        error: null,
        fieldError: null,
    },
}

/**
 * General Error
 * Shows a general error message at the top of the form.
 */
export const GeneralError: Story = {
    args: {
        error: "An error occurred while creating your account. Please try again.",
        fieldError: null,
        onDismiss: () => console.log("Error dismissed"),
    },
}

/**
 * Field Error
 * Shows a field-specific error message.
 */
export const FieldError: Story = {
    args: {
        error: null,
        fieldError: "This field is required",
    },
}

/**
 * Both Errors
 * Shows both a general error and a field-specific error.
 */
export const BothErrors: Story = {
    args: {
        error: "Registration failed. Please check your information.",
        fieldError: "Email is already registered",
        onDismiss: () => console.log("Error dismissed"),
    },
}

/**
 * Email Already Registered Error
 * Shows the specific error for an email that's already registered.
 */
export const EmailAlreadyRegisteredError: Story = {
    args: {
        error: null,
        fieldError: "This email is already registered",
    },
}

/**
 * Invalid Email Format Error
 * Shows the error for an invalid email format.
 */
export const InvalidEmailFormatError: Story = {
    args: {
        error: null,
        fieldError: "Please enter a valid email address",
    },
}

/**
 * Password Mismatch Error
 * Shows the error when passwords don't match.
 */
export const PasswordMismatchError: Story = {
    args: {
        error: null,
        fieldError: "Passwords do not match",
    },
}

/**
 * Invalid Phone Number Error
 * Shows the error for an invalid phone number.
 */
export const InvalidPhoneNumberError: Story = {
    args: {
        error: null,
        fieldError: "Please enter a valid phone number",
    },
}

/**
 * Network Error
 * Shows a network/connection error message.
 */
export const NetworkError: Story = {
    args: {
        error: "Connection failed. Please check your internet connection and try again.",
        fieldError: null,
        onDismiss: () => console.log("Error dismissed"),
    },
}

/**
 * Server Error
 * Shows a server error message.
 */
export const ServerError: Story = {
    args: {
        error: "Server error. Please try again later.",
        fieldError: null,
        onDismiss: () => console.log("Error dismissed"),
    },
}

/**
 * Session Expired Error
 * Shows the error when the registration session has expired.
 */
export const SessionExpiredError: Story = {
    args: {
        error: "Your registration session has expired. Please start over.",
        fieldError: null,
        onDismiss: () => console.log("Error dismissed"),
    },
}

/**
 * Interactive Error Display
 * Shows an interactive error display with toggle buttons.
 */
export const InteractiveErrorDisplay: Story = {
    render: args => <ErrorDisplayDemo {...args} />,
    args: {
        error: null,
        fieldError: null,
    },
}
