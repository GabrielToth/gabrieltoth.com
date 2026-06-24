"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useTranslations } from "next-intl"
import React, { useState } from "react"
import { BillingInfo } from "./SettingsContainer"
import { downloadInvoice } from "@/lib/api/user"

/**
 * BillingSectionProps
 */
export interface BillingSectionProps {
    billing: BillingInfo
    onUpgrade: () => void
}

/**
 * BillingSection Component
 * Billing and subscription management
 * Current plan display
 * Plan details and price
 * Next billing date
 * Upgrade Plan button
 * Billing history with invoices
 * Download invoice functionality
 *
 * Features:
 * - Display current plan
 * - Show plan details
 * - Display next billing date
 * - Upgrade plan option
 * - Billing history
 * - Download invoices
 */
export const BillingSection: React.FC<BillingSectionProps> = ({
    billing,
    onUpgrade,
}) => {
    const t = useTranslations("dashboard.settings")
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<
        string | null
    >(null)

    /**
     * Handle invoice download
     */
    const handleDownloadInvoice = async (invoiceId: string) => {
        try {
            setDownloadingInvoiceId(invoiceId)
            const blob = await downloadInvoice(invoiceId)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `invoice-${invoiceId}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Failed to download invoice:", err)
        } finally {
            setDownloadingInvoiceId(null)
        }
    }

    /**
     * Format currency
     */
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }

    /**
     * Format date
     */
    const formatDate = (date: Date): string => {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(new Date(date))
    }

    /**
     * Get status badge color
     */
    const getStatusColor = (status: string): string => {
        switch (status) {
            case "paid":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "failed":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <div className="space-y-6">
            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("currentPlan")}</CardTitle>
                    <CardDescription>{t("planDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Plan Details */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {t("planValue", { plan: billing.plan }) ||
                                        billing.plan + " " + t("plan")}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    {t("youAreOnPlan", { plan: billing.plan })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(billing.price)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {t("perMonth")}
                                </p>
                            </div>
                        </div>

                        {/* Plan Features */}
                        <div className="mt-6 space-y-2">
                            <p className="text-sm font-medium text-gray-900">
                                {t("planIncludes")}:
                            </p>
                            <ul className="space-y-1 text-sm text-gray-700">
                                <li>✓ {t("unlimitedPosts")}</li>
                                <li>
                                    ✓ {t("connectedChannels", { count: 5 })}
                                </li>
                                <li>✓ {t("basicAnalytics")}</li>
                                <li>✓ {t("emailSupport")}</li>
                            </ul>
                        </div>

                        {/* Next Billing Date */}
                        <div className="mt-6 border-t border-blue-200 pt-4">
                            <p className="text-sm text-gray-600">
                                {t("nextBillingDate")}
                                <span className="font-medium text-gray-900">
                                    {formatDate(billing.nextBillingDate)}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Upgrade Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={onUpgrade}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {t("upgradePlan")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("billingHistory")}</CardTitle>
                    <CardDescription>
                        {t("billingHistoryDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {billing.invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            {t("date")}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            {t("amount")}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            {t("status")}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            {t("action")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billing.invoices.map(invoice => (
                                        <tr
                                            key={invoice.id}
                                            className="border-b border-gray-100 hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {formatDate(invoice.date)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {formatCurrency(invoice.amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                                        invoice.status
                                                    )}`}
                                                >
                                                    {invoice.status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        invoice.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleDownloadInvoice(
                                                            invoice.id
                                                        )
                                                    }
                                                    disabled={
                                                        downloadingInvoiceId ===
                                                        invoice.id
                                                    }
                                                >
                                                    {downloadingInvoiceId ===
                                                    invoice.id
                                                        ? t("downloading")
                                                        : t("download")}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-lg bg-gray-50 p-8 text-center">
                            <p className="text-sm text-gray-600">
                                {t("noInvoices")}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default BillingSection
