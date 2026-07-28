/**
 * Chat Moderation Rule Engine & Filter
 */

export interface ModerationRule {
    id: string
    pattern: string
    type: "keyword" | "regex" | "link"
    action: "block" | "timeout" | "flag"
    timeoutSeconds?: number
}

export interface ModerationResult {
    flagged: boolean
    reason?: string
    action?: "block" | "timeout" | "flag"
    timeoutSeconds?: number
}

export class ChatModerator {
    private rules: ModerationRule[] = []

    constructor(rules: ModerationRule[] = []) {
        this.rules = rules
    }

    addRule(rule: ModerationRule) {
        this.rules.push(rule)
    }

    evaluateMessage(text: string): ModerationResult {
        // Link checking
        const urlRegex = /(https?:\/\/[^\s]+)/gi

        for (const rule of this.rules) {
            if (rule.type === "keyword") {
                if (text.toLowerCase().includes(rule.pattern.toLowerCase())) {
                    return {
                        flagged: true,
                        reason: `Banned keyword: "${rule.pattern}"`,
                        action: rule.action,
                        timeoutSeconds: rule.timeoutSeconds,
                    }
                }
            } else if (rule.type === "regex") {
                try {
                    const regex = new RegExp(rule.pattern, "i")
                    if (regex.test(text)) {
                        return {
                            flagged: true,
                            reason: `Matched pattern`,
                            action: rule.action,
                            timeoutSeconds: rule.timeoutSeconds,
                        }
                    }
                } catch {
                    // ignore invalid regex
                }
            } else if (rule.type === "link") {
                if (urlRegex.test(text)) {
                    return {
                        flagged: true,
                        reason: `Unauthorized link`,
                        action: rule.action,
                        timeoutSeconds: rule.timeoutSeconds,
                    }
                }
            }
        }

        return { flagged: false }
    }
}
