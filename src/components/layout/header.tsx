"use client"

import { ThemeToggleClient } from "@/components/theme/theme-toggle-client"
import LanguageSelector from "@/components/ui/language-selector"
import { useLocale } from "@/hooks/use-locale"
import { getLocalizedPath } from "@/lib/url-mapping"
import { Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function Header() {
    const { locale } = useLocale()
    const pathname = usePathname()
    const [isServicesOpen, setIsServicesOpen] = useState(false)
    const [isMinecraftOpen, setIsMinecraftOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Get translations
    const t = useTranslations("layout.header")

    // Navigation links based on page type
    const getNavigationLinks = () => {
        return [
            {
                href: getLocalizedPath("quem-sou-eu", locale),
                label: t("about"),
            },
        ]
    }

    const getHomeLink = () => {
        // If on homepage, link to hero section; otherwise link to home
        const isHomepage =
            pathname === `/${locale}` || pathname === `/${locale}/`
        return isHomepage ? "#hero" : `/${locale}`
    }

    const getServicesLinks = () => [
        {
            href: getLocalizedPath("channel-management", locale),
            label: t("servicesDropdown.channelManagement"),
        },
        {
            href: getLocalizedPath("pc-optimization", locale),
            label: t("servicesDropdown.pcOptimization"),
        },
        {
            href: getLocalizedPath("amazon-affiliate", locale),
            label: t("servicesDropdown.affiliate"),
        },
        {
            href: getLocalizedPath("iq-test", locale),
            label: t("servicesDropdown.iqTest"),
        },
        {
            href: getLocalizedPath("personality-test", locale),
            label: t("servicesDropdown.personalityTest", {
                default: "Personality Test",
            } as Record<string, string>),
        },
    ]

    const getMinecraftLinks = () => [
        {
            href: getLocalizedPath("minecraft-modpacks", locale),
            label: t("minecraftDropdown.modpacks"),
        },
        {
            href: getLocalizedPath("minecraft-mods", locale),
            label: t("minecraftDropdown.mods"),
        },
    ]

    const navigationLinks = getNavigationLinks()
    const servicesLinks = getServicesLinks()
    const minecraftLinks = getMinecraftLinks()

    // Show theme toggle inside language menu only on selected pages
    const pagesWithThemeInLanguage = ["/channel-management", "/pc-optimization"]
    const _includeThemeInLanguage = pagesWithThemeInLanguage.some(slug => {
        const base = `/${locale}${slug}`
        return pathname === base || pathname.startsWith(`${base}/`)
    })

    return (
        <header className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand - Left */}
                    <div className="shrink-0">
                        <Link
                            href={getHomeLink()}
                            className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            data-testid="nav-home"
                        >
                            Gabriel Toth Gonçalves
                        </Link>
                    </div>

                    {/* Desktop Navigation - Center */}
                    <nav className="hidden md:flex items-center space-x-8 flex-1 justify-center">
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
                                    link.href.includes("gabriel-toth-goncalves")
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

                        {/* Minecraft Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setIsMinecraftOpen(!isMinecraftOpen)
                                }
                                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center"
                                data-testid="minecraft-button"
                            >
                                {t("minecraft")}
                                <svg
                                    className={`ml-1 h-4 w-4 transition-transform ${
                                        isMinecraftOpen ? "rotate-180" : ""
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

                            {isMinecraftOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                                    {minecraftLinks.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            onClick={() =>
                                                setIsMinecraftOpen(false)
                                            }
                                            data-testid={
                                                link.href.includes("/modpacks")
                                                    ? "minecraft-link-modpacks"
                                                    : link.href.includes(
                                                            "/mods"
                                                        )
                                                      ? "minecraft-link-mods"
                                                      : undefined
                                            }
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

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
                                                      : undefined
                                            }
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Language, Theme and Auth Buttons - Right */}
                    <div className="hidden md:flex items-center space-x-3">
                        {/* Language and Theme Selectors */}
                        <div className="flex items-center space-x-2">
                            <LanguageSelector
                                variant="header"
                                includeThemeToggle={false}
                            />
                            <ThemeToggleClient />
                        </div>

                        {/* Divider */}
                        <div className="border-l border-gray-200 dark:border-gray-700 h-6"></div>

                        {/* Auth Buttons */}
                        <div className="flex items-center space-x-3">
                            <Link
                                href={getLocalizedPath("login", locale)}
                                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                                data-testid="nav-login"
                            >
                                {t("login", { defaultValue: "Login" })}
                            </Link>
                            <Link
                                href={getLocalizedPath("register", locale)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                                data-testid="nav-register"
                            >
                                {t("register", { defaultValue: "Register" })}
                            </Link>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-2">
                        <ThemeToggleClient />
                        <LanguageSelector
                            variant="header"
                            includeThemeToggle={false}
                        />

                        <button
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            data-testid="mobile-menu-toggle"
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
                    <div
                        className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700"
                        data-testid="mobile-nav"
                    >
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
                                        link.href.includes(
                                            "gabriel-toth-goncalves"
                                        )
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
                                                  : undefined
                                        }
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>

                            {/* Mobile Minecraft */}
                            <div className="px-3 py-2">
                                <div className="text-gray-900 dark:text-white font-medium mb-2">
                                    {t("minecraft")}
                                </div>
                                {minecraftLinks.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="block pl-4 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        data-testid={
                                            link.href.includes("/modpacks")
                                                ? "minecraft-link-modpacks-mobile"
                                                : link.href.includes("/mods")
                                                  ? "minecraft-link-mods-mobile"
                                                  : undefined
                                        }
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>

                            {/* Mobile Auth Buttons */}
                            <div className="px-3 py-2 space-y-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                                <Link
                                    href={getLocalizedPath("login", locale)}
                                    className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-testid="nav-login-mobile"
                                >
                                    {t("login", { defaultValue: "Login" })}
                                </Link>
                                <Link
                                    href={getLocalizedPath("register", locale)}
                                    className="block px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors text-center"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-testid="nav-register-mobile"
                                >
                                    {t("register", {
                                        defaultValue: "Register",
                                    })}
                                </Link>
                            </div>

                            {/* Mobile Actions */}
                            <div className="px-3 py-2 flex items-center justify-end md:hidden">
                                <ThemeToggleClient />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
