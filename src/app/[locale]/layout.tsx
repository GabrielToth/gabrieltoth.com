import StructuredData from "@/components/seo/structured-data"
import { ThemeScript } from "@/components/theme/theme-script"
import { locales, type Locale } from "@/lib/i18n"
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
    const locale = localeParam as Locale
    const messages = await getMessages({ locale })

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
