import { getTranslations } from "next-intl/server"
import { type Locale } from "@/lib/i18n"

export async function getChannelManagementBreadcrumbs(locale: Locale) {
    const base = "https://www.gabrieltoth.com"
    const localePath = locale === "en" ? "" : `/${locale}`
    const t = await getTranslations({ locale, namespace: "channelManagement" })

    return [
        {
            name: t("breadcrumbs.services"),
            url: `${base}${localePath}`,
        },
        {
            name: "ViraTrend",
            url: `${base}${localePath}/channel-management`,
        },
    ]
}
