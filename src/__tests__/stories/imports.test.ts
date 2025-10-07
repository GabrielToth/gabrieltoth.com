import { describe, expect, it } from "vitest"

describe("stories imports", () => {
    it("imports TS story files", async () => {
        const mods = await Promise.all([
            import("@/stories/Button.stories.ts"),
            import("@/stories/Header.stories.ts"),
            import("@/stories/Page.stories.ts"),
        ])
        expect(mods.length).toBeGreaterThan(0)
    })
})
