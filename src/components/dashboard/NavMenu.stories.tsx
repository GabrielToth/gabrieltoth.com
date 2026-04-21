import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { NavMenu, type NavItem } from "./NavMenu"

const meta = {
    title: "Dashboard/NavMenu",
    component: NavMenu,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof NavMenu>

export default meta
type Story = StoryObj<typeof meta>

const defaultItems: NavItem[] = [
    { id: "publish", label: "Publish", icon: "📝" },
    { id: "insights", label: "Insights", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
]

function NavMenuDemo() {
    const [activeItem, setActiveItem] = useState("publish")

    return (
        <div className="w-full max-w-xs">
            <NavMenu
                items={defaultItems}
                activeItem={activeItem}
                onItemClick={setActiveItem}
            />
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                    Current active item: <strong>{activeItem}</strong>
                </p>
            </div>
        </div>
    )
}

export const Default: Story = {
    render: () => <NavMenuDemo />,
}

export const PublishActive: Story = {
    args: {
        items: defaultItems,
        activeItem: "publish",
        onItemClick: () => {},
    },
}

export const InsightsActive: Story = {
    args: {
        items: defaultItems,
        activeItem: "insights",
        onItemClick: () => {},
    },
}

export const SettingsActive: Story = {
    args: {
        items: defaultItems,
        activeItem: "settings",
        onItemClick: () => {},
    },
}

export const WithoutIcons: Story = {
    args: {
        items: [
            { id: "publish", label: "Publish" },
            { id: "insights", label: "Insights" },
            { id: "settings", label: "Settings" },
        ],
        activeItem: "publish",
        onItemClick: () => {},
    },
}

export const CustomIcons: Story = {
    args: {
        items: [
            { id: "publish", label: "Publish", icon: "✍️" },
            { id: "insights", label: "Insights", icon: "📈" },
            { id: "settings", label: "Settings", icon: "🔧" },
        ],
        activeItem: "publish",
        onItemClick: () => {},
    },
}

export const SingleItem: Story = {
    args: {
        items: [{ id: "publish", label: "Publish", icon: "📝" }],
        activeItem: "publish",
        onItemClick: () => {},
    },
}

export const ManyItems: Story = {
    args: {
        items: [
            { id: "publish", label: "Publish", icon: "📝" },
            { id: "insights", label: "Insights", icon: "📊" },
            { id: "settings", label: "Settings", icon: "⚙️" },
            { id: "team", label: "Team", icon: "👥" },
            { id: "billing", label: "Billing", icon: "💳" },
            { id: "help", label: "Help", icon: "❓" },
        ],
        activeItem: "publish",
        onItemClick: () => {},
    },
}

export const Interactive: Story = {
    render: () => {
        const [activeItem, setActiveItem] = useState("insights")

        return (
            <div className="w-full max-w-xs">
                <NavMenu
                    items={defaultItems}
                    activeItem={activeItem}
                    onItemClick={setActiveItem}
                />
                <div className="mt-6 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-700">
                        Click any item to change the active state.
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                        Active: {activeItem}
                    </p>
                </div>
            </div>
        )
    },
}
