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
            ? "ViraTrend - Consultoria de Crescimento Digital - Gabriel Toth"
            : "ViraTrend - Digital Growth Consulting - Gabriel Toth",
        description: isPortuguese
            ? "ViraTrend: Transforme seu canal em uma máquina de crescimento. Consultoria especializada em analytics, otimização de conteúdo e estratégias de monetização para criadores de conteúdo."
            : "ViraTrend: Transform your channel into a growth machine. Specialized consulting in analytics, content optimization and monetization strategies for content creators.",
        keywords: isPortuguese
            ? "ViraTrend, consultoria crescimento digital, consultoria youtube, analytics, otimização de conteúdo, monetização, crescimento de canal"
            : "ViraTrend, digital growth consulting, youtube consulting, analytics, content optimization, monetization, channel growth",
        openGraph: {
            title: isPortuguese
                ? "ViraTrend - Consultoria de Crescimento Digital - Gabriel Toth"
                : "ViraTrend - Digital Growth Consulting - Gabriel Toth",
            description: isPortuguese
                ? "ViraTrend: Transforme seu canal em uma máquina de crescimento"
                : "ViraTrend: Transform your channel into a growth machine",
            type: "website",
            locale: locale,
        },
    }
}
