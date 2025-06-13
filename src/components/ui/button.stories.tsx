import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "./button"

const meta: Meta<typeof Button> = {
    title: "UI/Button",
    component: Button,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: { type: "select" },
            options: ["default", "secondary", "outline", "ghost"],
        },
        size: {
            control: { type: "select" },
            options: ["default", "sm", "lg", "icon"],
        },
        disabled: {
            control: { type: "boolean" },
        },
    },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        children: "Button",
    },
}

export const Secondary: Story = {
    args: {
        variant: "secondary",
        children: "Secondary",
    },
}

export const Outline: Story = {
    args: {
        variant: "outline",
        children: "Outline",
    },
}

export const Ghost: Story = {
    args: {
        variant: "ghost",
        children: "Ghost",
    },
}

export const Large: Story = {
    args: {
        size: "lg",
        children: "Large Button",
    },
}

export const Small: Story = {
    args: {
        size: "sm",
        children: "Small Button",
    },
}

export const Disabled: Story = {
    args: {
        disabled: true,
        children: "Disabled",
    },
}
