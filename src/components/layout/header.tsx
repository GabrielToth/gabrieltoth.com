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

    const toggleServices = () => {
        setIsServicesOpen(prev => !prev)
        setIsMinecraftOpen(false)
    }

    const toggleMinecraft = () => {
        setIsMinecraftOpen(prev => !prev)
        setIsServicesOpen(false)
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev)
        setIsServicesOpen(false)
        setIsMinecraftOpen(false)
    }

    // Get translations
    const t = useTranslations("layout.header")

    // Navigation links based on page type
    const getNavigationLinks = () => {
        return [
            {
                href: getLocalizedPath("about-me", locale),
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
            key: "channel-management",
            href: getLocalizedPath("channel-management", locale),
            label: t("servicesDropdown.channelManagement"),
        },
        {
            key: "pc-optimization",
            href: getLocalizedPath("pc-optimization", locale),
            label: t("servicesDropdown.pcOptimization"),
        },
        {
            key: "amazon-affiliate",
            href: getLocalizedPath("amazon-affiliate", locale),
            label: t("servicesDropdown.affiliate"),
        },
        {
            key: "iq-test",
            href: getLocalizedPath("iq-test", locale),
            label: t("servicesDropdown.iqTest"),
        },
        {
            key: "personality-test",
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
        {
            href: getLocalizedPath("minecraft-plugins", locale),
            label: t("minecraftDropdown.plugins", { defaultValue: "Plugins" }),
        },
        {
            href: getLocalizedPath("minecraft-contributions", locale),
            label: t("minecraftDropdown.contributions", {
                defaultValue: "Contributions",
            }),
        },
    ]

    const navigationLinks = getNavigationLinks()
    const servicesLinks = getServicesLinks()
    const minecraftLinks = getMinecraftLinks()

    // Show theme toggle inside language menu only on selected pages
    const pagesWithThemeInLanguage = ["channel-management", "pc-optimization"]
    const includeThemeInLanguage = pagesWithThemeInLanguage.some(slug => {
        const localizedPath = getLocalizedPath(slug, locale)
        return (
            pathname === localizedPath ||
            pathname.startsWith(localizedPath + "/")
        )
    })

    // Don't render public header on dashboard pages
    if (pathname?.includes("/dashboard/")) {
        return null
    }

    return (
        <header className="fixed top-0 w-full bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border dark:border-border z-50">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand - Left */}
                    <div className="shrink-0">
                        <Link
                            href={getHomeLink()}
                            className="text-xl font-bold text-foreground dark:text-foreground hover:text-primary dark:hover:text-primary transition-colors"
                            data-testid="nav-home"
                        >
                            Gabriel Toth Gonçalves
                        </Link>
                    </div>

                    {/* Desktop Navigation - Center */}
                    <nav className="hidden nav:flex items-center space-x-8 flex-1 justify-center">
                        <Link
                            href={getHomeLink()}
                            className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                            data-testid="nav-home-desktop"
                        >
                            {t("home")}
                        </Link>

                        {navigationLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
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
                            <div className="flex items-center">
                                <Link
                                    href={getLocalizedPath("minecraft", locale)}
                                    className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                    data-testid="minecraft-link"
                                >
                                    {t("minecraft")}
                                </Link>
                                <button
                                    onClick={toggleMinecraft}
                                    className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors ml-1 p-1"
                                    data-testid="minecraft-dropdown-button"
                                    aria-label="Toggle Minecraft submenu"
                                >
                                    <svg
                                        className={`h-4 w-4 transition-transform ${
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
                            </div>

                            {isMinecraftOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border dark:border-border">
                                    {minecraftLinks.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="block px-4 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-accent transition-colors"
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
                            <div className="flex items-center">
                                <Link
                                    href={getLocalizedPath("services", locale)}
                                    className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                    data-testid="services-link"
                                >
                                    {t("services")}
                                </Link>
                                <button
                                    onClick={toggleServices}
                                    className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors ml-1 p-1"
                                    data-testid="services-dropdown-button"
                                    aria-label="Toggle Services submenu"
                                >
                                    <svg
                                        className={`h-4 w-4 transition-transform ${
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
                            </div>

                            {isServicesOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border dark:border-border">
                                    {servicesLinks.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="block px-4 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-accent transition-colors"
                                            onClick={() =>
                                                setIsServicesOpen(false)
                                            }
                                            data-testid={`services-link-${link.key}`}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Right group: desktop actions, mid nav, hamburger */}
                    <div className="flex items-center">
                        {/* Language, Theme and Auth Buttons - visible ≥ 880px */}
                        <div className="hidden nav:flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <LanguageSelector
                                    variant="header"
                                    includeThemeToggle={includeThemeInLanguage}
                                />
                                <ThemeToggleClient />
                            </div>

                            <div className="border-l border-border dark:border-border h-6"></div>

                            <Link
                                href={getLocalizedPath("login", locale)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium transition-colors"
                                data-testid="nav-login"
                            >
                                {t("login", {
                                    defaultValue: "Sign In",
                                })}
                            </Link>
                        </div>

                        {/* Mid tier 1: About + Services + Minecraft (768–880px) */}
                        <div
                            className={`${isMobileMenuOpen ? "hidden" : "hidden md:flex nav:!hidden"} items-center space-x-8 mr-6`}
                        >
                            <Link
                                href={getLocalizedPath("about-me", locale)}
                                className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                data-testid="nav-about-mid"
                            >
                                {t("about")}
                            </Link>

                            <div className="relative">
                                <div className="flex items-center">
                                    <Link
                                        href={getLocalizedPath(
                                            "services",
                                            locale
                                        )}
                                        className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                        data-testid="services-link-mid"
                                    >
                                        {t("services")}
                                    </Link>
                                    <button
                                        onClick={toggleServices}
                                        className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors ml-1 p-1"
                                        data-testid="services-dropdown-button-mid"
                                        aria-label="Toggle Services submenu"
                                    >
                                        <svg
                                            className={`h-4 w-4 transition-transform ${
                                                isServicesOpen
                                                    ? "rotate-180"
                                                    : ""
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
                                </div>

                                {isServicesOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border dark:border-border z-50">
                                        {servicesLinks.map(link => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className="block px-4 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-accent transition-colors"
                                                onClick={() =>
                                                    setIsServicesOpen(false)
                                                }
                                                data-testid={`services-link-t1-${link.key}`}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <div className="flex items-center">
                                    <Link
                                        href={getLocalizedPath(
                                            "minecraft",
                                            locale
                                        )}
                                        className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                        data-testid="minecraft-link-mid"
                                    >
                                        {t("minecraft")}
                                    </Link>
                                    <button
                                        onClick={toggleMinecraft}
                                        className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors ml-1 p-1"
                                        data-testid="minecraft-dropdown-button-mid"
                                        aria-label="Toggle Minecraft submenu"
                                    >
                                        <svg
                                            className={`h-4 w-4 transition-transform ${
                                                isMinecraftOpen
                                                    ? "rotate-180"
                                                    : ""
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
                                </div>

                                {isMinecraftOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border dark:border-border z-50">
                                        {minecraftLinks.map(link => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className="block px-4 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-accent transition-colors"
                                                onClick={() =>
                                                    setIsMinecraftOpen(false)
                                                }
                                                data-testid={
                                                    link.href.includes(
                                                        "/modpacks"
                                                    )
                                                        ? "minecraft-link-modpacks-mid"
                                                        : link.href.includes(
                                                                "/mods"
                                                            )
                                                          ? "minecraft-link-mods-mid"
                                                          : undefined
                                                }
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mid tier 2: About + Services (640–768px) */}
                        <div
                            className={`${isMobileMenuOpen ? "hidden" : "hidden sm:flex md:!hidden"} items-center space-x-8 mr-6`}
                        >
                            <Link
                                href={getLocalizedPath("about-me", locale)}
                                className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                data-testid="nav-about-mid-sm"
                            >
                                {t("about")}
                            </Link>

                            <div className="relative">
                                <div className="flex items-center">
                                    <Link
                                        href={getLocalizedPath(
                                            "services",
                                            locale
                                        )}
                                        className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                        data-testid="services-link-mid-sm"
                                    >
                                        {t("services")}
                                    </Link>
                                    <button
                                        onClick={toggleServices}
                                        className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors ml-1 p-1"
                                        data-testid="services-dropdown-button-mid-sm"
                                        aria-label="Toggle Services submenu"
                                    >
                                        <svg
                                            className={`h-4 w-4 transition-transform ${
                                                isServicesOpen
                                                    ? "rotate-180"
                                                    : ""
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
                                </div>

                                {isServicesOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border dark:border-border z-50">
                                        {servicesLinks.map(link => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className="block px-4 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-accent transition-colors"
                                                onClick={() =>
                                                    setIsServicesOpen(false)
                                                }
                                                data-testid={`services-link-t2-${link.key}`}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="nav:hidden flex items-center">
                            <button
                                onClick={toggleMobileMenu}
                                className="text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground"
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
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div
                        className="nav:hidden py-4 border-t border-border dark:border-border"
                        data-testid="mobile-nav"
                    >
                        <div className="space-y-2">
                            {/* Mobile Language & Theme */}
                            <div className="flex items-center justify-between py-2 px-3 border-b border-border dark:border-border mb-2">
                                <LanguageSelector
                                    variant="header"
                                    includeThemeToggle={false}
                                    align="left"
                                />
                                <ThemeToggleClient />
                            </div>

                            <Link
                                href={getHomeLink()}
                                className="block px-3 py-2 text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                                data-testid="nav-home-mobile"
                            >
                                {t("home")}
                            </Link>

                            {navigationLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block px-3 py-2 text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
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
                                <Link
                                    href={getLocalizedPath("services", locale)}
                                    className="text-foreground dark:text-foreground font-medium mb-2 block"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-testid="nav-services-mobile"
                                >
                                    {t("services")}
                                </Link>
                                {servicesLinks.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="block pl-4 py-1 text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        data-testid={`services-link-${link.key}`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>

                            {/* Mobile Minecraft */}
                            <div className="px-3 py-2">
                                <Link
                                    href={getLocalizedPath("minecraft", locale)}
                                    className="text-foreground dark:text-foreground font-medium mb-2 block"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-testid="nav-minecraft-mobile"
                                >
                                    {t("minecraft")}
                                </Link>
                                {minecraftLinks.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="block pl-4 py-1 text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
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

                            {/* Mobile Auth Button */}
                            <div className="px-3 py-2 border-t border-border dark:border-border mt-2">
                                <Link
                                    href={getLocalizedPath("login", locale)}
                                    className="block px-3 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium transition-colors text-center"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-testid="nav-login-mobile"
                                >
                                    {t("login", {
                                        defaultValue: "Sign In",
                                    })}
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
