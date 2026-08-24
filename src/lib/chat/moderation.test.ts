import { ChatModerator, ModerationRule } from "./moderation"

describe("ChatModerator", () => {
    it("flags banned keywords", () => {
        const rules: ModerationRule[] = [
            { id: "1", pattern: "badword", type: "keyword", action: "block" },
        ]
        const moderator = new ChatModerator(rules)

        const res = moderator.evaluateMessage(
            "Hello this contains BADWORD here"
        )
        expect(res.flagged).toBe(true)
        expect(res.action).toBe("block")
    })

    it("flags unauthorized links", () => {
        const rules: ModerationRule[] = [
            {
                id: "2",
                pattern: "",
                type: "link",
                action: "timeout",
                timeoutSeconds: 300,
            },
        ]
        const moderator = new ChatModerator(rules)

        const res = moderator.evaluateMessage("Check out https://spam.com")
        expect(res.flagged).toBe(true)
        expect(res.action).toBe("timeout")
        expect(res.timeoutSeconds).toBe(300)
    })

    it("passes clean messages", () => {
        const moderator = new ChatModerator([
            { id: "1", pattern: "spam", type: "keyword", action: "block" },
        ])
        const res = moderator.evaluateMessage("Great stream today!")
        expect(res.flagged).toBe(false)
    })
})
