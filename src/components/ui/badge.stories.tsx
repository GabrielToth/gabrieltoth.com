import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Badge } from "./badge"

const meta: Meta<typeof Badge> = {
    title: "UI/Badge",
    component: Badge,
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "secondary", "destructive", "outline"],
            description: "The visual style of the badge",
        },
    },
    parameters: {
        docs: {
            description: {
                component:
                    "Badge component for displaying short status, labels, or counts. Follows the design system colors and variants.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
    args: {
        children: "Badge",
    },
}

export const Variants: Story = {
    render: () => (
        <div className="flex gap-2 items-center">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
        </div>
    ),
}

export const WithIcon: Story = {
    render: () => (
        <div className="flex gap-2 items-center">
            <Badge>
                <span className="mr-1">✨</span>
                New
            </Badge>
            <Badge variant="secondary">
                <span className="mr-1">🔥</span>
                Hot
            </Badge>
        </div>
    ),
}

export const InContext: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Feature Name</h3>
                <Badge variant="secondary">Beta</Badge>
            </div>
            <div className="flex items-center gap-2">
                <span>Product Status</span>
                <Badge variant="destructive">Out of Stock</Badge>
            </div>
        </div>
    ),
}
