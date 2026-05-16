import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TurnstileWidget from "./turnstile-widget"

describe("TurnstileWidget Component", () => {
    beforeEach(() => {
        // Mock the Turnstile API
        global.window.turnstile = {
            render: vi.fn(() => "widget-id-123"),
            reset: vi.fn(),
            remove: vi.fn(),
            getResponse: vi.fn(() => "token-123"),
        }

        // Mock environment variable
        process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY = "test-site-key"
    })

    afterEach(() => {
        vi.clearAllMocks()
        delete (global.window as any).turnstile
    })

    it("should render the widget container", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

        const container = document.getElementById("turnstile-widget")
        expect(container).toBeInTheDocument()
    })

    it("should render widget with correct configuration", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="dark"
                size="compact"
                language="pt"
            />
        )

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

    it("should call onTokenChange when CAPTCHA is solved", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

        const renderCall = (window.turnstile.render as any).mock.calls[0]
        const callback = renderCall[1].callback
        callback("test-token-123")
        expect(mockOnTokenChange).toHaveBeenCalledWith("test-token-123")
    })

    it("should call onTokenChange with null on error", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

        const renderCall = (window.turnstile.render as any).mock.calls[0]
        const errorCallback = renderCall[1]["error-callback"]
        errorCallback()
        expect(mockOnTokenChange).toHaveBeenCalledWith(null)
    })

    it("should call onTokenChange with null on expiration", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

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

    it("should support light theme", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

        expect(window.turnstile.render).toHaveBeenCalledWith(
            "#turnstile-widget",
            expect.objectContaining({
                theme: "light",
            })
        )
    })

    it("should support dark theme", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="dark"
                size="normal"
            />
        )

        expect(window.turnstile.render).toHaveBeenCalledWith(
            "#turnstile-widget",
            expect.objectContaining({
                theme: "dark",
            })
        )
    })

    it("should support normal size", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

        expect(window.turnstile.render).toHaveBeenCalledWith(
            "#turnstile-widget",
            expect.objectContaining({
                size: "normal",
            })
        )
    })

    it("should support compact size", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="compact"
            />
        )

        expect(window.turnstile.render).toHaveBeenCalledWith(
            "#turnstile-widget",
            expect.objectContaining({
                size: "compact",
            })
        )
    })

    it("should handle timeout callback", () => {
        const mockOnTokenChange = vi.fn()
        render(
            <TurnstileWidget
                onTokenChange={mockOnTokenChange}
                theme="light"
                size="normal"
            />
        )

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
