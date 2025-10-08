import { getCurrencyForLocale } from "@/lib/currency"
import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface SummaryPageProps {
    params: Promise<{ locale: Locale }>
}

const USD_PROMO = 1.0
const USD_ORIGINAL = 5.99

function formatPrice(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
        }).format(amount)
    } catch {
        return `$${amount.toFixed(2)}`
    }
}

export default async function IQSummaryPage({ params }: SummaryPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "iqTest" })
    const currency = getCurrencyForLocale(locale)

    // Conversion: simple heuristic (USD base)
    const rate = currency === "BRL" ? 5.0 : currency === "EUR" ? 0.95 : 1
    const promoLocal = USD_PROMO * rate
    const originalLocal = USD_ORIGINAL * rate

    return (
        <section className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-2xl font-bold mb-4">{t("summary.title")}</h1>
            <p className="text-muted-foreground mb-6">
                {t("summary.subtitle")}
            </p>

            <div className="rounded-lg border p-4 mb-6 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                <div className="text-lg font-bold">
                    {t("summary.promoNow", {
                        price: formatPrice(promoLocal, currency),
                    })}
                </div>
                <div className="text-sm">
                    {t("summary.promoOriginal", {
                        price: formatPrice(originalLocal, currency),
                        usd: formatPrice(USD_ORIGINAL, "USD"),
                    })}
                </div>
            </div>

            <Link
                href={`/${locale}/payments/checkout?product=iqtest&price=${USD_PROMO}`}
                className="inline-flex items-center px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
                {t("summary.payCta")}
            </Link>
        </section>
    )
}

export async function generateMetadata({
    params,
}: SummaryPageProps): Promise<Metadata> {
    const { locale } = await params
    const seoConfig = generateSeoConfig({
        locale,
        path: "/iq-test/summary",
        ogType: "website",
    })
    return {
        title: seoConfig.title,
        description: seoConfig.description,
        openGraph: {
            ...seoConfig.openGraph,
        },
        twitter: {
            ...seoConfig.twitter,
        },
        alternates: {
            canonical: seoConfig.canonical,
            languages: {
                en: "https://www.gabrieltoth.com/en/iq-test/summary/",
                "pt-BR": "https://www.gabrieltoth.com/pt-BR/iq-test/summary/",
                es: "https://www.gabrieltoth.com/es/iq-test/summary/",
                de: "https://www.gabrieltoth.com/de/iq-test/summary/",
                "x-default":
                    "https://www.gabrieltoth.com/pt-BR/iq-test/summary/",
            },
        },
    }
}
