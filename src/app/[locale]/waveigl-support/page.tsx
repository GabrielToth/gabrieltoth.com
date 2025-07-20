import WaveIGLSupportLanding from "@/app/[locale]/waveigl-support/waveigl-support-landing"
import Footer from "@/components/layout/footer"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
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
            ? "Comunidade de jogadores e criadores de conteúdo focada em gaming"
            : "Gaming community of players and content creators focused on gaming",
        url: "https://gabrieltoth.com/waveigl-support",
        foundingDate: "2023",
        areaServed: "Brazil",
        sameAs: ["https://discord.gg/waveigl", "https://youtube.com/@waveigl"],
        brand: {
            "@type": "Brand",
            name: "WaveIGL",
        },
    }

    // FAQs structured data
    const faqs = isPortuguese
        ? [
              {
                  question: "O que é a WaveIGL?",
                  answer: "WaveIGL é uma comunidade dedicada a jogadores e criadores de conteúdo de gaming, oferecendo suporte, networking e oportunidades de crescimento.",
              },
              {
                  question: "Como posso apoiar a WaveIGL?",
                  answer: "Você pode apoiar através de doações, participação ativa na comunidade, compartilhamento de conteúdo e ajudando outros membros.",
              },
              {
                  question: "Quais são os benefícios de apoiar?",
                  answer: "Apoiadores recebem acesso a conteúdo exclusivo, participação em eventos especiais, suporte personalizado e reconhecimento na comunidade.",
              },
              {
                  question: "Como funciona o sistema de doações?",
                  answer: "Aceitamos doações via PIX, cartão de crédito e criptomoedas. Todo o valor é investido de volta na comunidade através de melhorias e eventos.",
              },
          ]
        : [
              {
                  question: "What is WaveIGL?",
                  answer: "WaveIGL is a community dedicated to gaming players and content creators, offering support, networking and growth opportunities.",
              },
              {
                  question: "How can I support WaveIGL?",
                  answer: "You can support through donations, active community participation, content sharing and helping other members.",
              },
              {
                  question: "What are the benefits of supporting?",
                  answer: "Supporters receive access to exclusive content, participation in special events, personalized support and community recognition.",
              },
              {
                  question: "How does the donation system work?",
                  answer: "We accept donations via PIX, credit card and cryptocurrencies. All value is reinvested back into the community through improvements and events.",
              },
          ]

    // Breadcrumbs
    const breadcrumbs = [
        {
            name: isPortuguese ? "Início" : "Home",
            href: `/${locale}`,
        },
        {
            name: isPortuguese ? "Comunidade" : "Community",
            href: `/${locale}/#community`,
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
                <main className="container mx-auto px-4 py-8">
                    <Breadcrumbs items={breadcrumbs} className="mb-6" />
                    <WaveIGLSupportLanding locale={locale} />
                </main>
                <Footer locale={locale} />
            </div>
        </>
    )
}
