"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertCircle,
    CheckCircle,
    CreditCard,
    Crown,
    DollarSign,
    Gift,
    Globe,
    Heart,
    Layout,
    MessageSquare,
    Shield,
    Sparkles,
    Star,
    Users,
} from "lucide-react"
import Image from "next/image"
import type { WaveIGLSupportViewProps } from "./waveigl-support-types"

const iconMap = {
    Layout,
    CreditCard,
    Shield,
    Globe,
    MessageSquare,
    Users,
    CheckCircle,
    Star,
}

export default function WaveIGLSupportView({
    locale,
    translations: t,
    selectedMethod,
    setSelectedMethod,
    customAmount,
    setCustomAmount,
    paymentType,
    setPaymentType,
    onPaymentMethodClick,
    onScrollToDonation,
    donationSectionRef,
}: WaveIGLSupportViewProps) {
    const isPortuguese = locale === "pt-BR"

    const PaymentMethodToggle = () => (
        <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
            <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name="paymentMethod"
                        value="pix"
                        checked={selectedMethod === "pix"}
                        onChange={() => setSelectedMethod("pix")}
                        className="sr-only peer"
                    />
                    <div
                        className={`p-3 rounded-lg flex items-center gap-2 transition-all w-full ${
                            selectedMethod === "pix"
                                ? "bg-blue-500 text-white"
                                : "bg-white dark:bg-gray-700"
                        }`}
                    >
                        <DollarSign className="w-5 h-5" />
                        <div>
                            <div className="font-medium">
                                {t.payment.methods.pix.title}
                            </div>
                            <div className="text-sm opacity-80">
                                {t.payment.methods.pix.description}
                            </div>
                        </div>
                    </div>
                </label>
            </div>
            <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name="paymentMethod"
                        value="monero"
                        checked={selectedMethod === "monero"}
                        onChange={() => setSelectedMethod("monero")}
                        className="sr-only peer"
                    />
                    <div
                        className={`p-3 rounded-lg flex items-center gap-2 transition-all w-full ${
                            selectedMethod === "monero"
                                ? "bg-orange-500 text-white"
                                : "bg-white dark:bg-gray-700"
                        }`}
                    >
                        <Shield className="w-5 h-5" />
                        <div>
                            <div className="font-medium">
                                {t.payment.methods.monero.title}
                            </div>
                            <div className="text-sm opacity-80">
                                {t.payment.methods.monero.description}
                            </div>
                        </div>
                    </div>
                </label>
            </div>
        </div>
    )

    const PriceComparison = ({ basePrice }: { basePrice: number }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div
                className={`p-4 border rounded-lg transition-all ${
                    selectedMethod === "pix"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700"
                }`}
            >
                <div className="text-lg font-medium mb-2">
                    {t.payment.methods.pix.title}
                </div>
                <div className="text-2xl font-bold">R$ {basePrice * 2}</div>
                <ul className="mt-4 space-y-2 text-sm">
                    {t.payment.methods.pix.features.map(
                        (feature: string, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                {feature}
                            </li>
                        )
                    )}
                </ul>
            </div>
            <div
                className={`p-4 border rounded-lg transition-all ${
                    selectedMethod === "monero"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-gray-200 dark:border-gray-700"
                }`}
            >
                <div className="text-lg font-medium mb-2">
                    {t.payment.methods.monero.title}
                </div>
                <div className="text-2xl font-bold text-orange-600">
                    R$ {basePrice}
                </div>
                <div className="text-sm text-orange-600 font-medium">
                    50% OFF!
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                    {t.payment.methods.monero.features.map(
                        (feature: string, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-orange-500" />
                                {feature}
                            </li>
                        )
                    )}
                </ul>
            </div>
        </div>
    )

    const PaymentDialog = () => (
        <Dialog>
            <DialogContent className="sm:max-w-[525px] bg-gray-900 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {
                            t.payment.dialog[
                                paymentType === "one-time"
                                    ? "oneTime"
                                    : "monthly"
                            ]
                        }
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {t.payment.dialog.description}
                    </DialogDescription>
                </DialogHeader>

                <PaymentMethodToggle />

                <div className="py-2">
                    <input
                        type="number"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        placeholder={t.payment.dialog.customAmount}
                        className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                    />
                </div>

                {customAmount && Number(customAmount) > 0 && (
                    <PriceComparison basePrice={Number(customAmount)} />
                )}

                <div className="flex flex-col gap-2 mt-4">
                    <button
                        onClick={() => onPaymentMethodClick(selectedMethod)}
                        className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
                            selectedMethod === "monero"
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "bg-blue-500 hover:bg-blue-600"
                        }`}
                    >
                        <div className="text-left">
                            <div className="font-medium">
                                {selectedMethod === "monero"
                                    ? "Monero (XMR)"
                                    : "PIX"}
                            </div>
                            <div className="text-sm text-white/80">
                                {
                                    t.payment.dialog[
                                        selectedMethod === "monero"
                                            ? "anonymousPayment"
                                            : "instantPayment"
                                    ]
                                }
                            </div>
                        </div>
                        {selectedMethod === "monero" ? (
                            <Shield className="w-5 h-5" />
                        ) : (
                            <DollarSign className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {paymentType === "subscription" && selectedMethod === "pix" && (
                    <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-sm">
                                {t.payment.alerts.pixMonthlyNotSupported}
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-400 text-purple-900 text-sm font-bold mb-8">
                        {t.hero.badge}
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black mb-6">
                        {t.hero.title}
                    </h1>

                    <p className="text-xl mb-8 max-w-4xl mx-auto opacity-90">
                        {t.hero.subtitle}
                    </p>

                    <Button
                        onClick={onScrollToDonation}
                        className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-colors text-lg"
                    >
                        <Heart className="w-5 h-5 mr-2" />
                        {t.hero.cta}
                    </Button>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {t.hero.stats.map((stat, index) => (
                            <div
                                key={index}
                                className="text-center bg-white/10 backdrop-blur rounded-lg p-6"
                            >
                                <div className="text-4xl font-black text-purple-300 mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-white/80">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-4xl font-black mb-4 text-white">
                        {t.mission.title}
                    </h2>
                    <p className="text-xl mb-12 text-gray-300">
                        {t.mission.subtitle}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {t.mission.points.map((point, index) => {
                            const IconComponent =
                                iconMap[point.icon as keyof typeof iconMap] ||
                                CheckCircle
                            return (
                                <div
                                    key={index}
                                    className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all"
                                >
                                    <div className="flex items-center justify-center w-12 h-12 mb-4 mx-auto bg-purple-900/30 rounded-full">
                                        <IconComponent className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-white">
                                        {point.title}
                                    </h3>
                                    <p className="text-gray-300">
                                        {point.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Projects Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.projects.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                            {t.projects.subtitle}
                        </p>
                    </div>

                    <div className="relative max-w-5xl mx-auto">
                        {/* Linha vertical central */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-purple-200 dark:bg-purple-800"></div>

                        {/* Features na linha do tempo */}
                        {t.projects.list
                            .sort((a, b) => {
                                const getNumericValue = (str: string) =>
                                    Number(str.replace(/[^0-9]/g, ""))
                                return (
                                    getNumericValue(a.budget) -
                                    getNumericValue(b.budget)
                                )
                            })
                            .map((project, index) => {
                                const IconComponent =
                                    iconMap[
                                        project.icon as keyof typeof iconMap
                                    ] || Layout
                                return (
                                    <div
                                        key={index}
                                        className={`relative flex items-center mb-16 ${
                                            index % 2 === 0
                                                ? "justify-end"
                                                : "justify-start"
                                        } md:mb-24`}
                                    >
                                        {/* Círculo na linha do tempo */}
                                        <div
                                            className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full border-4 transition-colors duration-500 ${
                                                project.progress > 0
                                                    ? "bg-green-500 border-green-200 dark:border-green-800"
                                                    : "bg-purple-600 border-purple-200 dark:border-purple-800"
                                            } z-10`}
                                        ></div>

                                        {/* Card da funcionalidade */}
                                        <div
                                            className={`w-full md:w-5/12 ${index % 2 === 0 ? "md:mr-8 pr-4" : "md:ml-8 pl-4"}`}
                                        >
                                            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg border-2 border-purple-200 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-400 transition-all">
                                                <div className="flex items-start justify-between mb-4">
                                                    <IconComponent className="w-10 h-10 text-purple-600" />
                                                    <span
                                                        className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                                            project.progress > 0
                                                                ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                                                : "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                                                        }`}
                                                    >
                                                        {project.progress > 0
                                                            ? t.common
                                                                  .inDevelopment
                                                            : project.status}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                    {project.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                                    {project.description}
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {t.common.progress}
                                                        </span>
                                                        <span className="font-bold text-purple-600">
                                                            {project.progress}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${project.progress}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {t.common.goal}
                                                        </span>
                                                        <span className="text-lg font-bold text-green-600">
                                                            {project.budget}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                        {/* Card de Investimento Total no final */}
                        <div className="relative flex flex-col items-center mb-16 md:mb-24">
                            <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 h-8 w-1 bg-purple-200 dark:bg-purple-800"></div>
                            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 w-6 h-6 rounded-full border-4 bg-purple-600 border-purple-200 dark:border-purple-800 z-10"></div>

                            <div className="w-full md:w-8/12 mt-12">
                                <div className="bg-gray-900 rounded-xl p-6 shadow-lg border-2 border-purple-500/20">
                                    <div className="text-center">
                                        <div className="text-gray-400 mb-2">
                                            {t.common.totalInvestmentNeeded}
                                        </div>
                                        <div className="text-4xl font-bold text-purple-500 mb-4">
                                            {locale === "pt-BR"
                                                ? "R$ 27.360"
                                                : "$4,560"}
                                        </div>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <div className="text-sm text-gray-400">
                                                {t.common.overallProgress}
                                            </div>
                                            <div className="text-sm font-bold text-green-500">
                                                0%
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-800 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: "0%" }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transparency Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.transparency.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.transparency.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {t.transparency.breakdown.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center"
                            >
                                <div className="relative w-32 h-32 mx-auto mb-6">
                                    {/* Círculo base (background) */}
                                    <div className="absolute inset-0 rounded-full border-8 border-purple-200 dark:border-purple-900"></div>

                                    {/* Círculo de progresso */}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
                                        <circle
                                            className="text-purple-600 dark:text-purple-400"
                                            strokeWidth="8"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="48"
                                            cx="64"
                                            cy="64"
                                            style={{
                                                strokeDasharray: "301.59",
                                                strokeDashoffset:
                                                    301.59 -
                                                    (301.59 * item.percentage) /
                                                        100,
                                                transition:
                                                    "stroke-dashoffset 1s ease-in-out",
                                            }}
                                        />
                                    </svg>

                                    {/* Texto do percentual */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {item.amount}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {item.category}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Donation Section */}
            <section
                ref={donationSectionRef}
                className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4">
                            {t.donation.title}
                        </h2>
                        <p className="text-xl mb-8 opacity-90">
                            {t.donation.subtitle}
                        </p>
                        <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full mb-8">
                            <Sparkles className="w-5 h-5" />
                            {t.donation.moneroBonus}
                        </div>

                        {/* Toggle de Tipo de Pagamento */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-800 p-1 rounded-lg inline-flex">
                                <button
                                    onClick={() =>
                                        setPaymentType("subscription")
                                    }
                                    className={`px-4 py-2 rounded-md transition-all ${
                                        paymentType === "subscription"
                                            ? "bg-purple-600 text-white"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    {t.donation.monthlyAnnualPlan ||
                                        t.donation.monthly}
                                </button>
                                <button
                                    onClick={() => setPaymentType("one-time")}
                                    className={`px-4 py-2 rounded-md transition-all ${
                                        paymentType === "one-time"
                                            ? "bg-purple-600 text-white"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    {t.donation.oneTime}
                                </button>
                            </div>
                        </div>
                    </div>

                    {paymentType === "subscription" ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {/* Cards de Planos existentes */}
                            {/* WaveIGL - Donator Mensal */}
                            <a
                                href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c93808497ad02ae0197ae8d256c00d0"
                                data-mp-button
                                className="relative p-6 rounded-xl bg-purple-900/50 hover:bg-purple-800/50 transition-all group w-full text-left backdrop-blur-sm border-2 border-purple-500/20 hover:border-purple-400"
                            >
                                <div className="absolute -top-3 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                    R$ 9,90
                                </div>
                                <div className="mb-4">
                                    <div className="text-xl font-bold text-white mb-2">
                                        WaveIGL - Donator
                                    </div>
                                    <div className="text-white/90">
                                        {
                                            t.donation.suggestedAmounts.donator
                                                .description
                                        }
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 text-white group-hover:text-purple-300 transition-colors">
                                        <Gift className="w-5 h-5" />
                                        <span className="font-medium">
                                            {t.donation.monthly}
                                        </span>
                                    </div>
                                </div>
                            </a>

                            {/* WaveIGL - Donator Anual */}
                            <a
                                href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c93808497ad02ae0197aea01ba700db"
                                data-mp-button
                                className="relative p-6 rounded-xl bg-purple-900/50 hover:bg-purple-800/50 transition-all group w-full text-left backdrop-blur-sm border-2 border-purple-500/20 hover:border-purple-400"
                            >
                                <div className="absolute -top-3 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                    R$ 97,00
                                </div>
                                <div className="mb-4">
                                    <div className="text-xl font-bold text-white mb-2">
                                        WaveIGL - Donator
                                    </div>
                                    <div className="text-white/90">
                                        {locale === "pt-BR"
                                            ? "Apoio anual para o projeto"
                                            : "Annual support for the project"}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 text-white group-hover:text-purple-300 transition-colors">
                                        <Gift className="w-5 h-5" />
                                        <span className="font-medium">
                                            {t.donation.annual || "Annual"}
                                        </span>
                                    </div>
                                </div>
                            </a>

                            {/* WaveIGL - THE Donator */}
                            <a
                                href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c93808497ad02ae0197ae90c71800d2"
                                data-mp-button
                                className="relative p-6 rounded-xl bg-purple-900/50 hover:bg-purple-800/50 transition-all group w-full text-left backdrop-blur-sm border-2 border-purple-500/20 hover:border-purple-400"
                            >
                                <div className="absolute -top-3 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                    {t.donation.chooseAmount || "Choose amount"}
                                </div>
                                <div className="mb-4">
                                    <div className="text-xl font-bold text-white mb-2">
                                        WaveIGL - THE Donator
                                    </div>
                                    <div className="text-white/90">
                                        {
                                            t.donation.suggestedAmounts
                                                .theDonator.description
                                        }
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 text-white group-hover:text-purple-300 transition-colors">
                                        <Crown className="w-5 h-5" />
                                        <span className="font-medium">
                                            {t.donation.monthly}
                                        </span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto">
                            <div className="p-6 rounded-xl bg-purple-900/50 backdrop-blur-sm border-2 border-purple-500/20 text-center">
                                <h3 className="text-xl font-bold text-white mb-4">
                                    {t.donation.pixDonation || "PIX Donation"}
                                </h3>
                                <div className="bg-white p-4 rounded-lg mb-4">
                                    <Image
                                        src="/qr_code.webp"
                                        alt="QR Code PIX"
                                        width={192}
                                        height={192}
                                        className="mx-auto"
                                    />
                                </div>
                                <p className="text-gray-300 mb-4">
                                    {t.donation.scanQrCode ||
                                        "Scan the QR Code or copy the PIX key below:"}
                                </p>
                                <div className="bg-gray-800 p-3 rounded-lg mb-4">
                                    <code className="text-purple-300 select-all">
                                        gabrieltothgoncalves@gmail.com
                                    </code>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            "gabrieltothgoncalves@gmail.com"
                                        )
                                        alert(
                                            t.donation.pixKeyCopied ||
                                                "PIX key copied!"
                                        )
                                    }}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                >
                                    {t.donation.copyPixKey || "Copy PIX Key"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Payment Dialog */}
            <PaymentDialog />
        </div>
    )
}
