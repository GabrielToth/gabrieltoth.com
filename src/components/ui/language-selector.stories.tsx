import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import LanguageSelector from "./language-selector"

const meta: Meta<typeof LanguageSelector> = {
    title: "UI/LanguageSelector",
    component: LanguageSelector,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Language Selector component for switching between different language options. Supports multiple locales and custom styling.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof LanguageSelector>

export const Default: Story = {
    render: () => <LanguageSelector />,
}

export const WithCustomStyle: Story = {
    render: () => (
        <LanguageSelector className="bg-primary text-primary-foreground hover:bg-primary/90" />
    ),
}

export const InNavbar: Story = {
    render: () => (
        <nav className="flex items-center justify-between p-4 bg-background border-b">
            <div className="flex items-center space-x-4">
                <span className="font-semibold">Logo</span>
                <span>Home</span>
                <span>About</span>
            </div>
            <LanguageSelector variant="header" />
        </nav>
    ),
}

export const InMobileMenu: Story = {
    render: () => (
        <div className="w-64 h-screen bg-background border-r p-4">
            <div className="space-y-4">
                <div className="font-semibold">Mobile Menu</div>
                <div className="space-y-2">
                    <div>Home</div>
                    <div>About</div>
                    <div>Contact</div>
                </div>
                <div className="pt-4 border-t">
                    <LanguageSelector variant="footer" />
                </div>
            </div>
        </div>
    ),
}
