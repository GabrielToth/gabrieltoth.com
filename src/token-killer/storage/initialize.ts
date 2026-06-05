/**
 * Database Initialization Module
 * Orchestrates database setup, schema creation, and migration execution
 */

import { DatabasePool, initializeDatabasePool, getDatabasePool } from './database'
import { createSchema, verifySchema } from './schema'
import { createMigrationRunner } from './migrations'

/**
 * Database initialization result
 */
export interface InitializationResult {
  success: boolean
  dbPath: string
  dbSize: number
  schemaValid: boolean
  migrationsApplied: number
  errors: string[]
  warnings: string[]
  timestamp: Date
}

/**
 * Initialize the complete database system
 * This function:
 * 1. Creates database file if it doesn't exist
 * 2. Initializes connection pool
 * 3. Creates schema if needed
 * 4. Runs pending migrations
 * 5. Verifies schema integrity
 */
export async function initializeDatabase(
  config?: Partial<PoolConfig>
): Promise<InitializationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const startTime = Date.now()

  try {
    // Step 1: Initialize database pool
    const pool = await initializeDatabasePool(config)

    // Step 2: Create schema
    try {
      await createSchema(pool)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`Schema creation failed: ${message}`)
    }

    // Step 3: Initialize and run migrations
    let migrationsApplied = 0
    try {
      const migrationRunner = await createMigrationRunner(pool)
      const result = await migrationRunner.runPendingMigrations()
      migrationsApplied = result.count

      if (result.errors.length > 0) {
        errors.push(...result.errors)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`Migration execution failed: ${message}`)
    }

    // Step 4: Verify schema integrity
    let schemaValid = false
    try {
      const verification = await verifySchema(pool)
      schemaValid = verification.valid

      if (!verification.valid) {
        errors.push(`Schema verification failed: ${verification.errors.join(', ')}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`Schema verification error: ${message}`)
    }

    // Step 5: Perform health check
    try {
      const health = await pool.healthCheck()
      if (!health.healthy) {
        errors.push(`Database health check failed: ${health.error}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`Health check error: ${message}`)
    }

    // Step 6: Start periodic health checks
    try {
      pool.startHealthChecks(60000) // Check every 60 seconds
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      warnings.push(`Failed to start health checks: ${message}`)
    }

    const executionTime = Date.now() - startTime

    return {
      success: errors.length === 0,
      dbPath: pool.getDbPath(),
      dbSize: pool.getDbSize(),
      schemaValid,
      migrationsApplied,
      errors,
      warnings,
      timestamp: new Date(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(`Database initialization failed: ${message}`)

    return {
      success: false,
      dbPath: '',
      dbSize: 0,
      schemaValid: false,
      migrationsApplied: 0,
      errors,
      warnings,
      timestamp: new Date(),
    }
  }
}

/**
 * Get the database pool instance
 * Must be called after initializeDatabase()
 */
export function getDatabaseConnectionInstance(): DatabasePool {
  return getDatabasePool()
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  const pool = getDatabasePool()
  if (pool) {
    await pool.close()
  }
}

/**
 * Reset database (for testing)
 * WARNING: This will delete all data
 */
export async function resetDatabase(): Promise<void> {
  const pool = getDatabasePool()
  if (pool && pool.isReady()) {
    const { dropSchema } = await import('./schema')
    await dropSchema(pool)
    await createSchema(pool)
  }
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  const pool = getDatabasePool()

  if (pool && pool.isReady()) {
    return pool.getStats()
  }

  return null
}

export { InitializationResult }
