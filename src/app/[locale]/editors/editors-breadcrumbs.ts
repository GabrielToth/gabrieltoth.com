import { getTranslations } from "next-intl/server"
import { type Locale } from "@/lib/i18n"

export async function getEditorsBreadcrumbs(locale: Locale) {
    const base = "https://www.gabrieltoth.com"
    const localePath = locale === "en" ? "" : `/${locale}`
    const t = await getTranslations({ locale, namespace: "editors" })

    return [
        {
            name: t("breadcrumbs.services"),
            url: `${base}${localePath}`,
        },
        {
            name: "YouTube Editors",
            url: `${base}${localePath}/editors`,
        },
    ]
}
