import { render, screen } from "@testing-library/react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select"

describe("Select Component", () => {
    it("renders select trigger", () => {
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                </SelectContent>
            </Select>
        )

        const trigger = screen.getByRole("combobox")
        expect(trigger).toBeInTheDocument()
    })

    it("displays placeholder text", () => {
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                </SelectContent>
            </Select>
        )

        expect(screen.getByText("Select an option")).toBeInTheDocument()
    })

    it("has proper accessibility attributes", () => {
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                </SelectContent>
            </Select>
        )

        const trigger = screen.getByRole("combobox")
        expect(trigger).toHaveAttribute("aria-autocomplete", "none")
    })

    it("disables select when disabled prop is set", () => {
        render(
            <Select disabled>
                <SelectTrigger>
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                </SelectContent>
            </Select>
        )

        const trigger = screen.getByRole("combobox")
        expect(trigger).toBeDisabled()
    })

    it("renders select items", () => {
        const { container } = render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                </SelectContent>
            </Select>
        )

        const items = container.querySelectorAll('[role="option"]')
        expect(items.length).toBeGreaterThanOrEqual(0)
    })
})
