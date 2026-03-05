"use client"

import { Home } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function LocaleError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const params = useParams()
    const locale = (params?.locale as string) || "en"
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Log error for monitoring
        console.error("Locale error:", error)
    }, [error])

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-8xl font-bold text-red-600 dark:text-red-400 mb-4">
                        Error
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Loading...
                    </p>
                </div>
            </div>
        )
    }

    const content = {
        title:
            locale === "pt-BR"
                ? "Algo deu errado"
                : locale === "es"
                  ? "Algo salió mal"
                  : locale === "de"
                    ? "Etwas ist schief gelaufen"
                    : "Something went wrong",
        subtitle:
            locale === "pt-BR"
                ? "Encontramos um erro inesperado. Por favor, tente novamente ou volte para a página inicial."
                : locale === "es"
                  ? "Encontramos un error inesperado. Por favor, intente de nuevo o vuelva a la página de inicio."
                  : locale === "de"
                    ? "Wir sind auf einen unerwarteten Fehler gestoßen. Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zurück."
                    : "We encountered an unexpected error. Please try again or return to the home page.",
        tryAgain:
            locale === "pt-BR"
                ? "Tentar Novamente"
                : locale === "es"
                  ? "Intentar de Nuevo"
                  : locale === "de"
                    ? "Erneut Versuchen"
                    : "Try Again",
        homeButton:
            locale === "pt-BR"
                ? "Página Inicial"
                : locale === "es"
                  ? "Página de Inicio"
                  : locale === "de"
                    ? "Startseite"
                    : "Home Page",
        contactText:
            locale === "pt-BR"
                ? "Se este problema persistir, entre em contato conosco para obter suporte."
                : locale === "es"
                  ? "Si este problema persiste, contáctenos para obtener soporte."
                  : locale === "de"
                    ? "Wenn dieses Problem weiterhin besteht, kontaktieren Sie uns bitte für Unterstützung."
                    : "If this problem persists, please contact us for support.",
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
            <div className="max-w-2xl mx-auto text-center">
                {/* Error Section */}
                <div className="mb-12">
                    <h1 className="text-8xl font-bold text-red-600 dark:text-red-400 mb-4">
                        Error
                    </h1>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {content.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                        {content.subtitle}
                    </p>
                    {error.message && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded">
                            {error.message}
                        </p>
                    )}
                </div>

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        {content.tryAgain}
                    </button>
                    <Link
                        href={`/${locale}`}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Home className="mr-2" size={20} />
                        {content.homeButton}
                    </Link>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                    <p>{content.contactText}</p>
                </div>
            </div>
        </div>
    )
}
