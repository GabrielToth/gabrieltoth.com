"use client"

import { Button } from "@/components/ui/button"
import LanguageSelector from "@/components/ui/language-selector"
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
import { useCalculatePrice } from "./channel-management-calculate-price"
import { ChannelManagementLandingProps } from "./channel-management-types"
import { generateWhatsAppMessage } from "./channel-management-whatsapp-message"
// ✅ MIGRATED: Now using translations/ folder with JSON + icon injection
import {
    ChannelManagementTranslations,
    getChannelManagementTranslations,
} from "./translations"

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
const HeroSection = ({
    t,
    locale,
}: {
    t: ChannelManagementTranslations
    locale: Locale
}) => {
    return (
        <section className="relative py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-block mb-6">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-semibold px-4 py-2 rounded-full">
                        {t.hero.badge}
                    </span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                    {t.hero.title}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                    {t.hero.subtitle}
                </p>

                <a
                    href={generateWhatsAppMessage(t.hero.cta, 0, false, locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
                >
                    <MessageCircle className="mr-2" size={20} />
                    {t.hero.cta}
                </a>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                    {t.hero.stats.map((stat, index) => (
                        <div
                            key={index}
                            className="text-center bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
                        >
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                {stat.number}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// About Section Component
const AboutSection = ({ t }: { t: ChannelManagementTranslations }) => {
    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                            {t.personalAbout.title}
                        </h2>
                        <p className="text-lg text-blue-600 dark:text-blue-400 mb-6 font-medium">
                            {t.personalAbout.description}
                        </p>
                        <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                            <p>{t.personalAbout.intro}</p>
                            <p>{t.personalAbout.experience}</p>
                            <p>{t.personalAbout.passion}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {t.personalAbout.skills.map(
                            (skill: string, index: number) => {
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
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center"
                                    >
                                        <IconComponent className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {skill}
                                        </h3>
                                    </div>
                                )
                            }
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

// Problems Section Component
const ProblemsSection = ({ t }: { t: ChannelManagementTranslations }) => {
    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.problems.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        {t.problems.subtitle}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {t.problems.items.map(
                        (problem: ProblemItem, index: number) => {
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
                                    className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg text-center"
                                >
                                    <IconComponent className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                                        {problem.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                        {problem.description}
                                    </p>
                                </div>
                            )
                        }
                    )}
                </div>
            </div>
        </section>
    )
}

// Services Section Component
const ServicesSection = ({ t }: { t: ChannelManagementTranslations }) => {
    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.services.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        {t.services.subtitle}
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {t.services.items.map(
                        (service: ServiceItem, index: number) => {
                            const icons = [BarChart3, Video, DollarSign, Target]
                            const IconComponent = icons[index] || BarChart3
                            return (
                                <div
                                    key={index}
                                    className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg"
                                >
                                    <IconComponent className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-6" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                        {service.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                                        {service.description}
                                    </p>
                                    <ul className="space-y-2">
                                        {service.features.map(
                                            (feature: string, idx: number) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-center text-gray-600 dark:text-gray-300"
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
                        }
                    )}
                </div>
            </div>
        </section>
    )
}

// Results Section Component
const ResultsSection = ({ t }: { t: ChannelManagementTranslations }) => {
    return (
        <section className="py-20 bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.results.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        {t.results.subtitle}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {t.results.items.map((result, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
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
                            <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                                {result.role}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
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
const TestimonialsSection = ({ t }: { t: ChannelManagementTranslations }) => {
    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        {t.testimonials.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        {t.testimonials.subtitle}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {t.testimonials.items.map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg backdrop-blur-sm"
                        >
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {testimonial.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
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
                            <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
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
    t,
    locale,
    calculatePrice,
}: {
    t: ChannelManagementTranslations
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
    return (
        <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.pricing.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        {t.pricing.subtitle}
                    </p>
                </div>
                <PricingToggle locale={locale} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {t.pricing.plans.map((plan, index) => {
                        const pricing = calculatePrice(plan.basePrice)
                        return (
                            <div
                                key={index}
                                className={`bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg relative ${
                                    plan.popular
                                        ? "border-2 border-blue-500 transform scale-105"
                                        : ""
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                            {locale === "pt-BR"
                                                ? "Mais Popular"
                                                : "Most Popular"}
                                        </span>
                                    </div>
                                )}

                                {/* Monero Discount Badge */}
                                {pricing.isMonero && (
                                    <div className="absolute -top-2 -right-2">
                                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Percent className="w-3 h-3" />
                                            50% OFF
                                        </div>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                            {pricing.currency}{" "}
                                            {pricing.displayPrice}
                                        </span>
                                        {pricing.isMonero &&
                                            pricing.originalPrice &&
                                            pricing.originalPrice !==
                                                pricing.displayPrice && (
                                                <span className="text-lg text-gray-500 line-through">
                                                    {pricing.currency}{" "}
                                                    {pricing.originalPrice}
                                                </span>
                                            )}
                                    </div>
                                    {pricing.isMonero && (
                                        <div className="text-orange-400 text-sm font-medium">
                                            💰 Preço com Monero (XMR)
                                        </div>
                                    )}
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {plan.description}
                                    </p>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => {
                                        const isEditingFeature =
                                            feature.startsWith(
                                                locale === "pt-BR"
                                                    ? "Edição inclusa:"
                                                    : "Editing included:"
                                            )
                                        return (
                                            <li
                                                key={idx}
                                                className="flex flex-col items-start text-gray-600 dark:text-gray-300"
                                            >
                                                <span className="flex items-center">
                                                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                                    {feature}
                                                </span>
                                                {isEditingFeature &&
                                                    plan.editingNote && (
                                                        <span className="ml-8 text-xs italic text-gray-500 dark:text-gray-400 mt-1">
                                                            {plan.editingNote}
                                                        </span>
                                                    )}
                                            </li>
                                        )
                                    })}
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
                                    className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center block"
                                >
                                    {locale === "pt-BR"
                                        ? "Contratar Agora"
                                        : "Get Started"}
                                </a>
                            </div>
                        )
                    })}
                </div>
                {/* Observação sobre edição */}
                <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    {t.pricing.note}
                </div>
            </div>
        </section>
    )
}

// Editor Section Component
const EditorSection = ({ locale }: { locale: Locale }) => {
    const defaultTitle =
        locale === "pt-BR"
            ? "Pronto para Acelerar seu Crescimento?"
            : "Ready to Accelerate Your Growth?"
    const defaultSubtitle =
        locale === "pt-BR"
            ? "Entre em contato via WhatsApp para alinhar expectativas"
            : "Contact us via WhatsApp to align expectations"
    const defaultWhatsappText =
        locale === "pt-BR"
            ? "Saiba mais"
            : locale === "es"
              ? "Saber más"
              : locale === "de"
                ? "Mehr erfahren"
                : "Learn more"
    const alternativeText =
        locale === "pt-BR" ? "Trabalhar como Editor" : "Work as Editor"

    return (
        <section className="w-full bg-blue-600 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                    {defaultTitle}
                </h2>
                <p className="text-lg text-blue-100 mb-8">{defaultSubtitle}</p>
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
                            className="w-full border-white text-blue-600 bg-white hover:bg-blue-600 hover:text-white"
                        >
                            {defaultWhatsappText}
                        </Button>
                    </a>
                    <a href={`/${locale}/editors`} className="w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
                        >
                            {alternativeText}
                        </Button>
                    </a>
                </div>
            </div>
        </section>
    )
}

// Main Component
const ChannelManagementView = ({ locale }: ChannelManagementLandingProps) => {
    const t = getChannelManagementTranslations(locale)
    const { calculatePrice } = useCalculatePrice(locale)

    return (
        <main className="flex min-h-screen flex-col">
            {/* Language Selector */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                    <LanguageSelector variant="default" />
                </div>
            </div>

            {/* Page Sections */}
            <HeroSection t={t} locale={locale} />
            <AboutSection t={t} />
            <ProblemsSection t={t} />
            <ServicesSection t={t} />
            <ResultsSection t={t} />
            <TestimonialsSection t={t} />
            <PricingSection
                t={t}
                locale={locale}
                calculatePrice={calculatePrice}
            />
            <EditorSection locale={locale} />
        </main>
    )
}

export default ChannelManagementView
