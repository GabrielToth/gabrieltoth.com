"use client"

import LanguageSelectorWrapper from "@/components/layout/language-selector-wrapper"
import PageHeader from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import PricingToggle from "@/components/ui/pricing-toggle"
import { type Locale } from "@/lib/i18n"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import {
    BarChart3,
    CheckCircle,
    DollarSign,
    MessageCircle,
    Percent,
    Star,
    Target,
    TrendingUp,
    Video,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useCalculatePrice } from "./channel-management-calculate-price"
import { ChannelManagementLandingProps } from "./channel-management-types"
import { generateWhatsAppMessage } from "./channel-management-whatsapp-message"

// Internal types for consistency
interface ProblemItem {
    title: string
    description: string
}

interface ServiceItem {
    title: string
    description: string
    features: string[]
    price: number
}

// Hero Section Component
const HeroSection = ({ locale }: { locale: Locale }) => {
    const t = useTranslations("channelManagement")
    const stats = t.raw("hero.stats") as Array<{
        number: string
        label: string
    }>
    return (
        <>
            <PageHeader
                eyebrow={t("hero.badge")}
                title={t("hero.title")}
                subtitle={t("hero.subtitle")}
            >
                <div className="mt-8">
                    <a
                        href={generateWhatsAppMessage(
                            t("hero.cta"),
                            0,
                            false,
                            locale
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-full font-semibold hover:bg-primary transition-colors text-lg"
                    >
                        <MessageCircle className="mr-2" size={20} />
                        {t("hero.cta")}
                    </a>
                </div>
            </PageHeader>

            {/* Stats - outside PageHeader for more spacing */}
            <div className="w-full pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="text-center bg-card rounded-lg p-6 shadow-lg"
                            >
                                <div className="text-3xl font-bold text-primary dark:text-primary mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-muted-foreground dark:text-foreground">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

// About Section Component
const AboutSection = () => {
    const t = useTranslations("channelManagement")
    const skills = t.raw("personalAbout.skills") as string[]
    return (
        <section className="py-20 bg-muted dark:bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-6">
                            {t("personalAbout.title")}
                        </h2>
                        <p className="text-lg text-primary dark:text-primary mb-6 font-medium">
                            {t("personalAbout.description")}
                        </p>
                        <div className="space-y-4 text-muted-foreground dark:text-foreground leading-relaxed">
                            <p>{t("personalAbout.intro")}</p>
                            <p>{t("personalAbout.experience")}</p>
                            <p>{t("personalAbout.passion")}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {skills.map((skill: string, index: number) => {
                            const icons = [
                                BarChart3,
                                Video,
                                DollarSign,
                                TrendingUp,
                                SiYoutube,
                                Target,
                            ]
                            const IconComponent = icons[index] || BarChart3
                            return (
                                <div
                                    key={index}
                                    className="bg-card rounded-lg p-6 shadow-lg text-center"
                                >
                                    <IconComponent className="w-10 h-10 text-primary dark:text-primary mx-auto mb-4" />
                                    <h3 className="font-semibold text-foreground dark:text-foreground">
                                        {skill}
                                    </h3>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

// Problems Section Component
const ProblemsSection = () => {
    const t = useTranslations("channelManagement")
    const items = t.raw("problems.items") as Array<ProblemItem>
    return (
        <section className="py-20 bg-muted dark:bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                        {t("problems.title")}
                    </h2>
                    <p className="text-xl text-muted-foreground dark:text-foreground">
                        {t("problems.subtitle")}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((problem: ProblemItem, index: number) => {
                        const icons = [
                            TrendingUp,
                            BarChart3,
                            DollarSign,
                            Target,
                        ]
                        const IconComponent = icons[index] || TrendingUp
                        return (
                            <div
                                key={index}
                                className="bg-card dark:bg-background rounded-lg p-6 shadow-lg text-center"
                            >
                                <IconComponent className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <h3 className="font-bold text-foreground dark:text-foreground mb-3">
                                    {problem.title}
                                </h3>
                                <p className="text-muted-foreground dark:text-foreground text-sm">
                                    {problem.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// Services Section Component
const ServicesSection = () => {
    const t = useTranslations("channelManagement")
    const items = t.raw("services.items") as Array<ServiceItem>
    return (
        <section className="py-20 bg-muted dark:bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                        {t("services.title")}
                    </h2>
                    <p className="text-xl text-muted-foreground dark:text-foreground">
                        {t("services.subtitle")}
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {items.map((service: ServiceItem, index: number) => {
                        const icons = [BarChart3, Video, DollarSign, Target]
                        const IconComponent = icons[index] || BarChart3
                        return (
                            <div
                                key={index}
                                className="bg-card rounded-lg p-8 shadow-lg"
                            >
                                <IconComponent className="w-12 h-12 text-primary dark:text-primary mb-6" />
                                <h3 className="text-xl font-bold text-foreground dark:text-foreground mb-4">
                                    {service.title}
                                </h3>
                                <p className="text-muted-foreground dark:text-foreground mb-6">
                                    {service.description}
                                </p>
                                <ul className="space-y-2">
                                    {service.features.map(
                                        (feature: string, idx: number) => (
                                            <li
                                                key={idx}
                                                className="flex items-center text-muted-foreground dark:text-foreground"
                                            >
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                <span className="text-sm">
                                                    {feature}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// Results Section Component
const ResultsSection = () => {
    const t = useTranslations("channelManagement")
    const items = t.raw("results.items") as Array<{
        name: string
        role: string
        content: string
        rating: number
    }>
    return (
        <section className="py-20 bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                        {t("results.title")}
                    </h2>
                    <p className="text-xl text-muted-foreground dark:text-foreground">
                        {t("results.subtitle")}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {items.map((result, index) => (
                        <div
                            key={index}
                            className="bg-muted dark:bg-background rounded-lg p-8 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-foreground dark:text-foreground">
                                    {result.name}
                                </h3>
                                <div className="flex">
                                    {[...Array(result.rating)].map(
                                        (_, starIdx) => (
                                            <Star
                                                key={starIdx}
                                                className="w-5 h-5 text-yellow-400 fill-current"
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                            <p className="text-primary dark:text-primary font-medium mb-3">
                                {result.role}
                            </p>
                            <p className="text-foreground dark:text-foreground mb-6 leading-relaxed">
                                "{result.content}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Testimonials Section Component
const TestimonialsSection = () => {
    const t = useTranslations("channelManagement")
    const items = t.raw("testimonials.items") as Array<{
        name: string
        role: string
        content: string
        rating: number
    }>
    return (
        <section className="py-20 bg-muted dark:bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                        {t("testimonials.title")}
                    </h2>
                    <p className="text-xl text-muted-foreground dark:text-foreground">
                        {t("testimonials.subtitle")}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {items.map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-card rounded-lg p-8 shadow-lg backdrop-blur-sm"
                        >
                            <div>
                                <div className="font-semibold text-foreground dark:text-foreground">
                                    {testimonial.name}
                                </div>
                                <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                                    {testimonial.role}
                                </div>
                            </div>
                            <div className="flex items-center mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-5 h-5 text-yellow-400 fill-current"
                                    />
                                ))}
                            </div>
                            <p className="text-foreground dark:text-foreground mb-6 italic">
                                {testimonial.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Pricing Section Component
const PricingSection = ({
    locale,
    calculatePrice,
}: {
    locale: Locale
    calculatePrice: (basePrice: number) => {
        current: number
        original: number | null
        currency: string
        displayPrice: string
        originalPrice: string | undefined
        isMonero: boolean
    }
}) => {
    const t = useTranslations("channelManagement")
    const plans = t.raw("pricing.plans") as Array<{
        name: string
        basePrice: number
        description: string
        features: string[]
        popular?: boolean
    }>
    return (
        <section id="pricing" className="py-20 bg-muted dark:bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                        {t("pricing.title")}
                    </h2>
                    <p className="text-xl text-muted-foreground dark:text-foreground">
                        {t("pricing.subtitle")}
                    </p>
                </div>
                <PricingToggle locale={locale} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {plans.map((plan, index) => {
                        const pricing = calculatePrice(plan.basePrice)
                        return (
                            <div
                                key={index}
                                className={`bg-card dark:bg-background rounded-lg p-8 shadow-lg relative ${
                                    plan.popular
                                        ? "border-2 border-primary transform scale-105"
                                        : ""
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-primary/50 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                            {t("pricing.mostPopular")}
                                        </span>
                                    </div>
                                )}

                                {/* Monero Discount Badge */}
                                {pricing.isMonero && (
                                    <div className="absolute -top-2 -right-2">
                                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Percent className="w-3 h-3" />
                                            {t("moneroToggle.enabled")
                                                .replace(/^[^\(]*\(/, "")
                                                .replace(/\).*$/, "% OFF")}
                                        </div>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-foreground dark:text-foreground mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className="text-3xl font-bold text-primary dark:text-primary">
                                            {pricing.currency}{" "}
                                            {pricing.displayPrice}
                                        </span>
                                        {pricing.isMonero &&
                                            pricing.originalPrice &&
                                            pricing.originalPrice !==
                                                pricing.displayPrice && (
                                                <span className="text-lg text-muted-foreground line-through">
                                                    {pricing.currency}{" "}
                                                    {pricing.originalPrice}
                                                </span>
                                            )}
                                    </div>
                                    {pricing.isMonero && (
                                        <div className="text-orange-400 text-sm font-medium">
                                            {t("moneroToggle.title").replace(
                                                "Pricing",
                                                ""
                                            )}
                                        </div>
                                    )}
                                    <p className="text-muted-foreground dark:text-foreground">
                                        {plan.description}
                                    </p>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map(
                                        (feature: string, idx: number) => (
                                            <li
                                                key={idx}
                                                className="flex flex-col items-start text-muted-foreground dark:text-foreground"
                                            >
                                                <span className="flex items-center">
                                                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                                    {feature}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>
                                <a
                                    href={generateWhatsAppMessage(
                                        plan.name,
                                        pricing.current,
                                        pricing.isMonero,
                                        locale
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 px-6 bg-primary text-white rounded-full font-semibold hover:bg-primary transition-colors text-center block"
                                >
                                    {t("pricing.cta")}
                                </a>
                            </div>
                        )
                    })}
                </div>
                {/* Observação sobre edição */}
                <div className="mt-8 text-center text-sm text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
                    {t("pricing.note")}
                </div>
            </div>
        </section>
    )
}

// Editor Section Component
const EditorSection = ({ locale }: { locale: Locale }) => {
    const t = useTranslations("channelManagement")

    return (
        <section className="w-full bg-primary py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                    {t("editorCta.title")}
                </h2>
                <p className="text-lg text-blue-100 mb-8">
                    {t("editorCta.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href="https://wa.me/5511993313606"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto"
                    >
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full border-white text-primary bg-white hover:bg-primary hover:text-white"
                        >
                            {t("editorCta.more")}
                        </Button>
                    </a>
                    <a href={`/${locale}/editors`} className="w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full bg-transparent border-white text-white hover:bg-white hover:text-primary"
                        >
                            {t("editorCta.workAsEditor")}
                        </Button>
                    </a>
                </div>
            </div>
        </section>
    )
}

// Main Component
const ChannelManagementView = ({ locale }: ChannelManagementLandingProps) => {
    const { calculatePrice } = useCalculatePrice(locale)

    return (
        <main className="flex min-h-screen flex-col">
            {/* Language Selector */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-white/90 dark:bg-card/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                    <LanguageSelectorWrapper
                        variant="default"
                        includeThemeToggle={true}
                    />
                </div>
            </div>

            {/* Page Sections */}
            <HeroSection locale={locale} />
            <AboutSection />
            <ProblemsSection />
            <ServicesSection />
            <ResultsSection />
            <TestimonialsSection />
            <PricingSection locale={locale} calculatePrice={calculatePrice} />
            <EditorSection locale={locale} />
        </main>
    )
}

export default ChannelManagementView
