import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface FooterProps {
    locale: Locale
}

export default async function Footer({ locale }: FooterProps) {
    const t = await getTranslations({ locale, namespace: "layout.footer" })
    const tHome = await getTranslations({ locale, namespace: "home.contact" })

    return (
        <footer className="bg-gray-900 text-white">
            {/* Data Transparency Banner */}
            <div className="bg-blue-900 py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <h4 className="text-sm font-semibold text-blue-100 mb-2">
                            {t("dataInfo.title")}
                        </h4>
                        <p className="text-xs text-blue-200">
                            {t("dataInfo.text")}
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
                                Gabriel Toth Gonçalves
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {t("companyDescription")}
                            </p>
                        </div>

                        {/* Services */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                                {t("links.services.title")}
                            </h4>
                            <ul className="space-y-2">
                                {[
                                    {
                                        name: "ViraTrend",
                                        href: `/${locale}/channel-management`,
                                    },
                                    {
                                        name: t(
                                            "links.services.items.pcOptimization"
                                        ),
                                        href: `/${locale}/pc-optimization/`,
                                    },
                                    {
                                        name: t(
                                            "links.services.items.amazonAffiliate"
                                        ),
                                        href: `/${locale}/amazon-affiliate`,
                                    },
                                    {
                                        name: t("links.services.items.iqTest"),
                                        href: `/${locale}/iq-test`,
                                    },
                                    {
                                        name: t(
                                            "links.services.items.personalityTest"
                                        ),
                                        href: `/${locale}/personality-test`,
                                    },
                                ].map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-gray-400 hover:text-white transition-colors text-sm"
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                                {t("links.legal.title")}
                            </h4>
                            <ul className="space-y-2">
                                {[
                                    {
                                        name: t("links.legal.items.privacy"),
                                        href: `/${locale}/privacy-policy`,
                                    },
                                    {
                                        name: t("links.legal.items.terms"),
                                        href: `/${locale}/terms-of-service`,
                                    },
                                ].map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-gray-400 hover:text-white transition-colors text-sm"
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                                {t("links.contact.title")}
                            </h4>
                            <ul className="space-y-2">
                                {[
                                    {
                                        name: "Email",
                                        href: `mailto:${tHome("contactEmail")}`,
                                        external: true,
                                    },
                                    {
                                        name: "WhatsApp",
                                        href: "https://wa.me/5511993313606",
                                        external: true,
                                    },
                                    {
                                        name: t(
                                            "links.contact.items.workAsEditor"
                                        ),
                                        href: `/${locale}/editors/`,
                                        external: false,
                                    },
                                ].map((item, index) => (
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
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-12 pt-8 border-t border-gray-800">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm">
                                © 2025 Gabriel Toth Gonçalves. {t("rights")}
                            </p>
                            <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-500">
                                <Link
                                    href={`/${locale}/privacy-policy`}
                                    className="hover:text-gray-300"
                                >
                                    {t("short.privacy")}
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${locale}/terms-of-service`}
                                    className="hover:text-gray-300"
                                >
                                    {t("short.terms")}
                                </Link>
                                <span>•</span>
                                <span>{t("short.secureData")}</span>
                                <span>•</span>
                                <span>{t("short.openSource")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
