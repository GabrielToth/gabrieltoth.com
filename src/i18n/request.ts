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
        editors,
        channelManagement,
        pcOptimization,
        privacyPolicy,
        termsOfService,
        waveiglSupport,
        header,
        iqTest,
        personality,
    ] = await Promise.all([
        loadJson(() => import(`@/i18n/${selectedLocale}/home.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/editors.json`)),
        loadJson(
            () => import(`@/i18n/${selectedLocale}/channelManagement.json`)
        ),
        loadJson(() => import(`@/i18n/${selectedLocale}/pcOptimization.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/privacyPolicy.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/termsOfService.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/waveiglSupport.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/layout.header.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/iqTest.json`)),
        loadJson(() => import(`@/i18n/${selectedLocale}/personality.json`)),
    ])

    const messages: MessagesRecord = {
        common: {},
        home,
        editors,
        channelManagement,
        pcOptimization,
        privacyPolicy,
        termsOfService,
        waveiglSupport,
        iqTest,
        personality,
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
