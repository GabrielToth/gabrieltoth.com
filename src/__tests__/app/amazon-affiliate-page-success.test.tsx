import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/hooks/use-locale", () => ({
    useLocale: () => ({ locale: "en" }),
}))

describe("amazon-affiliate page success flow", () => {
    it("generates the affiliate link when tag is present", async () => {
        const original = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG
        process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG = "mytag-20"
        const mod = await import("@/app/[locale]/amazon-affiliate/page")
        render(React.createElement(mod.default))
        const input = screen.getByPlaceholderText(/amazon\.com\/dp/i)
        fireEvent.change(input, {
            target: { value: "https://www.amazon.com/dp/ASDF1234" },
        })
        fireEvent.click(screen.getByRole("button", { name: /Generate/i }))
        expect(screen.queryByRole("alert")).toBeNull()
        expect(screen.getByText(/Open link/i)).toBeInTheDocument()
        process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG = original
    })
})
