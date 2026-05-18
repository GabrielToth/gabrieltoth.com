import { Pool } from "pg"

let postgresAvailable: boolean | null = null

/** Returns whether a PostgreSQL instance is reachable for integration tests. */
export async function isPostgresAvailable(): Promise<boolean> {
    if (postgresAvailable !== null) {
        return postgresAvailable
    }

    const connectionString =
        process.env.DATABASE_URL ||
        "postgresql://test:test@localhost:5432/test"

    const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 2000,
    })

    try {
        await pool.query("SELECT 1")
        postgresAvailable = true
    } catch {
        postgresAvailable = false
    } finally {
        await pool.end().catch(() => {})
    }

    return postgresAvailable
}
