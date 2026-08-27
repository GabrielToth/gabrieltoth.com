import { render } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import React from "react"
import enDashboard from "@/i18n/en/dashboard.json"

/**
 * Renders a component wrapped in NextIntlClientProvider so
 * `useTranslations("dashboard.insights")` works in tests.
 */
export function renderInsights(ui: React.ReactNode) {
    return render(
        <NextIntlClientProvider
            locale="en"
            messages={{ dashboard: enDashboard as object }}
        >
            {ui}
        </NextIntlClientProvider>
    )
}
