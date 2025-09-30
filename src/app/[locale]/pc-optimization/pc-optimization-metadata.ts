import { type Locale } from "@/lib/i18n"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "pcOptimization" })

    const titles = {
        "pt-BR": "Otimização de PC Gaming - Máxima Performance - Gabriel Toth",
        en: "Gaming PC Optimization - Maximum Performance - Gabriel Toth",
        es: "Optimización de PC Gaming - Máximo Rendimiento - Gabriel Toth",
        de: "Gaming PC Optimierung - Maximale Leistung - Gabriel Toth",
    }

    const descriptions = {
        "pt-BR":
            "Desbloqueie o verdadeiro potencial do seu PC gaming! Otimização profissional para mais FPS, menos lag e performance máxima em todos os jogos.",
        en: "Unlock your gaming PC's true potential! Professional optimization for more FPS, less lag and maximum performance in all games.",
        es: "¡Desbloquea el verdadero potencial de tu PC gaming! Optimización profesional para más FPS, menos lag y máximo rendimiento en todos los juegos.",
        de: "Entfesseln Sie das wahre Potenzial Ihres Gaming-PCs! Professionelle Optimierung für mehr FPS, weniger Lag und maximale Leistung in allen Spielen.",
    }

    const title = titles[locale] || titles.en
    const description = descriptions[locale] || descriptions.en

    return {
        title,
        description,
        keywords:
            locale === "pt-BR"
                ? "otimização pc gaming, mais fps, menos lag, performance gaming, otimização windows, overclocking, gabriel toth, pc gamer, melhoria performance"
                : locale === "es"
                  ? "optimización pc gaming, más fps, menos lag, rendimiento gaming, optimización windows, overclocking, gabriel toth, pc gaming, mejora rendimiento"
                  : locale === "de"
                    ? "gaming pc optimierung, mehr fps, weniger lag, gaming leistung, windows optimierung, overclocking, gabriel toth, gaming pc, leistungsverbesserung"
                    : "gaming pc optimization, more fps, less lag, gaming performance, windows optimization, overclocking, gabriel toth, gaming pc, performance improvement",
        openGraph: {
            title,
            description: t("hero.subtitle"),
            type: "website",
            locale: locale,
            images: [
                {
                    url: "https://gabrieltoth.com/og-image-pc-optimization.jpg",
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
            description: t("hero.subtitle"),
            images: ["https://gabrieltoth.com/og-image-pc-optimization.jpg"],
        },
        alternates: {
            languages: {
                en: "https://gabrieltoth.com/en/pc-optimization",
                "pt-BR": "https://gabrieltoth.com/pt-BR/pc-optimization",
                es: "https://gabrieltoth.com/es/pc-optimization",
                de: "https://gabrieltoth.com/de/pc-optimization",
                "x-default": "https://gabrieltoth.com/pt-BR/pc-optimization",
            },
        },
    }
}
