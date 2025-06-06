import ChannelManagementLanding from "@/components/landing/channel-management-landing"
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
            ? "Gerenciamento de Canais e Consultoria - Gabriel Toth"
            : "Channel Management & Consulting - Gabriel Toth",
        description: isPortuguese
            ? "Transforme seu canal do YouTube em uma máquina de crescimento. Consultoria especializada em analytics, otimização de conteúdo e estratégias de monetização."
            : "Transform your YouTube channel into a growth machine. Specialized consulting in analytics, content optimization and monetization strategies.",
        keywords: isPortuguese
            ? "gerenciamento de canal, consultoria youtube, analytics, otimização de conteúdo, monetização, crescimento de canal"
            : "channel management, youtube consulting, analytics, content optimization, monetization, channel growth",
        openGraph: {
            title: isPortuguese
                ? "Gerenciamento de Canais e Consultoria - Gabriel Toth"
                : "Channel Management & Consulting - Gabriel Toth",
            description: isPortuguese
                ? "Transforme seu canal do YouTube em uma máquina de crescimento"
                : "Transform your YouTube channel into a growth machine",
            type: "website",
            locale: locale,
        },
    }
}

export default async function ChannelManagementPage({ params }: PageProps) {
    const { locale } = await params

    return <ChannelManagementLanding locale={locale} />
}
