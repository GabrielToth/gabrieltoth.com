import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"

interface StepProps {
    params: Promise<{ locale: Locale; step: string }>
}

export default async function PersonalityStepPage({ params }: StepProps) {
    const { locale, step } = await params
    const t = await getTranslations({ locale, namespace: "personality" })
    const n = Number(step)
    if (!Number.isInteger(n) || n < 1 || n > 35) notFound()

    const text = t(`questions.q${n}.text`)
    const choices: string[] = t.raw("choices") as string[]
    const isLast = n === 35

    return (
        <section className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
            <p className="text-muted-foreground mb-4">
                {t("steps.progress", { step: n, total: 35 })}
            </p>
            <div className="rounded-lg border p-4 mb-6">
                <div className="font-medium mb-2">{text}</div>
                <div className="space-y-2">
                    {choices.map((c, i) => (
                        <label key={i} className="flex items-center gap-2">
                            <input type="radio" name="answer" />
                            <span>{c}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between">
                {n > 1 ? (
                    <Link
                        href={`/${locale}/personality-test/step/${n - 1}`}
                        className="px-4 py-2 rounded-md border"
                    >
                        {t("steps.prev")}
                    </Link>
                ) : (
                    <span />
                )}
                {isLast ? (
                    <Link
                        href={`/${locale}/personality-test/summary`}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                        {t("steps.finish")}
                    </Link>
                ) : (
                    <Link
                        href={`/${locale}/personality-test/step/${n + 1}`}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                        {t("steps.next")}
                    </Link>
                )}
            </div>
        </section>
    )
}

export async function generateMetadata({
    params,
}: StepProps): Promise<Metadata> {
    const { locale, step } = await params
    const n = Number(step)
    if (!Number.isInteger(n) || n < 1 || n > 35) {
        return {}
    }
    const seoConfig = generateSeoConfig({
        locale,
        path: `/personality-test/step/${n}`,
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
                en: `https://www.gabrieltoth.com/en/personality-test/step/${n}/`,
                "pt-BR": `https://www.gabrieltoth.com/pt-BR/personality-test/step/${n}/`,
                es: `https://www.gabrieltoth.com/es/personality-test/step/${n}/`,
                de: `https://www.gabrieltoth.com/de/personality-test/step/${n}/`,
                "x-default": `https://www.gabrieltoth.com/pt-BR/personality-test/step/${n}/`,
            },
        },
    }
}
