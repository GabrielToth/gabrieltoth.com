import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/hooks/use-locale", () => ({
    useLocale: () => ({ locale: "en" }),
}))

describe("amazon-affiliate page", () => {
    it("mounts and shows heading", async () => {
        const mod = await import("@/app/[locale]/amazon-affiliate/page")
        render(React.createElement(mod.default))
        expect(
            screen.getByText(/Amazon Affiliate Link Generator/i)
        ).toBeInTheDocument()
    })
    it("shows error when missing tag", async () => {
        const original = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG
        process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG = ""
        const mod = await import("@/app/[locale]/amazon-affiliate/page")
        render(React.createElement(mod.default))
        // fill a valid URL to avoid 'Invalid URL'
        const input = screen.getByPlaceholderText(/amazon\.com\/dp/i)
        input && (input as HTMLInputElement).focus()
        if (input) {
            ;(input as HTMLInputElement).value =
                "https://www.amazon.com/dp/ASDF1234"
        }
        const btn = screen.getByRole("button", { name: /Generate/i })
        fireEvent.click(btn)
        expect(screen.getByText(/Missing affiliate tag/i)).toBeInTheDocument()
        process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG = original
    })

    it("shows Invalid URL when tag exists but URL is invalid", async () => {
        const original = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG
        process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG = "tag-20"
        const mod = await import("@/app/[locale]/amazon-affiliate/page")
        render(React.createElement(mod.default))
        const input = screen.getByPlaceholderText(/amazon\.com\/dp/i)
        // invalid string ensures generateAmazonAffiliateLink throws
        ;(input as HTMLInputElement).value = "not-a-url"
        const btn = screen.getByRole("button", { name: /Generate/i })
        fireEvent.click(btn)
        expect(screen.getByText(/Invalid URL/i)).toBeInTheDocument()
        process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG = original
    })
})
