import { type Locale } from "@/lib/i18n"

// URL mapping for each locale
const urlMapping: Record<Locale, Record<string, string>> = {
    en: {
        "channel-management": "channel-management",
        editors: "editors",
        "pc-optimization": "pc-optimization",
        "iq-test": "iq-test",
        "personality-test": "personality-test",
        "amazon-affiliate": "amazon-affiliate",
        "privacy-policy": "privacy-policy",
        "terms-of-service": "terms-of-service",
        login: "login",
        register: "register",
        payments: "payments",
        minecraft: "minecraft",
        "minecraft-modpacks": "minecraft/modpacks",
        "minecraft-mods": "minecraft/mods",
    },
    "pt-BR": {
        "channel-management": "gerenciamento-de-canais",
        editors: "editores",
        "pc-optimization": "otimizacao-de-pc",
        "iq-test": "teste-de-qi",
        "personality-test": "teste-de-personalidade",
        "amazon-affiliate": "afiliados-amazon",
        "privacy-policy": "politica-de-privacidade",
        "terms-of-service": "termos-de-servico",
        login: "entrar",
        register: "registrar",
        payments: "pagamentos",
        minecraft: "minecraft",
        "minecraft-modpacks": "minecraft/modpacks",
        "minecraft-mods": "minecraft/mods",
    },
    es: {
        "channel-management": "gestion-de-canales",
        editors: "editores",
        "pc-optimization": "optimizacion-de-pc",
        "iq-test": "prueba-de-ci",
        "personality-test": "prueba-de-personalidad",
        "amazon-affiliate": "afiliados-amazon",
        "privacy-policy": "politica-de-privacidad",
        "terms-of-service": "terminos-de-servicio",
        login: "iniciar-sesion",
        register: "registrarse",
        payments: "pagos",
        minecraft: "minecraft",
        "minecraft-modpacks": "minecraft/modpacks",
        "minecraft-mods": "minecraft/mods",
    },
    de: {
        "channel-management": "kanalverwaltung",
        editors: "editoren",
        "pc-optimization": "pc-optimierung",
        "iq-test": "iq-test",
        "personality-test": "personlichkeitstest",
        "amazon-affiliate": "amazon-partner",
        "privacy-policy": "datenschutzrichtlinie",
        "terms-of-service": "nutzungsbedingungen",
        login: "anmelden",
        register: "registrieren",
        payments: "zahlungen",
        minecraft: "minecraft",
        "minecraft-modpacks": "minecraft/modpacks",
        "minecraft-mods": "minecraft/mods",
    },
}

/**
 * Get the localized URL slug for a given key and locale
 * @param key - The English URL key (e.g., "channel-management")
 * @param locale - The target locale
 * @returns The localized URL slug
 */
export function getLocalizedUrl(key: string, locale: Locale): string {
    return urlMapping[locale]?.[key] || key
}

/**
 * Get the full localized path for a given key and locale
 * @param key - The English URL key (e.g., "channel-management")
 * @param locale - The target locale
 * @returns The full localized path (e.g., "/pt-BR/gerenciamento-de-canais")
 */
export function getLocalizedPath(key: string, locale: Locale): string {
    const slug = getLocalizedUrl(key, locale)
    return `/${locale}/${slug}`
}
