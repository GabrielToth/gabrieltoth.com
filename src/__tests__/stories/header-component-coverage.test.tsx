import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { Header } from "@/stories/Header"

describe("stories/Header component coverage", () => {
    it("renders logged out state and triggers login/create handlers", () => {
        const onLogin = vi.fn()
        const onCreate = vi.fn()
        render(<Header onLogin={onLogin} onCreateAccount={onCreate} />)

        const loginBtn = screen.getByRole("button", { name: /log in/i })
        const signupBtn = screen.getByRole("button", { name: /sign up/i })
        fireEvent.click(loginBtn)
        fireEvent.click(signupBtn)
        expect(onLogin).toHaveBeenCalled()
        expect(onCreate).toHaveBeenCalled()
    })

    it("renders logged in state and triggers logout handler", () => {
        const onLogout = vi.fn()
        render(<Header user={{ name: "Jane" }} onLogout={onLogout} />)
        expect(
            screen.getByText(
                (_, el) =>
                    el?.classList.contains("welcome") &&
                    /jane/i.test(el.textContent || "")
            )
        ).toBeTruthy()
        const logoutBtn = screen.getByRole("button", { name: /log out/i })
        fireEvent.click(logoutBtn)
        expect(onLogout).toHaveBeenCalled()
    })
})
