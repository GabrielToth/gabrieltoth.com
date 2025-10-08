import { type Locale } from "@/lib/i18n"

export function getEditorsBreadcrumbs(locale: Locale) {
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
            name: "YouTube Editors",
            url: `${base}${localePath}/editors`,
        },
    ]
}
