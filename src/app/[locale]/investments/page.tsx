import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    BarChart3,
    Bitcoin,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Gamepad2,
    Info,
    MessageSquare,
    Monitor,
    Phone,
    Users,
} from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

export default function InvestmentsPage() {
    const t = useTranslations("investments")

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Hero Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        {t("title")}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                        {t("subtitle")}
                    </p>
                </div>
            </section>

            {/* WaveIGL Project */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <Monitor className="h-8 w-8 text-primary" />
                                <CardTitle className="text-3xl">
                                    {t("waveigl.title")}
                                </CardTitle>
                            </div>
                            <CardDescription className="text-lg">
                                {t("waveigl.description")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* What this site will contain */}
                            <div>
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    {t("waveigl.what.title")}
                                </h3>
                                <div className="space-y-3">
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <Badge
                                            variant="secondary"
                                            className="mb-2"
                                        >
                                            Não Proprietário
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            {t("waveigl.what.login")}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <Badge
                                            variant="secondary"
                                            className="mb-2"
                                        >
                                            Não Proprietário
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            {t("waveigl.what.funnel")}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <Badge
                                            variant="secondary"
                                            className="mb-2"
                                        >
                                            Não Proprietário
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            {t("waveigl.what.chatUnify")}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <Badge
                                            variant="secondary"
                                            className="mb-2"
                                        >
                                            Não Proprietário
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            {t("waveigl.what.moderation")}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                                        <Badge className="mb-2">
                                            Proprietário
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            {t("waveigl.what.landing")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div>
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    {t("waveigl.benefits.title")}
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                        <p className="text-sm">
                                            {t("waveigl.benefits.automation")}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        <p className="text-sm">
                                            {t(
                                                "waveigl.benefits.centralization"
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                                        <p className="text-sm">
                                            {t("waveigl.benefits.moderation")}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                                        <p className="text-sm">
                                            {t("waveigl.benefits.professional")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div>
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    {t("waveigl.pricing.title")}
                                </h3>
                                <div className="space-y-4">
                                    {/* Landing Page */}
                                    <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge className="bg-primary text-primary-foreground">
                                                Proprietário
                                            </Badge>
                                            <span className="font-bold text-xl text-primary">
                                                {t(
                                                    "waveigl.pricing.landing.price"
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold mb-1">
                                            {t("waveigl.pricing.landing.name")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            <Clock className="inline h-4 w-4 mr-1" />
                                            {t("waveigl.pricing.landing.time")}
                                        </p>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                            <Info className="inline h-3 w-3 mr-1" />
                                            {t("waveigl.pricing.landing.note")}
                                        </p>
                                    </div>

                                    {/* Payment Automation */}
                                    <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge className="bg-primary text-primary-foreground">
                                                Proprietário
                                            </Badge>
                                            <span className="font-bold text-xl text-primary">
                                                {t(
                                                    "waveigl.pricing.payments.price"
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold mb-1">
                                            {t("waveigl.pricing.payments.name")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            <Clock className="inline h-4 w-4 mr-1" />
                                            {t("waveigl.pricing.payments.time")}
                                        </p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">
                                            <Info className="inline h-3 w-3 mr-1" />
                                            {t("waveigl.pricing.payments.note")}
                                        </p>
                                    </div>

                                    {/* DDoS Protection */}
                                    <div className="p-4 border rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary">
                                                Não Proprietário
                                            </Badge>
                                            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                                                {t(
                                                    "waveigl.pricing.ddos.price"
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold mb-1">
                                            {t("waveigl.pricing.ddos.name")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            <Clock className="inline h-4 w-4 mr-1" />
                                            {t("waveigl.pricing.ddos.time")}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            <Info className="inline h-3 w-3 mr-1" />
                                            {t("waveigl.pricing.ddos.note")}
                                        </p>
                                    </div>

                                    {/* Multi-platform Login */}
                                    <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary">
                                                Não Proprietário
                                            </Badge>
                                            <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                                                {t(
                                                    "waveigl.pricing.login.price"
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold mb-1">
                                            {t("waveigl.pricing.login.name")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            <Clock className="inline h-4 w-4 mr-1" />
                                            {t("waveigl.pricing.login.time")}
                                        </p>
                                    </div>

                                    {/* Subscriber Funnel */}
                                    <div className="p-4 border rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary">
                                                Não Proprietário
                                            </Badge>
                                            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                                                {t(
                                                    "waveigl.pricing.funnel.price"
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold mb-1">
                                            {t("waveigl.pricing.funnel.name")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            <Clock className="inline h-4 w-4 mr-1" />
                                            {t("waveigl.pricing.funnel.time")}
                                        </p>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                            <Info className="inline h-3 w-3 mr-1" />
                                            {t("waveigl.pricing.funnel.note")}
                                        </p>
                                    </div>

                                    {/* Chat Unification */}
                                    <div className="p-4 border rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary">
                                                Não Proprietário
                                            </Badge>
                                            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                                                {t(
                                                    "waveigl.pricing.chat.price"
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold mb-1">
                                            {t("waveigl.pricing.chat.name")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            <Clock className="inline h-4 w-4 mr-1" />
                                            {t("waveigl.pricing.chat.time")}
                                        </p>
                                    </div>

                                    {/* Moderation Tools */}
                                    <div className="p-4 border rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary">
                                                Não Proprietário
                                            </Badge>
                                            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                                                {t(
                                                    "waveigl.pricing.modTools.price"
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold mb-1">
                                            {t("waveigl.pricing.modTools.name")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            <Clock className="inline h-4 w-4 mr-1" />
                                            {t("waveigl.pricing.modTools.time")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Ownership Information */}
                            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    {t("waveigl.ownership.title")}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p>
                                        <strong>Não Proprietárias:</strong>{" "}
                                        {t("waveigl.ownership.nonProprietary")}
                                    </p>
                                    <p>
                                        <strong>Proprietárias:</strong>{" "}
                                        {t("waveigl.ownership.proprietary")}
                                    </p>
                                </div>
                            </div>

                            {/* Total Investment */}
                            <div className="p-6 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-lg border-2 border-primary/20">
                                <h3 className="text-2xl font-bold mb-2 text-center">
                                    {t("waveigl.total.title")}
                                </h3>
                                <p className="text-4xl font-bold text-center text-primary mb-2">
                                    {t("waveigl.total.amount")}
                                </p>
                                <p className="text-center text-muted-foreground">
                                    {t("waveigl.total.subtitle")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Other Projects */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Social Engine Analytics */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                    <CardTitle className="text-xl">
                                        Social Engine Analytics - SaaS
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Transformar um projeto privado local em uma
                                    plataforma SaaS aberta para análise de redes
                                    sociais.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Tornar o Social Engine Analytics um SaaS
                                        público ao invés de um projeto
                                        inteiramente privado e local.
                                    </p>
                                    <div className="p-4 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-lg">
                                        <p className="font-bold text-2xl text-primary">
                                            Investimento: R$50.000
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Live Content Direction */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <Gamepad2 className="h-6 w-6 text-primary" />
                                    <CardTitle className="text-xl">
                                        Direcionamento de Conteúdo Live
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Direcione 4 horas de conteúdo ao vivo com
                                    sua escolha de tecnologia e projetos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-600/10 rounded-lg">
                                        <p className="font-bold text-2xl text-green-600 dark:text-green-400">
                                            Doação: R$50
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Opções de Conteúdo
                                        </h4>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p>
                                                • Desenvolvimento de mods para
                                                Minecraft
                                            </p>
                                            <p>
                                                • Desenvolvimento de jogos na
                                                Unreal Engine 5
                                            </p>
                                            <p>
                                                • Desenvolvimento de jogos no
                                                Roblox
                                            </p>
                                            <p>• Desenvolvimento de sites</p>
                                            <p>
                                                • Trabalhar no Social Engine
                                                Analytics
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Payment Methods */}
            <section className="py-16 px-4 bg-muted/30">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl flex items-center justify-center gap-3">
                                <DollarSign className="h-6 w-6" />
                                {t("payment.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <Phone className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                                        {t("payment.pix")}
                                    </p>
                                </div>
                                <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <Bitcoin className="h-8 w-8 mx-auto mb-3 text-orange-600" />
                                    <p className="font-semibold text-orange-600 dark:text-orange-400">
                                        {t("payment.monero")}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 space-y-3">
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <p className="text-sm text-center text-yellow-800 dark:text-yellow-200">
                                        <strong>Nota:</strong>{" "}
                                        {t("payment.note")}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-center text-green-800 dark:text-green-200">
                                        💚 {t("payment.partial")}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <Card className="p-8 bg-gradient-to-r from-primary/5 to-blue-600/5">
                        <CardHeader>
                            <CardTitle className="text-3xl mb-4">
                                {t("contact.title")}
                            </CardTitle>
                            <CardDescription className="text-lg">
                                {t("contact.description")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/contact">
                                <Button size="lg" className="text-lg px-8 py-3">
                                    <MessageSquare className="mr-2 h-5 w-5" />
                                    {t("contact.cta")}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    )
}
