import SimplePaymentDemo from "@/components/payments/simple-payment-demo"

export default function PaymentDemoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            <div className="container mx-auto py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">
                        Sistema de Pagamento 100% Gratuito
                    </h1>
                    <p className="text-xl text-muted-foreground mb-2">
                        PIX + Monero + WhatsApp Bot + Discord - Vercel Free Tier
                    </p>
                    <div className="flex justify-center gap-4 text-sm">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            PIX: 0% taxa
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                            Monero: ~$0.01 taxa
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            Discord: Grátis
                        </span>
                    </div>
                </div>

                <SimplePaymentDemo serviceType="SpeedPC Gaming" amount={249} />

                <div className="mt-12 text-center">
                    <div className="bg-card p-6 rounded-lg max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            🎯 100% Gratuito na Vercel
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div>
                                <h3 className="font-semibold text-green-600 mb-2">
                                    ✅ Vercel Free:
                                </h3>
                                <ul className="text-sm space-y-1">
                                    <li>• APIs de pagamento</li>
                                    <li>• WhatsApp webhooks</li>
                                    <li>• PIX QR generation</li>
                                    <li>• Monero verification</li>
                                    <li>• Order tracking</li>
                                    <li>• Frontend completo</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-600 mb-2">
                                    🆓 Serviços Externos:
                                </h3>
                                <ul className="text-sm space-y-1">
                                    <li>• Supabase (500MB)</li>
                                    <li>• WhatsApp API (1K msgs)</li>
                                    <li>• Discord Webhooks</li>
                                    <li>• Monero explorers</li>
                                    <li>• Exchange rate APIs</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-purple-600 mb-2">
                                    🚀 Funcionalidades:
                                </h3>
                                <ul className="text-sm space-y-1">
                                    <li>• Verificação automática</li>
                                    <li>• WhatsApp bot completo</li>
                                    <li>• Discord notifications</li>
                                    <li>• Tracking em tempo real</li>
                                    <li>• Pagamentos anônimos</li>
                                    <li>• Mobile-friendly</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <p className="text-sm">
                                <strong>Custo total:</strong> R$ 0/mês (para até
                                1.000 transações/mês)
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Supabase: 500MB grátis • WhatsApp: 1K mensagens
                                grátis • Discord: Webhooks gratuitos • Vercel:
                                100GB bandwidth grátis
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
