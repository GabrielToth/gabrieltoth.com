"use client"

import { ArrowLeft, ExternalLink, Home } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function LocaleNotFound() {
    const [locale, setLocale] = useState<string>("en")
    const [mounted, setMounted] = useState(false)
    const t = useTranslations("notFound")

    useEffect(() => {
        setMounted(true)

        // Get locale from URL path
        const path = window.location.pathname
        const pathSegments = path.split("/").filter(Boolean)
        const potentialLocale = pathSegments[0]

        // Check if it's a valid locale
        const validLocales = ["en", "pt-BR", "es", "de"]
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
                    if (browserLang.startsWith("pt")) setLocale("pt-BR")
                    else if (browserLang.startsWith("es")) setLocale("es")
                    else if (browserLang.startsWith("de")) setLocale("de")
                    else setLocale("en")
                } else {
                    setLocale("en")
                }
            }
        }
    }, [])

    // Prevent hydration mismatch
    /* c8 ignore start */
    if (!mounted) {
        return (
            <div className="min-h-screen bg-background dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="mb-12">
                        <h1 className="text-8xl font-bold text-primary dark:text-primary mb-4">
                            404
                        </h1>
                        <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                            Page Not Found
                        </h2>
                        <p className="text-lg text-muted-foreground dark:text-foreground mb-8">
                            Loading...
                        </p>
                    </div>
                </div>
            </div>
        )
    }
    /* c8 ignore stop */

    /* c8 ignore start */
    const content = {
        title: t("title"),
        subtitle: t("subtitle"),
        homeButton: t("homeButton"),
        backButton: t("backButton"),
        contactText: t("contactText"),
        viewButton: t("viewButton"),
    }
    /* c8 ignore stop */

    const products = [
        {
            title: "ViraTrend",
            description: t("products.viraTrend.description"),
            href: `/${locale}/channel-management`,
        },
        {
            title: t("products.pcGamingOptimization.title"),
            description: t("products.pcGamingOptimization.description"),
            href: `/${locale}/pc-optimization`,
        },
        {
            title: t("products.workAsEditor.title"),
            description: t("products.workAsEditor.description"),
            href: `/${locale}/editors`,
        },
    ]

    return (
        <div className="min-h-screen bg-background dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center">
                {/* Error Section */}
                <div className="mb-12">
                    <h1 className="text-8xl font-bold text-primary dark:text-primary mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                        {content.title}
                    </h2>
                    <p className="text-lg text-muted-foreground dark:text-foreground mb-8">
                        {content.subtitle}
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {products.map((product, index) => (
                        <div
                            key={index}
                            className="bg-card rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                                {product.title}
                            </h3>
                            <p className="text-muted-foreground dark:text-foreground mb-4 text-sm">
                                {product.description}
                            </p>
                            <Link
                                href={product.href}
                                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary transition-colors w-full"
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
                        className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary transition-colors"
                    >
                        <Home className="mr-2" size={20} />
                        {content.homeButton}
                    </Link>
                    <button
                        onClick={() => {
                            /* c8 ignore next */
                            window.history.back()
                        }}
                        className="inline-flex items-center px-6 py-3 border border-input dark:border-input text-foreground dark:text-foreground rounded-full font-medium hover:bg-muted dark:hover:bg-accent transition-colors"
                    >
                        <ArrowLeft className="mr-2" size={20} />
                        {content.backButton}
                    </button>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-sm text-muted-foreground dark:text-muted-foreground">
                    <p>{content.contactText}</p>
                </div>
            </div>
        </div>
    )
}
