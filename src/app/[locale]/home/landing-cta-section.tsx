"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"

interface LandingCtaSectionProps {
    locale: string
}

export default function LandingCtaSection({ locale }: LandingCtaSectionProps) {
    const t = useTranslations("landing")

    return (
        <section className="py-20 px-4 bg-primary dark:bg-card">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground dark:text-foreground mb-6">
                    {t("cta.title")}
                </h2>
                <p className="text-xl text-primary-foreground/80 dark:text-muted-foreground mb-8">
                    {t("cta.subtitle")}
                </p>
                <Link
                    href={`/${locale}/login`}
                    className="inline-block px-8 py-4 bg-white dark:bg-primary hover:bg-muted dark:hover:bg-primary/90 text-primary dark:text-primary-foreground font-semibold rounded-full transition-colors"
                >
                    {t("cta.button")}
                </Link>
            </div>
        </section>
    )
}
