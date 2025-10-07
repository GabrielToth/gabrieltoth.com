"use client"

import { useTheme } from "@/components/theme/theme-provider"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/use-locale"
import { localeNamesShort, locales } from "@/lib/i18n"
import { Globe, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

interface LanguageSelectorProps {
    variant?: "default" | "header" | "footer"
    className?: string
    includeThemeToggle?: boolean
}

export default function LanguageSelector({
    variant = "default",
    className = "",
    includeThemeToggle = false,
}: LanguageSelectorProps) {
    const { locale, changeLocale } = useLocale()
    const { theme, toggleTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Fix hydration mismatch by only rendering after mount
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Don't render until mounted to avoid hydration issues
    if (!isMounted) {
        return (
            <div
                className={`flex items-center space-x-2 ${className}`}
                data-testid="language-selector"
            >
                <Globe
                    className="text-gray-700 dark:text-gray-300"
                    size={16}
                    data-lucide="globe"
                />
                <span className="min-w-[20px] text-gray-700 dark:text-gray-300">
                    EN
                </span>
            </div>
        )
    }

    const variants = {
        default: {
            container: "relative inline-block",
            button: "flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
            dropdown:
                "absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
        },
        header: {
            container: "relative inline-block",
            button: "flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors",
            dropdown:
                "absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
        },
        footer: {
            container: "relative inline-block",
            button: "flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors",
            dropdown:
                "absolute bottom-full right-0 mb-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
        },
    }

    const currentVariant = variants[variant]

    return (
        <div
            className={`${currentVariant.container} ${className}`}
            data-testid="language-selector"
        >
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={currentVariant.button}
                data-testid="language-selector-button"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Select language"
            >
                <Globe
                    className="text-gray-700 dark:text-gray-300"
                    size={16}
                    data-lucide="globe"
                />
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
                    <div
                        className={currentVariant.dropdown}
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="language-selector"
                        data-testid="language-selector-dropdown"
                    >
                        {locales.map(loc => (
                            <button
                                key={loc}
                                onClick={() => {
                                    changeLocale(loc)
                                    setIsOpen(false)
                                }}
                                className={`${currentVariant.option} ${
                                    loc === locale
                                        ? "text-blue-600 dark:text-blue-400 font-medium"
                                        : ""
                                }`}
                                data-testid={`language-selector-option-${loc}`}
                                role="menuitem"
                                aria-current={
                                    loc === locale ? "true" : undefined
                                }
                            >
                                {localeNamesShort[loc]}
                            </button>
                        ))}
                        /* c8 ignore start */
                        {includeThemeToggle && (
                            <>
                                <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-1" />
                                <button
                                    onClick={() => {
                                        toggleTheme()
                                        setIsOpen(false)
                                    }}
                                    className={`${currentVariant.option} flex items-center justify-between`}
                                    role="menuitem"
                                    aria-label={`Toggle theme`}
                                >
                                    <span>Theme</span>
                                    {theme === "light" ? (
                                        <Moon className="h-4 w-4" />
                                    ) : (
                                        <Sun className="h-4 w-4" />
                                    )}
                                </button>
                            </>
                        )}
                        /* c8 ignore stop */
                    </div>
                </>
            )}
        </div>
    )
}
