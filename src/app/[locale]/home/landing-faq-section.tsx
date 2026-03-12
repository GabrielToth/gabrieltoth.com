"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

export default function LandingFaqSection() {
    const t = useTranslations("landing")
    const faqs = t.raw("faq.items") as Array<{
        question: string
        answer: string
    }>
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section className="py-20 px-4 bg-white dark:bg-gray-900">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
                    {t("faq.title")}
                </h2>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() =>
                                    setOpenIndex(
                                        openIndex === index ? null : index
                                    )
                                }
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                            >
                                <span className="font-semibold text-gray-900 dark:text-white text-left">
                                    {faq.question}
                                </span>
                                <span
                                    className={`text-blue-600 dark:text-blue-400 transition-transform ${
                                        openIndex === index ? "rotate-180" : ""
                                    }`}
                                >
                                    ▼
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
