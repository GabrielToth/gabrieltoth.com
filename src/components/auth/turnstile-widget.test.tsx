import { render, waitFor } from "@testing-library/react"
import type React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TurnstileWidget from "./turnstile-widget"

describe("TurnstileWidget Component", () => {
    async function renderWidget(
        props: React.ComponentProps<typeof TurnstileWidget>
    ) {
        const result = render(<TurnstileWidget {...props} />)
        await waitFor(() => {
            expect(window.turnstile.render).toHaveBeenCalled()
        })
        return result
    }

    beforeEach(() => {
        document.getElementById("turnstile-script")?.remove()
        const script = document.createElement("script")
        script.id = "turnstile-script"
        document.head.appendChild(script)

        window.turnstile = {
            render: vi.fn(() => "widget-id-123"),
            reset: vi.fn(),
            remove: vi.fn(),
            getResponse: vi.fn(() => "token-123"),
        }

        process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = "test-site-key"
    })

    afterEach(() => {
        vi.clearAllMocks()
        document.getElementById("turnstile-script")?.remove()
        ;(window as any).turnstile = undefined
    })

    it("should render the widget container", async () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

        await waitFor(() => {
            expect(
                document.getElementById("turnstile-widget")
            ).toBeInTheDocument()
        })
    })

    it("should render widget with correct configuration", async () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="dark"
                size="compact"
                language="pt"
            />
        )

        await waitFor(() => {
            expect(window.turnstile.render).toHaveBeenCalledWith(
                "#turnstile-widget",
                expect.objectContaining({
                    sitekey: "test-site-key",
                    theme: "dark",
                    size: "compact",
                    language: "pt",
                })
            )
        })
    })

    it("should call onTokenChange when CAPTCHA is solved", async () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

        await waitFor(() => {
            expect(window.turnstile.render).toHaveBeenCalled()
        })
        const renderCall = (window.turnstile.render as any).mock.calls[0]
        const callback = renderCall[1].callback
        callback("test-token-123")
        expect(mockOnTokenChange).toHaveBeenCalledWith("test-token-123")
    })

    it("should call onTokenChange with null on error", async () => {
        const mockOnTokenChange = vi.fn()
        await renderWidget({
            onTokenChange: mockOnTokenChange,
            theme: "light",
            size: "normal",
        })

        const renderCall = (window.turnstile.render as any).mock.calls[0]
        const errorCallback = renderCall[1]["error-callback"]
        errorCallback()
        expect(mockOnTokenChange).toHaveBeenCalledWith(null)
    })

    it("should call onTokenChange with null on expiration", async () => {
        const mockOnTokenChange = vi.fn()
        await renderWidget({
            onTokenChange: mockOnTokenChange,
            theme: "light",
            size: "normal",
        })

        const renderCall = (window.turnstile.render as any).mock.calls[0]
        const expiredCallback = renderCall[1]["expired-callback"]
        expiredCallback()
        expect(mockOnTokenChange).toHaveBeenCalledWith(null)
    })

    it("should apply custom className", () => {
        const mockOnTokenChange = vi.fn()
        const { container } = render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
                className="custom-class"
            />
        )

        const wrapper = container.querySelector(".custom-class")
        expect(wrapper).toBeInTheDocument()
    })

    it("should support light theme", async () => {
        const mockOnTokenChange = vi.fn()
        await renderWidget({
            onTokenChange: mockOnTokenChange,
            theme: "light",
            size: "normal",
        })

        expect(window.turnstile.render).toHaveBeenCalledWith(
            "#turnstile-widget",
            expect.objectContaining({
                theme: "light",
            })
        )
    })

    it("should support dark theme", async () => {
        const mockOnTokenChange = vi.fn()
        await renderWidget({
            onTokenChange: mockOnTokenChange,
            theme: "dark",
            size: "normal",
        })

        expect(window.turnstile.render).toHaveBeenCalledWith(
            "#turnstile-widget",
            expect.objectContaining({
                theme: "dark",
            })
        )
    })

    it("should support normal size", async () => {
        const mockOnTokenChange = vi.fn()
        await renderWidget({
            onTokenChange: mockOnTokenChange,
            theme: "light",
            size: "normal",
        })

        expect(window.turnstile.render).toHaveBeenCalledWith(
            "#turnstile-widget",
            expect.objectContaining({
                size: "normal",
            })
        )
    })

    it("should support compact size", async () => {
        const mockOnTokenChange = vi.fn()
        await renderWidget({
            onTokenChange: mockOnTokenChange,
            theme: "light",
            size: "compact",
        })

        expect(window.turnstile.render).toHaveBeenCalledWith(
            "#turnstile-widget",
            expect.objectContaining({
                size: "compact",
            })
        )
    })

    it("should handle timeout callback", async () => {
        const mockOnTokenChange = vi.fn()
        await renderWidget({
            onTokenChange: mockOnTokenChange,
            theme: "light",
            size: "normal",
        })

        const renderCall = (window.turnstile.render as any).mock.calls[0]
        const timeoutCallback = renderCall[1]["timeout-callback"]
        timeoutCallback()
        expect(mockOnTokenChange).toHaveBeenCalledWith(null)
    })

    it("should have correct TypeScript types", () => {
        const mockOnTokenChange = vi.fn()
        const component = (
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
                language="en"
                className="test-class"
            />
        )
        expect(component).toBeDefined()
    })
})
