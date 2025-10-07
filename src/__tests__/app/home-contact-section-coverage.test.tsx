import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Minimal mocks for next-intl and use-locale
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k }))
vi.mock("@/hooks/use-locale", () => ({ useLocale: () => ({ locale: "en" }) }))

describe("home/contact-section coverage", () => {
    const fetchSpy = vi.spyOn(globalThis as any, "fetch")

    beforeEach(() => {
        fetchSpy.mockReset()
        // Remove any existing script
        const old = document.getElementById("cf-turnstile-script")
        if (old && old.parentNode) old.parentNode.removeChild(old)
    })

    it("injects Turnstile script once and submits success", async () => {
        const Mod = await import("@/app/[locale]/home/contact-section")
        fetchSpy.mockResolvedValueOnce({ ok: true } as any)

        render(React.createElement((Mod as any).default))

        // Script appended
        await waitFor(() =>
            expect(document.getElementById("cf-turnstile-script")).toBeTruthy()
        )

        fireEvent.change(screen.getByTestId("contact-name"), {
            target: { value: "John" },
        })
        fireEvent.change(screen.getByTestId("contact-email"), {
            target: { value: "john@example.com" },
        })
        fireEvent.change(screen.getByTestId("contact-subject"), {
            target: { value: "Hello" },
        })
        fireEvent.change(screen.getByTestId("contact-message"), {
            target: { value: "World" },
        })

        fireEvent.submit(screen.getByTestId("contact-form"))

        expect(fetchSpy).toHaveBeenCalledWith(
            "/api/contact",
            expect.objectContaining({ method: "POST" })
        )
        expect(await screen.findByTestId("contact-success")).toBeTruthy()
    })

    it("handles server error and shows error message", async () => {
        const Mod = await import("@/app/[locale]/home/contact-section")
        fetchSpy.mockResolvedValueOnce({ ok: false } as any)

        render(React.createElement((Mod as any).default))

        fireEvent.change(screen.getByTestId("contact-name"), {
            target: { value: "John" },
        })
        fireEvent.change(screen.getByTestId("contact-email"), {
            target: { value: "john@example.com" },
        })
        fireEvent.change(screen.getByTestId("contact-subject"), {
            target: { value: "Hello" },
        })
        fireEvent.change(screen.getByTestId("contact-message"), {
            target: { value: "World" },
        })
        fireEvent.submit(screen.getByTestId("contact-form"))

        expect(await screen.findByTestId("contact-error")).toBeTruthy()
    })

    it("does not inject script twice when already present and reveals turnstile", async () => {
        const existing = document.createElement("script")
        existing.id = "cf-turnstile-script"
        document.body.appendChild(existing)

        const Mod = await import("@/app/[locale]/home/contact-section")
        render(React.createElement((Mod as any).default))

        // Should not append a new script (same element remains)
        expect(document.getElementById("cf-turnstile-script")).toBe(existing)

        // Turnstile container should become visible (hidden=false)
        await waitFor(() => {
            const el = document.querySelector(".cf-turnstile") as HTMLElement
            expect(el).toBeTruthy()
            expect(el.hasAttribute("hidden")).toBe(false)
        })
    })

    it("adds locale to FormData, disables during submit and resets on success", async () => {
        const Mod = await import("@/app/[locale]/home/contact-section")

        const impl = vi
            .fn()
            .mockImplementationOnce(async (_url: any, init: any) => {
                const body = init?.body
                expect(body instanceof FormData).toBe(true)
                if (body instanceof FormData) {
                    expect(body.get("locale")).toBe("en")
                    expect(body.get("name")).toBe("John")
                }
                return { ok: true } as any
            })
        fetchSpy.mockImplementationOnce(impl)

        render(React.createElement((Mod as any).default))

        const name = screen.getByTestId("contact-name") as HTMLInputElement
        const email = screen.getByTestId("contact-email") as HTMLInputElement
        const subject = screen.getByTestId(
            "contact-subject"
        ) as HTMLInputElement
        const message = screen.getByTestId(
            "contact-message"
        ) as HTMLTextAreaElement

        fireEvent.change(name, { target: { value: "John" } })
        fireEvent.change(email, { target: { value: "john@example.com" } })
        fireEvent.change(subject, { target: { value: "Hello" } })
        fireEvent.change(message, { target: { value: "World" } })

        const submitBtn = screen.getByTestId(
            "contact-submit"
        ) as HTMLButtonElement
        fireEvent.submit(screen.getByTestId("contact-form"))

        // Disabled immediately during submit
        expect(submitBtn.disabled).toBe(true)

        // Success appears and inputs reset
        await screen.findByTestId("contact-success")
        expect(name.value).toBe("")
        expect(email.value).toBe("")
        expect(subject.value).toBe("")
        expect(message.value).toBe("")
    })
})
