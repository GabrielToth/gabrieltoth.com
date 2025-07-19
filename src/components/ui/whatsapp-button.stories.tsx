import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import WhatsAppButton from "./whatsapp-button"

const meta: Meta<typeof WhatsAppButton> = {
    title: "UI/WhatsAppButton",
    component: WhatsAppButton,
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "outline"],
        },
        size: {
            control: "select",
            options: ["default", "sm", "lg"],
        },
    },
} satisfies Meta<typeof WhatsAppButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
        >
            Contact on WhatsApp
        </WhatsAppButton>
    ),
}

export const Outline: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
            variant="outline"
        >
            Contact on WhatsApp
        </WhatsAppButton>
    ),
}

export const WithIcon: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
        >
            📱 Contact on WhatsApp
        </WhatsAppButton>
    ),
}

export const Small: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
            size="sm"
        >
            Contact
        </WhatsAppButton>
    ),
}

export const Large: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
            size="lg"
            className="w-full"
        >
            Contact on WhatsApp
        </WhatsAppButton>
    ),
}

export const CustomStyles: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <WhatsAppButton
                phoneNumber="5511999999999"
                message="Hello! I'd like to know more about your services."
                className="bg-green-600 hover:bg-green-700"
            >
                Green WhatsApp Button
            </WhatsAppButton>
            <WhatsAppButton
                phoneNumber="5511999999999"
                message="Hello! I'd like to know more about your services."
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
            >
                Green Outline Button
            </WhatsAppButton>
        </div>
    ),
}
