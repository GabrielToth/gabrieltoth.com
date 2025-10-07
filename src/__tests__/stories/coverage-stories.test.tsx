import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("stories components coverage", () => {
    it("renders Button story component", async () => {
        const { Button } = await import("@/stories/Button")
        render((<Button label="Click" />) as any)
        expect(screen.getByText("Click")).toBeTruthy()
    })

    it("renders Header.tsx component", async () => {
        const { Header } = await import("@/stories/Header")
        render(
            (<Header onLogin={() => {}} onCreateAccount={() => {}} />) as any
        )
        expect(screen.getByText("Log in")).toBeTruthy()
    })

    it("renders Page.tsx component", async () => {
        const { Page } = await import("@/stories/Page")
        render(<Page />)
        expect(screen.getByText("Pages in Storybook")).toBeTruthy()
    })
})
