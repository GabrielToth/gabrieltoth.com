"use client"

import { useLocale } from "@/hooks/use-locale"
import { cn } from "@/lib/utils"
import { ChevronRight, Home } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface BreadcrumbItem {
    name: string
    href: string
    current?: boolean
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[]
    className?: string
    hideHome?: boolean
    separator?: React.ReactNode
}

const Breadcrumbs = ({
    items,
    className,
    hideHome = false,
    separator = <ChevronRight className="h-4 w-4 text-gray-400" />,
}: BreadcrumbsProps) => {
    const pathname = usePathname()
    const { locale } = useLocale()
    const tHeader = useTranslations("layout.header")
    const tFooter = useTranslations("layout.footer")

    // Auto-generate breadcrumbs from pathname if items not provided
    const ensureLocalePrefixedPath = (path: string): string => {
        if (!path || path === "/") return `/${locale}`
        if (path === `/${locale}` || path.startsWith(`/${locale}/`)) return path
        if (path.startsWith("/")) return `/${locale}${path}`
        return `/${locale}/${path}`
    }

    const normalizeHref = (href: string): string => {
        if (!href) return `/${locale}`
        if (href.startsWith("http")) {
            try {
                const u = new URL(href)
                const path = u.pathname || "/"
                return ensureLocalePrefixedPath(path)
            } catch {
                /* c8 ignore next */
                return ensureLocalePrefixedPath(href)
            }
        }
        return ensureLocalePrefixedPath(href)
    }

    const breadcrumbItems = items
        ? items.map(item => ({ ...item, href: normalizeHref(item.href) }))
        : generateBreadcrumbsFromPath(pathname, locale, tHeader, tFooter)

    // Never show breadcrumbs on homepage (it IS the beginning)
    const isHomepage = pathname === `/${locale}` || pathname === `/${locale}/`
    if (isHomepage && !items) {
        return null
    }

    // Add home item if not hidden and not already present
    const finalItems = breadcrumbItems
    if (
        !hideHome &&
        !finalItems.some(
            item => item.href === `/${locale}` || item.href === "/"
        )
    ) {
        const getHomeName = () => tHeader("home")

        finalItems.unshift({
            name: getHomeName(),
            href: `/${locale}`,
        })
    }

    /* c8 ignore next */
    if (finalItems.length === 0) return null

    return (
        <nav
            className={cn(
                "flex items-center space-x-1 text-sm text-gray-500",
                className
            )}
            aria-label="breadcrumb"
        >
            {finalItems.map((item, index) => {
                const isLast = index === finalItems.length - 1
                const getHomeName = () => tHeader("home")
                const isHome = item.name === getHomeName()

                return (
                    <div key={item.href} className="flex items-center">
                        {index > 0 && (
                            <span className="mx-2" aria-hidden="true">
                                {separator}
                            </span>
                        )}

                        {isLast ? (
                            <span
                                className="font-medium text-gray-900 dark:text-gray-100"
                                aria-current="page"
                            >
                                {isHome && (
                                    <Home
                                        className="h-4 w-4 inline mr-1"
                                        aria-hidden="true"
                                    />
                                )}
                                {item.name}
                            </span>
                        ) : (
                            <Link
                                href={item.href}
                                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 flex items-center"
                            >
                                {isHome && (
                                    <Home
                                        className="h-4 w-4 inline mr-1"
                                        aria-hidden="true"
                                    />
                                )}
                                {item.name}
                            </Link>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbsFromPath(
    pathname: string,
    locale: string,
    tHeader: (key: string) => string,
    tFooter: (key: string) => string
): BreadcrumbItem[] {
    // Remove anchor/hash from pathname
    const cleanPathname = pathname.split("#")[0]
    const segments = cleanPathname.split("/").filter(Boolean)

    // Remove locale from segments if present
    if (segments[0] === locale) {
        segments.shift()
    }

    // If no segments remain after removing locale, this is the homepage - return empty array
    if (segments.length === 0) {
        return []
    }

    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = `/${locale}`

    // Page name mappings
    const pageNames = {
        "channel-management": tHeader("servicesDropdown.channelManagement"),
        "pc-optimization": tHeader("servicesDropdown.pcOptimization"),
        "waveigl-support": tHeader("servicesDropdown.support"),
        editors: tHeader("editors"),
        "privacy-policy": tFooter("links.legal.items.privacy"),
        "terms-of-service": tFooter("links.legal.items.terms"),
        terms: tFooter("short.terms"),
    } as Record<string, string>

    segments.forEach((segment, index) => {
        currentPath += `/${segment}`

        const isLast = index === segments.length - 1
        const name =
            pageNames[segment as keyof typeof pageNames] ||
            segment.charAt(0).toUpperCase() +
                segment.slice(1).replace(/-/g, " ")

        breadcrumbs.push({
            name,
            href: currentPath,
            current: isLast,
        })
    })

    return breadcrumbs
}

// Export breadcrumb items for use in structured data
export function getBreadcrumbsForStructuredData(
    pathname: string,
    locale: string
): Array<{ name: string; url: string }> {
    // Fallback translators for static generation context
    const noop = (key: string) => key
    const items = generateBreadcrumbsFromPath(pathname, locale, noop, noop)

    const homeNames: Record<string, string> = {
        "pt-BR": "Início",
        es: "Inicio",
        de: "Startseite",
        en: "Home",
    }
    const homeItem = {
        name: homeNames[locale] || "Home",
        url: `https://www.gabrieltoth.com/${locale}`,
    }

    const structuredItems = [homeItem]

    items.forEach(item => {
        structuredItems.push({
            name: item.name,
            url: `https://www.gabrieltoth.com${item.href}`,
        })
    })

    return structuredItems
}

export default Breadcrumbs
