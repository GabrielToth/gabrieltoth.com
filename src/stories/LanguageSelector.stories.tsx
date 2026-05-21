import { ThemeProvider } from "@/components/theme/theme-provider"
import LanguageSelector from "@/components/ui/language-selector"
import type { Meta, StoryObj } from "@storybook/nextjs"

const meta: Meta<typeof LanguageSelector> = {
    title: "Site/UI/LanguageSelector",
    component: LanguageSelector,
}
export default meta

type Story = StoryObj<typeof LanguageSelector>

export const HeaderVariant: Story = {
    args: {
        variant: "header",
        includeThemeToggle: true,
    },
    /* c8 ignore next */
    render: (args: any) => (
        <ThemeProvider>
            <div className="p-4">
                <LanguageSelector {...args} />
            </div>
        </ThemeProvider>
    ),
}
