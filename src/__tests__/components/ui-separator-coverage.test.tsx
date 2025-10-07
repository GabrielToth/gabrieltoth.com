import { Separator } from "@/components/ui/separator"
import { render } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("components/ui/separator coverage", () => {
    it("renders horizontal and vertical variants", () => {
        const { container: c1 } = render(<Separator />)
        expect(c1.firstChild).toHaveClass("h-[1px] w-full")

        const { container: c2 } = render(<Separator orientation="vertical" />)
        expect(c2.firstChild).toHaveClass("h-full w-[1px]")
    })
})
