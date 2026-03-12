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
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
                    {t("pricing.title")}
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                    {t("pricing.description")}
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`rounded-lg overflow-hidden transition-transform hover:scale-105 ${
                                plan.popular
                                    ? "ring-2 ring-blue-600 transform scale-105"
                                    : "border border-gray-200 dark:border-gray-700"
                            } ${
                                plan.popular
                                    ? "bg-white dark:bg-gray-900"
                                    : "bg-white dark:bg-gray-900"
                            }`}
                        >
                            {plan.popular && (
                                <div className="bg-blue-600 text-white text-center py-2 font-semibold">
                                    Popular
                                </div>
                            )}
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {plan.description}
                                </p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                        {plan.price}
                                    </span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, fIndex) => (
                                        <li
                                            key={fIndex}
                                            className="flex items-center text-gray-600 dark:text-gray-400"
                                        >
                                            <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
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
                                    className={`w-full py-3 rounded-lg font-semibold transition-colors text-center block ${
                                        plan.popular
                                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                                            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
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
