import type { Meta, StoryObj } from "@storybook/react"
import { Bold, Italic, Underline } from "lucide-react"
import { Toggle } from "./toggle"

const meta = {
    title: "UI/Toggle",
    component: Toggle,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: () => (
        <Toggle aria-label="Toggle bold">
            <Bold className="h-4 w-4" />
        </Toggle>
    ),
}

export const WithText: Story = {
    render: () => (
        <Toggle aria-label="Toggle italic">
            <Italic className="h-4 w-4" />
            Italic
        </Toggle>
    ),
}

export const Sizes: Story = {
    render: () => (
        <div className="flex gap-4">
            <Toggle size="sm" aria-label="Toggle small">
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle size="default" aria-label="Toggle default">
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle size="lg" aria-label="Toggle large">
                <Bold className="h-4 w-4" />
            </Toggle>
        </div>
    ),
}

export const Disabled: Story = {
    render: () => (
        <Toggle disabled aria-label="Toggle disabled">
            <Underline className="h-4 w-4" />
        </Toggle>
    ),
}

export const Pressed: Story = {
    render: () => (
        <Toggle defaultPressed aria-label="Toggle pressed">
            <Bold className="h-4 w-4" />
        </Toggle>
    ),
}
