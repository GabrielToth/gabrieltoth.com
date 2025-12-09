import QuestionsDebugPanel from "@/components/debug/questions-debug-panel"
import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import { type Locale } from "@/lib/i18n"
import { loadQuestions } from "@/lib/questions/loader"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"

interface StepPageProps {
    params: Promise<{ locale: Locale; step: string }>
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function IQStepPage({
    params,
    searchParams,
}: StepPageProps) {
    const { locale, step } = await params
    const sp = (await (searchParams || Promise.resolve({}))) as Record<
        string,
        string | string[] | undefined
    >
    const debug = sp["debug"] === "1"
    const envDebugEnabled =
        process.env.NEXT_PUBLIC_DEBUG === "1" ||
        process.env.NEXT_PUBLIC_DEBUG === "true"
    const debugOpen = envDebugEnabled && debug
    const t = await getTranslations({ locale, namespace: "iqTest" })
    const stepNum = Number(step)
    if (!Number.isInteger(stepNum) || stepNum < 1 || stepNum > 35) {
        notFound()
    }

    const isLast = stepNum === 35
    type Question =
        | { type: "sequence"; series: string; options: string[] }
        | { type: "math"; expr: string; options: string[] }
        | { type: "odd"; options: string[] }

    const buildQuestion = (index: number): Question => {
        const remainder = index % 7
        if (remainder === 1) {
            const start = 2 + (index % 3)
            const a = start
            const b = a * 2
            const c = b * 2
            const d = c * 2
            const series = `${a}, ${b}, ${c}, ${d}, ?`
            const correct = d * 2
            const options = [
                correct,
                correct - 2,
                Math.floor(correct / 2),
                correct - 4,
            ].map(String)
            return { type: "sequence", series, options }
        }
        if (remainder === 2) {
            const base = 1 + (index % 5)
            const inc = 3
            const s1 = base
            const s2 = s1 + inc
            const s3 = s2 + inc
            const s4 = s3 + inc
            const series = `${s1}, ${s2}, ${s3}, ${s4}, ?`
            const correct = s4 + inc
            const options = [
                correct,
                correct - 3,
                correct + 3,
                correct - 6,
            ].map(String)
            return { type: "sequence", series, options }
        }
        if (remainder === 3) {
            const n = 2 + (index % 5)
            const s1 = n ** 2
            const s2 = (n + 1) ** 2
            const s3 = (n + 2) ** 2
            const s4 = (n + 3) ** 2
            const series = `${s1}, ${s2}, ${s3}, ${s4}, ?`
            const correct = (n + 4) ** 2
            const options = [
                correct,
                correct - (2 * (n + 4) - 1),
                correct + (2 * (n + 4) + 1),
                s4 - 1,
            ].map(String)
            return { type: "sequence", series, options }
        }
        if (remainder === 4) {
            // Odd one out among three even and one odd (or vice-versa)
            const numbers = index % 2 === 0 ? [6, 8, 11, 10] : [9, 13, 15, 12]
            const options = numbers.map(n => String(n))
            return { type: "odd", options }
        }
        if (remainder === 5) {
            const a = 4 + (index % 6)
            const b = 6 + (index % 5)
            const c = 2 + (index % 4)
            const expr = `(${a} + ${b}) × ${c}`
            const correct = (a + b) * c
            const options = [
                correct,
                correct - c,
                correct + c,
                correct - 2,
            ].map(String)
            return { type: "math", expr, options }
        }
        if (remainder === 6) {
            const percent = 10 + (index % 5) * 5 // 10%, 15%, 20%, 25%, 30%
            const base = 80 + (index % 7) * 20
            const expr = `${percent}% × ${base}`
            const correct = Math.round((percent / 100) * base)
            const options = [
                correct,
                correct - 5,
                correct + 5,
                correct - 10,
            ].map(String)
            return { type: "math", expr, options }
        }
        // remainder === 0 → increasing increments (+1, +2, +3, +4)
        const start = 2 + (index % 4)
        const s1 = start
        const s2 = s1 + 1
        const s3 = s2 + 2
        const s4 = s3 + 3
        const series = `${s1}, ${s2}, ${s3}, ${s4}, ?`
        const correct = s4 + 4
        const options = [correct, correct - 2, correct + 2, correct - 4].map(
            String
        )
        return { type: "sequence", series, options }
    }

    const q = buildQuestion(stepNum)
    const question =
        q.type === "sequence"
            ? t("prompts.sequence", { series: q.series })
            : q.type === "math"
              ? t("prompts.math", { expr: q.expr })
              : t("prompts.oddOneOut")

    const options = q.options
    const correctIndex = 0

    const [
        mathPack,
        physPack,
        whPack,
        bioPack,
        sciPack,
        socPack,
        philPack,
        logicPack,
        langPack,
    ] = debugOpen
        ? await Promise.all([
              loadQuestions(locale, "math"),
              loadQuestions(locale, "physics"),
              loadQuestions(locale, "world_history"),
              loadQuestions(locale, "biology"),
              loadQuestions(locale, "science"),
              loadQuestions(locale, "sociology"),
              loadQuestions(locale, "philosophy"),
              loadQuestions(locale, "logic"),
              loadQuestions(locale, "language"),
          ])
        : [[], [], [], [], [], [], [], [], []]

    return (
        <>
            <Header />
            <section className="max-w-3xl mx-auto px-4 py-24 relative">
                <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
                <p className="text-muted-foreground mb-4">
                    {t("steps.progress", { step: stepNum, total: 35 })}
                </p>

                {envDebugEnabled && (
                    <div className="mb-4 flex justify-end gap-2">
                        {debug ? (
                            <Link
                                href={`/${locale}/iq-test/step/${stepNum}`}
                                className="rounded-md border px-3 py-1"
                            >
                                Debug: off
                            </Link>
                        ) : (
                            <Link
                                href={`/${locale}/iq-test/step/${stepNum}?debug=1`}
                                className="rounded-md border px-3 py-1"
                            >
                                Debug: on
                            </Link>
                        )}
                    </div>
                )}

                <div className="rounded-lg border p-4 mb-6">
                    <div className="font-medium mb-2">{question}</div>
                    <div className="space-y-2">
                        {options.map((optionText, idx) => (
                            <label
                                key={idx}
                                className="flex items-center gap-2"
                            >
                                <input type="radio" name="answer" />
                                <span>
                                    {optionText}
                                    {debugOpen && idx === correctIndex && (
                                        <span className="ml-2 text-green-600">
                                            (correta)
                                        </span>
                                    )}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    {stepNum > 1 ? (
                        <Link
                            href={`/${locale}/iq-test/step/${stepNum - 1}`}
                            className="px-4 py-2 rounded-md border"
                        >
                            {t("steps.prev")}
                        </Link>
                    ) : (
                        <span />
                    )}

                    {isLast ? (
                        <Link
                            href={`/${locale}/iq-test/summary`}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {t("steps.finish")}
                        </Link>
                    ) : (
                        <Link
                            href={`/${locale}/iq-test/step/${stepNum + 1}`}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {t("steps.next")}
                        </Link>
                    )}
                </div>

                <QuestionsDebugPanel
                    open={debugOpen}
                    closeHref={`/${locale}/iq-test/step/${stepNum}`}
                    dataByCategory={[
                        { name: "math", questions: mathPack },
                        { name: "physics", questions: physPack },
                        { name: "world_history", questions: whPack },
                        { name: "biology", questions: bioPack },
                        { name: "science", questions: sciPack },
                        { name: "sociology", questions: socPack },
                        { name: "philosophy", questions: philPack },
                        { name: "logic", questions: logicPack },
                        { name: "language", questions: langPack },
                    ]}
                />
            </section>
            <Footer locale={locale} />
        </>
    )
}

export async function generateMetadata({
    params,
}: StepPageProps): Promise<Metadata> {
    const { locale, step } = await params
    const stepNum = Number(step)
    if (!Number.isInteger(stepNum) || stepNum < 1 || stepNum > 35) {
        return {}
    }
    const seoConfig = generateSeoConfig({
        locale,
        path: `/iq-test/step/${stepNum}`,
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
                en: `https://www.gabrieltoth.com/en/iq-test/step/${stepNum}/`,
                "pt-BR": `https://www.gabrieltoth.com/pt-BR/iq-test/step/${stepNum}/`,
                es: `https://www.gabrieltoth.com/es/iq-test/step/${stepNum}/`,
                de: `https://www.gabrieltoth.com/de/iq-test/step/${stepNum}/`,
                "x-default": `https://www.gabrieltoth.com/pt-BR/iq-test/step/${stepNum}/`,
            },
        },
    }
}
