import WhatsAppButton from "@/components/ui/whatsapp-button"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("WhatsAppButton", () => {
    beforeEach(() => {
        // @ts-ignore
        window.open = vi.fn()
    })

    it("opens whatsapp link on click", () => {
        render(
            <WhatsAppButton message="Hello World" phoneNumber="5511999999999">
                Contact
            </WhatsAppButton>
        )
        fireEvent.click(screen.getByRole("button", { name: /contact/i }))
        expect(window.open).toHaveBeenCalled()
        const url = (window.open as any).mock.calls[0][0] as string
        expect(url).toContain("https://wa.me/5511999999999")
        expect(url).toContain(encodeURIComponent("Hello World"))
    })
})
