"use client"

import PCOptimizationHero from "./pc-optimization-hero"
import PricingToggle from "@/components/ui/pricing-toggle"
import { useMoneroPricing } from "@/hooks/use-monero-pricing"
import { type Locale } from "@/lib/i18n"
import { CheckCircle, Cpu, Gamepad2, Monitor, Shield, Star } from "lucide-react"
import { useTranslations } from "next-intl"
import { generatePCOptimizationWhatsAppMessage } from "./pc-optimization-whatsapp"

interface PCOptimizationViewProps {
    locale: Locale
}

export default function PCOptimizationView({
    locale,
}: PCOptimizationViewProps) {
    const t = useTranslations("pcOptimization")
    const tw = useTranslations("pcOptimizationWhatsapp")
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
        <div className="min-h-screen bg-background text-foreground overflow-hidden">
            {/* Hero Section */}
            <section className="relative">
                <PCOptimizationHero locale={locale} />

                {/* Stats */}
                <div className="relative z-20 -mt-20 max-w-4xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {heroStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-black text-primary mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-primary">
                            {t("features.title")}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                                    className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
                                >
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                        <IconComponent className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-foreground">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-primary">
                            {t("pricing.title")}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                                    className={`relative bg-card border rounded-2xl p-8 transition-all duration-300 ${
                                        plan.popular
                                            ? "border-primary shadow-2xl shadow-primary/10"
                                            : "border-border"
                                    }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
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
                                        <h3 className="text-2xl font-bold text-foreground mb-4">
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            {pricing.originalPrice && (
                                                <span className="text-lg text-muted-foreground line-through">
                                                    {pricing.currency}{" "}
                                                    {pricing.originalPrice}
                                                </span>
                                            )}
                                            <span className="text-4xl font-black text-primary">
                                                {pricing.currency}{" "}
                                                {pricing.displayPrice}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground">
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
                                                <span className="text-muted-foreground">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`w-full py-3 rounded-full font-semibold transition-colors ${
                                            plan.popular
                                                ? "bg-primary text-primary-foreground hover:bg-primary"
                                                : "bg-muted hover:bg-accent/20 text-muted-foreground"
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
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-primary">
                            {t("testimonials.title")}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            {t("testimonials.subtitle")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {testimonialsList.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-card border border-border rounded-xl p-6"
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
                                <p className="text-muted-foreground mb-4 leading-relaxed">
                                    "{testimonial.content}"
                                </p>
                                <div>
                                    <div className="font-bold text-foreground">
                                        {testimonial.name}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                        {testimonial.role}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-primary">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-primary-foreground">
                        {t("cta.title")}
                    </h2>
                    <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                        {t("cta.subtitle")}
                    </p>
                    <a
                        href={generatePCOptimizationWhatsAppMessage(
                            tw("message")
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-8 py-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full font-semibold text-lg transition-colors"
                    >
                        {t("cta.button")}
                    </a>
                </div>
            </section>
        </div>
    )
}