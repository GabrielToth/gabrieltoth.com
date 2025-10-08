import { type Locale } from "@/lib/i18n"

export function getTermsOfServiceBreadcrumbs(locale: Locale) {
    const base = "https://www.gabrieltoth.com"
    const localePath = locale === "en" ? "" : `/${locale}`
    return [
        {
            name:
                locale === "pt-BR"
                    ? "Termos de Serviço"
                    : locale === "es"
                      ? "Términos de Servicio"
                      : locale === "de"
                        ? "Nutzungsbedingungen"
                        : "Terms of Service",
            url: `${base}${localePath}/terms-of-service`,
        },
    ]
}
