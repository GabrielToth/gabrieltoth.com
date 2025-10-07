import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("ui/card coverage", () => {
    it("renders all card subcomponents with content", () => {
        render(
            React.createElement(
                Card,
                { className: "custom" },
                React.createElement(
                    CardHeader,
                    null,
                    React.createElement(CardTitle, null, "Title"),
                    React.createElement(CardDescription, null, "Description")
                ),
                React.createElement(CardContent, null, "Content"),
                React.createElement(CardFooter, null, "Footer")
            )
        )

        expect(screen.getByText("Title")).toBeInTheDocument()
        expect(screen.getByText("Description")).toBeInTheDocument()
        expect(screen.getByText("Content")).toBeInTheDocument()
        expect(screen.getByText("Footer")).toBeInTheDocument()
    })
})
