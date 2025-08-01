import { type Locale } from "@/lib/i18n"

interface BreadcrumbItem {
    name: string
    href: string
    current?: boolean
}

export function getWaveIGLSupportBreadcrumbs(locale: Locale): BreadcrumbItem[] {
    const getHomeName = () => {
        switch (locale) {
            case "pt-BR":
                return "Início"
            case "es":
                return "Inicio"
            case "de":
                return "Startseite"
            default:
                return "Home"
        }
    }

    const getSupportName = () => {
        switch (locale) {
            case "pt-BR":
                return "Apoie WaveIGL"
            case "es":
                return "Apoyar WaveIGL"
            case "de":
                return "WaveIGL unterstützen"
            default:
                return "Support WaveIGL"
        }
    }

    return [
        {
            name: getHomeName(),
            href: `/${locale}`,
        },
        {
            name: getSupportName(),
            href: `/${locale}/waveigl-support`,
            current: true,
        },
    ]
}
