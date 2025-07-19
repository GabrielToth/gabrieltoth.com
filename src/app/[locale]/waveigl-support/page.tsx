import WaveIGLSupportLanding from "@/app/[locale]/waveigl-support/waveigl-support-landing"
import Footer from "@/components/layout/footer"
import StructuredData from "@/components/seo/structured-data"
import { type Locale } from "@/lib/i18n"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./waveigl-support-metadata"

export default async function WaveIGLSupportPage({ params }: PageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Organization/Community structured data
    const organizationStructuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "WaveIGL Community",
        description: isPortuguese
            ? "Comunidade gaming brasileira com mais de 2 milhões de espectadores focada em entretenimento e desenvolvimento de ferramentas"
            : "Brazilian gaming community with over 2 million viewers focused on entertainment and tool development",
        founder: {
            "@type": "Person",
            name: "Gabriel Toth Gonçalves",
            url: "https://gabrieltoth.com",
        },
        url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/waveigl-support`,
        sameAs: ["https://youtube.com/@waveigl", "https://twitter.com/waveigl"],
        audience: {
            "@type": "Audience",
            audienceType: "Gaming Community",
        },
        seeks: {
            "@type": "Thing",
            name: isPortuguese
                ? "Apoio financeiro para desenvolvimento"
                : "Financial support for development",
        },
    }

    // FAQ data
    const faqs = isPortuguese
        ? [
              {
                  question: "Para que são usadas as doações?",
                  answer: "As doações são investidas 100% no desenvolvimento de ferramentas, plataformas e recursos para a comunidade WaveIGL, incluindo servidores, software e infraestrutura.",
              },
              {
                  question: "Como posso acompanhar o uso das doações?",
                  answer: "Publicamos relatórios mensais de transparência mostrando como cada real foi investido no desenvolvimento da comunidade.",
              },
              {
                  question: "Existe valor mínimo para doação?",
                  answer: "Não há valor mínimo. Qualquer contribuição, por menor que seja, faz diferença e é muito valorizada pela comunidade.",
              },
          ]
        : [
              {
                  question: "What are donations used for?",
                  answer: "Donations are 100% invested in developing tools, platforms and resources for the WaveIGL community, including servers, software and infrastructure.",
              },
              {
                  question: "How can I track donation usage?",
                  answer: "We publish monthly transparency reports showing how every dollar was invested in community development.",
              },
              {
                  question: "Is there a minimum donation amount?",
                  answer: "There's no minimum amount. Any contribution, however small, makes a difference and is highly valued by the community.",
              },
          ]

    // Breadcrumbs
    const breadcrumbs = [
        {
            name: isPortuguese ? "Início" : "Home",
            url: `https://gabrieltoth.com/${locale}`,
        },
        {
            name: isPortuguese ? "Comunidade" : "Community",
            url: `https://gabrieltoth.com/${locale}/#community`,
        },
        {
            name: isPortuguese ? "Apoie WaveIGL" : "Support WaveIGL",
            url: `https://gabrieltoth.com/${locale}/waveigl-support`,
        },
    ]

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={organizationStructuredData}
                breadcrumbs={breadcrumbs}
                faqs={faqs}
            />

            <div className="min-h-screen bg-white dark:bg-gray-900">
                <main className="container mx-auto px-4 py-8">
                    <WaveIGLSupportLanding locale={locale} />
                </main>
                <Footer locale={locale} />
            </div>
        </>
    )
}
