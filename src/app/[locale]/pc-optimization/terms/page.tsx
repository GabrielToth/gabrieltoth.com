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
            url: `https://gabrieltoth.com/${locale}`,
        },
        {
            name: isPortuguese ? "Otimização de PC" : "PC Optimization",
            url: `https://gabrieltoth.com/${locale}/pc-optimization`,
        },
        {
            name: isPortuguese ? "Termos" : "Terms",
            url: `https://gabrieltoth.com/${locale}/pc-optimization/terms`,
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
            items: [
                {
                    title: isPortuguese
                        ? "1. Resultados Variáveis"
                        : "1. Variable Results",
                    content: isPortuguese
                        ? "A otimização de desempenho pode apresentar resultados diferentes para cada usuário, dependendo do hardware, softwares instalados e outros fatores específicos do computador. Não há garantia de aumento específico de FPS, estabilidade ou desempenho em todos os casos."
                        : "Performance optimization may present different results for each user, depending on hardware, installed software and other computer-specific factors. There is no guarantee of specific FPS increase, stability or performance in all cases.",
                },
                {
                    title: isPortuguese
                        ? "2. Riscos e Limitações"
                        : "2. Risks and Limitations",
                    content: isPortuguese
                        ? "A otimização de sistema envolve ajustes em configurações do Windows, drivers e softwares. Embora as alterações sejam feitas com base em boas práticas, podem ocorrer instabilidades, travamentos ou incompatibilidades em casos específicos. Não me responsabilizo por falhas ou perdas de arquivos decorrentes de alterações no sistema operacional ou em drivers. Recomenda-se sempre realizar backup antes de qualquer intervenção."
                        : "System optimization involves adjustments to Windows settings, drivers and software. Although changes are made based on best practices, instabilities, crashes or incompatibilities may occur in specific cases. I am not responsible for failures or file losses resulting from changes to the operating system or drivers. It is always recommended to perform a backup before any intervention.",
                },
                {
                    title: isPortuguese
                        ? "3. Reversão e Restauração"
                        : "3. Reversal and Restoration",
                    content: isPortuguese
                        ? "Caso deseje, o cliente pode solicitar a reversão das otimizações aplicadas. Porém, eventuais efeitos colaterais ou alterações permanentes no desempenho não podem ser totalmente garantidos como antes da intervenção."
                        : "If desired, the client may request reversal of applied optimizations. However, any side effects or permanent performance changes cannot be fully guaranteed as they were before the intervention.",
                },
            ],
        },
        overclockTerms: {
            title: isPortuguese
                ? "Termos e Avisos Específicos sobre Overclock (Opcional)"
                : "Specific Terms and Notices about Overclocking (Optional)",
            subtitle: isPortuguese
                ? "O serviço de Overclock consiste em ajustes avançados para aumentar a performance do hardware (CPU, GPU, RAM, etc.), sendo a principal técnica responsável pelos maiores ganhos de desempenho em jogos e aplicações pesadas. Além da aplicação do overclock, o serviço também inclui a verificação e correção de overclocks inadequados ou instáveis previamente configurados no computador do cliente."
                : "The Overclocking service consists of advanced adjustments to increase hardware performance (CPU, GPU, RAM, etc.), being the main technique responsible for the greatest performance gains in games and heavy applications. In addition to applying overclocking, the service also includes verification and correction of inadequate or unstable overclocks previously configured on the client's computer.",
            subtitle2: isPortuguese
                ? "Ao optar por esse serviço, o cliente compreende e aceita os seguintes riscos e condições:"
                : "By choosing this service, the client understands and accepts the following risks and conditions:",
            items: [
                {
                    title: isPortuguese
                        ? "1. Tempo Necessário"
                        : "1. Required Time",
                    content: isPortuguese
                        ? "O processo de overclock é minucioso e personalizado, exigindo testes e ajustes específicos para cada máquina. Por isso, o tempo estimado para a conclusão do serviço varia entre 3 e 8 horas, podendo ser maior em casos de instabilidade ou necessidade de correções adicionais."
                        : "The overclocking process is thorough and personalized, requiring specific tests and adjustments for each machine. Therefore, the estimated time for service completion varies between 3 and 8 hours, and may be longer in cases of instability or need for additional corrections.",
                },
                {
                    title: isPortuguese
                        ? "2. Danos e Perda de Garantia"
                        : "2. Damage and Warranty Loss",
                    content: isPortuguese
                        ? "O overclock força os componentes a operarem além das especificações definidas pelo fabricante, o que pode causar danos físicos permanentes ou falhas, ainda que esses casos sejam raros. Essa prática pode invalidar a garantia dos componentes, conforme as regras e políticas de cada fabricante."
                        : "Overclocking forces components to operate beyond manufacturer specifications, which may cause permanent physical damage or failures, although these cases are rare. This practice may void component warranties, according to each manufacturer's rules and policies.",
                },
                {
                    title: isPortuguese
                        ? "3. Redução da Vida Útil"
                        : "3. Lifespan Reduction",
                    content: isPortuguese
                        ? "Mesmo sendo realizado com segurança e respeitando os limites adequados de temperatura e tensão, o overclock pode reduzir a vida útil dos componentes (CPU, GPU, RAM e outros)."
                        : "Even when performed safely and respecting adequate temperature and voltage limits, overclocking may reduce the lifespan of components (CPU, GPU, RAM and others).",
                },
                {
                    title: isPortuguese
                        ? "4. Estabilidade e Riscos Operacionais"
                        : "4. Stability and Operational Risks",
                    content: isPortuguese
                        ? "O overclock pode ocasionar instabilidades no sistema, como travamentos, telas azuis ou superaquecimento, especialmente durante sessões prolongadas de uso intenso ou em sistemas com resfriamento inadequado. Em casos extremos, falhas no hardware ou erros no processo podem causar a queima de componentes, sendo de inteira responsabilidade do cliente assumir esses riscos."
                        : "Overclocking may cause system instabilities, such as crashes, blue screens or overheating, especially during prolonged intensive use sessions or in systems with inadequate cooling. In extreme cases, hardware failures or process errors may cause component burning, and it is entirely the client's responsibility to assume these risks.",
                },
                {
                    title: isPortuguese
                        ? "5. Correção de Overclocks Incorretos"
                        : "5. Correction of Incorrect Overclocks",
                    content: isPortuguese
                        ? "O serviço também abrange a análise e ajuste de configurações de overclock pré-existentes. Caso sejam identificados overclocks feitos de forma incorreta ou insegura, estes serão corrigidos ou removidos, visando garantir a estabilidade e segurança do sistema."
                        : "The service also covers analysis and adjustment of pre-existing overclocking configurations. If incorrectly or unsafely done overclocks are identified, they will be corrected or removed to ensure system stability and safety.",
                },
                {
                    title: isPortuguese
                        ? "6. Responsabilidade do Cliente"
                        : "6. Client Responsibility",
                    content: isPortuguese
                        ? "O cliente declara estar plenamente ciente de todos os riscos mencionados e autoriza a execução do serviço por sua conta e risco, isentando o prestador de qualquer responsabilidade por eventuais danos ou prejuízos decorrentes do processo, durante ou após a finalização do serviço."
                        : "The client declares to be fully aware of all mentioned risks and authorizes service execution at their own risk, exempting the provider from any responsibility for eventual damages or losses resulting from the process, during or after service completion.",
                },
            ],
        },
        acceptance: isPortuguese
            ? "Ao prosseguir com qualquer serviço, o cliente confirma que leu, entendeu e concorda integralmente com todos os termos acima."
            : "By proceeding with any service, the client confirms they have read, understood and fully agree with all the above terms.",
        buttons: {
            back: isPortuguese ? "Voltar" : "Back",
            accept: isPortuguese
                ? "Li e Aceito os Termos"
                : "I Have Read and Accept the Terms",
        },
    }

    const whatsappMessage = isPortuguese
        ? "Olá! Tenho interesse na otimização de PC.%0A%0ANome:%0ATipo de PC (Gaming/Trabalho):%0APrincipal objetivo:%0AEspecificações do hardware:%0AJogos principais:%0AProblemas atuais:%0A%0AAguardo o contato!"
        : "Hello! I'm interested in PC optimization.%0A%0AName:%0APC Type (Gaming/Work):%0AMain objective:%0AHardware specifications:%0AMain games:%0ACurrent problems:%0A%0ALooking forward to hearing from you!"

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
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {content.generalTerms.title}
                            </h2>
                            <div className="space-y-6">
                                {content.generalTerms.items.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                                {item.title}
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {item.content}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Overclock Terms */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {content.overclockTerms.title}
                            </h2>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    {content.overclockTerms.subtitle}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                    {content.overclockTerms.subtitle2}
                                </p>
                            </div>
                            <div className="space-y-6">
                                {content.overclockTerms.items.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
                                        >
                                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-3">
                                                {item.title}
                                            </h3>
                                            <p className="text-red-700 dark:text-red-300 leading-relaxed">
                                                {item.content}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Final Acceptance */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                            <p className="text-blue-900 dark:text-blue-300 font-medium text-center">
                                {content.acceptance}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={`/${locale}/pc-optimization`}
                                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                {content.buttons.back}
                            </Link>
                            <a
                                href={`https://wa.me/5511993313606?text=${whatsappMessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                {content.buttons.accept}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
