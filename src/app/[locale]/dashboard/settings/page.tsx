"use client"

import { LocalEnvsProvider } from "@/lib/local-envs"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { TutorialLauncher } from "@/components/tutorial/tutorial-launcher"

const SettingsContainer = dynamic(
    () =>
        import("@/components/settings/SettingsContainer").then(
            m => m.SettingsContainer
        ),
    { ssr: false }
)

export default function SettingsPage() {
    const t = useTranslations("dashboard.settings")
    return (
        <LocalEnvsProvider>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {t("title")}
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            {t("description")}
                        </p>
                    </div>
                    <TutorialLauncher category="settings" />
                </div>
                <SettingsContainer />
            </div>
        </LocalEnvsProvider>
    )
}
