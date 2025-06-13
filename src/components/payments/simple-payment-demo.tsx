"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Check, Copy, CreditCard, Phone } from "lucide-react"
import { useState } from "react"

interface SimplePaymentDemoProps {
    serviceType: string
    amount: number
}

interface PaymentData {
    qrCode?: string
    copyPasteCode?: string
    address?: string
    amount?: number
    amountBrl?: number
}

interface OrderData {
    trackingCode: string
    status: string
}

export default function SimplePaymentDemo({
    serviceType,
    amount,
}: SimplePaymentDemoProps) {
    const [selectedMethod, setSelectedMethod] = useState<"pix" | "monero">(
        "pix"
    )
    const [whatsappNumber, setWhatsappNumber] = useState("")
    const [isCreatingOrder, setIsCreatingOrder] = useState(false)
    const [orderData, setOrderData] = useState<OrderData | null>(null)
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
    const [copiedText, setCopiedText] = useState<string | null>(null)
    const [, setError] = useState<string | null>(null)
    const [, setIsLoading] = useState(false)

    // Create payment order
    const createPayment = async () => {
        setIsCreatingOrder(true)
        try {
            const endpoint =
                selectedMethod === "pix"
                    ? "/api/payments/pix/create"
                    : "/api/payments/monero/create"

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceType,
                    amount,
                    whatsappNumber: whatsappNumber || undefined,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setOrderData(data.order)
                setPaymentData(
                    selectedMethod === "pix" ? data.pix : data.monero
                )
            } else {
                alert(`Erro: ${data.error}`)
            }
        } catch {
            setError("Failed to create PIX payment")
            setIsLoading(false)
        } finally {
            setIsCreatingOrder(false)
        }
    }

    // Copy to clipboard
    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedText(label)
            setTimeout(() => setCopiedText(null), 2000)
        } catch {
            alert("Erro ao copiar")
        }
    }

    // WhatsApp link
    const whatsappLink =
        whatsappNumber && orderData
            ? `https://wa.me/55${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `🤖 Pagamento ${serviceType}\n\n` +
                      `📋 Código: ${orderData.trackingCode}\n` +
                      `💰 Valor: R$ ${amount}\n` +
                      `📱 Método: ${selectedMethod.toUpperCase()}\n\n` +
                      "Aguardando confirmação do pagamento."
              )}`
            : ""

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Sistema de Pagamento Gratuito
                    </CardTitle>
                    <CardDescription>
                        PIX (0% taxa) • Monero (~$0.01 taxa) • Discord
                        Notifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span>Serviço:</span>
                            <span className="font-medium">{serviceType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Valor:</span>
                            <span className="font-medium">R$ {amount}</span>
                        </div>
                        {orderData && (
                            <>
                                <div className="flex justify-between">
                                    <span>Código:</span>
                                    <span className="font-mono text-sm">
                                        {orderData.trackingCode}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status:</span>
                                    <Badge
                                        variant={
                                            orderData.status === "confirmed"
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {orderData.status}
                                    </Badge>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* WhatsApp Input */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        WhatsApp (Opcional)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <input
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={whatsappNumber}
                            onChange={e => setWhatsappNumber(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                        <p className="text-sm text-gray-600">
                            Para receber notificações e verificação automática
                        </p>
                        {whatsappLink && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    window.open(whatsappLink, "_blank")
                                }
                                className="w-full"
                            >
                                <Phone className="h-4 w-4 mr-2" />
                                Abrir WhatsApp
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Button
                            variant={
                                selectedMethod === "pix" ? "default" : "outline"
                            }
                            onClick={() => setSelectedMethod("pix")}
                            className="h-16"
                        >
                            <div className="text-center">
                                <div className="font-medium">PIX</div>
                                <div className="text-xs">0% taxa</div>
                            </div>
                        </Button>
                        <Button
                            variant={
                                selectedMethod === "monero"
                                    ? "default"
                                    : "outline"
                            }
                            onClick={() => setSelectedMethod("monero")}
                            className="h-16"
                        >
                            <div className="text-center">
                                <div className="font-medium">Monero</div>
                                <div className="text-xs">Anônimo</div>
                            </div>
                        </Button>
                    </div>

                    {!orderData ? (
                        <Button
                            onClick={createPayment}
                            disabled={isCreatingOrder}
                            size="lg"
                            className="w-full"
                        >
                            {isCreatingOrder
                                ? "Gerando..."
                                : `Gerar Pagamento ${selectedMethod.toUpperCase()}`}
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            {/* PIX Payment */}
                            {selectedMethod === "pix" && paymentData && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h4 className="font-medium mb-3">
                                            QR Code PIX
                                        </h4>
                                        <div className="bg-white p-4 rounded-lg inline-block border">
                                            <img
                                                src={paymentData.qrCode}
                                                alt="PIX QR Code"
                                                className="w-48 h-48 mx-auto"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Código PIX (Copiar e Colar)
                                        </label>
                                        <div className="flex gap-2">
                                            <textarea
                                                value={
                                                    paymentData.copyPasteCode
                                                }
                                                readOnly
                                                className="flex-1 p-2 border rounded font-mono text-xs"
                                                rows={3}
                                                aria-label="Código PIX para copiar e colar"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    paymentData.copyPasteCode &&
                                                    copyToClipboard(
                                                        paymentData.copyPasteCode,
                                                        "pix"
                                                    )
                                                }
                                                disabled={
                                                    !paymentData.copyPasteCode
                                                }
                                            >
                                                {copiedText === "pix" ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Monero Payment */}
                            {selectedMethod === "monero" && paymentData && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Valor:{" "}
                                            {paymentData.amount?.toFixed(6)} XMR
                                        </label>
                                        <p className="text-xs text-gray-600">
                                            ≈ R$ {paymentData.amountBrl}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Endereço Monero
                                        </label>
                                        <div className="flex gap-2">
                                            <textarea
                                                value={paymentData.address}
                                                readOnly
                                                className="flex-1 p-2 border rounded font-mono text-xs"
                                                rows={3}
                                                aria-label="Endereço Monero para pagamento"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    paymentData.address &&
                                                    copyToClipboard(
                                                        paymentData.address,
                                                        "address"
                                                    )
                                                }
                                                disabled={!paymentData.address}
                                            >
                                                {copiedText === "address" ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <h5 className="font-medium text-purple-900 mb-2">
                                            Instruções
                                        </h5>
                                        <ol className="text-sm text-purple-800 space-y-1">
                                            <li>
                                                1. Envie{" "}
                                                {paymentData.amount?.toFixed(6)}{" "}
                                                XMR para o endereço acima
                                            </li>
                                            <li>
                                                2. Copie o hash da transação
                                            </li>
                                            <li>
                                                3. Envie o hash via WhatsApp ou
                                                cole no site
                                            </li>
                                            <li>
                                                4. Aguarde ~20 minutos para
                                                confirmação
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Free Tier Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg text-green-600">
                        🆓 100% Gratuito
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h4 className="font-medium mb-2">
                                Serviços Gratuitos:
                            </h4>
                            <ul className="space-y-1">
                                <li>• Supabase (500MB)</li>
                                <li>• WhatsApp API (1K msgs)</li>
                                <li>• Discord Webhooks</li>
                                <li>• Monero APIs</li>
                                <li>• Vercel Hosting</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">
                                Funcionalidades:
                            </h4>
                            <ul className="space-y-1">
                                <li>• PIX QR codes</li>
                                <li>• Monero verification</li>
                                <li>• WhatsApp bot</li>
                                <li>• Discord notifications</li>
                                <li>• Order tracking</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                            <strong>Custo total:</strong> R$ 0/mês para até
                            1.000 transações
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
