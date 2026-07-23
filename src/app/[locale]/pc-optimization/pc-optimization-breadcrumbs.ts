import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

export const getPCOptimizationBreadcrumbs = async (locale: Locale) => {
    const t = await getTranslations({ locale, namespace: "pcOptimization" })
    const localeSegment = locale === "en" ? "" : `/${locale}`

    return [
        {
            name: t("breadcrumbs.services"),
            url: `https://www.gabrieltoth.com${localeSegment}`,
        },
        {
            name: t("breadcrumbs.pcOptimization"),
            url: `https://www.gabrieltoth.com${localeSegment}/pc-optimization`,
        },
    ]
}
