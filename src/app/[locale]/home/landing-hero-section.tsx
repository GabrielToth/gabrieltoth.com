"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"

interface LandingHeroSectionProps {
    locale: string
}

export default function LandingHeroSection({
    locale,
}: LandingHeroSectionProps) {
    const t = useTranslations("landing")

    return (
        <section className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                    {t("hero.title")}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {t("hero.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={`/${locale}/login`}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        {t("hero.cta")}
                    </Link>
                    <Link
                        href={"#features"}
                        className="px-8 py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg font-semibold transition-colors"
                    >
                        Saiba Mais
                    </Link>
                </div>
            </div>
        </section>
    )
}
