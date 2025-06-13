import { type Locale } from "@/lib/i18n"

interface PrivacyPolicyPageProps {
    params: Promise<{ locale: Locale }>
}

export default async function PrivacyPolicyPage({
    params,
}: PrivacyPolicyPageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    const content = {
        title: isPortuguese ? "Política de Privacidade" : "Privacy Policy",
        lastUpdated: isPortuguese
            ? "Última atualização: Janeiro 2024"
            : "Last updated: January 2024",
        sections: {
            intro: {
                title: isPortuguese ? "1. Introdução" : "1. Introduction",
                content: isPortuguese
                    ? "Esta Política de Privacidade descreve como Gabriel Toth Gonçalves ('nós', 'nosso' ou 'nos') coleta, usa, armazena e protege suas informações pessoais quando você utiliza nossos serviços de consultoria em canais digitais, otimização de PC e outras soluções tecnológicas."
                    : "This Privacy Policy describes how Gabriel Toth Gonçalves ('we', 'our' or 'us') collects, uses, stores and protects your personal information when you use our digital channel consulting, PC optimization and other technology solution services.",
            },
            collection: {
                title: isPortuguese
                    ? "2. Informações que Coletamos"
                    : "2. Information We Collect",
                content: isPortuguese
                    ? [
                          "• Dados de contato: nome, email, telefone, WhatsApp",
                          "• Informações do canal: URL do YouTube, tipo de conteúdo, estatísticas",
                          "• Dados de pagamento: informações para processamento de transações",
                          "• Dados técnicos: especificações do PC para otimização",
                          "• Comunicações: mensagens trocadas durante a consultoria",
                      ]
                    : [
                          "• Contact data: name, email, phone, WhatsApp",
                          "• Channel information: YouTube URL, content type, statistics",
                          "• Payment data: information for transaction processing",
                          "• Technical data: PC specifications for optimization",
                          "• Communications: messages exchanged during consulting",
                      ],
            },
            usage: {
                title: isPortuguese
                    ? "3. Como Usamos suas Informações"
                    : "3. How We Use Your Information",
                content: isPortuguese
                    ? [
                          "• Prestar serviços de consultoria personalizados",
                          "• Processar pagamentos e emitir faturas",
                          "• Comunicar sobre projetos e atualizações",
                          "• Melhorar nossos serviços",
                          "• Cumprir obrigações legais",
                      ]
                    : [
                          "• Provide personalized consulting services",
                          "• Process payments and issue invoices",
                          "• Communicate about projects and updates",
                          "• Improve our services",
                          "• Comply with legal obligations",
                      ],
            },
            sharing: {
                title: isPortuguese
                    ? "4. Compartilhamento de Dados"
                    : "4. Data Sharing",
                content: isPortuguese
                    ? "Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para prestação dos serviços (processadores de pagamento, ferramentas de análise) ou quando exigido por lei."
                    : "We do not sell, rent or share your personal information with third parties, except when necessary for service provision (payment processors, analytics tools) or when required by law.",
            },
            security: {
                title: isPortuguese
                    ? "5. Segurança dos Dados"
                    : "5. Data Security",
                content: isPortuguese
                    ? "Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição."
                    : "We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure or destruction.",
            },
            rights: {
                title: isPortuguese ? "6. Seus Direitos" : "6. Your Rights",
                content: isPortuguese
                    ? [
                          "• Acessar suas informações pessoais",
                          "• Corrigir dados incorretos",
                          "• Solicitar exclusão de dados",
                          "• Portabilidade dos dados",
                          "• Revogar consentimento",
                      ]
                    : [
                          "• Access your personal information",
                          "• Correct incorrect data",
                          "• Request data deletion",
                          "• Data portability",
                          "• Revoke consent",
                      ],
            },
            contact: {
                title: isPortuguese ? "7. Contato" : "7. Contact",
                content: isPortuguese
                    ? "Para questões sobre esta política ou seus dados pessoais, entre em contato: gabrieltothgoncalves@gmail.com ou WhatsApp: +55 11 93619-1346"
                    : "For questions about this policy or your personal data, contact us: gabrieltothgoncalves@gmail.com or WhatsApp: +55 11 93619-1346",
            },
        },
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

                        {/* Information Collection */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.sections.collection.title}
                            </h2>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                {content.sections.collection.content.map(
                                    (item, index) => (
                                        <li key={index}>{item}</li>
                                    )
                                )}
                            </ul>
                        </section>

                        {/* Usage */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.sections.usage.title}
                            </h2>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                {content.sections.usage.content.map(
                                    (item, index) => (
                                        <li key={index}>{item}</li>
                                    )
                                )}
                            </ul>
                        </section>

                        {/* Sharing */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.sections.sharing.title}
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {content.sections.sharing.content}
                            </p>
                        </section>

                        {/* Security */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.sections.security.title}
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {content.sections.security.content}
                            </p>
                        </section>

                        {/* Rights */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.sections.rights.title}
                            </h2>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                {content.sections.rights.content.map(
                                    (item, index) => (
                                        <li key={index}>{item}</li>
                                    )
                                )}
                            </ul>
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
                            © 2024 Gabriel Toth Gonçalves.{" "}
                            {isPortuguese
                                ? "Todos os direitos reservados."
                                : "All rights reserved."}
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    )
}
