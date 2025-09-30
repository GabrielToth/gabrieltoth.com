"use client"

import LanguageSelectorWrapper from "@/components/layout/language-selector-wrapper"
import PricingToggle from "@/components/ui/pricing-toggle"
import { useMoneroPricing } from "@/hooks/use-monero-pricing"
import { type Locale } from "@/lib/i18n"
import {
    CheckCircle,
    Cpu,
    Gamepad2,
    Monitor,
    Shield,
    Star,
    Zap,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { generatePCOptimizationWhatsAppMessage } from "./pc-optimization-whatsapp"

interface PCOptimizationViewProps {
    locale: Locale
}

export default function PCOptimizationView({
    locale,
}: PCOptimizationViewProps) {
    const t = useTranslations("pcOptimization")
    const { calculatePrice } = useMoneroPricing()
    const heroStats = t.raw("hero.stats") as Array<{
        value: string
        label: string
    }>
    const featuresList = t.raw("features.list") as Array<{
        title: string
        description: string
    }>
    const pricingPlans = t.raw("pricing.plans") as Array<{
        name: string
        basePrice: number
        description: string
        features: string[]
        popular?: boolean
    }>
    const testimonialsList = t.raw("testimonials.items") as Array<{
        name: string
        role: string
        content: string
        rating: number
    }>

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Language Selector */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                    <LanguageSelectorWrapper
                        variant="default"
                        includeThemeToggle={true}
                    />
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-black"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 mb-8">
                        <Zap className="w-4 h-4 mr-2 text-blue-400" />
                        <span className="text-blue-300 text-sm font-medium">
                            {t("hero.badge")}
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                        {t("hero.title")}
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                        {t("hero.subtitle")}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <a
                            href="#pricing"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                        >
                            {t("hero.cta")}
                        </a>
                        <a
                            href={generatePCOptimizationWhatsAppMessage(locale)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 border border-gray-600 hover:border-gray-400 rounded-lg font-semibold text-lg transition-all duration-300"
                        >
                            {t("hero.learnMore")}
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {heroStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-black text-blue-400 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-400 text-sm">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll Animation */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gradient-to-b from-black to-gray-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {t("features.title")}
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            {t("features.subtitle")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {featuresList.map((feature, index) => {
                            const iconMap = [Cpu, Gamepad2, Monitor, Shield]
                            const IconComponent = iconMap[index] || Cpu
                            return (
                                <div
                                    key={index}
                                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                                        <IconComponent className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section
                id="pricing"
                className="py-24 bg-gradient-to-b from-gray-900 to-black"
            >
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {t("pricing.title")}
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            {t("pricing.subtitle")}
                        </p>
                    </div>

                    {/* Pricing Toggle */}
                    <PricingToggle locale={locale} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {pricingPlans.map((plan, index) => {
                            const pricing = calculatePrice(
                                plan.basePrice,
                                locale
                            )
                            return (
                                <div
                                    key={index}
                                    className={`relative bg-gray-800/50 backdrop-blur-sm border rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300 ${
                                        plan.popular
                                            ? "border-blue-500 shadow-2xl shadow-blue-500/20"
                                            : "border-gray-700"
                                    }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                                                {t("pricing.popular")}
                                            </div>
                                        </div>
                                    )}

                                    {/* Monero Discount Badge */}
                                    {pricing.isMonero &&
                                        pricing.discount > 0 && (
                                            <div className="absolute -top-2 -right-2">
                                                <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                                    -{pricing.discount}%
                                                </div>
                                            </div>
                                        )}

                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-white mb-4">
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            {pricing.originalPrice && (
                                                <span className="text-lg text-gray-500 line-through">
                                                    {pricing.currency}{" "}
                                                    {pricing.originalPrice}
                                                </span>
                                            )}
                                            <span className="text-4xl font-black text-blue-400">
                                                {pricing.currency}{" "}
                                                {pricing.displayPrice}
                                            </span>
                                        </div>
                                        <p className="text-gray-400">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-center gap-3"
                                            >
                                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                <span className="text-gray-300">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                                            plan.popular
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                        }`}
                                    >
                                        {t("pricing.cta")}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-gradient-to-b from-black to-gray-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {t("testimonials.title")}
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            {t("testimonials.subtitle")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {testimonialsList.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
                            >
                                <div className="flex items-center mb-4">
                                    {[...Array(testimonial.rating)].map(
                                        (_, i) => (
                                            <Star
                                                key={i}
                                                className="w-5 h-5 text-yellow-400 fill-current"
                                            />
                                        )
                                    )}
                                </div>
                                <p className="text-gray-300 mb-4 leading-relaxed">
                                    "{testimonial.content}"
                                </p>
                                <div>
                                    <div className="font-bold text-white">
                                        {testimonial.name}
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        {testimonial.role}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-blue-900 to-purple-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
                        {t("cta.title")}
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        {t("cta.subtitle")}
                    </p>
                    <a
                        href={generatePCOptimizationWhatsAppMessage(locale)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-8 py-4 bg-white text-blue-900 hover:bg-gray-100 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                    >
                        {t("cta.button")}
                    </a>
                </div>
            </section>

            <style jsx>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }
                @keyframes marquee-slow {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-200%);
                    }
                }
                .animate-marquee {
                    animation: marquee 10s linear infinite;
                }
                .animate-marquee-slow {
                    animation: marquee-slow 15s linear infinite;
                }
            `}</style>
        </div>
    )
}
