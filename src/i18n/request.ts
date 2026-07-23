import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import { getRequestConfig } from "next-intl/server"

type MessagesRecord = Record<string, unknown>

async function loadJson<T = unknown>(
    importer: () => Promise<{ default: T }>
): Promise<T | object> {
    try {
        const mod = await importer()
        return mod.default as T
    } catch {
        /* c8 ignore next */
        return {}
    }
}

export default getRequestConfig(async ({ locale }) => {
    const selectedLocale: Locale = locales.includes(locale as Locale)
        ? (locale as Locale)
        : defaultLocale

    // Load namespaces from src/i18n/{locale}/{namespace}.json (migrating progressively)
    const [
        home,
        landing,
        editors,
        channelManagement,
        pcOptimization,
        privacyPolicy,
        termsOfService,
        header,
        iqTest,
        auth,
        minecraft,
        services,
        dashboard,
        publish,
        aboutMe,
        amazonAffiliate,
        homePageHero,
        minecraftPageHero,
        minecraftContributionsPageHero,
        minecraftHypixelQolPageHero,
        minecraftModpacksPageHero,
        minecraftModsPageHero,
        minecraftPluginsPageHero,
        pcOptimizationPageHero,
        pcOptimizationTermsPageHero,
        privacyPageHero,
        servicesPageHero,
        termsOfServicePageHero,
    ] = await Promise.all([
        loadJson(() => import(`@/i18n/${selectedLocale}/home.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/landing.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/editors.json`)),
        loadJson(
            () => import(`@/i18n/${selectedLocale}/channelManagement.json`)
        ),
        loadJson(() => import(`@/i18n/${selectedLocale}/pcOptimization.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/privacyPolicy.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/termsOfService.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/layout.header.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/iqTest.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/auth.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/minecraft.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/services.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/dashboard.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/publish.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/aboutMe.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/amazonAffiliate.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/homePageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/minecraftPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/minecraftContributionsPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/minecraftHypixelQolPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/minecraftModpacksPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/minecraftModsPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/minecraftPluginsPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/pcOptimizationPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/pcOptimizationTermsPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/privacyPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/servicesPageHero.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/termsOfServicePageHero.json`)),
    ])

    const messages: MessagesRecord = {
        common: {},
        home,
        landing,
        editors,
        channelManagement,
        pcOptimization,
        privacyPolicy,
        termsOfService,
        iqTest,
        auth,
        minecraft,
        services,
        dashboard,
        publish,
        aboutMe,
        amazonAffiliate,
        homePageHero,
        minecraftPageHero,
        minecraftContributionsPageHero,
        minecraftHypixelQolPageHero,
        minecraftModpacksPageHero,
        minecraftModsPageHero,
        minecraftPluginsPageHero,
        pcOptimizationPageHero,
        pcOptimizationTermsPageHero,
        privacyPageHero,
        servicesPageHero,
        termsOfServicePageHero,
        layout: {
            header,
            footer: await loadJson(
                () => import(`@/i18n/${selectedLocale}/layout.footer.json`)
            ),
        },
    }

    return {
        locale: selectedLocale as string,
        messages,
    }
})
