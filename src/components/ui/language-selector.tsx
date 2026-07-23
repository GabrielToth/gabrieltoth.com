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
    align?: "left" | "right"
}

export default function LanguageSelector({
    variant = "default",
    className = "",
    includeThemeToggle = false,
    align = "right",
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
                    className="text-foreground dark:text-foreground"
                    size={16}
                    data-lucide="globe"
                />
                <span className="min-w-[20px] text-foreground dark:text-foreground">
                    EN
                </span>
            </div>
        )
    }

    const variants = {
        default: {
            container: "relative inline-block",
            button: "flex items-center space-x-2 px-3 py-2 border border-border dark:border-border rounded-full text-sm font-medium bg-card text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-accent transition-colors",
            dropdown:
                "absolute right-0 mt-2 w-32 bg-card border border-border dark:border-border rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-accent transition-colors",
        },
        header: {
            container: "relative inline-block",
            button: "flex items-center space-x-1 text-sm font-medium text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors",
            dropdown:
                "absolute right-0 mt-2 w-32 bg-card border border-border dark:border-border rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-accent transition-colors",
        },
        footer: {
            container: "relative inline-block",
            button: "flex items-center space-x-2 text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors",
            dropdown:
                "absolute bottom-full right-0 mb-2 w-32 bg-card border border-border dark:border-border rounded-md shadow-lg z-50",
            option: "block w-full px-4 py-2 text-sm text-left text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-accent transition-colors",
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
                    className="text-foreground dark:text-foreground"
                    size={16}
                    data-lucide="globe"
                />
                <span className="min-w-[20px] text-foreground dark:text-foreground">
                    {localeNamesShort[locale]}
                </span>
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
                        className={currentVariant.dropdown.replace(
                            "right-0",
                            align === "left" ? "left-0" : "right-0"
                        )}
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
                                        ? "text-primary dark:text-primary font-medium"
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
                        {includeThemeToggle && (
                            <>
                                <div className="h-px w-full bg-accent dark:bg-muted my-1" />
                                <button
                                    onClick={() => {
                                        toggleTheme()
                                        setIsOpen(false)
                                    }}
                                    className={`${currentVariant.option} flex items-center justify-between`}
                                    role="menuitem"
                                    aria-label={"Toggle theme"}
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
                    </div>
                </>
            )}
        </div>
    )
}
