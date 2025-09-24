import { type Locale } from "@/lib/i18n"

const localeToCurrencyMap: Record<Locale | string, string> = {
    "pt-BR": "BRL",
    en: "USD",
    es: "EUR",
    de: "EUR",
}

export function getCurrencyForLocale(locale: Locale | string): string {
    return localeToCurrencyMap[locale] || "USD"
}
