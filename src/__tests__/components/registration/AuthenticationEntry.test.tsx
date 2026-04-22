import { AuthenticationEntry } from "@/components/registration/AuthenticationEntry"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

describe("AuthenticationEntry", () => {
    it("should render both authentication method buttons", () => {
        const onEmailSelected = vi.fn()
        const onGoogleSelected = vi.fn()

        render(
            <AuthenticationEntry
                onEmailSelected={onEmailSelected}
                onGoogleSelected={onGoogleSelected}
            />
        )

        expect(
            screen.getByRole("button", { name: /sign up with email/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: /sign up with google/i })
        ).toBeInTheDocument()
    })

    it("should render back to login link", () => {
        const onEmailSelected = vi.fn()
        const onGoogleSelected = vi.fn()

        render(
            <AuthenticationEntry
                onEmailSelected={onEmailSelected}
                onGoogleSelected={onGoogleSelected}
            />
        )

        expect(
            screen.getByRole("link", { name: /back to login/i })
        ).toBeInTheDocument()
    })

    it("should call onEmailSelected when email button is clicked", async () => {
        const user = userEvent.setup()
        const onEmailSelected = vi.fn()
        const onGoogleSelected = vi.fn()

        render(
            <AuthenticationEntry
                onEmailSelected={onEmailSelected}
                onGoogleSelected={onGoogleSelected}
            />
        )

        await user.click(
            screen.getByRole("button", { name: /sign up with email/i })
        )

        expect(onEmailSelected).toHaveBeenCalledOnce()
        expect(onGoogleSelected).not.toHaveBeenCalled()
    })

    it("should call onGoogleSelected when Google button is clicked", async () => {
        const user = userEvent.setup()
        const onEmailSelected = vi.fn()
        const onGoogleSelected = vi.fn()

        render(
            <AuthenticationEntry
                onEmailSelected={onEmailSelected}
                onGoogleSelected={onGoogleSelected}
            />
        )

        await user.click(
            screen.getByRole("button", { name: /sign up with google/i })
        )

        expect(onGoogleSelected).toHaveBeenCalledOnce()
        expect(onEmailSelected).not.toHaveBeenCalled()
    })

    it("should disable buttons when isLoading is true", () => {
        const onEmailSelected = vi.fn()
        const onGoogleSelected = vi.fn()

        render(
            <AuthenticationEntry
                onEmailSelected={onEmailSelected}
                onGoogleSelected={onGoogleSelected}
                isLoading={true}
            />
        )

        expect(
            screen.getByRole("button", { name: /sign up with email/i })
        ).toBeDisabled()
        expect(
            screen.getByRole("button", { name: /sign up with google/i })
        ).toBeDisabled()
    })

    it("should display platform branding", () => {
        const onEmailSelected = vi.fn()
        const onGoogleSelected = vi.fn()

        render(
            <AuthenticationEntry
                onEmailSelected={onEmailSelected}
                onGoogleSelected={onGoogleSelected}
            />
        )

        expect(screen.getByText(/create account/i)).toBeInTheDocument()
        expect(screen.getByText(/join us today/i)).toBeInTheDocument()
    })
})
