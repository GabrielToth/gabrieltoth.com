import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import LanguageSelector from "@/components/ui/language-selector"
import { type Locale } from "@/lib/i18n"

interface TermsOfServicePageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./terms-of-service-metadata"

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
            ? "Última atualização: 15 de dezembro de 2024"
            : "Last updated: December 15, 2024",
        acceptance: {
            title: isPortuguese
                ? "1. Aceitação dos Termos"
                : "1. Acceptance of Terms",
            text: isPortuguese
                ? "Ao acessar e usar este site, você aceita e concorda estar vinculado aos termos e condições de uso aqui descritos. Se você não concordar com algum destes termos, não deverá usar este site."
                : "By accessing and using this website, you accept and agree to be bound by the terms and conditions of use described herein. If you do not agree to any of these terms, you should not use this website.",
        },
        services: {
            title: isPortuguese
                ? "2. Descrição dos Serviços"
                : "2. Service Description",
            text: isPortuguese
                ? "Este site oferece serviços de desenvolvimento web, consultoria digital, e soluções tecnológicas. Os serviços podem incluir, mas não se limitam a: desenvolvimento de websites, otimização de performance, consultoria em crescimento digital, e suporte técnico."
                : "This website offers web development services, digital consulting, and technological solutions. Services may include, but are not limited to: website development, performance optimization, digital growth consulting, and technical support.",
        },
        responsibilities: {
            title: isPortuguese
                ? "3. Responsabilidades do Usuário"
                : "3. User Responsibilities",
            text: isPortuguese
                ? "Você é responsável por manter a confidencialidade de suas informações de conta e senha, e por todas as atividades que ocorrem sob sua conta. Você concorda em notificar imediatamente sobre qualquer uso não autorizado de sua conta."
                : "You are responsible for maintaining the confidentiality of your account information and password, and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.",
        },
        limitations: {
            title: isPortuguese
                ? "4. Limitações de Responsabilidade"
                : "4. Limitation of Liability",
            text: isPortuguese
                ? "Em nenhuma circunstância seremos responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais que resultem do uso ou incapacidade de usar nossos serviços."
                : "Under no circumstances shall we be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.",
        },
        privacy: {
            title: isPortuguese ? "5. Privacidade" : "5. Privacy",
            text: isPortuguese
                ? "Sua privacidade é importante para nós. Consulte nossa Política de Privacidade para informações sobre como coletamos, usamos e protegemos suas informações pessoais."
                : "Your privacy is important to us. Please review our Privacy Policy for information on how we collect, use, and protect your personal information.",
        },
        modifications: {
            title: isPortuguese
                ? "6. Modificações dos Termos"
                : "6. Terms Modifications",
            text: isPortuguese
                ? "Reservamo-nos o direito de modificar estes termos de serviço a qualquer momento. As modificações entrarão em vigor imediatamente após a publicação no site."
                : "We reserve the right to modify these terms of service at any time. Modifications will take effect immediately upon posting on the website.",
        },
        termination: {
            title: isPortuguese ? "7. Rescisão" : "7. Termination",
            text: isPortuguese
                ? "Podemos encerrar ou suspender sua conta e acesso aos serviços imediatamente, sem aviso prévio, por qualquer motivo, incluindo violação destes termos."
                : "We may terminate or suspend your account and access to services immediately, without prior notice, for any reason, including breach of these terms.",
        },
        governing: {
            title: isPortuguese ? "8. Lei Aplicável" : "8. Governing Law",
            text: isPortuguese
                ? "Estes termos serão regidos e interpretados de acordo com as leis do Brasil, sem dar efeito a quaisquer princípios de conflitos de lei."
                : "These terms shall be governed by and construed in accordance with the laws of Brazil, without giving effect to any principles of conflicts of law.",
        },
        contact: {
            title: isPortuguese ? "9. Contato" : "9. Contact",
            text: isPortuguese
                ? "Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através dos canais disponíveis no site."
                : "If you have questions about these Terms of Service, please contact us through the channels available on the website.",
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
                            {/* Acceptance of Terms */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.acceptance.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.acceptance.text}
                                </p>
                            </section>

                            {/* Service Description */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.services.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.services.text}
                                </p>
                            </section>

                            {/* User Responsibilities */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.responsibilities.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.responsibilities.text}
                                </p>
                            </section>

                            {/* Limitation of Liability */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.limitations.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.limitations.text}
                                </p>
                            </section>

                            {/* Privacy */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.privacy.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.privacy.text}
                                </p>
                            </section>

                            {/* Terms Modifications */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.modifications.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.modifications.text}
                                </p>
                            </section>

                            {/* Termination */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.termination.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.termination.text}
                                </p>
                            </section>

                            {/* Governing Law */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.governing.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.governing.text}
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
                                    ? "Este documento constitui um acordo legalmente vinculativo entre você e Gabriel Toth Gonçalves."
                                    : "This document constitutes a legally binding agreement between you and Gabriel Toth Gonçalves."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
