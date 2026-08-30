"use client"

import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTutorial } from "@/components/tutorial/tutorial-provider"
import {
    getDocForCategory,
    type CategoryDoc,
    type DocExample,
} from "@/lib/tutorials/docs-data"
import { DASHBOARD_CATEGORIES } from "@/lib/tutorials/types"

interface DocsPageProps {
    category?: string
}

export function DocsPage({ category }: DocsPageProps) {
    const t = useTranslations("dashboard.docs")
    const tt = useTranslations("dashboard.tutorials")
    const locale = useLocale()
    const router = useRouter()
    const { start } = useTutorial()

    const doc: CategoryDoc | null = getDocForCategory(category)

    if (!doc) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">{t("title")}</h1>
                <p className="text-muted-foreground">{t("pickCategory")}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {DASHBOARD_CATEGORIES.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() =>
                                router.push(
                                    `/${locale}/dashboard/docs/${c}`
                                )
                            }
                            className="rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/50"
                        >
                            <span className="font-semibold">
                                {tt(`titles.${c}`)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold">
                        {tt(`titles.${doc.category}`)}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        {t(doc.overviewKey)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => start(doc.category)}
                    >
                        🎓 {tt("startTutorial")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            router.push(`/${locale}/dashboard/docs`)
                        }
                    >
                        {t("allCategories")}
                    </Button>
                </div>
            </div>

            {/* Technical overview */}
            <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="text-base font-semibold">
                    {t("technicalTitle")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {t(doc.technicalKey)}
                </p>
                <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    <span className="font-semibold">
                        {t("dataTitle")}:{" "}
                    </span>
                    {t(doc.dataKey)}
                </div>
            </section>

            {/* Additional sections */}
            {doc.sections.map((s, i) => (
                <section
                    key={i}
                    className="rounded-lg border border-border bg-card p-5"
                >
                    <h2 className="text-base font-semibold">
                        {t(s.headingKey)}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t(s.bodyKey)}
                    </p>
                    {s.code && (
                        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/80 p-4 text-xs text-green-400">
                            <code>{s.code}</code>
                        </pre>
                    )}
                </section>
            ))}

            {/* Examples (individual + company) */}
            <section>
                <h2 className="mb-3 text-lg font-semibold">
                    {t("examplesTitle")}
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {doc.examples.map((ex: DocExample) => (
                        <div
                            key={ex.audience}
                            className="rounded-lg border border-border bg-card p-5"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                        ex.audience === "company"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-emerald-100 text-emerald-700"
                                    }`}
                                >
                                    {ex.audience === "company"
                                        ? t("companyLabel")
                                        : t("individualLabel")}
                                </span>
                                <h3 className="font-semibold">
                                    {t(ex.titleKey)}
                                </h3>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t(ex.bodyKey)}
                            </p>
                            <ol className="mt-3 space-y-1.5">
                                {ex.steps.map((step, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-foreground"
                                    >
                                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                            {i + 1}
                                        </span>
                                        <span>{t(step)}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
