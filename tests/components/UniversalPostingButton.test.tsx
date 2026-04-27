import UniversalPostingButton from "@/components/publish/UniversalPostingButton"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

describe("UniversalPostingButton", () => {
    it("renders button with correct label", () => {
        render(<UniversalPostingButton linkedNetworksCount={3} />)
        expect(screen.getByRole("button")).toBeInTheDocument()
    })

    it("displays network count badge", () => {
        render(<UniversalPostingButton linkedNetworksCount={5} />)
        expect(screen.getByText("5")).toBeInTheDocument()
    })

    it("disables button when no networks linked", () => {
        render(
            <UniversalPostingButton linkedNetworksCount={0} isDisabled={true} />
        )
        expect(screen.getByRole("button")).toBeDisabled()
    })

    it("calls onOpen callback when clicked", () => {
        const onOpen = vi.fn()
        render(
            <UniversalPostingButton linkedNetworksCount={2} onOpen={onOpen} />
        )
        fireEvent.click(screen.getByRole("button"))
        expect(onOpen).toHaveBeenCalled()
    })

    it("has proper accessibility attributes", () => {
        render(<UniversalPostingButton linkedNetworksCount={3} />)
        const button = screen.getByRole("button")
        expect(button).toHaveAttribute("aria-label")
    })

    it("shows tooltip with network count", () => {
        render(<UniversalPostingButton linkedNetworksCount={2} />)
        expect(screen.getByText(/Post to 2 networks/)).toBeInTheDocument()
    })

    it("shows disabled tooltip when no networks", () => {
        render(
            <UniversalPostingButton linkedNetworksCount={0} isDisabled={true} />
        )
        expect(
            screen.getByText(/Link social networks first/)
        ).toBeInTheDocument()
    })
})
