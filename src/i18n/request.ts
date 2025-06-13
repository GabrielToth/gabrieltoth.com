import { getRequestConfig } from "next-intl/server"
import { defaultLocale, locales, type Locale } from "../lib/i18n"

export default getRequestConfig(async ({ locale }) => {
    // Ensure we have a valid locale
    const validLocale: Locale =
        locale && locales.includes(locale as Locale)
            ? (locale as Locale)
            : defaultLocale

    return {
        locale: validLocale,
        messages: (await import(`./${validLocale}.json`)).default,
    }
})
