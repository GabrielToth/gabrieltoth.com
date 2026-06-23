import { expect, test } from "@playwright/test"

const LOCALES = ["en", "pt-BR", "es", "de"] as const
const VIEWPORTS = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 375, height: 667 },
] as const

// Routes that have the same path across all locales
const COMMON_ROUTES = [
    "", // homepage
    "minecraft",
    "minecraft/modpacks",
    "minecraft/mods",
    "minecraft/plugins",
    "minecraft/contributions",
    "minecraft/modpacks/hypixel-qol",
]

// Routes per locale
const LOCALE_ROUTES: Record<string, Record<string, string>> = {
    en: {
        "about-me": "about-me",
        "channel-management": "channel-management",
        "pc-optimization": "pc-optimization",
        editors: "editors",
        "amazon-affiliate": "amazon-affiliate",
        "iq-test": "iq-test",
        "personality-test": "personality-test",
        "privacy-policy": "privacy-policy",
        "terms-of-service": "terms-of-service",
        login: "login",
        register: "register",
    },
    "pt-BR": {
        "about-me": "quem-sou-eu",
        "channel-management": "gerenciamento-de-canais",
        "pc-optimization": "otimizacao-de-pc",
        editors: "editores",
        "amazon-affiliate": "afiliados-amazon",
        "iq-test": "teste-de-qi",
        "personality-test": "teste-de-personalidade",
        "privacy-policy": "politica-de-privacidade",
        "terms-of-service": "termos-de-servico",
        login: "entrar",
        register: "registrar",
    },
    es: {
        "about-me": "acerca-de-mi",
        "channel-management": "gestion-de-canales",
        "pc-optimization": "optimizacion-de-pc",
        editors: "editores",
        "amazon-affiliate": "afiliados-amazon",
        "iq-test": "prueba-de-ci",
        "personality-test": "prueba-de-personalidad",
        "privacy-policy": "politica-de-privacidad",
        "terms-of-service": "terminos-de-servicio",
        login: "iniciar-sesion",
        register: "registrarse",
    },
    de: {
        "about-me": "uber-mich",
        "channel-management": "kanalverwaltung",
        "pc-optimization": "pc-optimierung",
        editors: "editoren",
        "amazon-affiliate": "amazon-partner",
        "iq-test": "iq-test",
        "personality-test": "personlichkeitstest",
        "privacy-policy": "datenschutzrichtlinie",
        "terms-of-service": "nutzungsbedingungen",
        login: "anmelden",
        register: "registrieren",
    },
}

test.describe("pages all locales systematic coverage", () => {
    for (const viewport of VIEWPORTS) {
        for (const locale of LOCALES) {
            for (const route of COMMON_ROUTES) {
                test(`[${viewport.name}] /${locale}/${route} loads successfully`, async ({
                    page,
                }) => {
                    await page.setViewportSize({
                        width: viewport.width,
                        height: viewport.height,
                    })
                    const url = route ? `/${locale}/${route}` : `/${locale}`
                    const response = await page.goto(url)
                    expect(response?.status()).toBe(200)
                })
            }

            const localeRoutes = LOCALE_ROUTES[locale]
            for (const [name, path] of Object.entries(localeRoutes)) {
                test(`[${viewport.name}] /${locale}/${name} (${path}) loads successfully`, async ({
                    page,
                }) => {
                    await page.setViewportSize({
                        width: viewport.width,
                        height: viewport.height,
                    })
                    const response = await page.goto(`/${locale}/${path}`)
                    expect(response?.status()).toBe(200)
                })
            }
        }
    }
})
