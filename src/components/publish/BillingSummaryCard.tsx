"use client"

import { CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"

interface BillingBreakdown {
    baseFee: number
    storageCostPerDay: number
    storageDays: number
    bandwidthCost: number
    total: number
    storageMode: "cloud" | "local"
}

export interface BillingSummaryCardProps {
    breakdown: BillingBreakdown
    refundOnCancel?: number
}

export default function BillingSummaryCard({
    breakdown,
    refundOnCancel,
}: BillingSummaryCardProps) {
    const t = useTranslations("publish")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    {t("billingSummary.title")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {breakdown.storageMode === "cloud" ? (
                    <>
                        <div className="flex justify-between">
                            <span>{t("billingSummary.cloudStorage")}</span>
                            <span className="text-xs text-gray-500">
                                {t("billingSummary.cancelRefund", {
                                    amount: refundOnCancel?.toFixed(2) ?? "0.00",
                                })}
                            </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>{t("billingSummary.baseFee")}</span>
                            <span>{breakdown.baseFee.toFixed(2)} cr</span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>
                                {t("billingSummary.storageCost", {
                                    days: breakdown.storageDays,
                                    rate: breakdown.storageCostPerDay.toFixed(2),
                                })}
                            </span>
                            <span>
                                {(
                                    breakdown.storageCostPerDay *
                                    breakdown.storageDays
                                ).toFixed(2)}{" "}
                                cr
                            </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                            <span>{t("billingSummary.bandwidthCost")}</span>
                            <span>{breakdown.bandwidthCost.toFixed(2)} cr</span>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-between text-gray-600">
                        <span>{t("billingSummary.localStorage")}</span>
                        <span>0 cr</span>
                    </div>
                )}

                <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                        <span>{t("billingSummary.total")}</span>
                        <span>{breakdown.total.toFixed(2)} cr</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
