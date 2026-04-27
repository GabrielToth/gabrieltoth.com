import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { UniversalPostingButton } from "./UniversalPostingButton"

describe("UniversalPostingButton", () => {
    it("renders button with network count", () => {
        render(
            <UniversalPostingButton
                linkedNetworksCount={3}
                isDisabled={false}
            />
        )

        const button = screen.getByRole("button")
        expect(button).toBeInTheDocument()
        expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("displays disabled state when no networks", () => {
        render(
            <UniversalPostingButton linkedNetworksCount={0} isDisabled={true} />
        )

        const button = screen.getByRole("button")
        expect(button).toBeDisabled()
    })

    it("calls onOpen when clicked", () => {
        const onOpen = vi.fn()
        render(
            <UniversalPostingButton
                linkedNetworksCount={2}
                isDisabled={false}
                onOpen={onOpen}
            />
        )

        const button = screen.getByRole("button")
        fireEvent.click(button)

        expect(onOpen).toHaveBeenCalled()
    })

    it("does not call onOpen when disabled", () => {
        const onOpen = vi.fn()
        render(
            <UniversalPostingButton
                linkedNetworksCount={0}
                isDisabled={true}
                onOpen={onOpen}
            />
        )

        const button = screen.getByRole("button")
        fireEvent.click(button)

        expect(onOpen).not.toHaveBeenCalled()
    })

    it("supports keyboard navigation with Enter key", () => {
        const onOpen = vi.fn()
        render(
            <UniversalPostingButton
                linkedNetworksCount={2}
                isDisabled={false}
                onOpen={onOpen}
            />
        )

        const button = screen.getByRole("button")
        fireEvent.keyDown(button, { key: "Enter" })

        expect(onOpen).toHaveBeenCalled()
    })

    it("supports keyboard navigation with Space key", () => {
        const onOpen = vi.fn()
        render(
            <UniversalPostingButton
                linkedNetworksCount={2}
                isDisabled={false}
                onOpen={onOpen}
            />
        )

        const button = screen.getByRole("button")
        fireEvent.keyDown(button, { key: " " })

        expect(onOpen).toHaveBeenCalled()
    })

    it("has proper ARIA labels", () => {
        render(
            <UniversalPostingButton
                linkedNetworksCount={3}
                isDisabled={false}
            />
        )

        const button = screen.getByRole("button")
        expect(button).toHaveAttribute(
            "aria-label",
            expect.stringContaining("3 networks linked")
        )
    })

    it("displays tooltip text on hover for disabled state", () => {
        render(
            <UniversalPostingButton linkedNetworksCount={0} isDisabled={true} />
        )

        const button = screen.getByRole("button")
        expect(button).toHaveAttribute("title")
    })
})
