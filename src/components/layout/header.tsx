"use client"

import { ThemeToggleClient } from "@/components/theme/theme-toggle-client"
import { useLocale } from "@/hooks/use-locale"
import { localeNames, locales, type Locale } from "@/lib/i18n"
import { Globe, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        home: isPortuguese ? "Início" : "Home",
        about: isPortuguese ? "Sobre" : "About",
        projects: isPortuguese ? "Projetos" : "Projects",
        investments: isPortuguese ? "Investimentos" : "Investments",
        services: isPortuguese ? "Serviços" : "Services",
        channels: isPortuguese ? "Canais" : "Channels",
        contact: isPortuguese ? "Contato" : "Contact",
        language: isPortuguese ? "Idioma" : "Language",
        // Services dropdown
        channelManagement: isPortuguese ? "ViraTrend" : "ViraTrend",
        pcOptimization: isPortuguese ? "SpeedPC" : "SpeedPC",
        investment: isPortuguese ? "Investimento" : "Investment",
        support: isPortuguese ? "Apoiar WaveIGL" : "Support WaveIGL",
    }
}

export default function Header() {
    const { locale, changeLocale } = useLocale()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false)
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
    const t = getTranslations(locale)

    const navigation = [
        { name: t.home, href: "/#hero" },
        { name: t.about, href: "/#about" },
        { name: t.projects, href: "/#projects" },
        { name: t.investments, href: `/${locale}/investments` },
        { name: t.channels, href: "/#channel-management" },
        { name: t.contact, href: "/#contact" },
    ]

    const servicesDropdown = [
        {
            name: t.channelManagement,
            href: `/${locale}/channel-management`,
            description:
                locale === "pt-BR"
                    ? "Serviço ViraTrend - Consultoria de crescimento"
                    : "ViraTrend Service - Growth consulting",
        },
        {
            name: t.pcOptimization,
            href: `/${locale}/pc-optimization`,
            description:
                locale === "pt-BR"
                    ? "SpeedPC para performance gaming"
                    : "SpeedPC for gaming performance",
        },

        {
            name: t.support,
            href: `/${locale}/waveigl-support`,
            description:
                locale === "pt-BR"
                    ? "Apoie a comunidade WaveIGL"
                    : "Support WaveIGL community",
        },
    ]

    const handleLanguageChange = (newLocale: Locale) => {
        changeLocale(newLocale)
        setIsLanguageMenuOpen(false)
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link
                        href={`/${locale}`}
                        className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        Gabriel Toth Gonçalves
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navigation.map(item => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                {item.name}
                            </a>
                        ))}

                        {/* Services Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setIsServicesMenuOpen(!isServicesMenuOpen)
                                }
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                {t.services}
                            </button>

                            {isServicesMenuOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                    {servicesDropdown.map(service => (
                                        <Link
                                            key={service.name}
                                            href={service.href}
                                            className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                                            onClick={() =>
                                                setIsServicesMenuOpen(false)
                                            }
                                        >
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {service.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {service.description}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setIsLanguageMenuOpen(!isLanguageMenuOpen)
                                }
                                className="flex items-center space-x-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                data-cy="language-selector"
                            >
                                <Globe size={16} />
                                <span>{localeNames[locale]}</span>
                            </button>

                            {isLanguageMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                    {locales.map(loc => (
                                        <button
                                            key={loc}
                                            onClick={() =>
                                                handleLanguageChange(loc)
                                            }
                                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                loc === locale
                                                    ? "text-blue-600 dark:text-blue-400 font-medium"
                                                    : "text-gray-600 dark:text-gray-300"
                                            }`}
                                            data-cy={`language-${loc}`}
                                        >
                                            {localeNames[loc]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggleClient />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                    <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col space-y-4">
                            {navigation.map(item => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </a>
                            ))}

                            {/* Mobile Services */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-base font-medium text-gray-900 dark:text-white mb-2">
                                    {t.services}
                                </div>
                                {servicesDropdown.map(service => (
                                    <Link
                                        key={service.name}
                                        href={service.href}
                                        className="block pl-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        {service.name}
                                    </Link>
                                ))}
                            </div>

                            {/* Mobile Language Switcher */}
                            <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {locales.map(loc => (
                                    <button
                                        key={loc}
                                        onClick={() => {
                                            handleLanguageChange(loc)
                                            setIsMobileMenuOpen(false)
                                        }}
                                        className={`text-sm font-medium transition-colors ${
                                            loc === locale
                                                ? "text-blue-600 dark:text-blue-400"
                                                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                    >
                                        {localeNames[loc]}
                                    </button>
                                ))}
                            </div>

                            {/* Theme Toggle */}
                            <ThemeToggleClient />
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}
