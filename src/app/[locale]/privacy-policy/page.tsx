import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"

interface PrivacyPolicyPageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./privacy-policy-metadata"

export default async function PrivacyPolicyPage({
    params,
}: PrivacyPolicyPageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Breadcrumbs
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
                    ? "Política de Privacidade"
                    : locale === "es"
                      ? "Política de Privacidad"
                      : locale === "de"
                        ? "Datenschutzrichtlinie"
                        : "Privacy Policy",
            url: `https://gabrieltoth.com/${locale}/privacy-policy`,
        },
    ]

    // WebPage structured data
    const webPageStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: isPortuguese ? "Política de Privacidade" : "Privacy Policy",
        description: isPortuguese
            ? "Política de privacidade detalhando como protegemos e utilizamos dados pessoais"
            : "Privacy policy detailing how we protect and use personal data",
        url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/privacy-policy`,
        isPartOf: {
            "@type": "WebSite",
            name: "Gabriel Toth Portfolio",
            url: "https://gabrieltoth.com",
        },
        about: {
            "@type": "Thing",
            name: isPortuguese ? "Proteção de Dados" : "Data Protection",
        },
    }

    const content = {
        title: isPortuguese ? "Política de Privacidade" : "Privacy Policy",
        lastUpdated: isPortuguese
            ? "Última atualização: 15 de dezembro de 2024"
            : "Last updated: December 15, 2024",
        introduction: {
            title: isPortuguese ? "1. Introdução" : "1. Introduction",
            text: isPortuguese
                ? "Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você visita nosso site ou utiliza nossos serviços."
                : "This Privacy Policy describes how we collect, use, store, and protect your personal information when you visit our website or use our services.",
        },
        collection: {
            title: isPortuguese
                ? "2. Informações que Coletamos"
                : "2. Information We Collect",
            text: isPortuguese
                ? "Coletamos informações que você nos fornece diretamente (como formulários de contato), informações de uso do site (cookies, analytics) e informações técnicas (endereço IP, tipo de navegador)."
                : "We collect information you provide directly to us (such as contact forms), website usage information (cookies, analytics), and technical information (IP address, browser type).",
        },
        usage: {
            title: isPortuguese
                ? "3. Como Usamos suas Informações"
                : "3. How We Use Your Information",
            text: isPortuguese
                ? "Utilizamos suas informações para fornecer nossos serviços, melhorar a experiência do usuário, comunicar-nos com você sobre nossos serviços e cumprir obrigações legais."
                : "We use your information to provide our services, improve user experience, communicate with you about our services, and comply with legal obligations.",
        },
        sharing: {
            title: isPortuguese
                ? "4. Compartilhamento de Informações"
                : "4. Information Sharing",
            text: isPortuguese
                ? "Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para fornecer nossos serviços ou quando exigido por lei."
                : "We do not sell, rent, or share your personal information with third parties, except when necessary to provide our services or when required by law.",
        },
        cookies: {
            title: isPortuguese
                ? "5. Cookies e Tecnologias Similares"
                : "5. Cookies and Similar Technologies",
            text: isPortuguese
                ? "Utilizamos cookies e tecnologias similares para melhorar a funcionalidade do site, analisar o uso e personalizar sua experiência. Você pode controlar o uso de cookies através das configurações do seu navegador."
                : "We use cookies and similar technologies to improve website functionality, analyze usage, and personalize your experience. You can control cookie usage through your browser settings.",
        },
        security: {
            title: isPortuguese ? "6. Segurança dos Dados" : "6. Data Security",
            text: isPortuguese
                ? "Implementamos medidas de segurança adequadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição."
                : "We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction.",
        },
        rights: {
            title: isPortuguese ? "7. Seus Direitos" : "7. Your Rights",
            text: isPortuguese
                ? "Você tem o direito de acessar, corrigir, excluir ou limitar o processamento de suas informações pessoais. Para exercer esses direitos, entre em contato conosco."
                : "You have the right to access, correct, delete, or limit the processing of your personal information. To exercise these rights, please contact us.",
        },
        retention: {
            title: isPortuguese ? "8. Retenção de Dados" : "8. Data Retention",
            text: isPortuguese
                ? "Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política ou conforme exigido por lei."
                : "We retain your personal information only for as long as necessary to fulfill the purposes described in this policy or as required by law.",
        },
        changes: {
            title: isPortuguese
                ? "9. Alterações nesta Política"
                : "9. Changes to This Policy",
            text: isPortuguese
                ? "Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através do site ou por outros meios apropriados."
                : "We may update this Privacy Policy periodically. We will notify you of significant changes through the website or other appropriate means.",
        },
        contact: {
            title: isPortuguese ? "10. Contato" : "10. Contact",
            text: isPortuguese
                ? "Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos suas informações, entre em contato conosco através dos canais disponíveis no site."
                : "If you have questions about this Privacy Policy or about how we handle your information, please contact us through the channels available on the website.",
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

            <Header />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
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
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.introduction.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.introduction.text}
                                </p>
                            </section>

                            {/* Information Collection */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.collection.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.collection.text}
                                </p>
                            </section>

                            {/* Information Usage */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.usage.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.usage.text}
                                </p>
                            </section>

                            {/* Information Sharing */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.sharing.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.sharing.text}
                                </p>
                            </section>

                            {/* Cookies */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.cookies.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.cookies.text}
                                </p>
                            </section>

                            {/* Security */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.security.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.security.text}
                                </p>
                            </section>

                            {/* Rights */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.rights.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.rights.text}
                                </p>
                            </section>

                            {/* Data Retention */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.retention.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.retention.text}
                                </p>
                            </section>

                            {/* Policy Changes */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.changes.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.changes.text}
                                </p>
                            </section>

                            {/* Contact */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.contact.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.contact.text}
                                </p>
                            </section>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                {isPortuguese
                                    ? "Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD) e outras regulamentações aplicáveis."
                                    : "This policy complies with the General Data Protection Law (LGPD) and other applicable regulations."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer locale={locale} />
        </>
    )
}
