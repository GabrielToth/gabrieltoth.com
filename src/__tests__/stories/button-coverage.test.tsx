import { Button } from "@/stories/Button"
import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("stories/Button coverage", () => {
    it("renders primary small with backgroundColor", () => {
        render(
            React.createElement(Button, {
                primary: true,
                size: "small",
                backgroundColor: "rgb(255, 0, 0)",
                label: "Click",
            })
        )
        expect(
            screen.getByRole("button", { name: /Click/i })
        ).toBeInTheDocument()
    })

    it("renders secondary large without backgroundColor", () => {
        render(
            React.createElement(Button, {
                primary: false,
                size: "large",
                label: "Go",
            })
        )
        expect(screen.getByRole("button", { name: /Go/i })).toBeInTheDocument()
    })
})
