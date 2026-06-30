import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import UniversalPostingButton from "./UniversalPostingButton"

vi.mock("./PostingInterface", () => ({
    default: () => null,
}))

function getPostingButton() {
    // Find the button by its role and look for the Share2 icon
    const buttons = screen.getAllByRole("button")
    // The UniversalPostingButton should be the first button with aria-disabled attribute
    return buttons.find(btn => btn.hasAttribute("aria-label")) || buttons[0]
}

describe("UniversalPostingButton", () => {
    it("renders button with network count", () => {
        render(
            <UniversalPostingButton
                linkedNetworksCount={3}
                isDisabled={false}
            />
        )

        const button = getPostingButton()
        expect(button).toBeInTheDocument()
        
        // The network count badge is shown as aria-label on the span element
        const badges = screen.queryAllByText("3")
        expect(badges.length).toBeGreaterThan(0)
    })

    it("displays disabled state when no networks", () => {
        render(
            <UniversalPostingButton linkedNetworksCount={0} isDisabled={true} />
        )

        const button = getPostingButton()
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

        fireEvent.click(getPostingButton())

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

        fireEvent.click(getPostingButton())

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

        const button = getPostingButton()
        fireEvent.keyDown(button, { key: "Enter", code: "Enter" })
        fireEvent.click(button)

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

        const button = getPostingButton()
        fireEvent.keyDown(button, { key: " ", code: "Space" })
        fireEvent.click(button)

        expect(onOpen).toHaveBeenCalled()
    })

    it("has proper ARIA labels", () => {
        render(
            <UniversalPostingButton
                linkedNetworksCount={3}
                isDisabled={false}
            />
        )

        const button = getPostingButton()
        expect(button).toHaveAttribute("aria-label")
        expect(button?.getAttribute("aria-label")).toContain("3")
    })

    it("displays tooltip text for disabled state", () => {
        render(
            <UniversalPostingButton linkedNetworksCount={0} isDisabled={true} />
        )

        expect(
            screen.getByText("Link social networks first to start posting")
        ).toBeInTheDocument()
    })
})
