"use client"

import { useTranslations } from "next-intl"

export default function LandingBenefitsSection() {
    const t = useTranslations("landing")
    const benefits = t.raw("benefits.items") as Array<{
        title: string
        description: string
    }>

    return (
        <section className="py-20 px-4 bg-card dark:bg-background">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-foreground dark:text-foreground mb-16">
                    {t("benefits.title")}
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border dark:border-white/10 dark:border-input"
                        >
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                                <span className="text-white font-bold text-lg">
                                    ✓
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                                {benefit.title}
                            </h3>
                            <p className="text-muted-foreground dark:text-muted-foreground">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
