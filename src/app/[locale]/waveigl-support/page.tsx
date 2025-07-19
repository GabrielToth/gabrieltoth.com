import WaveIGLSupportLanding from "@/app/[locale]/waveigl-support/waveigl-support-landing"
import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    const seoConfig = generateSeoConfig({
        locale,
        path: "/waveigl-support",
        title: isPortuguese
            ? "Apoie a Comunidade WaveIGL - Desenvolvimento do Ecossistema - Gabriel Toth"
            : "Support WaveIGL Community - Ecosystem Development - Gabriel Toth",
        description: isPortuguese
            ? "Ajude a construir o futuro da comunidade WaveIGL. Suas doações financiam o desenvolvimento de plataformas, ferramentas e recursos para nossa comunidade de mais de 2 milhões de espectadores."
            : "Help build the future of WaveIGL community. Your donations fund the development of platforms, tools and resources for our community of over 2 million viewers.",
        keywords: isPortuguese
            ? [
                  "waveigl",
                  "comunidade gaming",
                  "doação",
                  "apoio",
                  "desenvolvimento",
                  "ecossistema",
                  "youtube",
                  "gabriel toth",
                  "gaming community",
              ]
            : [
                  "waveigl",
                  "gaming community",
                  "donation",
                  "support",
                  "development",
                  "ecosystem",
                  "youtube",
                  "gabriel toth",
                  "gaming community",
              ],
        ogType: "website",
        ogImage: "https://gabrieltoth.com/og-image-waveigl.jpg",
    })

    return {
        title: seoConfig.title,
        description: seoConfig.description,
        keywords: seoConfig.additionalMetaTags?.find(
            tag => tag.name === "keywords"
        )?.content,
        robots: seoConfig.additionalMetaTags?.find(tag => tag.name === "robots")
            ?.content,
        openGraph: {
            title: seoConfig.openGraph?.title,
            description: seoConfig.openGraph?.description,
            url: seoConfig.canonical,
            type: seoConfig.openGraph?.type as "website",
            locale: seoConfig.openGraph?.locale,
            images: seoConfig.openGraph?.images?.map(img => ({
                url: img.url!,
                width: img.width,
                height: img.height,
                alt: img.alt!,
                type: img.type,
            })),
            siteName: "Gabriel Toth Portfolio",
        },
        twitter: {
            card: seoConfig.twitter?.card as "summary_large_image",
            title: seoConfig.twitter?.title,
            description: seoConfig.twitter?.description,
            images: seoConfig.twitter?.images,
            creator: seoConfig.twitter?.creator,
            site: seoConfig.twitter?.site,
        },
        alternates: {
            canonical: isPortuguese
                ? "https://gabrieltoth.com/pt-BR/waveigl-support"
                : "https://gabrieltoth.com/en/waveigl-support",
            languages: {
                en: "https://gabrieltoth.com/en/waveigl-support",
                "pt-BR": "https://gabrieltoth.com/pt-BR/waveigl-support",
                "x-default": "https://gabrieltoth.com/en/waveigl-support",
            },
        },
    }
}

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
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Breadcrumbs
                        items={breadcrumbs.map(item => ({
                            name: item.name,
                            href: item.url.replace(
                                "https://gabrieltoth.com",
                                ""
                            ),
                        }))}
                        className="mb-6"
                    />

                    <WaveIGLSupportLanding locale={locale} />
                </main>
                <Footer locale={locale} />
            </div>
        </>
    )
}
