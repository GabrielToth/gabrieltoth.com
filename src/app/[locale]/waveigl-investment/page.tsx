import WaveIGLInvestmentLanding from "@/components/landing/waveigl-investment-landing"
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
            ? "Investimento WaveIGL - Projeto Pessoal Não Proprietário"
            : "WaveIGL Investment - Personal Non-Proprietary Project",
        description: isPortuguese
            ? "Apoie o desenvolvimento do WaveIGL como projeto pessoal e não proprietário. Suas doações ajudam a construir ferramentas abertas para a comunidade de streaming sem fins comerciais."
            : "Support WaveIGL development as a personal non-proprietary project. Your donations help build open tools for the streaming community without commercial purposes.",
        keywords: isPortuguese
            ? "waveigl, investimento, projeto pessoal, não proprietário, streaming, automação, doação"
            : "waveigl, investment, personal project, non-proprietary, streaming, automation, donation",
        openGraph: {
            title: isPortuguese
                ? "Investimento WaveIGL - Projeto Pessoal"
                : "WaveIGL Investment - Personal Project",
            description: isPortuguese
                ? "Apoie o desenvolvimento de ferramentas abertas para streamers"
                : "Support the development of open tools for streamers",
            type: "website",
            locale: locale,
        },
    }
}

export default async function WaveIGLInvestmentPage({ params }: PageProps) {
    const { locale } = await params

    return <WaveIGLInvestmentLanding locale={locale} />
}
