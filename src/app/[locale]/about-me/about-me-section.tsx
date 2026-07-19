import PageHeader from "@/components/layout/page-header"
import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

interface AboutMeSectionProps {
    locale: Locale
}

export default async function AboutMeSection({
    locale,
}: AboutMeSectionProps) {
    const t = await getTranslations({ locale, namespace: "aboutMe" })

    return (
        <PageHeader
            eyebrow={t("hero.badge")}
            title={t("hero.title")}
            subtitle={t("hero.subtitle")}
        />
    )
}
