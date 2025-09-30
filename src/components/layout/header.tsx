"use client"

import { ThemeToggleClient } from "@/components/theme/theme-toggle-client"
import LanguageSelector from "@/components/ui/language-selector"
import { useLocale } from "@/hooks/use-locale"
import { Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function Header() {
    const { locale } = useLocale()
    const pathname = usePathname()
    const [isServicesOpen, setIsServicesOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Get translations
    const t = useTranslations("layout.header")

    // Determine if we're on the homepage
    const isHomepage = pathname === `/${locale}` || pathname === "/"

    // Navigation links based on page type
    const getNavigationLinks = () => {
        if (isHomepage) {
            // Homepage: anchor links
            return [
                { href: "#about", label: t("about") },
                { href: "#projects", label: t("projects") },
                { href: "#contact", label: t("contact") },
            ]
        } else {
            // Other pages: full URLs
            return [
                { href: `/${locale}#about`, label: t("about") },
                { href: `/${locale}#projects`, label: t("projects") },
                { href: `/${locale}#contact`, label: t("contact") },
            ]
        }
    }

    const getHomeLink = () => {
        return isHomepage ? "#hero" : `/${locale}`
    }

    const getServicesLinks = () => [
        {
            href: `/${locale}/channel-management`,
            label: t("servicesDropdown.channelManagement"),
        },
        {
            href: `/${locale}/pc-optimization`,
            label: t("servicesDropdown.pcOptimization"),
        },
        {
            href: `/${locale}/waveigl-support`,
            label: t("servicesDropdown.support"),
        },
    ]

    const navigationLinks = getNavigationLinks()
    const servicesLinks = getServicesLinks()

    // Show theme toggle inside language menu only on selected pages
    const pagesWithThemeInLanguage = [
        "/channel-management",
        "/pc-optimization",
        "/waveigl-support",
    ]
    const includeThemeInLanguage = pagesWithThemeInLanguage.some(slug => {
        const base = `/${locale}${slug}`
        return pathname === base || pathname.startsWith(`${base}/`)
    })

    return (
        <header className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex-shrink-0">
                        <Link
                            href={getHomeLink()}
                            className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            data-testid="nav-home"
                        >
                            Gabriel Toth Gonçalves
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            href={getHomeLink()}
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            data-testid="nav-home-desktop"
                        >
                            {t("home")}
                        </Link>

                        {navigationLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                data-testid={
                                    link.href.includes("#about")
                                        ? "nav-about"
                                        : link.href.includes("#projects")
                                          ? "nav-projects"
                                          : link.href.includes("#contact")
                                            ? "nav-contact"
                                            : undefined
                                }
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Services Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setIsServicesOpen(!isServicesOpen)
                                }
                                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center"
                                data-testid="services-button"
                            >
                                {t("services")}
                                <svg
                                    className={`ml-1 h-4 w-4 transition-transform ${
                                        isServicesOpen ? "rotate-180" : ""
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="m19 9-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {isServicesOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                                    {servicesLinks.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            onClick={() =>
                                                setIsServicesOpen(false)
                                            }
                                            data-testid={
                                                link.href.endsWith(
                                                    "/channel-management"
                                                )
                                                    ? "services-link-channel-management"
                                                    : link.href.endsWith(
                                                            "/pc-optimization"
                                                        )
                                                      ? "services-link-pc-optimization"
                                                      : link.href.endsWith(
                                                              "/waveigl-support"
                                                          )
                                                        ? "services-link-support"
                                                        : undefined
                                            }
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle (outside language) */}
                        <ThemeToggleClient />

                        {/* Language Selector */}
                        <LanguageSelector
                            variant="header"
                            includeThemeToggle={includeThemeInLanguage}
                        />
                    </nav>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-2">
                        <ThemeToggleClient />
                        <LanguageSelector
                            variant="header"
                            includeThemeToggle={includeThemeInLanguage}
                        />

                        <button
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                            <Link
                                href={getHomeLink()}
                                className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                                data-testid="nav-home-mobile"
                            >
                                {t("home")}
                            </Link>

                            {navigationLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-testid={
                                        link.href.includes("#about")
                                            ? "nav-about-mobile"
                                            : link.href.includes("#projects")
                                              ? "nav-projects-mobile"
                                              : link.href.includes("#contact")
                                                ? "nav-contact-mobile"
                                                : undefined
                                    }
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* Mobile Services */}
                            <div className="px-3 py-2">
                                <div className="text-gray-900 dark:text-white font-medium mb-2">
                                    {t("services")}
                                </div>
                                {servicesLinks.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="block pl-4 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        data-testid={
                                            link.href.endsWith(
                                                "/channel-management"
                                            )
                                                ? "services-link-channel-management"
                                                : link.href.endsWith(
                                                        "/pc-optimization"
                                                    )
                                                  ? "services-link-pc-optimization"
                                                  : link.href.endsWith(
                                                          "/waveigl-support"
                                                      )
                                                    ? "services-link-support"
                                                    : undefined
                                        }
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
