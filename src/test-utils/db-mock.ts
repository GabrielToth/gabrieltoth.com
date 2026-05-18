import { vi } from "vitest"

/** Vitest mock factory matching `@/lib/db` exports (`db` object + named helpers). */
export function createDbModuleMock() {
    const query = vi.fn()
    const queryOne = vi.fn()
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
