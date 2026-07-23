"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"

interface LandingPricingSectionProps {
    locale: string
}

export default function LandingPricingSection({
    locale,
}: LandingPricingSectionProps) {
    const t = useTranslations("landing")
    const plans = t.raw("pricing.plans") as Array<{
        name: string
        price: string
        description: string
        features: string[]
        popular?: boolean
    }>

    return (
        <section className="py-20 px-4 bg-muted dark:bg-card">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-foreground dark:text-foreground mb-4">
                    {t("pricing.title")}
                </h2>
                <p className="text-center text-muted-foreground dark:text-muted-foreground mb-16 text-lg">
                    {t("pricing.description")}
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`rounded-lg overflow-hidden transition-transform hover:scale-105 ${
                                plan.popular
                                    ? "ring-2 ring-ring transform scale-105"
                                    : "border border-border dark:border-border"
                            } ${
                                plan.popular
                                    ? "bg-card dark:bg-background"
                                    : "bg-card dark:bg-background"
                            }`}
                        >
                            {plan.popular && (
                                <div className="bg-primary text-white text-center py-2 font-semibold">
                                    Popular
                                </div>
                            )}
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-foreground dark:text-foreground mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                                    {plan.description}
                                </p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-foreground dark:text-foreground">
                                        {plan.price}
                                    </span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, fIndex) => (
                                        <li
                                            key={fIndex}
                                            className="flex items-center text-muted-foreground dark:text-muted-foreground"
                                        >
                                            <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                                <span className="text-white text-sm">
                                                    ✓
                                                </span>
                                            </span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={`/${locale}/login`}
                                    className={`w-full py-3 rounded-full font-semibold transition-colors text-center block ${
                                        plan.popular
                                            ? "bg-primary hover:bg-primary text-white"
                                            : "bg-muted hover:bg-accent dark:bg-card dark:hover:bg-accent text-foreground dark:text-foreground"
                                    }`}
                                >
                                    {t("hero.cta")}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
