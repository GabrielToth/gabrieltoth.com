"use client"

import { BenefitCard } from "@/components/editors/benefit-card"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import LanguageSelector from "@/components/ui/language-selector"
import WhatsAppButton from "@/components/ui/whatsapp-button"
import { type SectionProps } from "./editors-types"
import { getApplicationTemplate } from "./editors-whatsapp"

export const HeroSection = ({ t }: SectionProps) => {
    const whatsappNumber = "5511993313606"

    return (
        <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <div className="flex justify-end mb-4">
                    <LanguageSelector variant="default" />
                </div>
                <Badge variant="secondary" className="mb-4">
                    {t.hero.badge}
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                    {t.hero.title}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                    {t.hero.subtitle}
                </p>
                <WhatsAppButton
                    phoneNumber={whatsappNumber}
                    text={getApplicationTemplate(t.locale)}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white"
                >
                    {t.hero.cta}
                </WhatsAppButton>

                <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                    {t.hero.stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <p className="text-4xl font-bold">{stat.number}</p>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export const AboutSection = ({ t }: SectionProps) => {
    return (
        <section className="w-full bg-white dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">{t.about.title}</h2>
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
                            <DynamicIcon
                                name={skill.iconName}
                                size={32}
                                className="mb-2"
                            />
                            <p>{skill.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export const ToolsSection = ({ t }: SectionProps) => {
    return (
        <section className="w-full bg-gray-50 dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">{t.tools.title}</h2>
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
                            <DynamicIcon
                                name={tool.iconName}
                                size={48}
                                className="mx-auto mb-4"
                            />
                            <h3 className="font-semibold mb-2">{tool.name}</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {tool.description}
                            </p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

export const RequirementsSection = ({ t }: SectionProps) => {
    return (
        <section className="w-full bg-gray-50 dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">
                        {t.requirements.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        {t.requirements.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {t.requirements.items.map((requirement, index) => (
                        <Card
                            key={index}
                            className="p-6 bg-gray-100 dark:bg-gray-800 border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300"
                        >
                            <DynamicIcon
                                name={requirement.iconName}
                                size={32}
                                className="mb-4 text-blue-400"
                            />
                            <h3 className="text-xl font-semibold mb-4">
                                {requirement.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {requirement.description}
                            </p>
                            <ul className="space-y-3">
                                {requirement.features.map(
                                    (feature, featureIndex) => (
                                        <li
                                            key={featureIndex}
                                            className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                                        >
                                            <span className="mr-2 text-blue-400">
                                                •
                                            </span>
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
    )
}

export const BenefitsSection = ({ t }: SectionProps) => {
    return (
        <section className="w-full bg-white dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">
                        {t.benefits.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        {t.benefits.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {t.benefits.items.map((benefit, index) => (
                        <BenefitCard
                            key={index}
                            title={benefit.title}
                            description={benefit.description}
                            iconName={benefit.iconName}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export const CTASection = ({ t }: SectionProps) => {
    const whatsappNumber = "5511993313606"

    return (
        <section className="w-full bg-blue-600 text-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">{t.cta.title}</h2>
                <p className="text-lg mb-8">{t.cta.description}</p>
                <WhatsAppButton
                    phoneNumber={whatsappNumber}
                    text={getApplicationTemplate(t.locale)}
                    size="lg"
                    variant="outline"
                    className="border-white text-blue-600 bg-white hover:bg-blue-600 hover:text-white"
                >
                    {t.cta.button}
                </WhatsAppButton>
            </div>
        </section>
    )
}
