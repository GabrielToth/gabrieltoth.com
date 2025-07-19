import PCOptimizationLanding from "@/app/[locale]/pc-optimization/pc-optimization-landing"
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
            ? "otimização pc gaming, mais fps, menos lag, performance gaming, otimização windows, overclocking, gabriel toth, pc gamer, melhoria performance"
            : "gaming pc optimization, more fps, less lag, gaming performance, windows optimization, overclocking, gabriel toth, gaming pc, performance improvement",
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
    }
}

export default async function PCOptimizationPage({ params }: PageProps) {
    const { locale } = await params

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <PCOptimizationLanding locale={locale} />
            </div>
        </div>
    )
}
