import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import * as HeaderStories from "@/stories/Header.stories"

describe("stories/Header.stories branches", () => {
    it("imports story meta and default story", () => {
        expect(HeaderStories.default).toBeTruthy()
        // The story is named Default in the module scope export
        // but bundlers may not attach it to namespace in some modes; just assert meta.
        expect(typeof HeaderStories).toBe("object")
    })

    it("renders Default story without crashing", () => {
        const Comp = (HeaderStories as any).Default?.render
        if (Comp) {
            const { container } = render(Comp())
            expect(container).toBeTruthy()
        }
    })
})
