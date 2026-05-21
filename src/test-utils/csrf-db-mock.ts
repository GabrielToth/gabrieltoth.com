import { vi } from "vitest"

type CsrfTokenRow = {
    id: string
    token_hash: string
    expires_at: Date
}

/** In-memory PostgreSQL stand-in for csrf_tokens integration-style unit tests. */
export function createCsrfDbModuleMock() {
    const tokens = new Map<string, CsrfTokenRow>()
    let idCounter = 0

    const query = vi.fn(
        async (
            sql: string,
            params?: Array<string | number | boolean | Date | null>
        ) => {
            const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase()

            if (normalized.startsWith("insert into csrf_tokens")) {
                const [tokenHash, expiresAt] = params as [string, Date]
                const id = String(++idCounter)
                tokens.set(id, {
                    id,
                    token_hash: tokenHash,
                    expires_at: new Date(expiresAt),
                })
                return { rows: [], rowCount: 1 }
            }

            if (normalized.startsWith("delete from csrf_tokens where id")) {
                const [id] = params as [string]
                const deleted = tokens.delete(id)
                return { rows: [], rowCount: deleted ? 1 : 0 }
            }

            if (
                normalized.includes("delete from csrf_tokens where expires_at")
            ) {
                const now = new Date()
                let deleted = 0
                for (const [id, row] of [...tokens.entries()]) {
                    if (row.expires_at < now) {
                        tokens.delete(id)
                        deleted++
                    }
                }
                return { rows: [], rowCount: deleted }
            }

            if (normalized.startsWith("update csrf_tokens set expires_at")) {
                const [expiresAt, ...hashes] = params as [Date, ...string[]]
                for (const row of tokens.values()) {
                    if (hashes.includes(row.token_hash)) {
                        row.expires_at = new Date(expiresAt)
                    }
                }
                return { rows: [], rowCount: 1 }
            }

            if (normalized.includes("select count(*)")) {
                return { rows: [{ count: tokens.size }], rowCount: 1 }
            }

            if (normalized === "delete from csrf_tokens") {
                tokens.clear()
                return { rows: [], rowCount: 0 }
            }

            return { rows: [], rowCount: 0 }
        }
    )

    const queryOne = vi.fn(
        async (
            sql: string,
            params?: Array<string | number | boolean | null | Date>
        ) => {
            const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase()
            const [lookup] = params as [string]
            const row = [...tokens.values()].find(r => r.token_hash === lookup)

            if (!row) {
                return null
            }

            if (normalized.includes("expires_at")) {
                return { id: row.id, expires_at: row.expires_at }
            }

            return { id: row.id }
        }
    )

    const queryMany = vi.fn()
    const transaction = vi.fn()
    const healthCheck = vi.fn().mockResolvedValue(true)
    const shutdown = vi.fn().mockResolvedValue(undefined)
    const db = {
        query,
        queryOne,
        queryMany,
        transaction,
        healthCheck,
        shutdown,
    }

    return {
        db,
        default: db,
        query,
        queryOne,
        queryMany,
        transaction,
        healthCheck,
        shutdown,
    }
}
