import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ProfileSection } from "./ProfileSection"
import { User } from "./SettingsContainer"

describe("ProfileSection", () => {
    const mockUser: User = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        profilePhoto: "https://via.placeholder.com/150",
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const mockOnSave = vi.fn()

    it("renders profile section with user data", () => {
        render(<ProfileSection user={mockUser} onSave={mockOnSave} />)

        expect(screen.getByText("Profile Information")).toBeInTheDocument()
        expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument()
        expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument()
    })

    it("displays profile photo when available", () => {
        render(<ProfileSection user={mockUser} onSave={mockOnSave} />)

        const profileImg = screen.getByAltText("Profile")
        expect(profileImg).toHaveAttribute("src", mockUser.profilePhoto)
    })

    it("validates name field", async () => {
        const user = userEvent.setup()
        render(<ProfileSection user={mockUser} onSave={mockOnSave} />)

        const nameInput = screen.getByDisplayValue("John Doe")
        await user.clear(nameInput)
        await user.type(nameInput, "")

        const submitButton = screen.getByRole("button", {
            name: /save changes/i,
        })
        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText("Name is required")).toBeInTheDocument()
        })
    })

    it("validates email field", async () => {
        const user = userEvent.setup()
        render(<ProfileSection user={mockUser} onSave={mockOnSave} />)

        const emailInput = screen.getByDisplayValue("john@example.com")
        await user.clear(emailInput)
        await user.type(emailInput, "invalid-email")

        const submitButton = screen.getByRole("button", {
            name: /save changes/i,
        })
        await user.click(submitButton)

        await waitFor(() => {
            expect(
                screen.getByText("Please enter a valid email address")
            ).toBeInTheDocument()
        })
    })

    it("calls onSave with updated user data", async () => {
        const user = userEvent.setup()
        render(<ProfileSection user={mockUser} onSave={mockOnSave} />)

        const nameInput = screen.getByDisplayValue("John Doe")
        await user.clear(nameInput)
        await user.type(nameInput, "Jane Doe")

        const submitButton = screen.getByRole("button", {
            name: /save changes/i,
        })
        await user.click(submitButton)

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled()
            const savedUser = mockOnSave.mock.calls[0][0]
            expect(savedUser.name).toBe("Jane Doe")
        })
    })

    it("displays error message when provided", () => {
        render(
            <ProfileSection
                user={mockUser}
                onSave={mockOnSave}
                error="Failed to save profile"
            />
        )

        expect(screen.getByText("Failed to save profile")).toBeInTheDocument()
    })

    it("disables form when loading", () => {
        render(
            <ProfileSection
                user={mockUser}
                onSave={mockOnSave}
                isLoading={true}
            />
        )

        const nameInput = screen.getByDisplayValue("John Doe")
        expect(nameInput).toBeDisabled()

        const submitButton = screen.getByRole("button", {
            name: /save changes/i,
        })
        expect(submitButton).toBeDisabled()
    })

    it("shows success message after saving", async () => {
        const user = userEvent.setup()
        render(<ProfileSection user={mockUser} onSave={mockOnSave} />)

        const submitButton = screen.getByRole("button", {
            name: /save changes/i,
        })
        await user.click(submitButton)

        await waitFor(() => {
            expect(
                screen.getByText("Profile updated successfully!")
            ).toBeInTheDocument()
        })
    })
})
