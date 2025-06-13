"use client"

import Header from "@/components/layout/header"
import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"

const getTranslations = (locale: Locale) => {
    const translations = {
        en: {
            title: "Payment System Demo",
            description:
                "Explore our comprehensive payment system with support for multiple payment methods including PIX, credit cards, and cryptocurrencies.",
            methodsTitle: "💳 Payment Methods Supported",
            pixTitle: "🇧🇷 PIX Integration",
            pixDesc:
                "Native Brazilian instant payment system with QR codes and real-time processing.",
            testPix: "Test PIX",
            stripeTitle: "💳 Stripe Integration",
            stripeDesc:
                "Secure credit card processing with international support and fraud protection.",
            testCard: "Test Card",
            cryptoTitle: "🔐 Crypto Payments",
            cryptoDesc:
                "Decentralized payments with Bitcoin, Ethereum, and other major cryptocurrencies.",
            testCrypto: "Test Crypto",
            technicalTitle: "Technical Features",
            securityTitle: "Security & Compliance",
            developerTitle: "Developer Experience",
            security: [
                "PCI DSS Compliant",
                "End-to-end Encryption",
                "Fraud Detection",
                "Secure Webhooks",
            ],
            developer: [
                "RESTful APIs",
                "Real-time Updates",
                "Comprehensive Documentation",
                "Test Environment",
            ],
        },
        "pt-BR": {
            title: "Demo do Sistema de Pagamento",
            description:
                "Explore nosso sistema de pagamento abrangente com suporte para múltiplos métodos de pagamento incluindo PIX, cartões de crédito e criptomoedas.",
            methodsTitle: "💳 Métodos de Pagamento Suportados",
            pixTitle: "🇧🇷 Integração PIX",
            pixDesc:
                "Sistema de pagamento instantâneo brasileiro nativo com QR codes e processamento em tempo real.",
            testPix: "Testar PIX",
            stripeTitle: "💳 Integração Stripe",
            stripeDesc:
                "Processamento seguro de cartão de crédito com suporte internacional e proteção contra fraude.",
            testCard: "Testar Cartão",
            cryptoTitle: "🔐 Pagamentos Crypto",
            cryptoDesc:
                "Pagamentos descentralizados com Bitcoin, Ethereum e outras principais criptomoedas.",
            testCrypto: "Testar Crypto",
            technicalTitle: "Recursos Técnicos",
            securityTitle: "Segurança e Conformidade",
            developerTitle: "Experiência do Desenvolvedor",
            security: [
                "Conforme PCI DSS",
                "Criptografia Ponta a Ponta",
                "Detecção de Fraude",
                "Webhooks Seguros",
            ],
            developer: [
                "APIs RESTful",
                "Atualizações em Tempo Real",
                "Documentação Abrangente",
                "Ambiente de Teste",
            ],
        },
    }
    return translations[locale] || translations.en
}

export default function PaymentDemoPage() {
    const { locale } = useLocale()
    const t = getTranslations(locale)

    return (
        <>
            <Header />
            <div className="min-h-screen bg-white dark:bg-gray-900 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                            {t.title}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t.description}
                        </p>
                    </div>

                    <div className="mt-16">
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">
                                {t.methodsTitle}
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/20 rounded-lg p-4">
                                    <div className="text-2xl mb-2">🏦</div>
                                    <div>PIX</div>
                                </div>
                                <div className="bg-white/20 rounded-lg p-4">
                                    <div className="text-2xl mb-2">💳</div>
                                    <div>Credit Card</div>
                                </div>
                                <div className="bg-white/20 rounded-lg p-4">
                                    <div className="text-2xl mb-2">₿</div>
                                    <div>Bitcoin</div>
                                </div>
                                <div className="bg-white/20 rounded-lg p-4">
                                    <div className="text-2xl mb-2">💎</div>
                                    <div>Ethereum</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.pixTitle}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {t.pixDesc}
                                </p>
                                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                                    {t.testPix}
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.stripeTitle}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {t.stripeDesc}
                                </p>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                    {t.testCard}
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.cryptoTitle}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {t.cryptoDesc}
                                </p>
                                <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
                                    {t.testCrypto}
                                </button>
                            </div>
                        </div>

                        <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                                {t.technicalTitle}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        {t.securityTitle}
                                    </h4>
                                    <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                                        {t.security.map((item, index) => (
                                            <li key={index}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        {t.developerTitle}
                                    </h4>
                                    <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                                        {t.developer.map((item, index) => (
                                            <li key={index}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
