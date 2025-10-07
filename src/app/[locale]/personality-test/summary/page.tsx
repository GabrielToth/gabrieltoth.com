import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

interface SummaryProps {
    params: Promise<{ locale: Locale }>
}

export default async function PersonalitySummaryPage({ params }: SummaryProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "personality" })

    return (
        <section className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-2xl font-bold mb-4">{t("summary.title")}</h1>
            <p className="text-muted-foreground mb-6">
                {t("summary.subtitle")}
            </p>
            {/* Paywall appears here only after last step */}
            <div className="rounded-lg border p-6">
                <p className="mb-4">{t("summary.paywallText")}</p>
            </div>
        </section>
    )
}
