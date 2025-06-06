import SocialAnalyticsInvestmentLanding from "@/components/landing/social-analytics-investment-landing"
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
            ? "Invista no Futuro do Marketing Digital - Social Analytics Engine"
            : "Invest in the Future of Digital Marketing - Social Analytics Engine",
        description: isPortuguese
            ? "Revolucione o marketing digital com nossa plataforma de análise de campanhas. Oportunidade única de investimento em SAAS inovador com dados de múltiplas plataformas."
            : "Revolutionize digital marketing with our campaign analysis platform. Unique investment opportunity in innovative SAAS with multi-platform data.",
        keywords: isPortuguese
            ? "investimento, social analytics, marketing digital, saas, startup, analytics, google analytics, stripe"
            : "investment, social analytics, digital marketing, saas, startup, analytics, google analytics, stripe",
        openGraph: {
            title: isPortuguese
                ? "Invista no Social Analytics Engine"
                : "Invest in Social Analytics Engine",
            description: isPortuguese
                ? "O futuro do marketing digital começa aqui"
                : "The future of digital marketing starts here",
            type: "website",
            locale: locale,
        },
    }
}

export default async function SocialAnalyticsInvestmentPage({
    params,
}: PageProps) {
    const { locale } = await params

    return <SocialAnalyticsInvestmentLanding locale={locale} />
}
