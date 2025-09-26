import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import Breadcrumbs from "./breadcrumbs"

const meta: Meta<typeof Breadcrumbs> = {
    title: "UI/Breadcrumbs",
    component: Breadcrumbs,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Accessible breadcrumbs with auto-generation from pathname and i18n support.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Breadcrumbs>

export const Default: Story = {
    render: () => (
        <div className="p-4">
            <Breadcrumbs />
        </div>
    ),
}

export const WithItems: Story = {
    render: () => (
        <div className="p-4">
            <Breadcrumbs
                items={[
                    { name: "Home", href: "/en" },
                    { name: "Services", href: "/en/services" },
                    {
                        name: "ViraTrend",
                        href: "/en/channel-management",
                        current: true,
                    },
                ]}
            />
        </div>
    ),
}
