import { locales, type Locale } from "@/lib/i18n"
import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async ({ locale }) => {
    // Validate that the incoming `locale` parameter is valid and ensure it's a string
    const validLocale =
        locale && locales.includes(locale as Locale) ? locale : "en"

    return {
        locale: validLocale as string,
        messages: {},
    }
})
