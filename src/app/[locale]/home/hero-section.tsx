"use client"

import { type Locale } from "@/lib/i18n"
import { ChevronDown, Download, Mail } from "lucide-react"
import { useTranslations } from "next-intl"

interface HeroSectionProps {
    locale: Locale
}

export default function HeroSection({}: HeroSectionProps) {
    const t = useTranslations("home.hero")

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden"
        >
            <div className="absolute inset-0 bg-primary/10 dark:from-primary/20 dark:to-blue-900/30" />

            <div className="relative z-10 container mx-auto px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Greeting */}
                    <p className="text-xl sm:text-2xl text-muted-foreground dark:text-foreground">
                        {t("greeting")}
                    </p>

                    {/* Name */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-primary">
                        {t("name")}
                    </h1>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-semibold text-foreground dark:text-foreground">
                        {t("title")}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-muted-foreground dark:text-foreground max-w-3xl mx-auto leading-relaxed">
                        {t("subtitle")}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                        <a
                            href={`mailto:${t("contactEmail")}`}
                            className="inline-flex items-center px-8 py-4 bg-primary text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <Mail className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            {t("cta")}
                        </a>

                        <a
                            href={t("resumeUrl")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-8 py-4 border-2 border-purple-600 text-primary dark:text-purple-400 font-semibold rounded-lg hover:bg-primary hover:text-white dark:hover:bg-purple-500 transition-all duration-300 group"
                        >
                            <Download className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            {t("resume")}
                        </a>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-[-3rem] left-1/2 transform -translate-x-1/2 mt-32">
                    <ChevronDown className="h-6 w-6 text-muted-foreground animate-bounce" />
                </div>
            </div>
        </section>
    )
}
