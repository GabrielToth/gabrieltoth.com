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
        <section className="py-20 px-4 bg-card dark:bg-background">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-foreground dark:text-foreground mb-16">
                    {t("faq.title")}
                </h2>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-border dark:border-border rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() =>
                                    setOpenIndex(
                                        openIndex === index ? null : index
                                    )
                                }
                                className="w-full px-6 py-4 bg-muted dark:bg-card hover:bg-muted dark:hover:bg-accent flex items-center justify-between transition-colors"
                            >
                                <span className="font-semibold text-foreground dark:text-foreground text-left">
                                    {faq.question}
                                </span>
                                <span
                                    className={`text-primary dark:text-primary transition-transform ${
                                        openIndex === index ? "rotate-180" : ""
                                    }`}
                                >
                                    ▼
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="px-6 py-4 bg-card dark:bg-background border-t border-border dark:border-border">
                                    <p className="text-muted-foreground dark:text-muted-foreground">
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
