import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("editors BenefitCard coverage", () => {
    it("renders title and description", async () => {
        const { BenefitCard } =
            await import("@/app/[locale]/editors/editors-card")
        render(<BenefitCard title="T" description="D" iconName="Check" />)
        expect(screen.getByText("T")).toBeTruthy()
        expect(screen.getByText("D")).toBeTruthy()
    })
})
