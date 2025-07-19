import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import LanguageSelector from "@/components/ui/language-selector"
import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

interface TermsOfServicePageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: TermsOfServicePageProps): Promise<Metadata> {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    const seoConfig = generateSeoConfig({
        locale,
        path: "/terms-of-service",
        title: isPortuguese
            ? "Termos de Serviço - Gabriel Toth"
            : "Terms of Service - Gabriel Toth",
        description: isPortuguese
            ? "Termos de serviço da Gabriel Toth. Conheça as condições de uso de nossos serviços de consultoria digital, otimização de PC e desenvolvimento."
            : "Gabriel Toth terms of service. Learn about the usage conditions for our digital consulting, PC optimization and development services.",
        keywords: isPortuguese
            ? [
                  "termos de serviço",
                  "condições de uso",
                  "contrato",
                  "serviços",
                  "gabriel toth",
                  "consultoria",
              ]
            : [
                  "terms of service",
                  "terms of use",
                  "contract",
                  "services",
                  "gabriel toth",
                  "consulting",
              ],
        ogType: "article",
        ogImage: "https://gabrieltoth.com/og-image-terms.jpg",
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
                en: "https://gabrieltoth.com/terms-of-service",
                "pt-BR": "https://gabrieltoth.com/pt-BR/terms-of-service",
                "x-default": "https://gabrieltoth.com/terms-of-service",
            },
        },
    }
}

export default async function TermsOfServicePage({
    params,
}: TermsOfServicePageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Breadcrumbs
    const breadcrumbs = [
        {
            name: isPortuguese ? "Início" : "Home",
            url: `https://gabrieltoth.com/${locale}`,
        },
        {
            name: isPortuguese ? "Legal" : "Legal",
            url: `https://gabrieltoth.com/${locale}/#legal`,
        },
        {
            name: isPortuguese ? "Termos de Serviço" : "Terms of Service",
            url: `https://gabrieltoth.com/${locale}/terms-of-service`,
        },
    ]

    // WebPage structured data
    const webPageStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: isPortuguese ? "Termos de Serviço" : "Terms of Service",
        description: isPortuguese
            ? "Termos de serviço detalhando as condições de uso dos nossos serviços"
            : "Terms of service detailing the usage conditions for our services",
        url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/terms-of-service`,
        isPartOf: {
            "@type": "WebSite",
            name: "Gabriel Toth Portfolio",
            url: "https://gabrieltoth.com",
        },
        about: {
            "@type": "Thing",
            name: isPortuguese ? "Condições de Uso" : "Usage Terms",
        },
    }

    const content = {
        title: isPortuguese ? "Termos de Serviço" : "Terms of Service",
        lastUpdated: isPortuguese
            ? "Última atualização: Julho 2025"
            : "Last updated: January 2025",
        sections: {
            intro: {
                title: isPortuguese
                    ? "1. Aceitação dos Termos"
                    : "1. Acceptance of Terms",
                content: isPortuguese
                    ? "Ao contratar nossos serviços, você concorda em estar vinculado a estes Termos de Serviço. Se você não concorda com algum termo, não deve utilizar nossos serviços."
                    : "By hiring our services, you agree to be bound by these Terms of Service. If you do not agree with any term, you should not use our services.",
            },
            services: {
                title: isPortuguese
                    ? "2. Descrição dos Serviços"
                    : "2. Service Description",
                content: isPortuguese
                    ? [
                          "• Consultoria para crescimento de canais no YouTube e outras plataformas",
                          "• Otimização de performance de PCs para gaming e trabalho",
                          "• Serviços de edição de vídeos com remuneração baseada em AdSense",
                          "• Desenvolvimento de soluções tecnológicas personalizadas",
                          "• Suporte técnico e consultoria em projetos digitais",
                      ]
                    : [
                          "• Consulting for channel growth on YouTube and other platforms",
                          "• PC performance optimization for gaming and work",
                          "• Video editing services with AdSense-based compensation",
                          "• Custom technology solution development",
                          "• Technical support and digital project consulting",
                      ],
            },
            obligations: {
                title: isPortuguese
                    ? "3. Obrigações do Cliente"
                    : "3. Client Obligations",
                content: isPortuguese
                    ? [
                          "• Fornecer informações precisas e completas",
                          "• Cooperar durante o processo de consultoria",
                          "• Efetuar pagamentos conforme acordado",
                          "• Respeitar direitos autorais e propriedade intelectual",
                          "• Não usar serviços para atividades ilegais",
                      ]
                    : [
                          "• Provide accurate and complete information",
                          "• Cooperate during the consulting process",
                          "• Make payments as agreed",
                          "• Respect copyrights and intellectual property",
                          "• Not use services for illegal activities",
                      ],
            },
            payment: {
                title: isPortuguese
                    ? "4. Pagamentos e Reembolsos"
                    : "4. Payments and Refunds",
                content: isPortuguese
                    ? "Os pagamentos devem ser efetuados conforme acordado. Para editores, o pagamento é baseado em 90% do AdSense gerado pelos vídeos editados. Reembolsos são analisados caso a caso, considerando o trabalho já realizado."
                    : "Payments must be made as agreed. For editors, payment is based on 90% of AdSense generated by edited videos. Refunds are analyzed case by case, considering work already performed.",
            },
            liability: {
                title: isPortuguese
                    ? "5. Limitação de Responsabilidade"
                    : "5. Limitation of Liability",
                content: isPortuguese
                    ? "Nossos serviços são prestados com base no melhor esforço. Não garantimos resultados específicos de crescimento ou performance. Nossa responsabilidade é limitada ao valor dos serviços contratados."
                    : "Our services are provided on a best effort basis. We do not guarantee specific growth or performance results. Our liability is limited to the value of contracted services.",
            },
            intellectual: {
                title: isPortuguese
                    ? "6. Propriedade Intelectual"
                    : "6. Intellectual Property",
                content: isPortuguese
                    ? "Todo conteúdo criado durante nossos serviços pertence ao cliente, exceto metodologias e conhecimentos pré-existentes que permanecem de nossa propriedade."
                    : "All content created during our services belongs to the client, except for pre-existing methodologies and knowledge that remain our property.",
            },
            confidentiality: {
                title: isPortuguese
                    ? "7. Confidencialidade"
                    : "7. Confidentiality",
                content: isPortuguese
                    ? "Mantemos absoluta confidencialidade sobre informações do cliente, incluindo estratégias, dados de canal e informações comerciais sensíveis."
                    : "We maintain absolute confidentiality about client information, including strategies, channel data and sensitive business information.",
            },
            termination: {
                title: isPortuguese ? "8. Rescisão" : "8. Termination",
                content: isPortuguese
                    ? "Qualquer parte pode rescindir os serviços mediante aviso prévio. Trabalhos em andamento serão finalizados ou compensados proporcionalmente."
                    : "Either party may terminate services with prior notice. Work in progress will be completed or compensated proportionally.",
            },
            contact: {
                title: isPortuguese ? "9. Contato" : "9. Contact",
                content: isPortuguese
                    ? "Para questões sobre estes termos, entre em contato: gabrieltothgoncalves@gmail.com"
                    : "For questions about these terms, contact us: gabrieltothgoncalves@gmail.com",
            },
        },
    }

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={webPageStructuredData}
                breadcrumbs={breadcrumbs}
            />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                {/* Language Selector */}
                <div className="fixed top-4 right-4 z-50">
                    <LanguageSelector />
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {content.title}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                {content.lastUpdated}
                            </p>
                        </header>

                        <div className="space-y-8">
                            {/* Introduction */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.intro.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.sections.intro.content}
                                </p>
                            </section>

                            {/* Services */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.services.title}
                                </h2>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    {content.sections.services.content.map(
                                        (item, index) => (
                                            <li key={index}>{item}</li>
                                        )
                                    )}
                                </ul>
                            </section>

                            {/* Obligations */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.obligations.title}
                                </h2>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    {content.sections.obligations.content.map(
                                        (item, index) => (
                                            <li key={index}>{item}</li>
                                        )
                                    )}
                                </ul>
                            </section>

                            {/* Payment */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.payment.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.sections.payment.content}
                                </p>
                            </section>

                            {/* Liability */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.liability.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.sections.liability.content}
                                </p>
                            </section>

                            {/* Intellectual Property */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.intellectual.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.sections.intellectual.content}
                                </p>
                            </section>

                            {/* Confidentiality */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.confidentiality.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.sections.confidentiality.content}
                                </p>
                            </section>

                            {/* Termination */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.termination.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.sections.termination.content}
                                </p>
                            </section>

                            {/* Contact */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {content.sections.contact.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.sections.contact.content}
                                </p>
                            </section>
                        </div>

                        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                © 2025 Gabriel Toth Gonçalves.{" "}
                                {isPortuguese
                                    ? "Todos os direitos reservados."
                                    : "All rights reserved."}
                            </p>
                        </footer>
                    </div>
                </div>
            </div>
        </>
    )
}
