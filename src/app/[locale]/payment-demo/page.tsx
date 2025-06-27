"use client"

import { useLocale } from "@/hooks/use-locale"
import { useSearchParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { useEffect, useState } from "react"

export default function PaymentDemo() {
    const searchParams = useSearchParams()
    const { locale: currentLocale } = useLocale()
    const isPortuguese = currentLocale === "pt-BR"

    const method = searchParams.get("method")
    const amount = searchParams.get("amount")
    const type = searchParams.get("type")

    const [pixKey, setPixKey] = useState("")
    const [moneroAddress, setMoneroAddress] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simular carregamento dos dados
        setTimeout(() => {
            setPixKey(
                "00020126580014BR.GOV.BCB.PIX0136f5c32293-4b1e-4c39-a91b-011f1e23d6a90217Doacao para Gabriel5204000053039865802BR5925Gabriel Toth Goncalves6009SAO PAULO62070503***6304E2CA"
            )
            setMoneroAddress(
                "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A"
            )
            setLoading(false)
        }, 1500)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
                    <h2 className="text-2xl font-bold mt-8">
                        {isPortuguese
                            ? "Gerando pagamento..."
                            : "Generating payment..."}
                    </h2>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">
                    {isPortuguese ? "Detalhes do Pagamento" : "Payment Details"}
                </h1>

                <div className="bg-gray-800 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {isPortuguese ? "Resumo" : "Summary"}
                    </h2>
                    <div className="grid gap-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">
                                {isPortuguese ? "Método" : "Method"}:
                            </span>
                            <span className="font-medium">
                                {method?.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">
                                {isPortuguese ? "Valor" : "Amount"}:
                            </span>
                            <span className="font-medium">R$ {amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">
                                {isPortuguese ? "Tipo" : "Type"}:
                            </span>
                            <span className="font-medium">
                                {type === "monthly"
                                    ? isPortuguese
                                        ? "Mensal"
                                        : "Monthly"
                                    : isPortuguese
                                      ? "Único"
                                      : "One-time"}
                            </span>
                        </div>
                    </div>
                </div>

                {method === "pix" && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {isPortuguese ? "QR Code PIX" : "PIX QR Code"}
                        </h2>
                        <div className="bg-white p-4 rounded-lg w-fit mx-auto mb-4">
                            <QRCodeSVG value={pixKey} size={256} />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    {isPortuguese ? "Chave PIX" : "PIX Key"}
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={pixKey}
                                        readOnly
                                        title={
                                            isPortuguese
                                                ? "Chave PIX"
                                                : "PIX Key"
                                        }
                                        aria-label={
                                            isPortuguese
                                                ? "Chave PIX"
                                                : "PIX Key"
                                        }
                                        className="flex-1 bg-gray-700 rounded-l px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                pixKey
                                            )
                                        }
                                        className="bg-purple-600 text-white px-4 rounded-r hover:bg-purple-700 transition-colors"
                                    >
                                        {isPortuguese ? "Copiar" : "Copy"}
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400">
                                {isPortuguese
                                    ? "Escaneie o QR Code acima ou copie a chave PIX para fazer o pagamento."
                                    : "Scan the QR Code above or copy the PIX key to make the payment."}
                            </p>
                        </div>
                    </div>
                )}

                {method === "monero" && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {isPortuguese
                                ? "Endereço Monero"
                                : "Monero Address"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    {isPortuguese
                                        ? "Endereço XMR"
                                        : "XMR Address"}
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={moneroAddress}
                                        readOnly
                                        title={
                                            isPortuguese
                                                ? "Endereço Monero"
                                                : "Monero Address"
                                        }
                                        aria-label={
                                            isPortuguese
                                                ? "Endereço Monero"
                                                : "Monero Address"
                                        }
                                        className="flex-1 bg-gray-700 rounded-l px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                moneroAddress
                                            )
                                        }
                                        className="bg-purple-600 text-white px-4 rounded-r hover:bg-purple-700 transition-colors"
                                    >
                                        {isPortuguese ? "Copiar" : "Copy"}
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-700 rounded p-4">
                                <h3 className="font-medium mb-2">
                                    {isPortuguese
                                        ? "Instruções"
                                        : "Instructions"}
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                                    <li>
                                        {isPortuguese
                                            ? "Copie o endereço Monero acima"
                                            : "Copy the Monero address above"}
                                    </li>
                                    <li>
                                        {isPortuguese
                                            ? "Abra sua carteira Monero"
                                            : "Open your Monero wallet"}
                                    </li>
                                    <li>
                                        {isPortuguese
                                            ? "Envie a quantidade equivalente em XMR"
                                            : "Send the equivalent amount in XMR"}
                                    </li>
                                    <li>
                                        {isPortuguese
                                            ? "Aguarde a confirmação da transação"
                                            : "Wait for transaction confirmation"}
                                    </li>
                                </ol>
                            </div>
                            {type === "monthly" && (
                                <div className="bg-purple-900/50 rounded p-4 text-sm">
                                    <p>
                                        {isPortuguese
                                            ? "Para apoio mensal, por favor envie o mesmo valor todo mês. Você receberá lembretes por email."
                                            : "For monthly support, please send the same amount every month. You will receive email reminders."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
