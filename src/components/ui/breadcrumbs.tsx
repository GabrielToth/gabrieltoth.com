"use client"

import { useLocale } from "@/hooks/use-locale"
import { cn } from "@/lib/utils"
import { ChevronRight, Home } from "lucide-react"
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
    const isPortuguese = locale === "pt-BR"

    // Auto-generate breadcrumbs from pathname if items not provided
    const breadcrumbItems =
        items || generateBreadcrumbsFromPath(pathname, locale, isPortuguese)

    // Add home item if not hidden and not already present
    const finalItems = breadcrumbItems
    if (
        !hideHome &&
        !finalItems.some(
            item => item.href === `/${locale}` || item.href === "/"
        )
    ) {
        finalItems.unshift({
            name: isPortuguese ? "Início" : "Home",
            href: `/${locale}`,
        })
    }

    // If we have no items at all (like on homepage), always show Home breadcrumb unless explicitly hidden
    if (finalItems.length === 0 && !hideHome) {
        finalItems.push({
            name: isPortuguese ? "Início" : "Home",
            href: `/${locale}`,
            current: true,
        })
    }

    if (finalItems.length === 0) return null

    return (
        <nav
            className={cn(
                "flex items-center space-x-1 text-sm text-gray-500",
                className
            )}
            aria-label={
                isPortuguese ? "Navegação estrutural" : "Breadcrumb navigation"
            }
        >
            {finalItems.map((item, index) => {
                const isLast = index === finalItems.length - 1
                const isHome = item.href === `/${locale}` || item.href === "/"

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
    isPortuguese: boolean
): BreadcrumbItem[] {
    const segments = pathname.split("/").filter(Boolean)

    // Remove locale from segments if present
    if (segments[0] === locale) {
        segments.shift()
    }

    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = `/${locale}`

    // Page name mappings
    const pageNames = {
        "channel-management": isPortuguese
            ? "Gerenciamento de Canais"
            : "Channel Management",
        "pc-optimization": isPortuguese
            ? "Otimização de PC"
            : "PC Optimization",
        "waveigl-support": isPortuguese ? "Suporte WaveIGL" : "WaveIGL Support",
        editors: isPortuguese ? "Trabalhe Como Editor" : "Work as Editor",
        "privacy-policy": isPortuguese
            ? "Política de Privacidade"
            : "Privacy Policy",
        "terms-of-service": isPortuguese
            ? "Termos de Serviço"
            : "Terms of Service",
        terms: isPortuguese ? "Termos" : "Terms",
    }

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
    const isPortuguese = locale === "pt-BR"
    const items = generateBreadcrumbsFromPath(pathname, locale, isPortuguese)

    // Add home
    const homeItem = {
        name: isPortuguese ? "Início" : "Home",
        url: `https://gabrieltoth.com/${locale}`,
    }

    const structuredItems = [homeItem]

    items.forEach(item => {
        structuredItems.push({
            name: item.name,
            url: `https://gabrieltoth.com${item.href}`,
        })
    })

    return structuredItems
}

export default Breadcrumbs
