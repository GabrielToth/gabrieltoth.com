import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import PricingToggle from "./pricing-toggle"

const meta: Meta<typeof PricingToggle> = {
    title: "UI/PricingToggle",
    component: PricingToggle,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Pricing Toggle component for switching between different pricing options, typically monthly and yearly plans.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof PricingToggle>

export const Default: Story = {
    render: () => <PricingToggle locale="en" />,
}

export const WithLabels: Story = {
    render: () => (
        <div className="flex items-center gap-8">
            <span className="text-sm font-medium">Monthly</span>
            <PricingToggle locale="en" />
            <span className="text-sm font-medium">Yearly</span>
        </div>
    ),
}

export const WithSavingsBadge: Story = {
    render: () => (
        <div className="flex items-center gap-8">
            <span className="text-sm font-medium">Monthly</span>
            <PricingToggle locale="en" />
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Yearly</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Save 20%
                </span>
            </div>
        </div>
    ),
}

export const InPricingSection: Story = {
    render: () => (
        <div className="mx-auto max-w-3xl px-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold">Pricing Plans</h2>
                <p className="mt-4 text-gray-600">
                    Choose the perfect plan for your needs. Save with yearly
                    billing.
                </p>
                <div className="mt-8 flex justify-center items-center gap-8">
                    <span className="text-sm font-medium">Monthly billing</span>
                    <PricingToggle locale="en" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            Yearly billing
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Save 20%
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
                {/* Example pricing cards */}
                <div className="rounded-lg border p-8">
                    <h3 className="text-xl font-bold">Starter</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold">$29</span>
                        <span className="ml-1 text-gray-500">/month</span>
                    </div>
                </div>
                <div className="rounded-lg border p-8">
                    <h3 className="text-xl font-bold">Pro</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold">$99</span>
                        <span className="ml-1 text-gray-500">/month</span>
                    </div>
                </div>
            </div>
        </div>
    ),
}
