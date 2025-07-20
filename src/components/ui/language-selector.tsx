"use client"

import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/use-locale"
import { localeNames, localeNamesShort, locales } from "@/lib/i18n"
import { Globe } from "lucide-react"
import { useEffect, useState } from "react"

interface LanguageSelectorProps {
    variant?: "default" | "header" | "footer"
    className?: string
}

export default function LanguageSelector({
    variant = "default",
    className = "",
}: LanguageSelectorProps) {
    const { locale, changeLocale } = useLocale()
    const [isOpen, setIsOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Fix hydration mismatch by only rendering after mount
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Don't render until mounted to avoid hydration issues
    if (!isMounted) {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <Globe size={16} />
                <span className="min-w-[20px]">EN</span>
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
                data-testid="language-selector"
            >
                <Globe size={16} />
                <span className="min-w-[20px]">{localeNamesShort[locale]}</span>
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
