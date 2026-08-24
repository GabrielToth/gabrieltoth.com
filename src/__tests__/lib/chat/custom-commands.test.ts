import { describe, expect, it } from "vitest"
import {
    CustomChatCommand,
    interpolateCommandResponse,
    matchAndExecuteCustomCommand,
    parseCommandTrigger,
} from "@/lib/chat/custom-commands"

describe("custom-commands", () => {
    describe("parseCommandTrigger", () => {
        it("should return null for non-command messages", () => {
            expect(parseCommandTrigger("hello world")).toBeNull()
            expect(parseCommandTrigger("")).toBeNull()
        })

        it("should extract trigger in lowercase", () => {
            expect(parseCommandTrigger("!DISCORD")).toBe("!discord")
            expect(parseCommandTrigger("!socials link")).toBe("!socials")
        })
    })

    describe("interpolateCommandResponse", () => {
        it("should replace {user}, {platform}, {channel} placeholders", () => {
            const template = "Hello {user}! Welcome to {channel} on {platform}."
            const result = interpolateCommandResponse(template, {
                username: "Gabriel",
                platform: "Twitch",
                channel: "gabrieltoth",
            })
            expect(result).toBe(
                "Hello Gabriel! Welcome to gabrieltoth on Twitch."
            )
        })
    })

    describe("matchAndExecuteCustomCommand", () => {
        const sampleCommands: CustomChatCommand[] = [
            {
                trigger: "!discord",
                responseTemplate: "Discord link: discord.gg/test {user}",
                enabled: true,
            },
            {
                trigger: "!disabled",
                responseTemplate: "Disabled command",
                enabled: false,
            },
        ]

        it("should return matched: false if command is unknown or disabled", () => {
            expect(
                matchAndExecuteCustomCommand("!unknown", sampleCommands, {
                    username: "User",
                    platform: "Twitch",
                }).matched
            ).toBe(false)

            expect(
                matchAndExecuteCustomCommand("!disabled", sampleCommands, {
                    username: "User",
                    platform: "Twitch",
                }).matched
            ).toBe(false)
        })

        it("should return interpolated response for valid command", () => {
            const result = matchAndExecuteCustomCommand(
                "!discord",
                sampleCommands,
                { username: "Alice", platform: "Kick" }
            )
            expect(result.matched).toBe(true)
            expect(result.response).toBe("Discord link: discord.gg/test Alice")
        })
    })
})
