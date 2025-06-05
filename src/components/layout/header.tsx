"use client"

import { getLocalizedPath, type Locale, localeNames, locales } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Globe, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface HeaderProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        home: isPortuguese ? "Início" : "Home",
        about: isPortuguese ? "Sobre" : "About",
        projects: isPortuguese ? "Projetos" : "Projects",
        contact: isPortuguese ? "Contato" : "Contact",
        language: isPortuguese ? "Idioma" : "Language",
    }
}

export default function Header({ locale }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
    const pathname = usePathname()
    const t = getTranslations(locale)

    const navigation = [
        { name: t.home, href: "#hero" },
        { name: t.about, href: "#about" },
        { name: t.projects, href: "#projects" },
        { name: t.contact, href: "#contact" },
    ]

    const currentPath = pathname.replace(`/${locale}`, "") || "/"

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link
                        href={getLocalizedPath("/", locale)}
                        className="text-xl font-bold text-foreground hover:text-primary transition-colors"
                    >
                        Gabriel Toth
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navigation.map(item => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {item.name}
                            </a>
                        ))}

                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setIsLanguageMenuOpen(!isLanguageMenuOpen)
                                }
                                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Globe size={16} />
                                <span>{localeNames[locale]}</span>
                            </button>

                            {isLanguageMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-background border border-border rounded-md shadow-lg">
                                    {locales.map(loc => (
                                        <Link
                                            key={loc}
                                            href={getLocalizedPath(
                                                currentPath,
                                                loc
                                            )}
                                            className={cn(
                                                "block px-4 py-2 text-sm hover:bg-muted transition-colors",
                                                loc === locale
                                                    ? "text-primary font-medium"
                                                    : "text-muted-foreground"
                                            )}
                                            onClick={() =>
                                                setIsLanguageMenuOpen(false)
                                            }
                                        >
                                            {localeNames[loc]}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {isMobileMenuOpen ? (
                            <X size={24} />
                        ) : (
                            <Menu size={24} />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-border">
                        <div className="flex flex-col space-y-4">
                            {navigation.map(item => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </a>
                            ))}

                            {/* Mobile Language Switcher */}
                            <div className="flex space-x-4 pt-4 border-t border-border">
                                {locales.map(loc => (
                                    <Link
                                        key={loc}
                                        href={getLocalizedPath(
                                            currentPath,
                                            loc
                                        )}
                                        className={cn(
                                            "text-sm font-medium transition-colors",
                                            loc === locale
                                                ? "text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        {localeNames[loc]}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}
