"use client"

import PageHeader from "@/components/layout/page-header"
import { useTranslations } from "next-intl"
import Link from "next/link"

interface LandingHeroSectionProps {
    locale: string
}

export default function LandingHeroSection({
    locale,
}: LandingHeroSectionProps) {
    const t = useTranslations("landing")
    const tHero = useTranslations("homePageHero")

    return (
        <PageHeader
            eyebrow={tHero("hero.badge")}
            title={tHero("hero.title")}
            subtitle={tHero("hero.subtitle")}
        >
            <div className="mt-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={`/${locale}/login`}
                        className="px-8 py-4 bg-primary hover:bg-primary text-white rounded-lg font-semibold transition-colors"
                    >
                        {t("hero.cta")}
                    </Link>
                    <Link
                        href={"#features"}
                        className="px-8 py-4 border-2 border-blue-600 text-primary dark:text-primary hover:bg-primary/5 dark:hover:bg-accent rounded-lg font-semibold transition-colors"
                    >
                        Saiba Mais
                    </Link>
                </div>
            </div>
        </PageHeader>
    )
}
