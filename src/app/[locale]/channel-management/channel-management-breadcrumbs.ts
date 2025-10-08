import { type Locale } from "@/lib/i18n"

export function getChannelManagementBreadcrumbs(locale: Locale) {
    const base = "https://www.gabrieltoth.com"
    const localePath = locale === "en" ? "" : `/${locale}`

    const servicesName =
        locale === "pt-BR"
            ? "Serviços"
            : locale === "es"
              ? "Servicios"
              : locale === "de"
                ? "Dienstleistungen"
                : "Services"

    return [
        {
            name: servicesName,
            url: `${base}${localePath}`,
        },
        {
            name: "ViraTrend",
            url: `${base}${localePath}/channel-management`,
        },
    ]
}
