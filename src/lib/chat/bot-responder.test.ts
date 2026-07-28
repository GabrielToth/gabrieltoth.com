import { BotResponder } from "./bot-responder"

describe("BotResponder", () => {
    it("returns automated response for matching commands", () => {
        const bot = new BotResponder([
            { trigger: "!discord", response: "Join us at https://discord.gg/test", enabled: true },
            { trigger: "!specs", response: "PC Specs: RTX 4090, i9-13900K", enabled: true },
            { trigger: "!disabled", response: "Disabled command", enabled: false },
        ])

        expect(bot.getResponse("!discord")).toBe("Join us at https://discord.gg/test")
        expect(bot.getResponse("!specs")).toBe("PC Specs: RTX 4090, i9-13900K")
        expect(bot.getResponse("!disabled")).toBeNull()
        expect(bot.getResponse("hello")).toBeNull()
    })
})
