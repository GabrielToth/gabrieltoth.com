"use client"

import { type Locale } from "@/lib/i18n"
import { ChevronDown, Download, Mail } from "lucide-react"
import { getHeroTranslations } from "./translations"

interface HeroSectionProps {
    locale: Locale
}

export default function HeroSection({ locale }: HeroSectionProps) {
    const isPortuguese = locale === "pt-BR"
    const t = getHeroTranslations(locale)

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 dark:from-purple-900/30 dark:to-blue-900/30" />

            <div className="relative z-10 container mx-auto px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Greeting */}
                    <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300">
                        {t.greeting}
                    </p>

                    {/* Name */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                        {t.name}
                    </h1>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100">
                        {t.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        {t.subtitle}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                        <a
                            href={`mailto:${isPortuguese ? "contato@gabrieltoth.com" : "contact@gabrieltoth.com"}`}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <Mail className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            {t.cta}
                        </a>

                        <a
                            href={
                                isPortuguese
                                    ? "/resume/Gabriel Toth - Curriculum PT.pdf"
                                    : "/resume/Gabriel Toth - Curriculum EN.pdf"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-8 py-4 border-2 border-purple-600 text-purple-600 dark:text-purple-400 font-semibold rounded-lg hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 transition-all duration-300 group"
                        >
                            <Download className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            {t.resume}
                        </a>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-[-3rem] left-1/2 transform -translate-x-1/2 mt-32">
                    <ChevronDown className="h-6 w-6 text-gray-400 animate-bounce" />
                </div>
            </div>
        </section>
    )
}
