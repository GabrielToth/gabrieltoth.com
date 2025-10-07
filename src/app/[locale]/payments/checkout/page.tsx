"use client"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const PIX_ENDPOINT = "/api/payments/pix/create"

export default function CheckoutPage() {
    const search = useSearchParams()
    const price = Number(search.get("price") || 1)
    const product = search.get("product") || "iqtest"

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [qr, setQr] = useState<{
        qrCode: string
        copyPasteCode: string
    } | null>(null)
    const [trackingCode, setTrackingCode] = useState<string | null>(null)

    const description = useMemo(() => `${product}`, [product])

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch(PIX_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        serviceType: description,
                        amount: price,
                    }),
                })
                if (!res.ok) throw new Error("Failed to create PIX payment")
                const json = await res.json()
                setTrackingCode(json.order?.trackingCode || null)
                setQr({
                    qrCode: json.pix?.qrCode,
                    copyPasteCode: json.pix?.copyPasteCode,
                })
            } catch (e) {
                setError((e as Error).message)
            } finally {
                setLoading(false)
            }
        }
        run()
    }, [description, price])

    return (
        <section className="max-w-xl mx-auto px-4 py-16">
            <h1 className="text-2xl font-bold mb-4">IQ Test Payment</h1>
            {loading && (
                <p className="text-muted-foreground">Generating PIX…</p>
            )}
            {error && <p className="text-red-600">{error}</p>}

            {qr && (
                <div className="rounded-lg border p-4">
                    {qr.qrCode && (
                        <div className="mb-4 flex justify-center">
                            <Image
                                src={qr.qrCode}
                                alt="PIX QR"
                                width={220}
                                height={220}
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <div className="font-medium">Copy & Paste code</div>
                        <div className="text-xs break-all bg-gray-100 dark:bg-gray-900 p-2 rounded">
                            {qr.copyPasteCode}
                        </div>
                        <button
                            className="mt-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() =>
                                navigator.clipboard.writeText(qr.copyPasteCode)
                            }
                        >
                            Copy code
                        </button>
                    </div>
                    {trackingCode && (
                        <p className="mt-4 text-xs text-muted-foreground">
                            Tracking: {trackingCode}
                        </p>
                    )}
                </div>
            )}
        </section>
    )
}
