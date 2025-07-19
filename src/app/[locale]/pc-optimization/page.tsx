import PCOptimizationLanding from "@/app/[locale]/pc-optimization/pc-optimization-landing"
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
        path: "/pc-optimization",
        title: isPortuguese
            ? "Otimização de PC Gaming - Máxima Performance - Gabriel Toth"
            : "Gaming PC Optimization - Maximum Performance - Gabriel Toth",
        description: isPortuguese
            ? "Desbloqueie o verdadeiro potencial do seu PC gaming! Otimização profissional para mais FPS, menos lag e performance máxima em todos os jogos. Serviço especializado em Windows e hardware."
            : "Unlock your gaming PC's true potential! Professional optimization for more FPS, less lag and maximum performance in all games. Specialized Windows and hardware service.",
        keywords: isPortuguese
            ? [
                  "otimização pc gaming",
                  "mais fps",
                  "menos lag",
                  "performance gaming",
                  "otimização windows",
                  "overclocking",
                  "gabriel toth",
                  "pc gamer",
                  "melhoria performance",
              ]
            : [
                  "gaming pc optimization",
                  "more fps",
                  "less lag",
                  "gaming performance",
                  "windows optimization",
                  "overclocking",
                  "gabriel toth",
                  "gaming pc",
                  "performance improvement",
              ],
        ogType: "service",
        ogImage: "https://gabrieltoth.com/og-image-pc-optimization.jpg",
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
            canonical: seoConfig.canonical,
            languages: {
                en: "https://gabrieltoth.com/pc-optimization",
                "pt-BR": "https://gabrieltoth.com/pt-BR/pc-optimization",
                "x-default": "https://gabrieltoth.com/pc-optimization",
            },
        },
    }
}

export default async function PCOptimizationPage({ params }: PageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Service structured data
    const serviceStructuredData = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: isPortuguese
            ? "Otimização de PC Gaming"
            : "Gaming PC Optimization",
        description: isPortuguese
            ? "Serviço profissional de otimização de PC para gaming com foco em performance máxima"
            : "Professional PC optimization service for gaming with focus on maximum performance",
        provider: {
            "@type": "Person",
            name: "Gabriel Toth Gonçalves",
            url: "https://gabrieltoth.com",
        },
        category: "Computer Optimization",
        url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/pc-optimization`,
        offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "BRL",
            priceRange: "$",
            description: isPortuguese
                ? "Otimização profissional de PC gaming"
                : "Professional gaming PC optimization",
        },
        areaServed: {
            "@type": "Country",
            name: "Brazil",
        },
        serviceType: "Computer Optimization",
    }

    // FAQ data
    const faqs = isPortuguese
        ? [
              {
                  question: "Como funciona a otimização de PC?",
                  answer: "Realizamos uma análise completa do seu sistema, otimizamos configurações do Windows, drivers, e parâmetros de hardware para maximizar a performance em jogos.",
              },
              {
                  question: "Quanto FPS posso ganhar?",
                  answer: "O ganho varia conforme o sistema, mas tipicamente nossos clientes veem melhorias de 20-40% na performance e redução significativa de lag.",
              },
              {
                  question: "O serviço inclui overclocking?",
                  answer: "Sim, fazemos overclocking seguro de CPU, GPU e RAM quando aplicável, sempre priorizando estabilidade e temperaturas seguras.",
              },
          ]
        : [
              {
                  question: "How does PC optimization work?",
                  answer: "We perform a complete system analysis, optimize Windows settings, drivers, and hardware parameters to maximize gaming performance.",
              },
              {
                  question: "How much FPS can I gain?",
                  answer: "Gains vary by system, but typically our clients see 20-40% performance improvements and significant lag reduction.",
              },
              {
                  question: "Does the service include overclocking?",
                  answer: "Yes, we perform safe overclocking of CPU, GPU and RAM when applicable, always prioritizing stability and safe temperatures.",
              },
          ]

    // Breadcrumbs
    const breadcrumbs = [
        {
            name: isPortuguese ? "Início" : "Home",
            url: `https://gabrieltoth.com/${locale}`,
        },
        {
            name: isPortuguese ? "Serviços" : "Services",
            url: `https://gabrieltoth.com/${locale}/#services`,
        },
        {
            name: isPortuguese
                ? "Otimização de PC Gaming"
                : "Gaming PC Optimization",
            url: `https://gabrieltoth.com/${locale}/pc-optimization`,
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
                        items={breadcrumbs.map(item => ({
                            name: item.name,
                            href: item.url.replace(
                                "https://gabrieltoth.com",
                                ""
                            ),
                        }))}
                        className="mb-6"
                    />

                    <PCOptimizationLanding locale={locale} />
                </div>
            </div>
        </>
    )
}
