import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { DashboardLayout } from "./DashboardLayout"

const meta = {
    title: "Dashboard/DashboardLayout",
    component: DashboardLayout,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof DashboardLayout>

export default meta
type Story = StoryObj<typeof meta>

function DashboardLayoutDemo() {
    const [activeTab, setActiveTab] = useState<
        "publish" | "insights" | "settings"
    >("publish")

    return (
        <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
                </h1>
                <p className="text-gray-600">
                    This is the {activeTab} tab content. Click on the navigation
                    items in the sidebar to switch between tabs.
                </p>
                <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-900">
                        Current active tab: <strong>{activeTab}</strong>
                    </p>
                </div>
            </div>
        </DashboardLayout>
    )
}

export const Default: Story = {
    render: () => <DashboardLayoutDemo />,
}

export const PublishTab: Story = {
    render: () => (
        <DashboardLayout activeTab="publish">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Publish Tab
                </h1>
                <p className="text-gray-600">
                    This is where users can view, filter, and manage their
                    scheduled and published posts.
                </p>
            </div>
        </DashboardLayout>
    ),
}

export const InsightsTab: Story = {
    render: () => (
        <DashboardLayout activeTab="insights">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Insights Tab
                </h1>
                <p className="text-gray-600">
                    This is where users can view comprehensive analytics and
                    performance metrics.
                </p>
            </div>
        </DashboardLayout>
    ),
}

export const SettingsTab: Story = {
    render: () => (
        <DashboardLayout activeTab="settings">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Settings Tab
                </h1>
                <p className="text-gray-600">
                    This is where users can manage their profile, preferences,
                    and account settings.
                </p>
            </div>
        </DashboardLayout>
    ),
}
