"use client"

import WaveIGLSupportView from "@/app/[locale]/waveigl-support/waveigl-support-view"
import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"
import { useEffect, useRef, useState } from "react"

interface WaveIGLSupportClientPageProps {
    initialLocale: Locale
    translations: any
}

const MERCADO_PAGO_SCRIPT = `
(function() {
    function $MPC_load() {
        window.$MPC_loaded !== true && (function() {
            var s = document.createElement("script");
            s.type = "text/javascript";
            s.async = true;
            s.src = document.location.protocol + "//secure.mlstatic.com/mptools/render.js";
            var x = document.getElementsByTagName('script')[0];
            x.parentNode.insertBefore(s, x);
            window.$MPC_loaded = true;
        })();
    }
    window.$MPC_loaded !== true ? (window.attachEvent ? window.attachEvent('onload', $MPC_load) : window.addEventListener('load', $MPC_load, false)) : null;
})();
`

export default function WaveIGLSupportClientPage({
    initialLocale,
    translations,
}: WaveIGLSupportClientPageProps) {
    const { locale } = useLocale()
    const [selectedMethod, setSelectedMethod] = useState<"pix" | "monero">(
        "pix"
    )
    const [customAmount, setCustomAmount] = useState("")
    const [paymentType, setPaymentType] = useState<"one-time" | "subscription">(
        "subscription"
    )
    const donationSectionRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const script = document.createElement("script")
        script.type = "text/javascript"
        script.text = MERCADO_PAGO_SCRIPT
        document.body.appendChild(script)

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const scrollToDonation = () => {
        donationSectionRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const handlePaymentMethodClick = async (method: "monero" | "pix") => {
        if (!customAmount) {
            alert(translations.payment.alerts.enterAmount)
            return
        }

        const amount = Number(customAmount)

        if (method === "monero") {
            window.open(
                `/payment-demo?method=monero&amount=${amount}&type=${paymentType}`,
                "_blank"
            )
        } else if (method === "pix") {
            if (paymentType === "subscription") {
                alert(translations.payment.alerts.pixMonthlyNotSupported)
                return
            }
            window.open(
                `/payment-demo?method=pix&amount=${amount}&type=${paymentType}`,
                "_blank"
            )
        }
    }

    return (
        <WaveIGLSupportView
            locale={locale}
            translations={translations}
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
            customAmount={customAmount}
            setCustomAmount={setCustomAmount}
            paymentType={paymentType}
            setPaymentType={setPaymentType}
            onPaymentMethodClick={handlePaymentMethodClick}
            onScrollToDonation={scrollToDonation}
            donationSectionRef={donationSectionRef}
        />
    )
}
