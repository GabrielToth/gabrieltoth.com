import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import PricingToggle from "@/components/ui/pricing-toggle"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"
import { Metadata } from "next"
import { getEditorsTranslations } from "./editors-translations"

export const metadata: Metadata = {
    title: "Professional Video Editing Services | Gabriel Toth",
    description:
        "Professional video editing services including motion graphics, color grading, and sound design. Over 10 years of experience in content creation.",
}

export default function EditorsPage({
    params,
}: {
    params: { locale: "en" | "pt-BR" }
}) {
    const t = getEditorsTranslations(params.locale)
    const isPortuguese = params.locale === "pt-BR"

    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            {/* Hero Section */}
            <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <Badge variant="secondary" className="mb-4">
                        {t.hero.badge}
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                        {t.hero.title}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                        {t.hero.subtitle}
                    </p>
                    <Button size="lg">{t.hero.cta}</Button>

                    <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                        {t.hero.stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <p className="text-4xl font-bold">
                                    {stat.number}
                                </p>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="w-full bg-white dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">
                            {t.about.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.about.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <p className="text-lg">{t.about.intro}</p>
                        <p className="text-lg">{t.about.experience}</p>
                        <p className="text-lg">{t.about.passion}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {t.about.skills.map((skill, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center"
                            >
                                <skill.icon className="h-8 w-8 mb-2" />
                                <p>{skill.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tools Section */}
            <section className="w-full bg-gray-50 dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">
                            {t.tools.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.tools.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {t.tools.items.map((tool, index) => (
                            <Card
                                key={index}
                                className="p-6 text-center backdrop-blur-sm bg-white/50 dark:bg-gray-900/50"
                            >
                                <tool.icon className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="font-semibold mb-2">
                                    {tool.name}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {tool.description}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="w-full bg-white dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">
                            {t.services.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.services.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {t.services.items.map((service, index) => (
                            <Card key={index} className="p-6">
                                <service.icon className="h-8 w-8 mb-4" />
                                <h3 className="text-xl font-semibold mb-4">
                                    {service.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {service.description}
                                </p>
                                <ul className="space-y-2">
                                    {service.features.map(
                                        (feature, featureIndex) => (
                                            <li
                                                key={featureIndex}
                                                className="flex items-center text-sm"
                                            >
                                                <span className="mr-2">•</span>
                                                {feature}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="w-full bg-gray-50 dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">
                            {t.testimonials.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.testimonials.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {t.testimonials.items.map((testimonial, index) => (
                            <Card
                                key={index}
                                className="p-6 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50"
                            >
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map(
                                        (_, i) => (
                                            <Star
                                                key={i}
                                                className="h-5 w-5 text-yellow-400 fill-current"
                                            />
                                        )
                                    )}
                                </div>
                                <p className="text-lg mb-4">
                                    {testimonial.content}
                                </p>
                                <div>
                                    <p className="font-semibold">
                                        {testimonial.name}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="w-full bg-white dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-4">
                            {t.pricing.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            {t.pricing.subtitle}
                        </p>
                        <div className="flex justify-center mb-8">
                            <PricingToggle locale={params.locale} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {t.pricing.plans.map((plan, index) => (
                            <Card
                                key={index}
                                className={cn(
                                    "p-8",
                                    plan.popular &&
                                        "border-2 border-primary relative"
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge variant="secondary">
                                            Popular
                                        </Badge>
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-2">
                                    {plan.name}
                                </h3>
                                <div className="mb-4">
                                    <span className="text-4xl font-bold">
                                        ${plan.basePrice}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">
                                        /video
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {plan.description}
                                </p>
                                <Separator className="mb-6" />
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map(
                                        (feature, featureIndex) => (
                                            <li
                                                key={featureIndex}
                                                className="flex items-center"
                                            >
                                                <span className="mr-2">✓</span>
                                                {feature}
                                            </li>
                                        )
                                    )}
                                </ul>
                                <Button
                                    className="w-full"
                                    variant={
                                        plan.popular ? "default" : "outline"
                                    }
                                >
                                    {t.hero.cta}
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                        {t.pricing.note}
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="w-full bg-blue-600 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        {isPortuguese
                            ? "Pronto para Começar seu Projeto?"
                            : "Ready to Start Your Project?"}
                    </h2>
                    <p className="text-lg text-blue-100 mb-8">
                        {isPortuguese
                            ? "Entre em contato via WhatsApp para discutir seu projeto"
                            : "Contact us via WhatsApp to discuss your project"}
                    </p>
                    <a
                        href="https://wa.me/5511993313606"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full sm:w-auto"
                    >
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full border-white text-white bg-white hover:bg-blue-600 hover:text-white"
                        >
                            {isPortuguese
                                ? "Mensagem no WhatsApp"
                                : "Message on WhatsApp"}
                        </Button>
                    </a>
                </div>
            </section>
        </main>
    )
}
