import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { Sidebar } from "./Sidebar"

const meta = {
    title: "Dashboard/Sidebar",
    component: Sidebar,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

function SidebarDemo() {
    const [activeTab, setActiveTab] = useState<
        "publish" | "insights" | "settings"
    >("publish")
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                organization={{ name: "Acme Corp", plan: "pro" }}
                onLogout={() => alert("Logout clicked")}
            />
            <main className="flex-1 overflow-auto p-6">
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Sidebar Demo
                    </h1>
                    <p className="text-gray-600">
                        The sidebar is displayed on the left. On mobile, click
                        the hamburger menu to toggle it.
                    </p>
                    <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm text-blue-900">
                            Current active tab: <strong>{activeTab}</strong>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export const Default: Story = {
    render: () => <SidebarDemo />,
}

export const PublishActive: Story = {
    render: () => (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                activeTab="publish"
                onTabChange={() => {}}
                organization={{ name: "Acme Corp", plan: "pro" }}
            />
            <main className="flex-1 overflow-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Publish Tab Active
                </h1>
            </main>
        </div>
    ),
}

export const InsightsActive: Story = {
    render: () => (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                activeTab="insights"
                onTabChange={() => {}}
                organization={{ name: "Acme Corp", plan: "pro" }}
            />
            <main className="flex-1 overflow-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Insights Tab Active
                </h1>
            </main>
        </div>
    ),
}

export const SettingsActive: Story = {
    render: () => (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                activeTab="settings"
                onTabChange={() => {}}
                organization={{ name: "Acme Corp", plan: "pro" }}
            />
            <main className="flex-1 overflow-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Settings Tab Active
                </h1>
            </main>
        </div>
    ),
}

export const FreePlan: Story = {
    render: () => (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                activeTab="publish"
                onTabChange={() => {}}
                organization={{ name: "Startup Inc", plan: "free" }}
            />
            <main className="flex-1 overflow-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Free Plan Organization
                </h1>
            </main>
        </div>
    ),
}

export const EnterprisePlan: Story = {
    render: () => (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                activeTab="publish"
                onTabChange={() => {}}
                organization={{ name: "Enterprise Corp", plan: "enterprise" }}
            />
            <main className="flex-1 overflow-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Enterprise Plan Organization
                </h1>
            </main>
        </div>
    ),
}
