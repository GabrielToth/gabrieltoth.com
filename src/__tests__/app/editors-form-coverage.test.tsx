import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("app/[locale]/editors/editors-form coverage", () => {
    const fetchSpy = vi.spyOn(globalThis as any, "fetch")

    beforeEach(() => {
        fetchSpy.mockReset()
    })

    afterEach(() => {
        fetchSpy.mockReset()
    })

    it("submits editor application in EN and shows success", async () => {
        const mod = await import("@/app/[locale]/editors/editors-form")
        fetchSpy.mockResolvedValueOnce({ ok: true } as any)

        render(
            React.createElement((mod as any).default, {
                locale: "en",
                type: "editor-application",
            })
        )

        const nameInput = screen.getAllByRole("textbox")[0]
        fireEvent.change(nameInput, {
            target: { value: "John Doe" },
        })
        const emailInput = screen.getAllByRole("textbox")[1]
        fireEvent.change(emailInput, {
            target: { value: "john@example.com" },
        })
        // Select required experience level
        const level = screen.getByRole("combobox", {
            name: /experience level/i,
        })
        fireEvent.change(level, { target: { value: "Intermediate" } })

        fireEvent.click(
            screen.getByRole("button", { name: /submit application/i })
        )

        expect(fetchSpy).toHaveBeenCalledWith(
            "/api/contact",
            expect.objectContaining({ method: "POST" })
        )

        // Success screen in EN
        expect(await screen.findByText(/application submitted!/i)).toBeTruthy()
    })

    it("submits channel management request in PT-BR and shows success", async () => {
        const mod = await import("@/app/[locale]/editors/editors-form")
        fetchSpy.mockResolvedValueOnce({ ok: true } as any)

        render(
            React.createElement((mod as any).default, {
                locale: "pt-BR",
                type: "channel-management",
            })
        )

        const inputs = screen.getAllByRole("textbox")
        fireEvent.change(inputs[0], { target: { value: "Fulano de Tal" } })
        fireEvent.change(inputs[1], { target: { value: "fulano@example.com" } })
        // Fill required channel fields
        fireEvent.change(
            inputs.find(
                el =>
                    (el as HTMLInputElement).type === "text" &&
                    (el as HTMLInputElement).placeholder?.includes("canal")
            )!,
            { target: { value: "Canal X" } }
        )
        fireEvent.change(
            inputs.find(el => (el as HTMLInputElement).type === "url")!,
            { target: { value: "https://youtube.com/@canalx" } }
        )

        fireEvent.click(
            screen.getByRole("button", { name: /solicitar consultoria/i })
        )

        expect(fetchSpy).toHaveBeenCalledWith(
            "/api/contact",
            expect.objectContaining({ method: "POST" })
        )
        expect(await screen.findByText(/aplicação enviada!/i)).toBeTruthy()
    })
})

describe("editors form coverage", () => {
    it("submits editor-application and shows success", async () => {
        const { default: ApplicationForm } =
            await import("@/app/[locale]/editors/editors-form")

        const fetchMock = vi.fn().mockResolvedValue({ ok: true })
        ;(globalThis as any).fetch = fetchMock

        render(
            React.createElement(ApplicationForm as any, {
                locale: "en",
                type: "editor-application",
            })
        )

        fireEvent.change(screen.getByPlaceholderText(/your full name/i), {
            target: { value: "John" },
        })
        fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
            target: { value: "john@example.com" },
        })

        fireEvent.change(screen.getByLabelText(/Experience level/i), {
            target: { value: "Beginner" },
        })

        fireEvent.click(
            screen.getByRole("button", { name: /Submit Application/i })
        )

        expect(fetchMock).toHaveBeenCalled()
        expect(
            await screen.findByText(/Application Submitted!/i)
        ).toBeInTheDocument()
    })

    it("submits channel-management path", async () => {
        const { default: ApplicationForm } =
            await import("@/app/[locale]/editors/editors-form")

        ;(globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true })

        render(
            React.createElement(ApplicationForm as any, {
                locale: "en",
                type: "channel-management",
            })
        )

        fireEvent.change(screen.getByPlaceholderText(/your full name/i), {
            target: { value: "Jane" },
        })
        fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
            target: { value: "jane@example.com" },
        })

        fireEvent.change(screen.getByPlaceholderText(/your channel name/i), {
            target: { value: "My Channel" },
        })
        fireEvent.change(
            screen.getByPlaceholderText(/https:\/\/youtube.com\/@yourchannel/i),
            { target: { value: "https://youtube.com/@mychannel" } }
        )

        fireEvent.click(
            screen.getByRole("button", { name: /Request Consulting/i })
        )

        expect(await screen.findByText(/Application Submitted!/i)).toBeTruthy()
    })
})
