import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo-config"
import { type Metadata } from "next"

interface PageProps {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { locale: localeParam } = await params

    // Validate locale parameter
    let locale: Locale = defaultLocale

    // Check if locale is valid
    if (
        localeParam &&
        typeof localeParam === "string" &&
        locales.includes(localeParam as Locale)
    ) {
        locale = localeParam as Locale
    }

    const titles: Record<Locale, string> = {
        "pt-BR": "Otimização de PC Gaming - Máxima Performance - Gabriel Toth",
        en: "Gaming PC Optimization - Maximum Performance - Gabriel Toth",
        es: "Optimización de PC Gaming - Máximo Rendimiento - Gabriel Toth",
        de: "Gaming PC Optimierung - Maximale Leistung - Gabriel Toth",
        fr: "Optimisation de PC Gaming - Performance Maximale - Gabriel Toth",
    }

    const descriptions: Record<Locale, string> = {
        "pt-BR":
            "Desbloqueie o verdadeiro potencial do seu PC gaming! Otimização profissional para mais FPS, menos lag e performance máxima em todos os jogos.",
        en: "Unlock your gaming PC's true potential! Professional optimization for more FPS, less lag and maximum performance in all games.",
        es: "¡Desbloquea el verdadero potencial de tu PC gaming! Optimización profesional para más FPS, menos lag y rendimiento máximo en todos los juegos.",
        de: "Entfesseln Sie das wahre Potenzial Ihres Gaming-PCs! Professionelle Optimierung für mehr FPS, weniger Lag und maximale Leistung in allen Spielen.",
        fr: "Libérez le vrai potentiel de votre PC gamer ! Optimisation professionnelle pour plus de FPS, moins de lag et une performance maximale dans tous les jeux.",
    }

    const keywords: Record<Locale, string> = {
        "pt-BR":
            "otimização pc gaming, mais fps, menos lag, performance gaming, otimização windows, overclocking, gabriel toth, pc gamer, melhoria performance",
        en: "gaming pc optimization, more fps, less lag, gaming performance, windows optimization, overclocking, gabriel toth, gaming pc, performance improvement",
        es: "optimización pc gaming, más fps, menos lag, rendimiento gaming, optimización windows, overclocking, gabriel toth, pc gaming, mejora rendimiento",
        de: "gaming pc optimierung, mehr fps, weniger lag, gaming leistung, windows optimierung, overclocking, gabriel toth, gaming pc, leistungsverbesserung",
        fr: "optimisation pc gaming, plus de fps, moins de lag, performance gaming, optimisation windows, overclocking, gabriel toth, pc gamer, amélioration performance",
    }

    const title = titles[locale] || titles.en
    /* c8 ignore next */
    const description = descriptions[locale] || descriptions.en

    const seoConfig = generateSeoConfig({
        locale,
        path: "/pc-optimization",
        title,
        description,
        keywords: (keywords[locale] || keywords.en).split(", "),
        ogImage: "https://www.gabrieltoth.com/og-image-pc-optimization.jpg",
    })

    return {
        title,
        description,
        keywords: keywords[locale] || keywords.en,
        openGraph: {
            title,
            description: description,
            type: "website",
            locale: locale,
            images: [
                {
                    url: "https://www.gabrieltoth.com/og-image-pc-optimization.jpg",
                    width: 1200,
                    height: 630,
                    alt: "PC Optimization Service",
                },
            ],
            siteName: "Gabriel Toth Portfolio",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: description,
            images: [
                "https://www.gabrieltoth.com/og-image-pc-optimization.jpg",
            ],
        },
        alternates: {
            canonical: seoConfig.canonical,
            languages: Object.fromEntries(
                (seoConfig.languageAlternates || []).map(alt => [
                    alt.hrefLang,
                    alt.href,
                ])
            ),
        },
    }
}
