"use client"

import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useTutorial } from "./tutorial-provider"
import { getTutorialsForCategory } from "@/lib/tutorials/definitions"
import type { DashboardCategory } from "@/lib/tutorials/types"

interface TutorialLauncherProps {
    category: DashboardCategory | "onboarding"
    /** optionally override the default tutorial id to start */
    tutorialId?: string
    showDocs?: boolean
    compact?: boolean
}

/**
 * A launcher shown in each category page header:
 * - "Tutorial" button starts that category's guided tutorial
 * - "Docs" button navigates to the detailed documentation page for the category
 */
export function TutorialLauncher({
    category,
    tutorialId,
    showDocs = true,
    compact = false,
}: TutorialLauncherProps) {
    const t = useTranslations("dashboard.tutorials")
    const { start } = useTutorial()
    const locale = useLocale()
    const router = useRouter()

    const tutorials = getTutorialsForCategory(category)
    const idToStart =
        tutorialId ??
        tutorials.find(t => t.id !== "onboarding")?.id ??
        tutorials[0]?.id

    const docHref = `/${locale}/dashboard/docs/${category}`

    return (
        <div className="flex items-center gap-2">
            {idToStart && (
                <button
                    type="button"
                    onClick={() => start(idToStart)}
                    className={`inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/20 ${
                        compact ? "" : ""
                    }`}
                    title={t("startTutorial")}
                >
                    🎓 {t("startTutorial")}
                </button>
            )}
            {showDocs && (
                <button
                    type="button"
                    onClick={() => router.push(docHref)}
                    className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted ${
                        compact ? "" : ""
                    }`}
                    title={t("openDocs")}
                >
                    📖 {t("openDocs")}
                </button>
            )}
        </div>
    )
}
