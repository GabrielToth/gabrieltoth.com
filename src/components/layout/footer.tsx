import { type Locale } from "@/lib/i18n"
import Link from "next/link"

interface FooterProps {
    locale: Locale
}

export default function Footer({ locale }: FooterProps) {
    const isPortuguese = locale === "pt-BR"

    const content = {
        company: "Gabriel Toth Gonçalves",
        rights: isPortuguese
            ? "Todos os direitos reservados."
            : "All rights reserved.",
        links: {
            services: {
                title: isPortuguese ? "Serviços" : "Services",
                items: [
                    {
                        name: isPortuguese ? "ViraTrend" : "ViraTrend",
                        href: `/${locale}/channel-management`,
                    },
                    {
                        name: isPortuguese
                            ? "Otimização de PC"
                            : "PC Optimization",
                        href: `/${locale}/pc-optimization`,
                    },
                    {
                        name: isPortuguese
                            ? "Trabalhe Como Editor"
                            : "Work as Editor",
                        href: `/${locale}/editors`,
                    },
                    {
                        name: isPortuguese ? "Investimentos" : "Investments",
                        href: `/${locale}/investments`,
                    },
                ],
            },
            legal: {
                title: isPortuguese ? "Jurídico" : "Legal",
                items: [
                    {
                        name: isPortuguese
                            ? "Política de Privacidade"
                            : "Privacy Policy",
                        href: `/${locale}/privacy-policy`,
                    },
                    {
                        name: isPortuguese
                            ? "Termos de Serviço"
                            : "Terms of Service",
                        href: `/${locale}/terms-of-service`,
                    },
                ],
            },
            contact: {
                title: isPortuguese ? "Contato" : "Contact",
                items: [
                    {
                        name: "Email",
                        href: "mailto:gabrieltothgoncalves@gmail.com",
                        external: true,
                    },
                    {
                        name: "WhatsApp",
                        href: "https://wa.me/5511993313606",
                        external: true,
                    },
                ],
            },
        },
        dataInfo: {
            title: isPortuguese
                ? "Transparência de Dados"
                : "Data Transparency",
            text: isPortuguese
                ? "Coletamos apenas dados essenciais para prestação de serviços: informações de contato, dados do canal e comunicações. Não vendemos ou compartilhamos seus dados."
                : "We only collect essential data for service provision: contact information, channel data and communications. We do not sell or share your data.",
        },
    }

    return (
        <footer className="bg-gray-900 text-white">
            {/* Data Transparency Banner */}
            <div className="bg-blue-900 py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <h4 className="text-sm font-semibold text-blue-100 mb-2">
                            {content.dataInfo.title}
                        </h4>
                        <p className="text-xs text-blue-200">
                            {content.dataInfo.text}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Company Info */}
                        <div className="col-span-1 md:col-span-1">
                            <h3 className="text-lg font-bold mb-4">
                                {content.company}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {isPortuguese
                                    ? "Desenvolvedor Full Stack especializado em soluções digitais inovadoras e consultoria em canais."
                                    : "Full Stack Developer specialized in innovative digital solutions and channel consulting."}
                            </p>
                        </div>

                        {/* Services */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                                {content.links.services.title}
                            </h4>
                            <ul className="space-y-2">
                                {content.links.services.items.map(
                                    (item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-gray-400 hover:text-white transition-colors text-sm"
                                            >
                                                {item.name}
                                            </Link>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                                {content.links.legal.title}
                            </h4>
                            <ul className="space-y-2">
                                {content.links.legal.items.map(
                                    (item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-gray-400 hover:text-white transition-colors text-sm"
                                            >
                                                {item.name}
                                            </Link>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                                {content.links.contact.title}
                            </h4>
                            <ul className="space-y-2">
                                {content.links.contact.items.map(
                                    (item, index) => (
                                        <li key={index}>
                                            {item.external ? (
                                                <a
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                                >
                                                    {item.name}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                                >
                                                    {item.name}
                                                </Link>
                                            )}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-12 pt-8 border-t border-gray-800">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm">
                                © 2025 {content.company}. {content.rights}
                            </p>
                            <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-500">
                                <Link
                                    href={`/${locale}/privacy-policy`}
                                    className="hover:text-gray-300"
                                >
                                    {isPortuguese ? "Privacidade" : "Privacy"}
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${locale}/terms-of-service`}
                                    className="hover:text-gray-300"
                                >
                                    {isPortuguese ? "Termos" : "Terms"}
                                </Link>
                                <span>•</span>
                                <span>
                                    {isPortuguese
                                        ? "Dados seguros"
                                        : "Secure data"}
                                </span>
                                <span>•</span>
                                <span>
                                    {isPortuguese
                                        ? "Código aberto • Totalmente público"
                                        : "Open source • Fully public"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
