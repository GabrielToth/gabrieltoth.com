"use client"

import { ArrowLeft, ExternalLink, Home } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function LocaleNotFound() {
    const [locale, setLocale] = useState<string>("en")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Get locale from URL path
        const path = window.location.pathname
        const pathSegments = path.split("/").filter(Boolean)
        const potentialLocale = pathSegments[0]

        // Check if it's a valid locale
        const validLocales = ["en", "pt-BR"]
        if (validLocales.includes(potentialLocale)) {
            setLocale(potentialLocale)
        } else {
            // Try to detect from cookie or browser
            const cookieLocale =
                typeof document !== "undefined"
                    ? document.cookie
                          .split("; ")
                          .find(row => row.startsWith("locale="))
                          ?.split("=")[1]
                    : null

            if (cookieLocale && validLocales.includes(cookieLocale)) {
                setLocale(cookieLocale)
            } else {
                // Detect from browser language
                if (typeof navigator !== "undefined") {
                    const browserLang = navigator.language
                    setLocale(browserLang.startsWith("pt") ? "pt-BR" : "en")
                } else {
                    setLocale("en")
                }
            }
        }
    }, [])

    const isPortuguese = locale === "pt-BR"

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="mb-12">
                        <h1 className="text-8xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                            404
                        </h1>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Page Not Found
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                            Loading...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const content = {
        title: isPortuguese ? "Página Não Encontrada" : "Page Not Found",
        subtitle: isPortuguese
            ? "A página que você procura não existe, mas temos outras opções interessantes!"
            : "The page you're looking for doesn't exist, but we have other interesting options!",
        homeButton: isPortuguese ? "Página Inicial" : "Home Page",
        backButton: isPortuguese ? "Voltar" : "Go Back",
        contactText: isPortuguese
            ? "Se você acha que isso é um erro, entre em contato conosco."
            : "If you think this is an error, please contact us.",
        viewButton: isPortuguese ? "Ver Página" : "View Page",
    }

    const products = [
        {
            title: isPortuguese ? "ViraTrend" : "ViraTrend",
            description: isPortuguese
                ? "Consultoria especializada para crescimento digital"
                : "Specialized consulting for digital growth",
            href: `/${locale}/channel-management`,
        },
        {
            title: isPortuguese
                ? "Otimização de PC Gaming"
                : "PC Gaming Optimization",
            description: isPortuguese
                ? "Serviços de otimização para melhor performance"
                : "Optimization services for better performance",
            href: `/${locale}/pc-optimization`,
        },
        {
            title: isPortuguese ? "Investimentos" : "Investments",
            description: isPortuguese
                ? "Oportunidades de investimento em projetos tech"
                : "Investment opportunities in tech projects",
            href: `/${locale}/investments`,
        },
        {
            title: isPortuguese ? "Trabalhe Como Editor" : "Work as Editor",
            description: isPortuguese
                ? "Ganhe 90% do AdSense editando vídeos"
                : "Earn 90% of AdSense editing videos",
            href: `/${locale}/editors`,
        },
        {
            title: isPortuguese ? "Suporte WaveIGL" : "WaveIGL Support",
            description: isPortuguese
                ? "Apoie nossa comunidade gaming"
                : "Support our gaming community",
            href: `/${locale}/waveigl-support`,
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center">
                {/* Error Section */}
                <div className="mb-12">
                    <h1 className="text-8xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {content.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                        {content.subtitle}
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {products.map((product, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {product.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                                {product.description}
                            </p>
                            <Link
                                href={product.href}
                                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full"
                            >
                                <span>{content.viewButton}</span>
                                <ExternalLink className="ml-2" size={14} />
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={`/${locale}`}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Home className="mr-2" size={20} />
                        {content.homeButton}
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="mr-2" size={20} />
                        {content.backButton}
                    </button>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                    <p>{content.contactText}</p>
                </div>
            </div>
        </div>
    )
}
