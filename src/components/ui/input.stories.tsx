import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "./input"
import { Label } from "./label"

const meta: Meta<typeof Input> = {
    title: "UI/Input",
    component: Input,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Input component for collecting user input in forms. Supports various types and states.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
    render: () => <Input placeholder="Type something..." />,
}

export const WithLabel: Story = {
    render: () => (
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Enter your email" />
        </div>
    ),
}

export const Disabled: Story = {
    render: () => <Input disabled placeholder="Disabled input" />,
}

export const WithIcon: Story = {
    render: () => (
        <div className="relative w-full max-w-sm">
            <Input placeholder="Search..." className="pl-8" />
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        </div>
    ),
}

export const FormExample: Story = {
    render: () => (
        <form className="w-full max-w-sm space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                />
            </div>
        </form>
    ),
}

export const Sizes: Story = {
    render: () => (
        <div className="flex flex-col space-y-4">
            <Input className="h-8 text-sm" placeholder="Small input" />
            <Input placeholder="Default input" />
            <Input className="h-12 text-lg" placeholder="Large input" />
        </div>
    ),
}
