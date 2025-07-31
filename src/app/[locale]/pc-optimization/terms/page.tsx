import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import Link from "next/link"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./terms-metadata"

export default async function PCOptimizationTermsPage({ params }: PageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Breadcrumbs
    const breadcrumbs = [
        {
            name: isPortuguese ? "Início" : "Home",
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}`,
        },
        {
            name: isPortuguese ? "Otimização de PC" : "PC Optimization",
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/pc-optimization`,
        },
        {
            name: isPortuguese ? "Termos" : "Terms",
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/pc-optimization/terms`,
        },
    ]

    const content = {
        title: isPortuguese
            ? "Termos e Avisos Importantes – Otimização de Desempenho"
            : "Important Terms and Notices – Performance Optimization",
        subtitle: isPortuguese
            ? "Ao contratar os serviços de otimização de desempenho e ajustes avançados para computadores, o cliente declara estar ciente e de acordo com os seguintes pontos:"
            : "By contracting performance optimization and advanced computer tuning services, the client declares to be aware and agree with the following points:",
        generalTerms: {
            title: isPortuguese
                ? "Termos Gerais de Otimização"
                : "General Optimization Terms",
            items: isPortuguese
                ? [
                      "1. **Natureza dos Serviços**: Os serviços incluem ajustes de sistema, configurações de hardware/software, instalação de drivers, otimização de perfis de energia e configurações específicas para gaming ou trabalho.",
                      "2. **Tempo de Execução**: O processo completo pode levar de 2 a 6 horas, dependendo das configurações iniciais do sistema e dos objetivos específicos.",
                      "3. **Acesso Remoto**: Alguns ajustes podem ser realizados remotamente através de software especializado, sempre com autorização prévia do cliente.",
                      "4. **Documentação**: Todas as alterações realizadas serão documentadas e fornecidas ao cliente.",
                  ]
                : [
                      "1. **Nature of Services**: Services include system adjustments, hardware/software configurations, driver installation, power profile optimization, and specific settings for gaming or work.",
                      "2. **Execution Time**: The complete process may take 2 to 6 hours, depending on initial system settings and specific objectives.",
                      "3. **Remote Access**: Some adjustments may be performed remotely through specialized software, always with prior client authorization.",
                      "4. **Documentation**: All changes made will be documented and provided to the client.",
                  ],
        },
        warranties: {
            title: isPortuguese
                ? "Garantias e Limitações"
                : "Warranties and Limitations",
            items: isPortuguese
                ? [
                      "• **Garantia de Serviço**: 30 dias para correção de problemas diretamente relacionados às otimizações realizadas.",
                      "• **Limite de Responsabilidade**: Não nos responsabilizamos por danos a hardware pré-existentes ou falhas não relacionadas aos ajustes realizados.",
                      "• **Compatibilidade**: Algumas otimizações podem não ser compatíveis com softwares específicos ou hardware muito antigo.",
                      "• **Performance**: Melhorias de performance variam conforme hardware disponível e uso pretendido.",
                  ]
                : [
                      "• **Service Warranty**: 30 days for correction of problems directly related to performed optimizations.",
                      "• **Liability Limit**: We are not responsible for pre-existing hardware damage or failures unrelated to performed adjustments.",
                      "• **Compatibility**: Some optimizations may not be compatible with specific software or very old hardware.",
                      "• **Performance**: Performance improvements vary according to available hardware and intended use.",
                  ],
        },
        requirements: {
            title: isPortuguese
                ? "Requisitos e Responsabilidades do Cliente"
                : "Client Requirements and Responsibilities",
            items: isPortuguese
                ? [
                      "• **Backup de Dados**: É recomendável realizar backup de dados importantes antes dos ajustes.",
                      "• **Informações do Sistema**: Fornecer informações precisas sobre hardware, software instalado e uso pretendido.",
                      "• **Acesso Administrativo**: Disponibilizar acesso de administrador ao sistema durante o processo.",
                      "• **Ambiente Adequado**: Garantir ambiente livre de vírus e malwares antes dos ajustes.",
                  ]
                : [
                      "• **Data Backup**: It is recommended to backup important data before adjustments.",
                      "• **System Information**: Provide accurate information about hardware, installed software, and intended use.",
                      "• **Administrative Access**: Provide administrator access to the system during the process.",
                      "• **Proper Environment**: Ensure virus and malware-free environment before adjustments.",
                  ],
        },
        warnings: {
            title: isPortuguese ? "Avisos Importantes" : "Important Warnings",
            items: isPortuguese
                ? [
                      "⚠️ **Overclocking**: Serviços de overclocking aumentam performance mas podem reduzir vida útil do hardware.",
                      "⚠️ **Configurações Experimentais**: Algumas configurações avançadas podem exigir reversão em caso de incompatibilidade.",
                      "⚠️ **Atualizações do Sistema**: Atualizações futuras do Windows podem reverter algumas otimizações.",
                      "⚠️ **Hardware Antigo**: Sistemas muito antigos podem ter limitações físicas que impedem certas otimizações.",
                  ]
                : [
                      "⚠️ **Overclocking**: Overclocking services increase performance but may reduce hardware lifespan.",
                      "⚠️ **Experimental Settings**: Some advanced settings may require reversal in case of incompatibility.",
                      "⚠️ **System Updates**: Future Windows updates may revert some optimizations.",
                      "⚠️ **Old Hardware**: Very old systems may have physical limitations that prevent certain optimizations.",
                  ],
        },
        payment: {
            title: isPortuguese ? "Condições de Pagamento" : "Payment Terms",
            text: isPortuguese
                ? "O pagamento é realizado após a conclusão e aprovação dos serviços. Valores variam conforme complexidade e tempo necessário. Forma de pagamento: PIX, cartão de crédito ou outros métodos acordados previamente."
                : "Payment is made after completion and approval of services. Prices vary according to complexity and required time. Payment methods: PIX, credit card, or other previously agreed methods.",
        },
        support: {
            title: isPortuguese
                ? "Suporte Pós-Serviço"
                : "Post-Service Support",
            text: isPortuguese
                ? "Oferecemos suporte de 30 dias para esclarecimentos sobre as otimizações realizadas e correção de problemas relacionados. Suporte adicional pode ser contratado separadamente."
                : "We offer 30-day support for clarifications about performed optimizations and correction of related problems. Additional support can be contracted separately.",
        },
    }

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                breadcrumbs={breadcrumbs}
            />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
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

                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                {content.title}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                {content.subtitle}
                            </p>
                        </div>

                        {/* General Terms */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.generalTerms.title}
                            </h2>
                            <div className="space-y-4">
                                {content.generalTerms.items.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                        >
                                            <p className="text-gray-700 dark:text-gray-300">
                                                {item}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </section>

                        {/* Warranties */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.warranties.title}
                            </h2>
                            <div className="space-y-3">
                                {content.warranties.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start"
                                    >
                                        <span className="text-green-500 mr-2 mt-1">
                                            ✓
                                        </span>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Requirements */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.requirements.title}
                            </h2>
                            <div className="space-y-3">
                                {content.requirements.items.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start"
                                        >
                                            <span className="text-blue-500 mr-2 mt-1">
                                                📋
                                            </span>
                                            <p className="text-gray-700 dark:text-gray-300">
                                                {item}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </section>

                        {/* Warnings */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.warnings.title}
                            </h2>
                            <div className="space-y-3">
                                {content.warnings.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400"
                                    >
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Payment Terms */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.payment.title}
                            </h2>
                            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-gray-700 dark:text-gray-300">
                                    {content.payment.text}
                                </p>
                            </div>
                        </section>

                        {/* Support */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                {content.support.title}
                            </h2>
                            <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-gray-700 dark:text-gray-300">
                                    {content.support.text}
                                </p>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {isPortuguese
                                    ? "Ao contratar nossos serviços, você concorda com todos os termos descritos acima."
                                    : "By hiring our services, you agree to all terms described above."}
                            </p>
                            <Link
                                href={`/${locale}/pc-optimization`}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {isPortuguese
                                    ? "← Voltar para Otimização de PC"
                                    : "← Back to PC Optimization"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
