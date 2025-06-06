import WaveIGLSupportLanding from "@/components/landing/waveigl-support-landing"
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
            ? "Apoie a Comunidade WaveIGL - Desenvolvimento do Ecossistema"
            : "Support WaveIGL Community - Ecosystem Development",
        description: isPortuguese
            ? "Ajude a construir o futuro da comunidade WaveIGL. Suas doações financiam o desenvolvimento de plataformas, ferramentas e recursos para nossa comunidade de mais de 2 milhões de espectadores."
            : "Help build the future of WaveIGL community. Your donations fund the development of platforms, tools and resources for our community of over 2 million viewers.",
        keywords: isPortuguese
            ? "waveigl, doação, comunidade, youtube, desenvolvimento, ecossistema, apoio"
            : "waveigl, donation, community, youtube, development, ecosystem, support",
        openGraph: {
            title: isPortuguese
                ? "Apoie a Comunidade WaveIGL"
                : "Support WaveIGL Community",
            description: isPortuguese
                ? "Construa conosco o futuro da comunidade"
                : "Build the future of the community with us",
            type: "website",
            locale: locale,
        },
    }
}

export default async function WaveIGLSupportPage({ params }: PageProps) {
    const { locale } = await params

    return <WaveIGLSupportLanding locale={locale} />
}
