import PCOptimizationLanding from "@/components/landing/pc-optimization-landing"
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
            ? "Otimização de PC Gaming - Gabriel Toth Tech"
            : "Gaming PC Optimization - Gabriel Toth Tech",
        description: isPortuguese
            ? "Desbloqueie o verdadeiro potencial do seu PC! Otimização profissional para mais FPS, menos lag e performance máxima em todos os jogos."
            : "Unlock your PC's true potential! Professional optimization for more FPS, less lag and maximum performance in all games.",
        keywords: isPortuguese
            ? "otimização pc, gaming, fps, performance, lag, windows optimization, overclocking"
            : "pc optimization, gaming, fps, performance, lag, windows optimization, overclocking",
        openGraph: {
            title: isPortuguese
                ? "Otimização de PC Gaming - Gabriel Toth Tech"
                : "Gaming PC Optimization - Gabriel Toth Tech",
            description: isPortuguese
                ? "Desbloqueie o verdadeiro potencial do seu PC gaming"
                : "Unlock your gaming PC's true potential",
            type: "website",
            locale: locale,
        },
    }
}

export default async function PCOptimizationPage({ params }: PageProps) {
    const { locale } = await params

    return <PCOptimizationLanding locale={locale} />
}
