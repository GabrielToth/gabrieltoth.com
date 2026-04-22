import type { Meta, StoryObj } from "@storybook/react"
import { VerificationReview } from "./VerificationReview"

const meta = {
    title: "Registration/VerificationReview",
    component: VerificationReview,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        email: {
            control: { type: "text" },
            description: "Email address to review",
        },
        name: {
            control: { type: "text" },
            description: "Full name to review",
        },
        phone: {
            control: { type: "text" },
            description: "Phone number to review",
        },
        disabled: {
            control: { type: "boolean" },
            description: "Whether the edit buttons are disabled",
        },
    },
} satisfies Meta<typeof VerificationReview>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Complete Review
 * Shows all fields filled with valid data ready for account creation.
 */
export const CompleteReview: Story = {
    args: {
        email: "john.doe@example.com",
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        onEdit: field => console.log(`Edit ${field}`),
        disabled: false,
    },
}

/**
 * Review with International Phone
 * Shows a review with an international phone number.
 */
export const ReviewWithInternationalPhone: Story = {
    args: {
        email: "joao.silva@example.com.br",
        name: "João Silva",
        phone: "+55 11 98765-4321",
        onEdit: field => console.log(`Edit ${field}`),
        disabled: false,
    },
}

/**
 * Review with Hyphenated Name
 * Shows a review with a hyphenated name.
 */
export const ReviewWithHyphenatedName: Story = {
    args: {
        email: "mary.jane@example.com",
        name: "Mary-Jane Smith",
        phone: "+1 (555) 987-6543",
        onEdit: field => console.log(`Edit ${field}`),
        disabled: false,
    },
}

/**
 * Review with Apostrophe in Name
 * Shows a review with an apostrophe in the name.
 */
export const ReviewWithApostropheName: Story = {
    args: {
        email: "obrien@example.com",
        name: "Patrick O'Brien",
        phone: "+44 20 7946 0958",
        onEdit: field => console.log(`Edit ${field}`),
        disabled: false,
    },
}

/**
 * Loading State
 * Shows the review form in a disabled/loading state.
 */
export const LoadingState: Story = {
    args: {
        email: "john.doe@example.com",
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        onEdit: field => console.log(`Edit ${field}`),
        disabled: true,
    },
}

/**
 * Edit Email
 * Demonstrates clicking the edit button for the email field.
 */
export const EditEmailAction: Story = {
    args: {
        email: "john.doe@example.com",
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        onEdit: field => {
            if (field === "email") {
                console.log("Navigating back to email step")
            }
        },
        disabled: false,
    },
}

/**
 * Edit Password
 * Demonstrates clicking the edit button for the password field.
 */
export const EditPasswordAction: Story = {
    args: {
        email: "john.doe@example.com",
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        onEdit: field => {
            if (field === "password") {
                console.log("Navigating back to password step")
            }
        },
        disabled: false,
    },
}

/**
 * Edit Name
 * Demonstrates clicking the edit button for the name field.
 */
export const EditNameAction: Story = {
    args: {
        email: "john.doe@example.com",
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        onEdit: field => {
            if (field === "name") {
                console.log("Navigating back to personal data step")
            }
        },
        disabled: false,
    },
}

/**
 * Edit Phone
 * Demonstrates clicking the edit button for the phone field.
 */
export const EditPhoneAction: Story = {
    args: {
        email: "john.doe@example.com",
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        onEdit: field => {
            if (field === "phone") {
                console.log("Navigating back to personal data step")
            }
        },
        disabled: false,
    },
}

/**
 * All Fields Editable
 * Shows all fields with edit buttons available.
 */
export const AllFieldsEditable: Story = {
    args: {
        email: "user@example.com",
        name: "Jane Smith",
        phone: "+1 (555) 555-5555",
        onEdit: field => console.log(`Editing ${field}`),
        disabled: false,
    },
}
