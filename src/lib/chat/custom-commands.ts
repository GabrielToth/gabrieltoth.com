/**
 * Custom Chat Commands Manager
 * Handles dynamic chatbot response commands (!discord, !socials, !donate, etc.) with template interpolation.
 */

export interface CustomChatCommand {
    id?: string
    trigger: string // e.g. "!discord"
    responseTemplate: string // e.g. "Join our Discord: https://discord.gg/example {user}!"
    enabled: boolean
    cooldownSeconds?: number
}

/**
 * Extracts the command trigger from a chat message (e.g. "!discord" from "!discord hello")
 */
export function parseCommandTrigger(message: string): string | null {
    if (!message || !message.trim().startsWith("!")) return null
    const parts = message.trim().split(/\s+/)
    return parts[0].toLowerCase()
}

/**
 * Interpolates variables inside a response template
 */
export function interpolateCommandResponse(
    template: string,
    context: { username: string; platform: string; channel?: string }
): string {
    let result = template
    result = result.replace(/\{user\}/gi, context.username)
    result = result.replace(/\{platform\}/gi, context.platform)
    result = result.replace(/\{channel\}/gi, context.channel || "streamer")
    result = result.replace(
        /\{time\}/gi,
        new Date().toLocaleTimeString("en-US", { hour12: false })
    )
    return result
}

/**
 * Matches a chat message against active custom commands and returns response
 */
export function matchAndExecuteCustomCommand(
    messageText: string,
    commands: CustomChatCommand[],
    context: { username: string; platform: string; channel?: string }
): { matched: boolean; response?: string } {
    const trigger = parseCommandTrigger(messageText)
    if (!trigger) return { matched: false }

    const cmd = commands.find(
        c => c.enabled && c.trigger.toLowerCase() === trigger
    )

    if (!cmd) return { matched: false }

    const response = interpolateCommandResponse(cmd.responseTemplate, context)
    return { matched: true, response }
}
