import { defaultLocale } from "@/lib/i18n"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import DashboardClientLayout from "./dashboard-layout-client"

/**
 * Dashboard Layout (Server Component)
 * Provides i18n context for dashboard pages (outside [locale] routes)
 * Wraps children with the client DashboardLayout component
 */
export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    let messages: Record<string, unknown> = {}
    try {
        messages = await getMessages({ locale: defaultLocale })
    } catch {
        // Fall back to empty messages
    }

    return (
        <NextIntlClientProvider locale={defaultLocale} messages={messages}>
            <DashboardClientLayout>{children}</DashboardClientLayout>
        </NextIntlClientProvider>
    )
}
