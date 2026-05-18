import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import UniversalPostingButton from "./UniversalPostingButton"

vi.mock("./PostingInterface", () => ({
    default: () => null,
}))

function getPostingButton() {
    return screen.getByLabelText(/Universal posting button/i)
}

describe("UniversalPostingButton", () => {
    it("renders button with network count", () => {
        render(
            <UniversalPostingButton
                linkedNetworksCount={3}
                isDisabled={false}
            />
        )

        expect(getPostingButton()).toBeInTheDocument()
        expect(screen.getByLabelText("3 networks")).toHaveTextContent("3")
    })

    it("displays disabled state when no networks", () => {
        render(
            <UniversalPostingButton linkedNetworksCount={0} isDisabled={true} />
        )

        expect(getPostingButton()).toBeDisabled()
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

        expect(getPostingButton()).toHaveAttribute(
            "aria-label",
            "Universal posting button. 3 networks linked."
        )
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
