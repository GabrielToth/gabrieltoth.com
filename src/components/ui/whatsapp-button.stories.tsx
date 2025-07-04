import type { Meta, StoryObj } from "@storybook/react"
import WhatsAppButton from "./whatsapp-button"

const meta: Meta<typeof WhatsAppButton> = {
    title: "UI/WhatsAppButton",
    component: WhatsAppButton,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "WhatsApp Button component for quick access to WhatsApp chat. Customizable with different styles and pre-defined messages.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof WhatsAppButton>

export const Default: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
            text="Contact on WhatsApp"
        >
            Contact on WhatsApp
        </WhatsAppButton>
    ),
}

export const WithCustomText: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
            text="Contact us on WhatsApp"
        >
            Contact us on WhatsApp
        </WhatsAppButton>
    ),
}

export const WithIcon: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
            text="Chat Now"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
            >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Chat Now
        </WhatsAppButton>
    ),
}

export const CustomStyle: Story = {
    render: () => (
        <WhatsAppButton
            phoneNumber="5511999999999"
            message="Hello! I'd like to know more about your services."
            text="Contact Support"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
        >
            Contact Support
        </WhatsAppButton>
    ),
}

export const InContext: Story = {
    render: () => (
        <div className="flex flex-col items-center space-y-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold">Need Help?</h3>
            <p className="text-sm text-gray-600 text-center">
                Our team is ready to assist you. Click below to start a
                conversation.
            </p>
            <WhatsAppButton
                phoneNumber="5511999999999"
                message="Hi! I need assistance with..."
                text="Chat with Support"
                className="mt-2"
            >
                Chat with Support
            </WhatsAppButton>
        </div>
    ),
}
