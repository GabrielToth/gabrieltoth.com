import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { PersonalDataForm } from "./PersonalDataForm"

const meta = {
    title: "Registration/PersonalDataForm",
    component: PersonalDataForm,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        name: {
            control: { type: "text" },
            description: "Current name value",
        },
        phone: {
            control: { type: "text" },
            description: "Current phone value",
        },
        disabled: {
            control: { type: "boolean" },
            description: "Whether the inputs are disabled",
        },
    },
} satisfies Meta<typeof PersonalDataForm>

export default meta
type Story = StoryObj<typeof meta>

function PersonalDataFormDemo(args: any) {
    const [name, setName] = useState(args.name || "")
    const [phone, setPhone] = useState(args.phone || "")
    const [isValid, setIsValid] = useState(false)

    return (
        <div className="w-full max-w-md">
            <PersonalDataForm
                {...args}
                name={name}
                phone={phone}
                onNameChange={setName}
                onPhoneChange={setPhone}
                onValidationChange={setIsValid}
            />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {name || "(empty)"}
                </p>
                <p className="text-sm text-gray-600">
                    <strong>Phone:</strong> {phone || "(empty)"}
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
 * Shows the personal data form in its initial empty state.
 */
export const Empty: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "",
        phone: "",
        disabled: false,
    },
}

/**
 * Valid Data
 * Shows valid name and phone number entries.
 */
export const ValidData: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        disabled: false,
    },
}

/**
 * Invalid Name - Empty
 * Shows an error when the name field is empty.
 */
export const InvalidNameEmpty: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "",
        phone: "+1 (555) 123-4567",
        disabled: false,
    },
}

/**
 * Invalid Name - Too Short
 * Shows an error when the name is too short (less than 2 characters).
 */
export const InvalidNameTooShort: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "J",
        phone: "+1 (555) 123-4567",
        disabled: false,
    },
}

/**
 * Invalid Name - Special Characters
 * Shows an error when the name contains invalid special characters.
 */
export const InvalidNameSpecialChars: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "John@#$%",
        phone: "+1 (555) 123-4567",
        disabled: false,
    },
}

/**
 * Valid Name with Hyphen
 * Shows a valid name with a hyphen (allowed character).
 */
export const ValidNameWithHyphen: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "Mary-Jane Smith",
        phone: "+1 (555) 123-4567",
        disabled: false,
    },
}

/**
 * Valid Name with Apostrophe
 * Shows a valid name with an apostrophe (allowed character).
 */
export const ValidNameWithApostrophe: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "O'Brien",
        phone: "+1 (555) 123-4567",
        disabled: false,
    },
}

/**
 * Invalid Phone - Empty
 * Shows an error when the phone field is empty.
 */
export const InvalidPhoneEmpty: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "John Doe",
        phone: "",
        disabled: false,
    },
}

/**
 * Invalid Phone Format
 * Shows an error when the phone format is invalid.
 */
export const InvalidPhoneFormat: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "John Doe",
        phone: "123",
        disabled: false,
    },
}

/**
 * US Phone Number
 * Shows a valid US phone number in various formats.
 */
export const USPhoneNumber: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        disabled: false,
    },
}

/**
 * International Phone - Brazil
 * Shows a valid Brazilian phone number.
 */
export const InternationalPhoneBrazil: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "João Silva",
        phone: "+55 11 98765-4321",
        disabled: false,
    },
}

/**
 * International Phone - UK
 * Shows a valid UK phone number.
 */
export const InternationalPhoneUK: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "John Smith",
        phone: "+44 20 7946 0958",
        disabled: false,
    },
}

/**
 * International Phone - Germany
 * Shows a valid German phone number.
 */
export const InternationalPhoneGermany: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "Hans Mueller",
        phone: "+49 30 12345678",
        disabled: false,
    },
}

/**
 * Phone with Different Formatting
 * Shows a valid phone number with alternative formatting.
 */
export const PhoneAlternativeFormat: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "John Doe",
        phone: "+1 555 123 4567",
        disabled: false,
    },
}

/**
 * Disabled State
 * Shows the personal data form in a disabled state.
 */
export const Disabled: Story = {
    render: args => <PersonalDataFormDemo {...args} />,
    args: {
        name: "John Doe",
        phone: "+1 (555) 123-4567",
        disabled: true,
    },
}
