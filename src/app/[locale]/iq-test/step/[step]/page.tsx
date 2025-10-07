import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"

interface StepPageProps {
    params: Promise<{ locale: Locale; step: string }>
}

export default async function IQStepPage({ params }: StepPageProps) {
    const { locale, step } = await params
    const t = await getTranslations({ locale, namespace: "iqTest" })
    const stepNum = Number(step)
    if (!Number.isInteger(stepNum) || stepNum < 1 || stepNum > 35) {
        notFound()
    }

    const isLast = stepNum === 35

    type Q =
        | { type: "sequence"; series: string }
        | { type: "analogy"; a: string; b: string; c: string }
        | { type: "math"; expr: string }
        | { type: "odd" }
        | { type: "text" }

    const questions: Record<number, Q> = {
        1: { type: "sequence", series: "2, 4, 8, 16, ?" },
        2: { type: "analogy", a: "Hand", b: "Glove", c: "Foot" },
        3: { type: "odd" },
        4: { type: "math", expr: "(12 + 8) / 5" },
        5: { type: "analogy", a: "Bird", b: "Wing", c: "Fish" },
        6: { type: "odd" },
        7: { type: "text" },
        8: { type: "math", expr: "A has 3, adds 5, gives away 2. Total?" },
        9: { type: "text" },
        10: { type: "text" },
        11: { type: "text" },
        12: { type: "sequence", series: "3, 6, 9, 12, ?" },
        13: { type: "math", expr: "7 × 4 + 9 = ?" },
        14: { type: "analogy", a: "Hot", b: "Cold", c: "High" },
        15: { type: "text" },
        16: { type: "math", expr: "Clock: 2:45 + 50 min = ?" },
        17: { type: "text" },
        18: { type: "sequence", series: "1, 2, 4, 7, 11, ?" },
        19: { type: "text" },
        20: { type: "text" },
        21: { type: "math", expr: "What is 25% of 240?" },
        22: { type: "text" },
        23: { type: "sequence", series: "A, C, F, J, O, ?" },
        24: { type: "text" },
        25: { type: "text" },
        26: { type: "text" },
        27: { type: "sequence", series: "D(4), G(7), K(11), P(16), ?" },
        28: { type: "sequence", series: "2, 3, 5, 7, 11, ?" },
        29: { type: "sequence", series: "1, 10, 11, 100, 101, ?" },
        30: { type: "text" },
        31: {
            type: "math",
            expr: "A completes task in 6h, B in 3h. Together?",
        },
        32: { type: "math", expr: "x + y = 12; x − y = 4; x = ?" },
        33: { type: "text" },
        34: { type: "text" },
        35: { type: "text" },
    }

    const q = questions[stepNum] || { type: "text" }
    const question =
        q.type === "sequence"
            ? t("prompts.sequence", { series: q.series })
            : q.type === "analogy"
              ? t("prompts.analogy", { a: q.a, b: q.b, c: q.c })
              : q.type === "math"
                ? t("prompts.math", { expr: q.expr })
                : q.type === "odd"
                  ? t("prompts.oddOneOut")
                  : t("steps.question", { step: stepNum })

    const options = [
        t("steps.options.a"),
        t("steps.options.b"),
        t("steps.options.c"),
        t("steps.options.d"),
    ]

    return (
        <section className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
            <p className="text-muted-foreground mb-4">
                {t("steps.progress", { step: stepNum, total: 35 })}
            </p>

            <div className="rounded-lg border p-4 mb-6">
                <div className="font-medium mb-2">{question}</div>
                <div className="space-y-2">
                    {options.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-2">
                            <input type="radio" name="answer" />
                            <span>{opt}</span>
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
        </section>
    )
}
