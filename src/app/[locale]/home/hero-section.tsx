"use client"

import { useLocale } from "@/hooks/use-locale"
import { ChevronDown, Download, Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { getHeroTranslations } from "./translations"

const technologies = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Python",
    "PostgreSQL",
    "Google APIs",
    "Power BI",
    "Docker",
    "Tailwind CSS",
]

export default function HeroSection() {
    const { locale } = useLocale()
    const [mounted, setMounted] = useState(false)
    const [currentTech, setCurrentTech] = useState(0)

    // Get translations
    const t = getHeroTranslations(locale)

    useEffect(() => {
        setMounted(true)
        const interval = setInterval(() => {
            setCurrentTech(prev => (prev + 1) % technologies.length)
        }, 2000)

        return () => clearInterval(interval)
    }, [])

    if (!mounted) return null

    return (
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="space-y-8">
                    {/* Greeting */}
                    <div className="space-y-4">
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium">
                            {t.greeting}
                        </p>

                        {/* Name with gradient */}
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent leading-tight">
                            {t.name}
                        </h1>
                    </div>

                    {/* Title with rotating tech */}
                    <div className="space-y-4">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-white">
                            {t.title}
                        </h2>

                        {/* Rotating technology */}
                        <div className="h-8 flex items-center justify-center">
                            <span className="text-base sm:text-lg text-purple-600 dark:text-purple-400 font-medium">
                                Especialista em{" "}
                                <span className="inline-block min-w-[120px] text-left transition-all duration-500 ease-in-out">
                                    {technologies[currentTech]}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        {t.subtitle}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                        <a
                            href="#contact"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <Mail className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            {t.cta}
                        </a>

                        <a
                            href="/resume/Gabriel-Toth-Goncalves-Curriculo-PT.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-8 py-4 border-2 border-purple-600 text-purple-600 dark:text-purple-400 font-semibold rounded-lg hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 transition-all duration-300 group"
                        >
                            <Download className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            {t.resume}
                        </a>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                    </div>
                </div>
            </div>
        </section>
    )
}
