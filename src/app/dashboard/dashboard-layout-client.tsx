"use client"

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { useTranslations } from "next-intl"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type DashboardTab = "publish" | "live" | "insights" | "channels" | "settings"

export default function DashboardClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const t = useTranslations("dashboard.common")
    const params = useParams()
    const locale = params.locale as string
    const router = useRouter()
    const pathname = usePathname()
    const [activeTab, setActiveTab] = useState<DashboardTab>("publish")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (
            pathname.includes("/dashboard/publish") ||
            pathname.endsWith("/dashboard")
        ) {
            setActiveTab("publish")
        } else if (pathname.includes("/dashboard/insights")) {
            setActiveTab("insights")
        } else if (pathname.includes("/dashboard/live")) {
            setActiveTab("live")
        } else if (pathname.includes("/dashboard/channels")) {
            setActiveTab("channels")
        } else if (pathname.includes("/dashboard/settings")) {
            setActiveTab("settings")
        } else {
            setActiveTab("publish")
        }
        setIsLoading(false)
    }, [pathname])

    const handleTabChange = (tab: DashboardTab) => {
        setActiveTab(tab)
        router.push(`/${locale}/dashboard/${tab}`)
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-card dark:bg-background">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-blue-500 dark:border-border"></div>
                    <p className="text-muted-foreground dark:text-muted-foreground">
                        {t("loading")}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
            {children}
        </DashboardLayout>
    )
}
