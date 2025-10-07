import { Badge } from "@/components/ui/badge"
import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("Badge", () => {
    it("renders with text and default variant", () => {
        render(<Badge>Badge</Badge>)
        expect(screen.getByText("Badge")).toBeInTheDocument()
    })
    it("renders destructive variant", () => {
        render(<Badge variant="destructive">Danger</Badge>)
        expect(screen.getByText("Danger")).toBeInTheDocument()
    })
})
