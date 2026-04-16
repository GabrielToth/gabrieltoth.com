import { type Locale } from "@/lib/i18n"

interface BreadcrumbItem {
    name: string
    href: string
    current?: boolean
}

export async function getWaveIGLSupportBreadcrumbs(
    locale: Locale
): Promise<BreadcrumbItem[]> {
    const header = (await import(`@/i18n/${locale}/layout.header.json`))
        .default as { home: string }
    const wave = (await import(`@/i18n/${locale}/waveiglSupport.json`))
        .default as { hero: { badge: string } }

    return [
        {
            name: header.home || "Home",
            href: `/${locale}`,
        },
        {
            name: wave.hero.badge,
            href: `/${locale}/waveigl-support`,
            current: true,
        },
    ]
}
