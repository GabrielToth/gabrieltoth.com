import type { Meta, StoryObj } from "@storybook/react"
import { Label } from "./label"
import { Textarea } from "./textarea"

const meta: Meta<typeof Textarea> = {
    title: "UI/Textarea",
    component: Textarea,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Textarea component for multi-line text input. Supports various states and can be customized with different sizes.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
    render: () => <Textarea placeholder="Type your message here." />,
}

export const WithLabel: Story = {
    render: () => (
        <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea placeholder="Type your message here." id="message" />
        </div>
    ),
}

export const Disabled: Story = {
    render: () => (
        <Textarea placeholder="This textarea is disabled." disabled />
    ),
}

export const WithCharacterCount: Story = {
    render: () => (
        <div className="grid w-full gap-1.5">
            <Label htmlFor="message-with-count">Your message</Label>
            <div className="relative">
                <Textarea
                    placeholder="Type your message here."
                    id="message-with-count"
                    className="min-h-[100px] resize-none"
                />
                <div className="absolute bottom-2 right-2 text-sm text-gray-400">
                    0/100
                </div>
            </div>
        </div>
    ),
}

export const WithValidation: Story = {
    render: () => (
        <div className="grid w-full gap-1.5">
            <Label htmlFor="message-error" className="text-red-500">
                Your message
            </Label>
            <Textarea
                placeholder="Type your message here."
                id="message-error"
                className="border-red-500"
            />
            <p className="text-sm text-red-500">
                Please enter a message with at least 10 characters.
            </p>
        </div>
    ),
}

export const Sizes: Story = {
    render: () => (
        <div className="flex flex-col space-y-4">
            <Textarea placeholder="Small textarea" className="h-20" />
            <Textarea placeholder="Medium textarea" className="h-32" />
            <Textarea placeholder="Large textarea" className="h-44" />
        </div>
    ),
}
