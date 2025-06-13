"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    CreditCard,
    Eye,
    EyeOff,
    Send,
    Shield,
    Smartphone,
    Upload,
} from "lucide-react"
import { useState } from "react"

interface PaymentModalProps {
    service: {
        name: string
        price: string
        description: string
    }
    locale: "en" | "pt-BR"
}

type PaymentMethod = "pix" | "monero" | "stripe" | "manual"
type PaymentStatus = "pending" | "verifying" | "completed" | "failed"

const PaymentModal = ({ service, locale }: PaymentModalProps) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("pix")
    const [anonymousMode, setAnonymousMode] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending")
    const [trackingCode, setTrackingCode] = useState("")
    const [receiptFile, setReceiptFile] = useState<File | null>(null)

    const isPortuguese = locale === "pt-BR"

    const translations = {
        title: isPortuguese ? "Finalizar Pagamento" : "Complete Payment",
        selectMethod: isPortuguese
            ? "Escolha o método de pagamento"
            : "Select payment method",
        anonymousToggle: isPortuguese ? "Modo Anônimo" : "Anonymous Mode",
        anonymousDescription: isPortuguese
            ? "Pagamento totalmente privado com Monero"
            : "Fully private payment with Monero",

        methods: {
            pix: {
                name: "PIX",
                description: isPortuguese
                    ? "Instant • Sem taxas • Brasil"
                    : "Instant • No fees • Brazil",
                fee: "0%",
            },
            monero: {
                name: "Monero (XMR)",
                description: isPortuguese
                    ? "Privado • Anônimo • Global"
                    : "Private • Anonymous • Global",
                fee: "~$0.01",
            },
            stripe: {
                name: isPortuguese ? "Cartão" : "Credit Card",
                description: isPortuguese
                    ? "Cartão de crédito • Internacional"
                    : "Credit card • International",
                fee: "2.9%",
            },
            manual: {
                name: isPortuguese ? "Transferência" : "Bank Transfer",
                description: isPortuguese
                    ? "Transferência + Comprovante"
                    : "Transfer + Receipt",
                fee: "0%",
            },
        },

        steps: {
            pix: [
                isPortuguese ? "Escaneie o QR Code PIX" : "Scan PIX QR Code",
                isPortuguese
                    ? "Confirme o pagamento no app"
                    : "Confirm payment in app",
                isPortuguese
                    ? "Verificação automática"
                    : "Automatic verification",
            ],
            monero: [
                isPortuguese
                    ? "Copie o endereço Monero"
                    : "Copy Monero address",
                isPortuguese
                    ? "Envie XMR da sua carteira"
                    : "Send XMR from your wallet",
                isPortuguese ? "Aguarde confirmação" : "Wait for confirmation",
            ],
            stripe: [
                isPortuguese ? "Insira dados do cartão" : "Enter card details",
                isPortuguese ? "Confirme o pagamento" : "Confirm payment",
                isPortuguese
                    ? "Processamento instantâneo"
                    : "Instant processing",
            ],
            manual: [
                isPortuguese ? "Faça a transferência" : "Make the transfer",
                isPortuguese ? "Envie o comprovante" : "Send receipt",
                isPortuguese ? "Verificação manual" : "Manual verification",
            ],
        },

        tracking: {
            title: isPortuguese ? "Código de Rastreamento" : "Tracking Code",
            description: isPortuguese
                ? "Use este código para acompanhar seu pedido"
                : "Use this code to track your order",
            checkStatus: isPortuguese ? "Verificar Status" : "Check Status",
        },

        status: {
            pending: isPortuguese ? "Aguardando pagamento" : "Awaiting payment",
            verifying: isPortuguese
                ? "Verificando pagamento"
                : "Verifying payment",
            completed: isPortuguese
                ? "Pagamento confirmado"
                : "Payment confirmed",
            failed: isPortuguese ? "Pagamento falhou" : "Payment failed",
        },
    }

    const paymentMethods = [
        {
            id: "pix" as PaymentMethod,
            icon: Smartphone,
            name: translations.methods.pix.name,
            description: translations.methods.pix.description,
            fee: translations.methods.pix.fee,
            available: true,
            primary: true,
        },
        {
            id: "monero" as PaymentMethod,
            icon: Shield,
            name: translations.methods.monero.name,
            description: translations.methods.monero.description,
            fee: translations.methods.monero.fee,
            available: true,
            private: true,
        },
        {
            id: "stripe" as PaymentMethod,
            icon: CreditCard,
            name: translations.methods.stripe.name,
            description: translations.methods.stripe.description,
            fee: translations.methods.stripe.fee,
            available: true,
        },
        {
            id: "manual" as PaymentMethod,
            icon: Upload,
            name: translations.methods.manual.name,
            description: translations.methods.manual.description,
            fee: translations.methods.manual.fee,
            available: true,
        },
    ]

    const generateTrackingCode = () => {
        const code = `TRACK-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        setTrackingCode(code)
        return code
    }

    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method)
        if (method === "monero") {
            setAnonymousMode(true)
        }
    }

    const renderPaymentInterface = () => {
        switch (selectedMethod) {
            case "pix":
                return (
                    <div className="space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                            <div className="w-48 h-48 bg-white dark:bg-gray-900 mx-auto mb-4 flex items-center justify-center rounded-lg">
                                <div className="text-6xl">📱</div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isPortuguese
                                    ? "QR Code PIX será gerado aqui"
                                    : "PIX QR Code will be generated here"}
                            </p>
                        </div>
                        <div className="text-center">
                            <Button
                                onClick={() => {
                                    setPaymentStatus("verifying")
                                    generateTrackingCode()
                                }}
                                className="w-full"
                            >
                                {isPortuguese ? "Gerar PIX" : "Generate PIX"}
                            </Button>
                        </div>
                    </div>
                )

            case "monero":
                return (
                    <div className="space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                    {isPortuguese
                                        ? "Endereço Monero:"
                                        : "Monero Address:"}
                                </span>
                                <Button variant="ghost" size="sm">
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            <code className="text-xs bg-white dark:bg-gray-900 p-2 rounded block break-all">
                                4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5BM62D4J5QHW2MSVayRxLEGy5vEhQyM3sELs5oi
                            </code>
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>
                                    {isPortuguese ? "Valor:" : "Amount:"} 0.05
                                    XMR
                                </p>
                            </div>
                        </div>
                        {anonymousMode && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {isPortuguese
                                            ? "Modo Anônimo Ativo"
                                            : "Anonymous Mode Active"}
                                    </span>
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    {isPortuguese
                                        ? "Nenhum dado pessoal será armazenado"
                                        : "No personal data will be stored"}
                                </p>
                            </div>
                        )}
                        <Button
                            onClick={() => {
                                setPaymentStatus("verifying")
                                generateTrackingCode()
                            }}
                            className="w-full"
                        >
                            {isPortuguese
                                ? "Monitorar Pagamento"
                                : "Monitor Payment"}
                        </Button>
                    </div>
                )

            case "manual":
                return (
                    <div className="space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">
                                {isPortuguese
                                    ? "Dados para Transferência:"
                                    : "Transfer Details:"}
                            </h4>
                            <div className="space-y-1 text-sm">
                                <p>
                                    <strong>
                                        {isPortuguese ? "Banco:" : "Bank:"}
                                    </strong>{" "}
                                    Nubank
                                </p>
                                <p>
                                    <strong>
                                        {isPortuguese ? "Agência:" : "Branch:"}
                                    </strong>{" "}
                                    0001
                                </p>
                                <p>
                                    <strong>
                                        {isPortuguese ? "Conta:" : "Account:"}
                                    </strong>{" "}
                                    12345678-9
                                </p>
                                <p>
                                    <strong>
                                        {isPortuguese ? "CPF:" : "CPF:"}
                                    </strong>{" "}
                                    123.456.789-00
                                </p>
                                <p>
                                    <strong>
                                        {isPortuguese ? "Valor:" : "Amount:"}
                                    </strong>{" "}
                                    {service.price}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {isPortuguese
                                    ? "Enviar Comprovante:"
                                    : "Send Receipt:"}
                            </label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {isPortuguese
                                        ? "Clique para enviar ou arraste o arquivo"
                                        : "Click to upload or drag file"}
                                </p>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    aria-label={
                                        isPortuguese
                                            ? "Enviar comprovante de pagamento"
                                            : "Upload payment receipt"
                                    }
                                    onChange={e =>
                                        setReceiptFile(
                                            e.target.files?.[0] || null
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => {
                                setPaymentStatus("verifying")
                                generateTrackingCode()
                            }}
                            className="w-full"
                            disabled={!receiptFile}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {isPortuguese
                                ? "Enviar Comprovante"
                                : "Send Receipt"}
                        </Button>
                    </div>
                )

            default:
                return null
        }
    }

    const getStatusIcon = () => {
        switch (paymentStatus) {
            case "pending":
                return <Clock className="w-5 h-5 text-yellow-500" />
            case "verifying":
                return <AlertCircle className="w-5 h-5 text-blue-500" />
            case "completed":
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case "failed":
                return <AlertCircle className="w-5 h-5 text-red-500" />
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full">
                    {isPortuguese ? "Contratar Agora" : "Get Started"}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{translations.title}</DialogTitle>
                    <DialogDescription>
                        {service.name} - {service.price}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Anonymous Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                            <div className="flex items-center gap-2">
                                {anonymousMode ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                                <span className="font-medium">
                                    {translations.anonymousToggle}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {translations.anonymousDescription}
                            </p>
                        </div>
                        <Button
                            variant={anonymousMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                setAnonymousMode(!anonymousMode)
                                if (!anonymousMode) {
                                    setSelectedMethod("monero")
                                }
                            }}
                        >
                            {anonymousMode ? "ON" : "OFF"}
                        </Button>
                    </div>

                    {/* Payment Method Selection */}
                    {!anonymousMode && (
                        <div>
                            <h3 className="font-medium mb-4">
                                {translations.selectMethod}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {paymentMethods
                                    .filter(
                                        method =>
                                            !anonymousMode || method.private
                                    )
                                    .map(method => (
                                        <Card
                                            key={method.id}
                                            className={`p-4 cursor-pointer transition-all ${
                                                selectedMethod === method.id
                                                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                            onClick={() =>
                                                handlePaymentMethodSelect(
                                                    method.id
                                                )
                                            }
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <method.icon className="w-5 h-5" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {method.name}
                                                            </span>
                                                            {method.primary && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {isPortuguese
                                                                        ? "Recomendado"
                                                                        : "Recommended"}
                                                                </Badge>
                                                            )}
                                                            {method.private && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {isPortuguese
                                                                        ? "Privado"
                                                                        : "Private"}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {method.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {method.fee}
                                                </Badge>
                                            </div>
                                        </Card>
                                    ))}
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Payment Interface */}
                    <div>
                        <h3 className="font-medium mb-4">
                            {isPortuguese
                                ? "Efetuar Pagamento"
                                : "Make Payment"}
                        </h3>
                        {renderPaymentInterface()}
                    </div>

                    {/* Tracking Code */}
                    {trackingCode && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon()}
                                <span className="font-medium">
                                    {translations.tracking.title}
                                </span>
                            </div>
                            <code className="bg-white dark:bg-gray-900 p-2 rounded text-sm block font-mono">
                                {trackingCode}
                            </code>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                {translations.tracking.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm">
                                    {translations.status[paymentStatus]}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Steps */}
                    <div>
                        <h4 className="font-medium mb-3">
                            {isPortuguese ? "Próximos Passos:" : "Next Steps:"}
                        </h4>
                        <div className="space-y-2">
                            {translations.steps[selectedMethod].map(
                                (step, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm">{step}</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default PaymentModal
