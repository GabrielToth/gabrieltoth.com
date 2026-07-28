/**
 * Automated Chat Bot Trigger & Responder
 */

export interface BotCommand {
    trigger: string
    response: string
    enabled: boolean
}

export class BotResponder {
    private commands: Map<string, string> = new Map()

    constructor(commands: BotCommand[] = []) {
        for (const cmd of commands) {
            if (cmd.enabled) {
                this.commands.set(cmd.trigger.toLowerCase(), cmd.response)
            }
        }
    }

    setCommand(trigger: string, response: string) {
        this.commands.set(trigger.toLowerCase(), response)
    }

    getResponse(text: string): string | null {
        const trimmed = text.trim().toLowerCase()
        if (this.commands.has(trimmed)) {
            return this.commands.get(trimmed) || null
        }
        return null
    }
}
