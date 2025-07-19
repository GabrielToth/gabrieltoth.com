import { type Locale } from "@/lib/i18n"
import { type Metadata } from "next"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    return {
        title: isPortuguese
            ? "Otimização de PC Gaming - Máxima Performance - Gabriel Toth"
            : "Gaming PC Optimization - Maximum Performance - Gabriel Toth",
        description: isPortuguese
            ? "Desbloqueie o verdadeiro potencial do seu PC gaming! Otimização profissional para mais FPS, menos lag e performance máxima em todos os jogos. Serviço especializado em Windows e hardware."
            : "Unlock your gaming PC's true potential! Professional optimization for more FPS, less lag and maximum performance in all games. Specialized Windows and hardware service.",
        keywords: isPortuguese
            ? "otimização pc gaming, mais fps, menos lag, performance gaming, otimização windows, overclocking, gabriel toth, pc gamer, melhoria performance, gaming performance, windows optimization, hardware tuning, fps boost, lag reduction"
            : "gaming pc optimization, more fps, less lag, gaming performance, windows optimization, overclocking, gabriel toth, gaming pc, performance improvement, hardware tuning, fps boost, lag reduction, game optimization, pc tuning",
        openGraph: {
            title: isPortuguese
                ? "Otimização de PC Gaming - Máxima Performance - Gabriel Toth"
                : "Gaming PC Optimization - Maximum Performance - Gabriel Toth",
            description: isPortuguese
                ? "Desbloqueie o verdadeiro potencial do seu PC gaming!"
                : "Unlock your gaming PC's true potential!",
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
            title: isPortuguese
                ? "Otimização de PC Gaming - Gabriel Toth"
                : "Gaming PC Optimization - Gabriel Toth",
            description: isPortuguese
                ? "Desbloqueie o verdadeiro potencial do seu PC gaming!"
                : "Unlock your gaming PC's true potential!",
            images: ["https://gabrieltoth.com/og-image-pc-optimization.jpg"],
        },
        alternates: {
            canonical: isPortuguese
                ? "https://gabrieltoth.com/pt-BR/pc-optimization"
                : "https://gabrieltoth.com/en/pc-optimization",
            languages: {
                en: "https://gabrieltoth.com/en/pc-optimization",
                "pt-BR": "https://gabrieltoth.com/pt-BR/pc-optimization",
                "x-default": "https://gabrieltoth.com/en/pc-optimization",
            },
        },
    }
}
