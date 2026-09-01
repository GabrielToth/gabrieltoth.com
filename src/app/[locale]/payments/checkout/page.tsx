"use client"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"

const PIX_ENDPOINT = "/api/payments/pix/create"

function CheckoutInner() {
    const search = useSearchParams()
    const t = useTranslations("payments")
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
                if (!res.ok) throw new Error(t("checkout.errorPayment"))
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
    }, [description, price, t])

    return (
        <section className="max-w-xl mx-auto px-4 py-16">
            <h1 className="text-2xl font-bold mb-4">{t("checkout.title")}</h1>
            {loading && (
                <p className="text-muted-foreground">
                    {t("checkout.generating")}
                </p>
            )}
            {error && <p className="text-red-600">{error}</p>}

            {qr && (
                <div className="rounded-lg border p-4">
                    {qr.qrCode && (
                        <div className="mb-4 flex justify-center">
                            <Image
                                src={qr.qrCode}
                                alt={t("checkout.qrAlt")}
                                width={220}
                                height={220}
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <div className="font-medium">
                            {t("checkout.copyPasteCode")}
                        </div>
                        <div className="text-xs break-all bg-muted dark:bg-background p-2 rounded">
                            {qr.copyPasteCode}
                        </div>
                        <button
                            className="mt-2 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary"
                            onClick={() =>
                                navigator.clipboard.writeText(qr.copyPasteCode)
                            }
                        >
                            {t("checkout.copyCode")}
                        </button>
                    </div>
                    {trackingCode && (
                        <p className="mt-4 text-xs text-muted-foreground">
                            {t("checkout.trackingCode", { code: trackingCode })}
                        </p>
                    )}
                </div>
            )}
        </section>
    )
}

export default function CheckoutPage() {
    const t = useTranslations("payments")
    return (
        <Suspense
            fallback={
                <section className="max-w-xl mx-auto px-4 py-16">
                    <p>{t("checkout.loading")}</p>
                </section>
            }
        >
            <CheckoutInner />
        </Suspense>
    )
}
