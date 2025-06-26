"use client"

import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/use-locale"
import { localeNames, locales } from "@/lib/i18n"
import { Globe } from "lucide-react"
import { useState } from "react"

interface LanguageSelectorProps {
    variant?: "default" | "header" | "footer"
    className?: string
}

export default function LanguageSelector({
    variant = "default",
    className = "",
}: LanguageSelectorProps) {
    const { locale, changeLocale, isLoading } = useLocale()
    const [isOpen, setIsOpen] = useState(false)

    if (isLoading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
            </div>
        )
    }

    const variants = {
        default: {
            container: "relative inline-block",
            button: "flex items-center space-x-2 px-3 py-2 border border-gray-700 rounded-md text-sm font-medium bg-gray-800 text-white hover:bg-gray-700 transition-colors",
            dropdown:
                "absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors",
        },
        header: {
            container: "relative inline-block",
            button: "flex items-center space-x-1 text-sm font-medium text-gray-200 hover:text-white transition-colors",
            dropdown:
                "absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors",
        },
        footer: {
            container: "relative inline-block",
            button: "flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors",
            dropdown:
                "absolute bottom-full right-0 mb-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors",
        },
    }

    const currentVariant = variants[variant]

    return (
        <div className={`${currentVariant.container} ${className}`}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={currentVariant.button}
                data-cy="language-selector"
            >
                <Globe size={16} />
                <span>{localeNames[locale]}</span>
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className={currentVariant.dropdown}>
                        {locales.map(loc => (
                            <button
                                key={loc}
                                onClick={() => {
                                    changeLocale(loc)
                                    setIsOpen(false)
                                }}
                                className={`${currentVariant.option} ${
                                    loc === locale
                                        ? "text-blue-400 font-medium"
                                        : ""
                                }`}
                                data-cy={`language-${loc}`}
                            >
                                {localeNames[loc]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
