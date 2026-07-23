import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

export async function getPrivacyPolicyBreadcrumbs(locale: Locale) {
    const base = "https://www.gabrieltoth.com"
    const localePath = locale === "en" ? "" : `/${locale}`
    const t = await getTranslations({ locale, namespace: "privacyPolicy" })
    return [
        {
            name: t("title"),
            url: `${base}${localePath}/privacy-policy`,
        },
    ]
}
