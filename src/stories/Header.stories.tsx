import Header from "@/components/layout/header"
import { ThemeProvider } from "@/components/theme/theme-provider"
import enLayoutHeader from "@/i18n/en/layout.header.json"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { NextIntlClientProvider } from "next-intl"

const meta: Meta<typeof Header> = {
    title: "Site/Layout/Header",
    component: Header,
    parameters: {
        layout: "fullscreen",
    },
}
export default meta

type Story = StoryObj<typeof Header>

export const Default: Story = {
    /* c8 ignore next */
    render: () => (
        <ThemeProvider>
            <NextIntlClientProvider
                locale="en"
                messages={{ layout: { header: enLayoutHeader as any } }}
            >
                <Header />
            </NextIntlClientProvider>
        </ThemeProvider>
    ),
}
