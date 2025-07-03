"use client"

import { MoneroPricingProvider } from "@/hooks/use-monero-pricing"
import { type Locale } from "@/lib/i18n"
import { useEffect } from "react"

interface LocaleProviderProps {
    locale: Locale
    children: React.ReactNode
}

export default function LocaleProvider({
    locale,
    children,
}: LocaleProviderProps) {
    useEffect(() => {
        // Update the HTML lang attribute when locale changes
        if (typeof document !== "undefined") {
            document.documentElement.lang = locale
        }
    }, [locale])

    return <MoneroPricingProvider>{children}</MoneroPricingProvider>
}
