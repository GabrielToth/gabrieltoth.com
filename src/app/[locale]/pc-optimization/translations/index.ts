import { Locale } from "@/lib/i18n"
import deTranslations from "./de.json"
import enTranslations from "./en.json"
import esTranslations from "./es.json"
import ptBRTranslations from "./pt-BR.json"

export const pcOptimizationTranslations = {
    de: deTranslations,
    en: enTranslations,
    es: esTranslations,
    "pt-BR": ptBRTranslations,
}

export const getPCOptimizationTranslations = (locale: Locale) => {
    return pcOptimizationTranslations[locale] || pcOptimizationTranslations.en
}

export type PCOptimizationTranslations = typeof enTranslations
