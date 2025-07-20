import WaveIGLSupportLanding from "@/app/[locale]/waveigl-support/waveigl-support-landing"
import Footer from "@/components/layout/footer"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import LanguageSelector from "@/components/ui/language-selector"
import { type Locale } from "@/lib/i18n"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./waveigl-support-metadata"

export default async function WaveIGLSupportPage({ params }: PageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Organization structured data
    const organizationStructuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "WaveIGL",
        description: isPortuguese
            ? "Canal de gaming com foco em conteúdo de qualidade e crescimento da comunidade"
            : "Gaming channel focused on quality content and community growth",
        url: "https://gabrieltoth.com/waveigl-support",
        logo: "https://gabrieltoth.com/logo.png",
        sameAs: [
            "https://youtube.com/@WaveIGL",
            "https://twitch.tv/WaveIGL",
            "https://discord.gg/WaveIGL",
        ],
    }

    // FAQ structured data
    const faqs = [
        {
            question: isPortuguese
                ? "Como posso apoiar o canal WaveIGL?"
                : "How can I support the WaveIGL channel?",
            answer: isPortuguese
                ? "Você pode apoiar através de doações via PIX, cartão de crédito ou criptomoedas. Todo valor é reinvestido na comunidade."
                : "You can support through donations via PIX, credit card, or cryptocurrencies. All value is reinvested back into the community.",
        },
        {
            question: isPortuguese
                ? "Quais são os benefícios de apoiar?"
                : "What are the benefits of supporting?",
            answer: isPortuguese
                ? "Apoiadores recebem acesso exclusivo a conteúdos, participação em eventos especiais e reconhecimento na comunidade."
                : "Supporters receive exclusive access to content, participation in special events, and community recognition.",
        },
        {
            question: isPortuguese
                ? "Como o dinheiro arrecadado é utilizado?"
                : "How is the raised money used?",
            answer: isPortuguese
                ? "100% dos valores arrecadados são reinvestidos em melhorias de equipamento, software premium e eventos para a comunidade."
                : "100% of raised funds are reinvested in equipment improvements, premium software, and community events.",
        },
        {
            question: isPortuguese
                ? "Quais formas de pagamento são aceitas?"
                : "What payment methods are accepted?",
            answer: isPortuguese
                ? "Aceitamos doações via PIX, cartão de crédito e criptomoedas. Todo valor é reinvestido de volta na comunidade através de melhorias e eventos."
                : "We accept donations via PIX, credit card and cryptocurrencies. All value is reinvested back into the community through improvements and events.",
        },
    ]

    // Breadcrumbs (simplified - no community section)
    const breadcrumbs = [
        {
            name: "Início",
            href: `/${locale}`,
        },
        {
            name: isPortuguese ? "Apoie WaveIGL" : "Support WaveIGL",
            href: `/${locale}/waveigl-support`,
            current: true,
        },
    ]

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={organizationStructuredData}
                faqs={faqs}
            />

            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Language Selector for Landing Page */}
                <div className="container mx-auto px-4 py-4 flex justify-end">
                    <LanguageSelector />
                </div>

                <main className="container mx-auto px-4 pb-8">
                    <Breadcrumbs items={breadcrumbs} className="mb-6" />
                    <WaveIGLSupportLanding locale={locale} />
                </main>
                <Footer locale={locale} />
            </div>
        </>
    )
}
