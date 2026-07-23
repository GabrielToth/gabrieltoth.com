import { generateWhatsAppMessage } from "@/app/[locale]/channel-management/channel-management-whatsapp-message"
import { describe, expect, it } from "vitest"

const enTemplate = "Hello! I'm interested in channel consulting.%0A%0A📋 Chosen plan: {planName}%0A💰 Price: {currency} {price}%0A💳 Payment method: {paymentMethod}%0A%0AName:%0AYouTube Channel:%0AYour main goal:%0AContent type:%0APosting frequency:%0A%0ALooking forward to hearing from you!"
const ptBrTemplate = "Olá! Tenho interesse na consultoria de canal.%0A%0A📋 Plano escolhido: {planName}%0A💰 Valor: {currency} {price}%0A💳 Forma de pagamento: {paymentMethod}%0A%0ANome:%0ACanal do YouTube:%0AQual seu principal objetivo:%0ATipo de conteúdo:%0AFrequência de postagem:%0A%0AAguardo o contato!"

describe("generateWhatsAppMessage", () => {
    it("generates english message with Card label and USD symbol", () => {
        const url = generateWhatsAppMessage(
            "Express Analysis",
            499,
            false,
            "Card",
            "$",
            enTemplate
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
            "PIX/Cartão",
            "R$",
            ptBrTemplate
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
        const url = generateWhatsAppMessage("Express Analysis", 300, true, "Card", "$", enTemplate)
        expect(decodeURIComponent(url)).toContain(
            "Payment method: Monero (XMR)"
        )
    })
})
