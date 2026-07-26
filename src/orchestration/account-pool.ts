import type { AccountConfig } from "./types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("AccountPool")

export class AccountPool {
    private accounts: Map<string, AccountConfig> = new Map()

    constructor(accountsConfig: AccountConfig[]) {
        for (const account of accountsConfig) {
            const key = `${account.provider}:${account.accountId}`
            this.accounts.set(key, account)
        }
        logger.info(`Loaded ${this.accounts.size} accounts`)
    }

    selectAccount(
        provider: string,
        model: string
    ): AccountConfig | null {
        const candidates = Array.from(this.accounts.values()).filter(
            acc =>
                acc.provider === provider &&
                acc.models.includes(model) &&
                acc.status === "ok" &&
                acc.usedTokens < acc.tokenLimit
        )

        if (candidates.length === 0) {
            logger.warn(`No available accounts for ${provider}/${model}`)
            return null
        }

        candidates.sort((a, b) => a.usedTokens - b.usedTokens)
        return candidates[0]
    }

    recordUsage(provider: string, accountId: string, tokens: number): void {
        const key = `${provider}:${accountId}`
        const account = this.accounts.get(key)
        if (account) {
            account.usedTokens += tokens
            account.lastUsedAt = Date.now()
            logger.debug(
                `Account ${key} used ${tokens} tokens (total: ${account.usedTokens}/${account.tokenLimit})`
            )
        }
    }

    markRateLimited(provider: string, accountId: string): void {
        const key = `${provider}:${accountId}`
        const account = this.accounts.get(key)
        if (account) {
            account.status = "rate_limited"
            logger.warn(`Account ${key} rate limited`)
        }
    }

    resetAccount(provider: string, accountId: string): void {
        const key = `${provider}:${accountId}`
        const account = this.accounts.get(key)
        if (account) {
            account.usedTokens = 0
            account.status = "ok"
            logger.info(`Account ${key} reset`)
        }
    }

    getStatus(): Record<string, unknown> {
        const status: Record<string, unknown> = {}
        for (const [key, account] of this.accounts) {
            status[key] = {
                provider: account.provider,
                models: account.models,
                used: account.usedTokens,
                limit: account.tokenLimit,
                status: account.status,
            }
        }
        return status
    }
}
