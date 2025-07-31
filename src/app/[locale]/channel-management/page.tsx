import Footer from "@/components/layout/footer"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { generateMetadata } from "./channel-management-metadata"
import ChannelManagementView from "./channel-management-view"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

export default async function ChannelManagementPage({ params }: PageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Generate structured data for the service
    const serviceStructuredData = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "ViraTrend - Digital Growth Consulting",
        description: isPortuguese
            ? "Consultoria especializada em crescimento digital para criadores de conteúdo"
            : "Specialized digital growth consulting for content creators",
        provider: {
            "@type": "Person",
            name: "Gabriel Toth Gonçalves",
            url: "https://gabrieltoth.com",
        },
        category: "Digital Marketing Consulting",
        url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/channel-management`,
        offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "BRL",
            priceRange: "$$",
            description: isPortuguese
                ? "Consultoria personalizada para crescimento de canais"
                : "Personalized channel growth consulting",
        },
        areaServed: {
            "@type": "Country",
            name: "Brazil",
        },
        serviceType: "Digital Marketing",
        additionalType: "https://schema.org/ConsultingService",
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            ratingCount: "50",
            bestRating: "5",
            worstRating: "1",
        },
    }

    const faqs = isPortuguese
        ? [
              {
                  question: "O que é o ViraTrend?",
                  answer: "ViraTrend é um serviço de consultoria especializado em crescimento digital para criadores de conteúdo. Oferecemos análise de dados, otimização de conteúdo e estratégias personalizadas de monetização.",
              },
              {
                  question: "Como funciona a consultoria?",
                  answer: "Analisamos seu canal, identificamos oportunidades de crescimento, criamos estratégias personalizadas e acompanhamos os resultados através de relatórios detalhados.",
              },
              {
                  question: "Quanto tempo leva para ver resultados?",
                  answer: "Os primeiros resultados aparecem entre 30-60 dias, mas o crescimento consistente acontece entre 3-6 meses com a implementação das estratégias.",
              },
              {
                  question: "Qual o investimento necessário?",
                  answer: "O investimento varia conforme o tamanho do canal e objetivos. Entre em contato para uma proposta personalizada.",
              },
          ]
        : [
              {
                  question: "What is ViraTrend?",
                  answer: "ViraTrend is a specialized digital growth consulting service for content creators. We offer data analysis, content optimization, and personalized monetization strategies.",
              },
              {
                  question: "How does the consulting work?",
                  answer: "We analyze your channel, identify growth opportunities, create personalized strategies, and track results through detailed reports.",
              },
              {
                  question: "How long does it take to see results?",
                  answer: "First results appear within 30-60 days, but consistent growth happens between 3-6 months with strategy implementation.",
              },
              {
                  question: "What is the required investment?",
                  answer: "Investment varies according to channel size and objectives. Contact us for a personalized proposal.",
              },
          ]

    // Custom breadcrumbs
    const breadcrumbs = [
        {
            name:
                locale === "pt-BR"
                    ? "Início"
                    : locale === "es"
                      ? "Inicio"
                      : locale === "de"
                        ? "Startseite"
                        : "Home",
            url: `https://gabrieltoth.com/${locale}`,
        },
        {
            name:
                locale === "pt-BR"
                    ? "ViraTrend - Consultoria Digital"
                    : locale === "es"
                      ? "ViraTrend - Consultoría Digital"
                      : locale === "de"
                        ? "ViraTrend - Digitale Beratung"
                        : "ViraTrend - Digital Consulting",
            url: `https://gabrieltoth.com/${locale}/channel-management`,
        },
    ]

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={serviceStructuredData}
                breadcrumbs={breadcrumbs}
                faqs={faqs}
            />

            <div className="min-h-screen bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <Breadcrumbs
                        items={breadcrumbs.map((item, index) => ({
                            name: item.name,
                            href: item.url.replace(
                                "https://gabrieltoth.com",
                                ""
                            ),
                            current: index === breadcrumbs.length - 1,
                        }))}
                        className="mb-6"
                    />
                    <ChannelManagementView locale={locale} />
                </div>
                <Footer locale={locale} />
            </div>
        </>
    )
}
