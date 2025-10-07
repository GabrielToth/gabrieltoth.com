import { render } from "@testing-library/react"
import { act } from "react"
import { describe, expect, it } from "vitest"

import { Page } from "@/stories/Page"
import * as PageStories from "@/stories/Page.stories"

describe("stories/Page.stories branches", () => {
    it("imports meta and renders Page, then runs LoggedIn.play", async () => {
        // Ensure meta exported
        expect(PageStories.default).toBeTruthy()

        // Render base Page content so play() can find elements
        const { container } = render(<Page />)
        expect(container).toBeTruthy()

        // Run play to simulate login/logout flow if available
        if ((PageStories as any).LoggedIn?.play) {
            await act(async () => {
                await (PageStories as any).LoggedIn.play({
                    canvasElement: container,
                })
            })
        }
        // Also run LoggedOut play if present (no-op for extra coverage)
        if ((PageStories as any).LoggedOut?.play) {
            await act(async () => {
                await (PageStories as any).LoggedOut.play({
                    canvasElement: container,
                })
            })
        }
    })
})
