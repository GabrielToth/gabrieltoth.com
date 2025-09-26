import { generateWhatsAppMessage } from "@/app/[locale]/channel-management/channel-management-whatsapp-message"
import { describe, expect, it } from "vitest"

describe("generateWhatsAppMessage", () => {
    it("generates english message with Card label and USD symbol", () => {
        const url = generateWhatsAppMessage(
            "Express Analysis",
            499,
            false,
            "en"
        )
        expect(url).toMatch(/^https:\/\/wa\.me\/5511993313606\?text=/)
        expect(decodeURIComponent(url)).toContain(
            "Chosen plan: Express Analysis"
        )
        expect(decodeURIComponent(url)).toContain("Price: $ 499")
        expect(decodeURIComponent(url)).toContain("Payment method: Card")
    })

    it("generates pt-BR message with PIX/Cartão label and BRL symbol", () => {
        const url = generateWhatsAppMessage(
            "Análise Express",
            497,
            false,
            "pt-BR"
        )
        expect(url).toMatch(/^https:\/\/wa\.me\/5511993313606\?text=/)
        expect(decodeURIComponent(url)).toContain(
            "Plano escolhido: Análise Express"
        )
        expect(decodeURIComponent(url)).toContain("Valor: R$ 497")
        expect(decodeURIComponent(url)).toContain(
            "Forma de pagamento: PIX/Cartão"
        )
    })

    it("sets payment method Monero (XMR) when isMonero=true", () => {
        const url = generateWhatsAppMessage("Express Analysis", 300, true, "en")
        expect(decodeURIComponent(url)).toContain(
            "Payment method: Monero (XMR)"
        )
    })
})
