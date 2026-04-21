import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Toggle } from "./toggle"

describe("Toggle Component", () => {
    it("renders toggle button", () => {
        render(<Toggle aria-label="Toggle test">Toggle</Toggle>)

        const button = screen.getByRole("button", { name: "Toggle test" })
        expect(button).toBeInTheDocument()
    })

    it("toggles pressed state when clicked", async () => {
        const user = userEvent.setup()
        render(<Toggle aria-label="Toggle test">Toggle</Toggle>)

        const button = screen.getByRole("button", { name: "Toggle test" })
        expect(button).toHaveAttribute("data-state", "off")

        await user.click(button)
        expect(button).toHaveAttribute("data-state", "on")

        await user.click(button)
        expect(button).toHaveAttribute("data-state", "off")
    })

    it("starts pressed when defaultPressed is true", () => {
        render(
            <Toggle defaultPressed aria-label="Toggle test">
                Toggle
            </Toggle>
        )

        const button = screen.getByRole("button", { name: "Toggle test" })
        expect(button).toHaveAttribute("data-state", "on")
    })

    it("disables toggle when disabled prop is set", () => {
        render(
            <Toggle disabled aria-label="Toggle test">
                Toggle
            </Toggle>
        )

        const button = screen.getByRole("button", { name: "Toggle test" })
        expect(button).toBeDisabled()
    })

    it("applies size variants correctly", () => {
        const { rerender } = render(
            <Toggle size="sm" aria-label="Toggle test">
                Toggle
            </Toggle>
        )

        let button = screen.getByRole("button", { name: "Toggle test" })
        expect(button).toHaveClass("h-9")

        rerender(
            <Toggle size="lg" aria-label="Toggle test">
                Toggle
            </Toggle>
        )

        button = screen.getByRole("button", { name: "Toggle test" })
        expect(button).toHaveClass("h-11")
    })
})
