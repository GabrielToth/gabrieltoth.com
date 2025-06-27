"use client"

import SimplePaymentDemo from "@/components/payments/simple-payment-demo"
import { Suspense } from "react"

export default function PaymentDemoPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white py-20">
            <div className="max-w-4xl mx-auto px-4">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center min-h-[50vh]">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-400">Carregando...</p>
                            </div>
                        </div>
                    }
                >
                    <SimplePaymentDemo />
                </Suspense>
            </div>
        </div>
    )
}
