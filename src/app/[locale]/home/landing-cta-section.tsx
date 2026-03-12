"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"

interface LandingCtaSectionProps {
    locale: string
}

export default function LandingCtaSection({ locale }: LandingCtaSectionProps) {
    const t = useTranslations("landing")

    return (
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    {t("cta.title")}
                </h2>
                <p className="text-xl text-blue-100 mb-8">
                    {t("cta.subtitle")}
                </p>
                <Link
                    href={`/${locale}/login`}
                    className="inline-block px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-lg transition-colors"
                >
                    {t("cta.button")}
                </Link>
            </div>
        </section>
    )
}
