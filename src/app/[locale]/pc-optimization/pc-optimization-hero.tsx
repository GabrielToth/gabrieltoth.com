"use client"

import PageHeader from "@/components/layout/page-header"
import { Zap } from "lucide-react"
import { useTranslations } from "next-intl"

interface PCOptimizationHeroProps {
    locale: string
}

export default function PCOptimizationHero({
    locale,
}: PCOptimizationHeroProps) {
    const tHero = useTranslations("pcOptimizationPageHero")

    return (
        <PageHeader
            eyebrow={tHero("hero.badge")}
            title={tHero("hero.title")}
            subtitle={tHero("hero.subtitle")}
            className="bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-black dark:from-blue-900/30 dark:via-purple-900/20 dark:to-black"
            containerClassName="space-y-6"
        >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                    href="#pricing"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 text-white"
                >
                    {tHero("hero.cta")}
                </a>
            </div>
        </PageHeader>
    )
}
