import { type Locale } from "@/lib/i18n"

export function getPrivacyPolicyBreadcrumbs(locale: Locale) {
    const base = "https://www.gabrieltoth.com"
    const localePath = locale === "en" ? "" : `/${locale}`
    return [
        {
            name:
                locale === "pt-BR"
                    ? "Política de Privacidade"
                    : locale === "es"
                      ? "Política de Privacidad"
                      : locale === "de"
                        ? "Datenschutzrichtlinie"
                        : "Privacy Policy",
            url: `${base}${localePath}/privacy-policy`,
        },
    ]
}
