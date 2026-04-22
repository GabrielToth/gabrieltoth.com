import { PersonalDataForm } from "@/components/registration/PersonalDataForm"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

describe("PersonalDataForm Component", () => {
    it("renders name input field with label", () => {
        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(screen.getByLabelText("Full name")).toBeInTheDocument()
        expect(screen.getByText("Full Name")).toBeInTheDocument()
    })

    it("renders phone input field with label", () => {
        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(screen.getByLabelText("Phone number")).toBeInTheDocument()
        expect(screen.getByText("Phone Number")).toBeInTheDocument()
    })

    it("displays placeholder text for both fields", () => {
        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument()
        expect(
            screen.getByPlaceholderText("+1 (555) 123-4567")
        ).toBeInTheDocument()
    })

    it("calls onNameChange when user types name", async () => {
        const onNameChange = vi.fn()
        const user = userEvent.setup()

        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={onNameChange}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const nameInput = screen.getByPlaceholderText("John Doe")
        await user.type(nameInput, "J")

        expect(onNameChange).toHaveBeenCalledWith("J")
    })

    it("calls onPhoneChange when user types phone", async () => {
        const onPhoneChange = vi.fn()
        const user = userEvent.setup()

        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={onPhoneChange}
                onValidationChange={vi.fn()}
            />
        )

        const phoneInput = screen.getByPlaceholderText("+1 (555) 123-4567")
        await user.type(phoneInput, "+")

        expect(onPhoneChange).toHaveBeenCalledWith("+")
    })

    it("displays provided name value", () => {
        render(
            <PersonalDataForm
                name="John Doe"
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const nameInput = screen.getByDisplayValue("John Doe")
        expect(nameInput).toBeInTheDocument()
    })

    it("displays provided phone value", () => {
        render(
            <PersonalDataForm
                name=""
                phone="+1 (555) 123-4567"
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const phoneInput = screen.getByDisplayValue("+1 (555) 123-4567")
        expect(phoneInput).toBeInTheDocument()
    })

    it("disables inputs when disabled prop is true", () => {
        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
                disabled={true}
            />
        )

        const nameInput = screen.getByPlaceholderText("John Doe")
        const phoneInput = screen.getByPlaceholderText("+1 (555) 123-4567")

        expect(nameInput).toBeDisabled()
        expect(phoneInput).toBeDisabled()
    })

    it("displays helper text for phone format", () => {
        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(
            screen.getByText(/Supports international formats/)
        ).toBeInTheDocument()
    })

    it("has proper aria attributes", () => {
        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const nameInput = screen.getByLabelText("Full name")
        const phoneInput = screen.getByLabelText("Phone number")

        expect(nameInput).toHaveAttribute("type", "text")
        expect(phoneInput).toHaveAttribute("type", "tel")
    })

    it("renders with correct styling classes", () => {
        const { container } = render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const wrapper = container.querySelector(".w-full.space-y-4")
        expect(wrapper).toBeInTheDocument()
    })

    it("renders labels with correct htmlFor attributes", () => {
        render(
            <PersonalDataForm
                name=""
                phone=""
                onNameChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const nameLabel = screen.getByText("Full Name")
        const phoneLabel = screen.getByText("Phone Number")

        expect(nameLabel).toHaveAttribute("for", "name")
        expect(phoneLabel).toHaveAttribute("for", "phone")
    })

    it("accepts valid name values", () => {
        const validNames = ["John Doe", "John-Paul", "O'Brien"]

        for (const name of validNames) {
            const { unmount } = render(
                <PersonalDataForm
                    name={name}
                    phone=""
                    onNameChange={vi.fn()}
                    onPhoneChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const nameInput = screen.getByDisplayValue(name)
            expect(nameInput).toBeInTheDocument()

            unmount()
        }
    })

    it("accepts international phone number values", () => {
        const internationalPhones = [
            "+1 (555) 123-4567",
            "+55 11 98765-4321",
            "+44 20 7946 0958",
        ]

        for (const phone of internationalPhones) {
            const { unmount } = render(
                <PersonalDataForm
                    name=""
                    phone={phone}
                    onNameChange={vi.fn()}
                    onPhoneChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const phoneInput = screen.getByDisplayValue(phone)
            expect(phoneInput).toBeInTheDocument()

            unmount()
        }
    })
})
