/**
 * Database Migration System
 * Manages schema migrations with rollback capability and history tracking
 */

import { DatabasePool } from './database'
import { createSchema } from './schema'

/**
 * Migration metadata
 */
export interface Migration {
  id: string
  name: string
  version: number
  description: string
  up: (pool: DatabasePool) => Promise<void>
  down: (pool: DatabasePool) => Promise<void>
  createdAt: Date
}

/**
 * Applied migration record
 */
export interface AppliedMigration {
  id: string
  name: string
  version: number
  appliedAt: Date
  executionTime: number // milliseconds
}

/**
 * Migration history entry
 */
export interface MigrationHistory {
  id: string
  migrationId: string
  migrationName: string
  action: 'up' | 'down'
  appliedAt: Date
  executionTime: number
  status: 'success' | 'failed'
  error?: string
}

/**
 * Helper to run SQL with promise wrapper
 */
function runSQL(connection: any, sql: string, params?: any[]): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.run(sql, params || [], (err: any) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

/**
 * Helper to get SQL results
 */
function getSQL(connection: any, sql: string, params?: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    connection.get(sql, params || [], (err: any, row: any) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

/**
 * Helper to get all SQL results
 */
function allSQL(connection: any, sql: string, params?: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.all(sql, params || [], (err: any, rows: any[]) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

/**
 * Migration runner
 */
export class MigrationRunner {
  private pool: DatabasePool
  private migrations: Map<string, Migration> = new Map()
  private appliedMigrations: Map<string, AppliedMigration> = new Map()

  constructor(pool: DatabasePool) {
    this.pool = pool
  }

  /**
   * Initialize migration tracking tables
   */
  async initialize(): Promise<void> {
    const connection = this.pool.getConnection()

    try {
      // Create migrations table
      await runSQL(
        connection,
        `
        CREATE TABLE IF NOT EXISTS migrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          version INTEGER NOT NULL,
          appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          executionTime INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'success' CHECK(status IN ('success', 'failed'))
        )
      `
      )

      // Create migration history table
      await runSQL(
        connection,
        `
        CREATE TABLE IF NOT EXISTS migration_history (
          id TEXT PRIMARY KEY,
          migrationId TEXT NOT NULL,
          migrationName TEXT NOT NULL,
          action TEXT NOT NULL CHECK(action IN ('up', 'down')),
          appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          executionTime INTEGER NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
          error TEXT,
          FOREIGN KEY (migrationId) REFERENCES migrations(id) ON DELETE CASCADE
        )
      `
      )

      // Create indexes
      await runSQL(connection, `CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version)`)

      await runSQL(
        connection,
        `CREATE INDEX IF NOT EXISTS idx_migration_history_migrationId ON migration_history(migrationId)`
      )

      await runSQL(
        connection,
        `CREATE INDEX IF NOT EXISTS idx_migration_history_appliedAt ON migration_history(appliedAt)`
      )

      // Load applied migrations
      await this.loadAppliedMigrations()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to initialize migrations: ${message}`)
    }
  }

  /**
   * Register a migration
   */
  registerMigration(migration: Migration): void {
    this.migrations.set(migration.id, migration)
  }

  /**
   * Register multiple migrations
   */
  registerMigrations(migrations: Migration[]): void {
    for (const migration of migrations) {
      this.registerMigration(migration)
    }
  }

  /**
   * Load applied migrations from database
   */
  private async loadAppliedMigrations(): Promise<void> {
    const connection = this.pool.getConnection()

    try {
      const rows = await allSQL(
        connection,
        'SELECT id, name, version, appliedAt, executionTime FROM migrations ORDER BY version'
      )

      this.appliedMigrations.clear()
      for (const row of rows) {
        this.appliedMigrations.set(row.id, {
          id: row.id,
          name: row.name,
          version: row.version,
          appliedAt: new Date(row.appliedAt),
          executionTime: row.executionTime,
        })
      }
    } catch (error) {
      // Table might not exist yet
      this.appliedMigrations.clear()
    }
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations(): Migration[] {
    const pending: Migration[] = []

    for (const [id, migration] of this.migrations.entries()) {
      if (!this.appliedMigrations.has(id)) {
        pending.push(migration)
      }
    }

    // Sort by version
    return pending.sort((a, b) => a.version - b.version)
  }

  /**
   * Get applied migrations
   */
  getAppliedMigrations(): AppliedMigration[] {
    return Array.from(this.appliedMigrations.values()).sort((a, b) => a.version - b.version)
  }

  /**
   * Run pending migrations
   */
  async runPendingMigrations(): Promise<{
    count: number
    migrations: AppliedMigration[]
    errors: string[]
  }> {
    const pending = this.getPendingMigrations()
    const applied: AppliedMigration[] = []
    const errors: string[] = []

    for (const migration of pending) {
      try {
        await this.runMigration(migration, 'up')
        applied.push({
          id: migration.id,
          name: migration.name,
          version: migration.version,
          appliedAt: new Date(),
          executionTime: 0,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`Migration '${migration.name}' failed: ${message}`)
      }
    }

    return {
      count: applied.length,
      migrations: applied,
      errors,
    }
  }

  /**
   * Run a specific migration
   */
  private async runMigration(migration: Migration, direction: 'up' | 'down'): Promise<void> {
    const connection = this.pool.getConnection()
    const startTime = Date.now()

    try {
      const migrationFn = direction === 'up' ? migration.up : migration.down
      await migrationFn(this.pool)

      const executionTime = Date.now() - startTime

      if (direction === 'up') {
        // Record applied migration
        await runSQL(
          connection,
          `INSERT INTO migrations (id, name, version, executionTime, status)
           VALUES (?, ?, ?, ?, 'success')`,
          [migration.id, migration.name, migration.version, executionTime]
        )

        this.appliedMigrations.set(migration.id, {
          id: migration.id,
          name: migration.name,
          version: migration.version,
          appliedAt: new Date(),
          executionTime,
        })
      } else {
        // Remove from applied migrations
        await runSQL(connection, 'DELETE FROM migrations WHERE id = ?', [migration.id])
        this.appliedMigrations.delete(migration.id)
      }

      // Record in history
      await runSQL(
        connection,
        `INSERT INTO migration_history (id, migrationId, migrationName, action, executionTime, status)
         VALUES (?, ?, ?, ?, ?, 'success')`,
        [`${migration.id}-${direction}-${Date.now()}`, migration.id, migration.name, direction, executionTime]
      )
    } catch (error) {
      const executionTime = Date.now() - startTime
      const message = error instanceof Error ? error.message : String(error)

      // Record failed migration in history
      try {
        await runSQL(
          connection,
          `INSERT INTO migration_history (id, migrationId, migrationName, action, executionTime, status, error)
           VALUES (?, ?, ?, ?, ?, 'failed', ?)`,
          [
            `${migration.id}-${direction}-${Date.now()}`,
            migration.id,
            migration.name,
            direction,
            executionTime,
            message,
          ]
        )
      } catch (historyError) {
        // Ignore history recording errors
      }

      throw error
    }
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(targetVersion: number): Promise<{
    count: number
    migrations: string[]
    errors: string[]
  }> {
    const applied = this.getAppliedMigrations()
    const toRollback = applied.filter((m) => m.version > targetVersion).reverse()

    const rolled: string[] = []
    const errors: string[] = []

    for (const applied of toRollback) {
      const migration = this.migrations.get(applied.id)
      if (migration) {
        try {
          await this.runMigration(migration, 'down')
          rolled.push(migration.name)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          errors.push(`Rollback of '${migration.name}' failed: ${message}`)
        }
      }
    }

    return {
      count: rolled.length,
      migrations: rolled,
      errors,
    }
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(limit: number = 100): Promise<MigrationHistory[]> {
    const connection = this.pool.getConnection()

    try {
      const rows = await allSQL(
        connection,
        `SELECT id, migrationId, migrationName, action, appliedAt, executionTime, status, error
         FROM migration_history
         ORDER BY appliedAt DESC
         LIMIT ?`,
        [limit]
      )

      return rows.map((row) => ({
        id: row.id,
        migrationId: row.migrationId,
        migrationName: row.migrationName,
        action: row.action,
        appliedAt: new Date(row.appliedAt),
        executionTime: row.executionTime,
        status: row.status,
        error: row.error,
      }))
    } catch (error) {
      return []
    }
  }

  /**
   * Get migration status
   */
  getStatus(): {
    totalMigrations: number
    appliedMigrations: number
    pendingMigrations: number
    lastApplied?: AppliedMigration
  } {
    const applied = this.getAppliedMigrations()
    const pending = this.getPendingMigrations()

    return {
      totalMigrations: this.migrations.size,
      appliedMigrations: applied.length,
      pendingMigrations: pending.length,
      lastApplied: applied[applied.length - 1],
    }
  }
}

/**
 * Default migrations for initial schema setup
 */
export const DEFAULT_MIGRATIONS: Migration[] = [
  {
    id: 'migration-001-initial-schema',
    name: 'Initial Schema',
    version: 1,
    description: 'Create initial database schema with all tables and indexes',
    up: async (pool: DatabasePool) => {
      await createSchema(pool)
    },
    down: async (pool: DatabasePool) => {
      const connection = pool.getConnection()
      // Drop all tables
      const tables = [
        'budget_warnings',
        'tasks',
        'compression_decisions',
        'pruning_decisions',
        'archived_data',
        'pricing_cache',
        'strategies',
        'budget_usage',
        'budget_configs',
        'token_records',
      ]

      for (const table of tables) {
        await runSQL(connection, `DROP TABLE IF EXISTS ${table}`)
      }
    },
    createdAt: new Date(),
  },
]

/**
 * Create and initialize migration runner with default migrations
 */
export async function createMigrationRunner(pool: DatabasePool): Promise<MigrationRunner> {
  const runner = new MigrationRunner(pool)
  await runner.initialize()
  runner.registerMigrations(DEFAULT_MIGRATIONS)
  return runner
}
