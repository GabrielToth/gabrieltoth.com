import StructuredData from "@/components/seo/structured-data"
import { ThemeScript } from "@/components/theme/theme-script"
import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import LocaleProvider from "./locale-provider"

interface LocaleLayoutProps {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}

export { generateMetadata } from "./layout-metadata"

export default async function LocaleLayout({
    children,
    params,
}: LocaleLayoutProps) {
    const { locale: localeParam } = await params

    // Validate locale parameter
    let locale: Locale = defaultLocale

    // Check if locale is valid
    if (
        localeParam &&
        typeof localeParam === "string" &&
        locales.includes(localeParam as Locale)
    ) {
        locale = localeParam as Locale
    }

    // Get messages with error handling
    let messages
    try {
        messages = await getMessages({ locale })
    } catch (error) {
        // If getMessages fails, try with default locale
        try {
            messages = await getMessages({ locale: defaultLocale })
            locale = defaultLocale
        } catch (fallbackError) {
            // If even default locale fails, use empty messages object
            messages = {}
        }
    }

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <LocaleProvider locale={locale}>
                <ThemeScript />
                <StructuredData locale={locale} type="both" />
                {children}
            </LocaleProvider>
        </NextIntlClientProvider>
    )
}
