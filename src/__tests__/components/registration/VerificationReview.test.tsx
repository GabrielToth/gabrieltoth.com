import { VerificationReview } from "@/components/registration/VerificationReview"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

describe("VerificationReview Component", () => {
    const mockData = {
        email: "john@example.com",
        name: "John Doe",
        birthDate: "01/01/1990",
        phone: "+1 (555) 123-4567",
    }

    it("renders review section with all fields", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(screen.getByText("Email Address")).toBeInTheDocument()
        expect(screen.getByText("Full Name")).toBeInTheDocument()
        expect(screen.getByText("Birth Date")).toBeInTheDocument()
        expect(screen.getByText("Phone Number")).toBeInTheDocument()
        expect(screen.getByText("Password")).toBeInTheDocument()
    })

    it("displays email in read-only format", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(screen.getByText(mockData.email)).toBeInTheDocument()
    })

    it("displays name in read-only format", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(screen.getByText(mockData.name)).toBeInTheDocument()
    })

    it("displays birth date in read-only format", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(screen.getByText(mockData.birthDate)).toBeInTheDocument()
    })

    it("displays phone in read-only format", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(screen.getByText(mockData.phone)).toBeInTheDocument()
    })

    it("displays password as masked text", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(
            screen.getByText("Password is set and secured")
        ).toBeInTheDocument()
    })

    it("displays Edit button for each field", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        expect(editButtons.length).toBe(5) // One for each field
    })

    it("calls onEdit with 'email' when email Edit button is clicked", async () => {
        const onEdit = vi.fn()
        const user = userEvent.setup()

        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={onEdit}
                onCreateAccount={vi.fn()}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        await user.click(editButtons[0]) // Email edit button

        expect(onEdit).toHaveBeenCalledWith("email")
    })

    it("calls onEdit with 'name' when name Edit button is clicked", async () => {
        const onEdit = vi.fn()
        const user = userEvent.setup()

        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={onEdit}
                onCreateAccount={vi.fn()}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        await user.click(editButtons[1]) // Name edit button

        expect(onEdit).toHaveBeenCalledWith("name")
    })

    it("calls onEdit with 'birthDate' when birth date Edit button is clicked", async () => {
        const onEdit = vi.fn()
        const user = userEvent.setup()

        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={onEdit}
                onCreateAccount={vi.fn()}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        await user.click(editButtons[2]) // Birth date edit button

        expect(onEdit).toHaveBeenCalledWith("birthDate")
    })

    it("calls onEdit with 'phone' when phone Edit button is clicked", async () => {
        const onEdit = vi.fn()
        const user = userEvent.setup()

        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={onEdit}
                onCreateAccount={vi.fn()}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        await user.click(editButtons[3]) // Phone edit button

        expect(onEdit).toHaveBeenCalledWith("phone")
    })

    it("calls onEdit with 'password' when password Edit button is clicked", async () => {
        const onEdit = vi.fn()
        const user = userEvent.setup()

        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={onEdit}
                onCreateAccount={vi.fn()}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        await user.click(editButtons[4]) // Password edit button

        expect(onEdit).toHaveBeenCalledWith("password")
    })

    it("displays confirmation message", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(
            screen.getByText(
                /Please review your information before creating your account/
            )
        ).toBeInTheDocument()
    })

    it("displays validation confirmation message", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(
            screen.getByText(
                /All information has been validated and is ready for account creation/
            )
        ).toBeInTheDocument()
    })

    it("displays Create Account button", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(screen.getByText("Create Account")).toBeInTheDocument()
    })

    it("calls onCreateAccount when Create Account button is clicked", async () => {
        const onCreateAccount = vi.fn()
        const user = userEvent.setup()

        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={onCreateAccount}
            />
        )

        const createButton = screen.getByText("Create Account")
        await user.click(createButton)

        expect(onCreateAccount).toHaveBeenCalledTimes(1)
    })

    it("disables Create Account button when disabled prop is true", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
                disabled={true}
            />
        )

        const createButton = screen.getByText("Create Account")
        expect(createButton).toBeDisabled()
    })

    it("disables Edit buttons when disabled prop is true", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
                disabled={true}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        editButtons.forEach(button => {
            expect(button).toBeDisabled()
        })
    })

    it("displays all fields in correct order", () => {
        const { container } = render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        const labels = container.querySelectorAll("p.text-sm.font-medium")
        expect(labels[0].textContent).toBe("Email Address")
        expect(labels[1].textContent).toBe("Full Name")
        expect(labels[2].textContent).toBe("Birth Date")
        expect(labels[3].textContent).toBe("Phone Number")
        expect(labels[4].textContent).toBe("Password")
    })

    it("renders with proper styling for read-only fields", () => {
        const { container } = render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        const fieldContainers = container.querySelectorAll(
            ".bg-gray-50.rounded-lg"
        )
        expect(fieldContainers.length).toBeGreaterThan(0)
    })

    it("displays Edit buttons with proper styling", () => {
        const { container } = render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        const editButtons = container.querySelectorAll("button.text-blue-600")
        expect(editButtons.length).toBe(5)
    })

    it("handles empty values gracefully", () => {
        render(
            <VerificationReview
                email=""
                name=""
                birthDate=""
                phone=""
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        expect(screen.getByText("Email Address")).toBeInTheDocument()
        expect(screen.getByText("Full Name")).toBeInTheDocument()
        expect(screen.getByText("Birth Date")).toBeInTheDocument()
        expect(screen.getByText("Phone Number")).toBeInTheDocument()
    })

    it("displays aria labels for accessibility", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        expect(editButtons[0]).toHaveAttribute(
            "aria-label",
            "Edit Email Address"
        )
        expect(editButtons[1]).toHaveAttribute("aria-label", "Edit Full Name")
        expect(editButtons[2]).toHaveAttribute("aria-label", "Edit Birth Date")
        expect(editButtons[3]).toHaveAttribute(
            "aria-label",
            "Edit Phone Number"
        )
        expect(editButtons[4]).toHaveAttribute("aria-label", "Edit Password")
    })

    it("displays Create Account button with proper aria label", () => {
        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        const createButton = screen.getByText("Create Account")
        expect(createButton).toHaveAttribute("aria-label", "Create Account")
    })

    it("does not call onCreateAccount when disabled", async () => {
        const onCreateAccount = vi.fn()
        const user = userEvent.setup()

        render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={onCreateAccount}
                disabled={true}
            />
        )

        const createButton = screen.getByText("Create Account")
        await user.click(createButton)

        expect(onCreateAccount).not.toHaveBeenCalled()
    })

    it("renders Create Account button with proper styling", () => {
        const { container } = render(
            <VerificationReview
                email={mockData.email}
                name={mockData.name}
                birthDate={mockData.birthDate}
                phone={mockData.phone}
                onEdit={vi.fn()}
                onCreateAccount={vi.fn()}
            />
        )

        const createButton = container.querySelector("button.bg-blue-600")
        expect(createButton).toBeInTheDocument()
        expect(createButton).toHaveClass("w-full")
        expect(createButton).toHaveClass("text-white")
    })
})
