import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "./input"
import { Label } from "./label"

const meta: Meta<typeof Label> = {
    title: "UI/Label",
    component: Label,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Label component for form inputs. Provides accessible labels that can be associated with form controls.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {
    render: () => <Label>Label Text</Label>,
}

export const WithInput: Story = {
    render: () => (
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Enter your email" />
        </div>
    ),
}

export const Required: Story = {
    render: () => (
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label
                htmlFor="username"
                className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
                Username
            </Label>
            <Input id="username" placeholder="Enter username" required />
        </div>
    ),
}

export const WithHelpText: Story = {
    render: () => (
        <div className="grid w-full max-w-sm gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input type="password" id="password" />
            <p className="text-sm text-gray-500">
                Password must be at least 8 characters long
            </p>
        </div>
    ),
}

export const WithError: Story = {
    render: () => (
        <div className="grid w-full max-w-sm gap-1.5">
            <Label htmlFor="email" className="text-red-500">
                Email
            </Label>
            <Input
                type="email"
                id="email"
                className="border-red-500"
                placeholder="Enter email"
            />
            <p className="text-sm text-red-500">
                Please enter a valid email address
            </p>
        </div>
    ),
}
