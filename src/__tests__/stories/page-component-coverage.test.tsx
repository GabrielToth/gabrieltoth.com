import { Page } from "@/stories/Page"
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("stories/Page component coverage", () => {
    it("toggles user state via header actions", () => {
        render(<Page />)
        // Logged out has Login and Sign up
        const loginBtn = screen.getByRole("button", { name: /log in/i })
        const signupBtn = screen.getByRole("button", { name: /sign up/i })
        fireEvent.click(loginBtn)
        // After login, header shows welcome
        expect(
            screen.getByText((_, el) => el?.classList.contains("welcome"))
        ).toBeTruthy()
        // Logout flow
        const logoutBtn = screen.getByRole("button", { name: /log out/i })
        fireEvent.click(logoutBtn)
        expect(screen.getByRole("button", { name: /log in/i })).toBeTruthy()
    })
})
