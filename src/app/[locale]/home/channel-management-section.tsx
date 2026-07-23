import { type Locale } from "@/lib/i18n"
import { BarChart3, Play, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

interface ChannelManagementSectionProps {
    params: { locale: Locale }
}

export default function ChannelManagementSection({
    params: { locale },
}: ChannelManagementSectionProps) {
    const t = useTranslations("home")
    const tCM = useTranslations("channelManagement")

    /* c8 ignore start */
    return (
        <section
            id="channel-management"
            className="py-24 bg-gradient-to-br from-primary/5 to-primary/5 dark:from-primary/10 dark:to-blue-900/20"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary text-sm font-medium mb-8">
                        🚀 {tCM("hero.badge")}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-foreground mb-4">
                        <span className="text-foreground">
                            ViraTrend
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground dark:text-foreground max-w-2xl mx-auto mb-8">
                        {t("channelManagement.subtitle")}
                    </p>
                    <p className="text-foreground dark:text-foreground max-w-4xl mx-auto leading-relaxed">
                        {t("channelManagement.description")}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {t.raw("channelManagement.stats").map((stat: { value: string; label: string }, index: number) => (
                        <div
                            key={index}
                            className="text-center bg-card dark:bg-background rounded-2xl p-8 shadow-lg"
                        >
                            <div className="text-3xl font-bold text-primary dark:text-primary mb-2">
                                {stat.value}
                            </div>
                            <div className="text-muted-foreground dark:text-foreground">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Features */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-center text-foreground dark:text-foreground mb-12">
                        {t("channelManagement.features.title")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-card dark:bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-primary/10 dark:bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <BarChart3 className="w-6 h-6 text-primary dark:text-primary" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                                {t("channelManagement.features.analytics.title")}
                            </h4>
                            <p className="text-muted-foreground dark:text-foreground text-sm">
                                {t("channelManagement.features.analytics.description")}
                            </p>
                        </div>

                        <div className="bg-card dark:bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <Play className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                                {t("channelManagement.features.optimization.title")}
                            </h4>
                            <p className="text-muted-foreground dark:text-foreground text-sm">
                                {t("channelManagement.features.optimization.description")}
                            </p>
                        </div>

                        <div className="bg-card dark:bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6 text-primary dark:text-purple-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                                {t("channelManagement.features.growth.title")}
                            </h4>
                            <p className="text-muted-foreground dark:text-foreground text-sm">
                                {t("channelManagement.features.growth.description")}
                            </p>
                        </div>

                        <div className="bg-card dark:bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-yellow-100 dark:bg-yellow-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                                {t("channelManagement.features.monetization.title")}
                            </h4>
                            <p className="text-muted-foreground dark:text-foreground text-sm">
                                {t("channelManagement.features.monetization.description")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-center text-foreground dark:text-foreground mb-4">
                        {t("channelManagement.results.title")}
                    </h3>
                    <p className="text-center text-muted-foreground dark:text-foreground mb-12">
                        {t("channelManagement.results.subtitle")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {t.raw("channelManagement.results.cases").map((caseStudy: { channel: string; description: string; metrics: { label: string; value: string }[] }, index: number) => (
                            <div
                                key={index}
                                className="bg-card dark:bg-background rounded-2xl p-8 shadow-lg"
                            >
                                <h4 className="text-xl font-bold text-foreground dark:text-foreground mb-2">
                                    {caseStudy.channel}
                                </h4>
                                <p className="text-muted-foreground dark:text-foreground text-sm mb-6">
                                    {caseStudy.description}
                                </p>

                                <div className="grid grid-cols-3 gap-4">
                                    {caseStudy.metrics.map((metric, idx) => (
                                        <div key={idx} className="text-center">
                                            <div className="text-2xl font-bold text-primary dark:text-primary mb-1">
                                                {metric.value}
                                            </div>
                                            <div className="text-sm text-muted-foreground dark:text-foreground">
                                                {metric.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-foreground dark:text-foreground mb-4">
                        {t("channelManagement.cta.title")}
                    </h3>
                    <p className="text-muted-foreground dark:text-foreground mb-8 max-w-2xl mx-auto">
                        {t("channelManagement.cta.description")}
                    </p>
                    <Link
                        href={`/${locale}/channel-management`}
                        className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary transition-colors font-medium text-lg"
                    >
                        <Users size={20} />
                        <span>{t("channelManagement.cta.button")}</span>
                    </Link>
                </div>
            </div>
        </section>
    )
    /* c8 ignore stop */
}
