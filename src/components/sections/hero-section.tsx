"use client"

import { type Locale } from "@/lib/i18n"
import { ChevronDown, Download, Mail } from "lucide-react"
import { useEffect, useState } from "react"

interface HeroSectionProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        greeting: isPortuguese ? "Olá, eu sou" : "Hello, I'm",
        name: "Gabriel Toth Gonçalves",
        title: isPortuguese
            ? "Desenvolvedor Full Stack & Gerente de Canais"
            : "Full Stack Developer & Channel Manager",
        subtitle: isPortuguese
            ? "Apaixonado por criar soluções digitais inovadoras com tecnologias modernas"
            : "Passionate about creating innovative digital solutions with modern technologies",
        cta: isPortuguese ? "Entre em contato" : "Get in touch",
        resume: isPortuguese ? "Baixar Currículo" : "Download Resume",
    }
}

const technologies = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Python",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Tailwind CSS",
]

export default function HeroSection({ locale }: HeroSectionProps) {
    const [mounted, setMounted] = useState(false)
    const [currentTech, setCurrentTech] = useState(0)
    const t = getTranslations(locale)

    useEffect(() => {
        setMounted(true)
        const interval = setInterval(() => {
            setCurrentTech(prev => (prev + 1) % technologies.length)
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    const scrollToAbout = () => {
        document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })
    }

    const scrollToContact = () => {
        document
            .getElementById("contact")
            ?.scrollIntoView({ behavior: "smooth" })
    }

    const downloadResume = () => {
        const resumeFile =
            locale === "pt-BR"
                ? "/resume/Gabriel-Toth-Goncalves-Curriculo-PT.pdf"
                : "/resume/Gabriel-Toth-Goncalves-Resume-EN.pdf"

        const link = document.createElement("a")
        link.href = resumeFile
        link.download = `Gabriel-Toth-Goncalves-${locale === "pt-BR" ? "Curriculo" : "Resume"}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <section
            id="hero"
            className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <div
                    className={`transition-all duration-1000 ease-out ${
                        mounted
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-8"
                    }`}
                >
                    {/* Greeting */}
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4 font-medium">
                        {t.greeting}
                    </p>

                    {/* Name */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t.name}
                    </h1>

                    {/* Title with Rotating Tech */}
                    <div className="mb-8">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t.title}
                        </h2>

                        {/* Rotating Technology */}
                        <div className="h-8 flex items-center justify-center">
                            <span className="text-lg text-gray-600 dark:text-gray-300 mr-2">
                                {locale === "pt-BR"
                                    ? "especializado em"
                                    : "specialized in"}
                            </span>
                            <span className="text-lg text-blue-600 dark:text-blue-400 font-medium min-w-[120px] text-left">
                                {mounted && technologies[currentTech]}
                            </span>
                        </div>
                    </div>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                        {t.subtitle}
                    </p>

                    {/* Call to Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <button
                            onClick={scrollToContact}
                            className="group bg-blue-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-blue-700 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                        >
                            <Mail size={20} />
                            <span>{t.cta}</span>
                        </button>

                        <button
                            onClick={downloadResume}
                            className="group border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                        >
                            <Download size={20} />
                            <span>{t.resume}</span>
                        </button>
                    </div>

                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap justify-center gap-3 mb-16">
                        {technologies.slice(0, 6).map((tech, index) => (
                            <span
                                key={tech}
                                className={`px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                    mounted
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 translate-y-4"
                                }`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <button
                    onClick={scrollToAbout}
                    className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 animate-bounce ${
                        mounted ? "opacity-100" : "opacity-0"
                    }`}
                    aria-label="Scroll to about section"
                >
                    <ChevronDown size={32} />
                </button>
            </div>
        </section>
    )
}
