import type { Meta, StoryObj } from "@storybook/react"
import { PublishContainer } from "./PublishContainer"

const meta = {
    title: "Components/Publish/PublishContainer",
    component: PublishContainer,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof PublishContainer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default PublishContainer with all posts and filters
 */
export const Default: Story = {
    render: () => <PublishContainer />,
}

/**
 * PublishContainer with custom children
 */
export const WithChildren: Story = {
    render: () => (
        <PublishContainer>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900">
                    Custom Content
                </h2>
                <p className="mt-2 text-gray-600">
                    This is custom content passed as children to
                    PublishContainer
                </p>
            </div>
        </PublishContainer>
    ),
}

/**
 * PublishContainer in a dashboard layout context
 */
export const InDashboard: Story = {
    render: () => (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                    Dashboard
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto p-6">
                <PublishContainer />
            </div>
        </div>
    ),
}
