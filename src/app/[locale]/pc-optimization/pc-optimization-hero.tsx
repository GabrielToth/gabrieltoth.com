"use client"

import PageHeader from "@/components/layout/page-header"
import { useTranslations } from "next-intl"

interface PCOptimizationHeroProps {
    locale: string
}

export default function PCOptimizationHero({
    locale: _locale,
}: PCOptimizationHeroProps) {
    const tHero = useTranslations("pcOptimizationPageHero")

    return (
        <PageHeader
            eyebrow={tHero("hero.badge")}
            title={tHero("hero.title")}
            subtitle={tHero("hero.subtitle")}
            className=""
            containerClassName="space-y-6"
        >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                    href="#pricing"
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg transition-colors hover:bg-primary"
                >
                    {tHero("hero.cta")}
                </a>
            </div>
        </PageHeader>
    )
}
