"use client"

import { ArrowLeft, ExternalLink, Home } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function NotFound() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])
    const products = [
        {
            title: "Gerenciamento de Canais",
            titleEn: "Channel Management",
            description:
                "Consultoria especializada para crescimento no YouTube",
            descriptionEn: "Specialized consulting for YouTube growth",
            href: "/pt-BR/channel-management",
            hrefEn: "/channel-management",
        },
        {
            title: "Otimização de PC Gaming",
            titleEn: "PC Gaming Optimization",
            description: "Serviços de otimização para melhor performance",
            descriptionEn: "Optimization services for better performance",
            href: "/pt-BR/pc-optimization",
            hrefEn: "/pc-optimization",
        },
        {
            title: "Investimentos",
            titleEn: "Investments",
            description: "Oportunidades de investimento em projetos tech",
            descriptionEn: "Investment opportunities in tech projects",
            href: "/pt-BR/investments",
            hrefEn: "/investments",
        },
        {
            title: "Trabalhe Como Editor",
            titleEn: "Work as Editor",
            description: "Ganhe 90% do AdSense editando vídeos",
            descriptionEn: "Earn 90% of AdSense editing videos",
            href: "/pt-BR/editors",
            hrefEn: "/editors",
        },
        {
            title: "Suporte WaveIGL",
            titleEn: "WaveIGL Support",
            description: "Apoie nossa comunidade gaming",
            descriptionEn: "Support our gaming community",
            href: "/pt-BR/waveigl-support",
            hrefEn: "/waveigl-support",
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
                        Página Não Encontrada | Page Not Found
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                        A página que você procura não existe, mas temos outras
                        opções interessantes!
                        <br />
                        <span className="text-sm">
                            The page you're looking for doesn't exist, but we
                            have other interesting options!
                        </span>
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
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {product.titleEn}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                                {product.description}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 mb-4 text-xs">
                                {product.descriptionEn}
                            </p>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={product.href}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <span>Ver em Português</span>
                                    <ExternalLink className="ml-2" size={14} />
                                </Link>
                                <Link
                                    href={product.hrefEn}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <span>View in English</span>
                                    <ExternalLink className="ml-2" size={14} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/pt-BR"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Home className="mr-2" size={20} />
                        Página Inicial (PT)
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Home className="mr-2" size={20} />
                        Home Page (EN)
                    </Link>
                    {mounted && (
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="mr-2" size={20} />
                            Voltar | Go Back
                        </button>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                    <p>
                        Se você acha que isso é um erro, entre em contato
                        conosco.
                        <br />
                        If you think this is an error, please contact us.
                    </p>
                </div>
            </div>
        </div>
    )
}
