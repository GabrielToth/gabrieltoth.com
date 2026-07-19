import PageHeader from "@/components/layout/page-header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./terms-metadata"

export default async function PCOptimizationTermsPage({ params }: PageProps) {
    const { locale } = await params
    const tHero = await getTranslations({ locale, namespace: "pcOptimizationTermsPageHero" })

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
            url: `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}`,
        },
        {
            name:
                locale === "pt-BR"
                    ? "Otimização de PC"
                    : locale === "es"
                      ? "Optimización de PC"
                      : locale === "de"
                        ? "PC-Optimierung"
                        : "PC Optimization",
            url: `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/pc-optimization`,
        },
        {
            name:
                locale === "pt-BR"
                    ? "Termos"
                    : locale === "es"
                      ? "Términos"
                      : locale === "de"
                        ? "Bedingungen"
                        : "Terms",
            url: `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/pc-optimization/terms`,
        },
    ]

    const content = {
        title:
            locale === "pt-BR"
                ? "Termos e Avisos Importantes – Otimização de Desempenho"
                : locale === "es"
                  ? "Términos y Avisos Importantes – Optimización de Rendimiento"
                  : locale === "de"
                    ? "Wichtige Bedingungen und Hinweise – Leistungsoptimierung"
                    : "Important Terms and Notices – Performance Optimization",
        subtitle:
            locale === "pt-BR"
                ? "Ao contratar os serviços de otimização de desempenho e ajustes avançados para computadores, o cliente declara estar ciente e de acordo com os seguintes pontos:"
                : locale === "es"
                  ? "Al contratar servicios de optimización de rendimiento y ajustes avanzados, el cliente declara estar al tanto y de acuerdo con lo siguiente:"
                  : locale === "de"
                    ? "Durch die Beauftragung von Leistungsoptimierung und erweiterten Anpassungen erklärt sich der Kunde mit Folgendem einverstanden:"
                    : "By contracting performance optimization and advanced computer tuning services, the client declares to be aware and agree with the following points:",
        generalTerms: {
            title:
                locale === "pt-BR"
                    ? "Termos Gerais de Otimização"
                    : locale === "es"
                      ? "Términos Generales de Optimización"
                      : locale === "de"
                        ? "Allgemeine Optimierungsbedingungen"
                        : "General Optimization Terms",
            items:
                locale === "pt-BR"
                    ? [
                          "1. **Natureza dos Serviços**: Os serviços incluem ajustes de sistema, configurações de hardware/software, instalação de drivers, otimização de perfis de energia e configurações específicas para gaming ou trabalho.",
                          "2. **Tempo de Execução**: O processo completo pode levar de 2 a 6 horas, dependendo das configurações iniciais do sistema e dos objetivos específicos.",
                          "3. **Acesso Remoto**: Alguns ajustes podem ser realizados remotamente através de software especializado, sempre com autorização prévia do cliente.",
                          "4. **Documentação**: Todas as alterações realizadas serão documentadas e fornecidas ao cliente.",
                      ]
                    : locale === "es"
                      ? [
                            "1. **Naturaleza de los Servicios**: ...",
                            "2. **Tiempo de Ejecución**: ...",
                            "3. **Acceso Remoto**: ...",
                            "4. **Documentación**: ...",
                        ]
                      : [
                            "1. **Nature of Services**: Services include system adjustments, hardware/software configurations, driver installation, power profile optimization, and specific settings for gaming or work.",
                            "2. **Execution Time**: The complete process may take 2 to 6 hours, depending on initial system settings and specific objectives.",
                            "3. **Remote Access**: Some adjustments may be performed remotely through specialized software, always with prior client authorization.",
                            "4. **Documentation**: All changes made will be documented and provided to the client.",
                        ],
        },
        warranties: {
            title:
                locale === "pt-BR"
                    ? "Garantias e Limitações"
                    : locale === "es"
                      ? "Garantías y Limitaciones"
                      : locale === "de"
                        ? "Garantien und Einschränkungen"
                        : "Warranties and Limitations",
            items:
                locale === "pt-BR"
                    ? [
                          "• **Garantia de Serviço**: 30 dias para correção de problemas diretamente relacionados às otimizações realizadas.",
                          "• **Limite de Responsabilidade**: Não nos responsabilizamos por danos a hardware pré-existentes ou falhas não relacionadas aos ajustes realizados.",
                          "• **Compatibilidade**: Algumas otimizações podem não ser compatíveis com softwares específicos ou hardware muito antigo.",
                          "• **Performance**: Melhorias de performance variam conforme hardware disponível e uso pretendido.",
                      ]
                    : locale === "es"
                      ? [
                            "• **Garantía del Servicio**: ...",
                            "• **Límite de Responsabilidad**: ...",
                            "• **Compatibilidad**: ...",
                            "• **Rendimiento**: ...",
                        ]
                      : [
                            "• **Service Warranty**: 30 days for correction of problems directly related to performed optimizations.",
                            "• **Liability Limit**: We are not responsible for pre-existing hardware damage or failures unrelated to performed adjustments.",
                            "• **Compatibility**: Some optimizations may not be compatible with specific software or very old hardware.",
                            "• **Performance**: Performance improvements vary according to available hardware and intended use.",
                        ],
        },
        requirements: {
            title:
                locale === "pt-BR"
                    ? "Requisitos e Responsabilidades do Cliente"
                    : locale === "es"
                      ? "Requisitos y Responsabilidades del Cliente"
                      : locale === "de"
                        ? "Anforderungen und Verantwortlichkeiten des Kunden"
                        : "Client Requirements and Responsibilities",
            items:
                locale === "pt-BR"
                    ? [
                          "• **Backup de Dados**: É recomendável realizar backup de dados importantes antes dos ajustes.",
                          "• **Informações do Sistema**: Fornecer informações precisas sobre hardware, software instalado e uso pretendido.",
                          "• **Acesso Administrativo**: Disponibilizar acesso de administrador ao sistema durante o processo.",
                          "• **Ambiente Adequado**: Garantir ambiente livre de vírus e malwares antes dos ajustes.",
                      ]
                    : locale === "es"
                      ? [
                            "• **Copia de Seguridad de Datos**: ...",
                            "• **Información del Sistema**: ...",
                            "• **Acceso Administrativo**: ...",
                            "• **Entorno Adecuado**: ...",
                        ]
                      : [
                            "• **Data Backup**: It is recommended to backup important data before adjustments.",
                            "• **System Information**: Provide accurate information about hardware, installed software, and intended use.",
                            "• **Administrative Access**: Provide administrator access to the system during the process.",
                            "• **Proper Environment**: Ensure virus and malware-free environment before adjustments.",
                        ],
        },
        warnings: {
            title:
                locale === "pt-BR"
                    ? "Avisos Importantes"
                    : locale === "es"
                      ? "Avisos Importantes"
                      : locale === "de"
                        ? "Wichtige Hinweise"
                        : "Important Warnings",
            items:
                locale === "pt-BR"
                    ? [
                          "⚠️ **Overclocking**: Serviços de overclocking aumentam performance mas podem reduzir vida útil do hardware.",
                          "⚠️ **Configurações Experimentais**: Algumas configurações avançadas podem exigir reversão em caso de incompatibilidade.",
                          "⚠️ **Atualizações do Sistema**: Atualizações futuras do Windows podem reverter algumas otimizações.",
                          "⚠️ **Hardware Antigo**: Sistemas muito antigos podem ter limitações físicas que impedem certas otimizações.",
                      ]
                    : locale === "es"
                      ? [
                            "⚠️ **Overclocking**: ...",
                            "⚠️ **Configuraciones Experimentales**: ...",
                            "⚠️ **Actualizaciones del Sistema**: ...",
                            "⚠️ **Hardware Antiguo**: ...",
                        ]
                      : [
                            "⚠️ **Overclocking**: Overclocking services increase performance but may reduce hardware lifespan.",
                            "⚠️ **Experimental Settings**: Some advanced settings may require reversal in case of incompatibility.",
                            "⚠️ **System Updates**: Future Windows updates may revert some optimizations.",
                            "⚠️ **Old Hardware**: Very old systems may have physical limitations that prevent certain optimizations.",
                        ],
        },
        payment: {
            title:
                locale === "pt-BR"
                    ? "Condições de Pagamento"
                    : locale === "es"
                      ? "Términos de Pago"
                      : locale === "de"
                        ? "Zahlungsbedingungen"
                        : "Payment Terms",
            text:
                locale === "pt-BR"
                    ? "O pagamento é realizado após a conclusão e aprovação dos serviços. Valores variam conforme complexidade e tempo necessário. Forma de pagamento: PIX, cartão de crédito ou outros métodos acordados previamente."
                    : locale === "es"
                      ? "El pago se realiza tras la finalización y aprobación del servicio. Los valores varían según la complejidad y el tiempo requerido. Métodos de pago: PIX, tarjeta de crédito u otros métodos previamente acordados."
                      : locale === "de"
                        ? "Die Zahlung erfolgt nach Abschluss und Genehmigung der Leistungen. Die Preise variieren je nach Komplexität und erforderlicher Zeit. Zahlungsmethoden: PIX, Kreditkarte oder andere zuvor vereinbarte Methoden."
                        : "Payment is made after completion and approval of services. Prices vary according to complexity and required time. Payment methods: PIX, credit card, or other previously agreed methods.",
        },
        support: {
            title:
                locale === "pt-BR"
                    ? "Suporte Pós-Serviço"
                    : locale === "es"
                      ? "Soporte Postservicio"
                      : locale === "de"
                        ? "Kundendienst"
                        : "Post-Service Support",
            text:
                locale === "pt-BR"
                    ? "Oferecemos suporte de 30 dias para esclarecimentos sobre as otimizações realizadas e correção de problemas relacionados. Suporte adicional pode ser contratado separadamente."
                    : locale === "es"
                      ? "Ofrecemos soporte de 30 días para aclaraciones sobre las optimizaciones realizadas y corrección de problemas relacionados. Un soporte adicional se puede contratar por separado."
                      : locale === "de"
                        ? "Wir bieten 30 Tage Support für Fragen zu den durchgeführten Optimierungen und zur Behebung damit verbundener Probleme. Zusätzlicher Support kann separat vereinbart werden."
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

            <main className="min-h-screen bg-muted dark:bg-background">
                <PageHeader
                    eyebrow={tHero("hero.badge")}
                    title={tHero("hero.title")}
                    subtitle={tHero("hero.subtitle")}
                />

                <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <Breadcrumbs
                            items={breadcrumbs.map((item, index) => ({
                                name: item.name,
                                href: item.url,
                                current: index === breadcrumbs.length - 1,
                            }))}
                            className="mb-6"
                        />

                        <div className="bg-card shadow-xl rounded-lg p-8">
                            <div className="space-y-12">
                                {/* General Terms */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {content.generalTerms.title}
                                    </h2>
                                    <div className="space-y-4">
                                        {content.generalTerms.items.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg"
                                                >
                                                    <p className="text-foreground dark:text-foreground">
                                                        {item}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </section>

                                {/* Warranties */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
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
                                                <p className="text-foreground dark:text-foreground">
                                                    {item}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Requirements */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {content.requirements.title}
                                    </h2>
                                    <div className="space-y-3">
                                        {content.requirements.items.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start"
                                                >
                                                    <span className="text-primary mr-2 mt-1">
                                                        📋
                                                    </span>
                                                    <p className="text-foreground dark:text-foreground">
                                                        {item}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </section>

                                {/* Warnings */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {content.warnings.title}
                                    </h2>
                                    <div className="space-y-3">
                                        {content.warnings.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400"
                                            >
                                                <p className="text-foreground dark:text-foreground">
                                                    {item}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Payment Terms */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {content.payment.title}
                                    </h2>
                                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-foreground dark:text-foreground">
                                            {content.payment.text}
                                        </p>
                                    </div>
                                </section>

                                {/* Support */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {content.support.title}
                                    </h2>
                                    <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-foreground dark:text-foreground">
                                            {content.support.text}
                                        </p>
                                    </div>
                                </section>

                                {/* Footer */}
                                <div className="border-t border-border dark:border-border pt-6 text-center">
                                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                                        {locale === "pt-BR"
                                            ? "Ao contratar nossos serviços, você concorda com todos os termos descritos acima."
                                            : locale === "es"
                                              ? "Al contratar nuestros servicios, acepta todos los términos descritos anteriormente."
                                              : locale === "de"
                                                ? "Mit der Beauftragung unserer Dienste akzeptieren Sie alle oben beschriebenen Bedingungen."
                                                : "By hiring our services, you agree to all terms described above."}
                                    </p>
                                    <Link
                                        href={`/${locale}/pc-optimization`}
                                        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
                                    >
                                        {locale === "pt-BR"
                                            ? "← Voltar para Otimização de PC"
                                            : locale === "es"
                                              ? "← Volver a Optimización de PC"
                                              : locale === "de"
                                                ? "← Zurück zur PC-Optimierung"
                                                : "← Back to PC Optimization"}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
