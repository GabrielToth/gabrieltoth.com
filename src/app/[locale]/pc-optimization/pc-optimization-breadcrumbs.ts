import { Locale } from "@/lib/i18n"

export const getPCOptimizationBreadcrumbs = (locale: Locale) => {
    return [
        {
            name:
                locale === "pt-BR"
                    ? "Serviços"
                    : locale === "es"
                      ? "Servicios"
                      : locale === "de"
                        ? "Dienstleistungen"
                        : "Services",
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}`,
        },
        {
            name:
                locale === "pt-BR"
                    ? "Otimização de PC"
                    : locale === "es"
                      ? "Optimización de PC"
                      : locale === "de"
                        ? "PC-Optimierung"
                        : "PC Optimization",
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/pc-optimization`,
        },
    ]
}
