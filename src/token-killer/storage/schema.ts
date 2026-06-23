/**
 * SQLite Schema Definition and Creation
 * Defines all tables, indexes, and constraints for Token Killer
 */

import { DatabasePool } from "./database"

/**
 * SQL schema definitions for all tables
 */
const SCHEMA_DEFINITIONS = {
    /**
     * Token Records Table
     * Stores individual token consumption records
     */
    token_records: `
    CREATE TABLE IF NOT EXISTS token_records (
      id TEXT PRIMARY KEY,
      requestId TEXT NOT NULL,
      taskId TEXT,
      agentType TEXT NOT NULL CHECK(agentType IN ('kiro', 'antigravity', 'cursor', 'gabrieltoth')),
      model TEXT NOT NULL,
      inputTokens INTEGER NOT NULL CHECK(inputTokens >= 0),
      outputTokens INTEGER NOT NULL CHECK(outputTokens >= 0),
      totalTokens INTEGER NOT NULL CHECK(totalTokens >= 0),
      inputCost REAL NOT NULL CHECK(inputCost >= 0),
      outputCost REAL NOT NULL CHECK(outputCost >= 0),
      totalCost REAL NOT NULL CHECK(totalCost >= 0),
      timestamp DATETIME NOT NULL,
      metadata TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL
    )
  `,

    /**
     * Budget Configurations Table
     * Stores budget definitions for requests, tasks, and agents
     */
    budget_configs: `
    CREATE TABLE IF NOT EXISTS budget_configs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('request', 'task', 'agent')),
      name TEXT NOT NULL,
      maxTokens INTEGER NOT NULL CHECK(maxTokens > 0),
      yellowThreshold INTEGER NOT NULL DEFAULT 50 CHECK(yellowThreshold > 0 AND yellowThreshold < 100),
      redThreshold INTEGER NOT NULL DEFAULT 80 CHECK(redThreshold > yellowThreshold AND redThreshold < 100),
      enabled BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, name)
    )
  `,

    /**
     * Budget Usage Table
     * Tracks current consumption against budgets
     */
    budget_usage: `
    CREATE TABLE IF NOT EXISTS budget_usage (
      id TEXT PRIMARY KEY,
      budgetId TEXT NOT NULL UNIQUE,
      currentTokens INTEGER NOT NULL DEFAULT 0 CHECK(currentTokens >= 0),
      status TEXT NOT NULL DEFAULT 'ok' CHECK(status IN ('ok', 'warning_yellow', 'warning_red', 'exceeded')),
      lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (budgetId) REFERENCES budget_configs(id) ON DELETE CASCADE
    )
  `,

    /**
     * Strategies Table
     * Stores optimization strategy configurations
     */
    strategies: `
    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('pruning', 'compression', 'optimization', 'caching', 'routing')),
      enabled BOOLEAN NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL CHECK(priority >= 0),
      parameters TEXT,
      estimatedSavings REAL NOT NULL DEFAULT 0 CHECK(estimatedSavings >= 0 AND estimatedSavings <= 100),
      actualSavings REAL NOT NULL DEFAULT 0 CHECK(actualSavings >= 0 AND actualSavings <= 100),
      qualityImpact TEXT NOT NULL DEFAULT 'none' CHECK(qualityImpact IN ('none', 'low', 'medium', 'high')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

    /**
     * Pricing Cache Table
     * Caches model pricing information (24-hour TTL)
     */
    pricing_cache: `
    CREATE TABLE IF NOT EXISTS pricing_cache (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL UNIQUE,
      inputPrice REAL NOT NULL CHECK(inputPrice >= 0),
      outputPrice REAL NOT NULL CHECK(outputPrice >= 0),
      currency TEXT NOT NULL DEFAULT 'USD' CHECK(currency IN ('USD', 'BRL')),
      lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

    /**
     * Archived Data Table
     * Stores compressed archived records
     */
    archived_data: `
    CREATE TABLE IF NOT EXISTS archived_data (
      id TEXT PRIMARY KEY,
      dataType TEXT NOT NULL,
      compressedData BLOB NOT NULL,
      originalSize INTEGER NOT NULL CHECK(originalSize > 0),
      compressedSize INTEGER NOT NULL CHECK(compressedSize > 0),
      compressionMethod TEXT NOT NULL DEFAULT 'gzip' CHECK(compressionMethod IN ('gzip', 'brotli')),
      recordCount INTEGER NOT NULL DEFAULT 0 CHECK(recordCount >= 0),
      archivedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

    /**
     * Archive Metadata Table
     * Tracks metadata for all archives
     */
    archive_metadata: `
    CREATE TABLE IF NOT EXISTS archive_metadata (
      archiveId TEXT PRIMARY KEY,
      recordCount INTEGER NOT NULL CHECK(recordCount >= 0),
      originalSize INTEGER NOT NULL CHECK(originalSize > 0),
      compressedSize INTEGER NOT NULL CHECK(compressedSize > 0),
      compressionRatio REAL NOT NULL CHECK(compressionRatio >= 0 AND compressionRatio <= 100),
      compressionMethod TEXT NOT NULL DEFAULT 'gzip' CHECK(compressionMethod IN ('gzip', 'brotli')),
      archivedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      dataType TEXT NOT NULL DEFAULT 'token_records',
      tags TEXT,
      description TEXT,
      expiresAt DATETIME,
      FOREIGN KEY (archiveId) REFERENCES archived_data(id) ON DELETE CASCADE
    )
  `,

    /**
     * Pruning Decisions Table
     * Audit log for context pruning decisions
     */
    pruning_decisions: `
    CREATE TABLE IF NOT EXISTS pruning_decisions (
      id TEXT PRIMARY KEY,
      requestId TEXT NOT NULL,
      originalTokenCount INTEGER NOT NULL CHECK(originalTokenCount > 0),
      prunedTokenCount INTEGER NOT NULL CHECK(prunedTokenCount >= 0),
      tokensSaved INTEGER NOT NULL CHECK(tokensSaved >= 0),
      savingsPercentage REAL NOT NULL CHECK(savingsPercentage >= 0 AND savingsPercentage <= 100),
      elementsRemoved TEXT,
      dryRun BOOLEAN NOT NULL DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

    /**
     * Compression Decisions Table
     * Audit log for response compression decisions
     */
    compression_decisions: `
    CREATE TABLE IF NOT EXISTS compression_decisions (
      id TEXT PRIMARY KEY,
      requestId TEXT NOT NULL,
      originalTokenCount INTEGER NOT NULL CHECK(originalTokenCount > 0),
      compressedTokenCount INTEGER NOT NULL CHECK(compressedTokenCount >= 0),
      tokensSaved INTEGER NOT NULL CHECK(tokensSaved >= 0),
      savingsPercentage REAL NOT NULL CHECK(savingsPercentage >= 0 AND savingsPercentage <= 100),
      techniquesApplied TEXT,
      dryRun BOOLEAN NOT NULL DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

    /**
     * Tasks Table
     * Stores task execution records
     */
    tasks: `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      agentType TEXT NOT NULL CHECK(agentType IN ('kiro', 'antigravity', 'cursor', 'gabrieltoth')),
      budgetId TEXT,
      totalTokens INTEGER NOT NULL DEFAULT 0 CHECK(totalTokens >= 0),
      status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'completed', 'failed')),
      startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      FOREIGN KEY (budgetId) REFERENCES budget_configs(id) ON DELETE SET NULL
    )
  `,

    /**
     * Budget Warnings Table
     * Audit log for budget warning events
     */
    budget_warnings: `
    CREATE TABLE IF NOT EXISTS budget_warnings (
      id TEXT PRIMARY KEY,
      budgetId TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('yellow', 'red', 'critical')),
      currentTokens INTEGER NOT NULL CHECK(currentTokens >= 0),
      maxTokens INTEGER NOT NULL CHECK(maxTokens > 0),
      percentageUsed REAL NOT NULL CHECK(percentageUsed >= 0),
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (budgetId) REFERENCES budget_configs(id) ON DELETE CASCADE
    )
  `,
}

/**
 * Index definitions for performance optimization
 */
const INDEX_DEFINITIONS = [
    // Token Records indexes
    "CREATE INDEX IF NOT EXISTS idx_token_records_timestamp ON token_records(timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_token_records_taskId ON token_records(taskId)",
    "CREATE INDEX IF NOT EXISTS idx_token_records_agentType ON token_records(agentType)",
    "CREATE INDEX IF NOT EXISTS idx_token_records_model ON token_records(model)",
    "CREATE INDEX IF NOT EXISTS idx_token_records_requestId ON token_records(requestId)",
    "CREATE INDEX IF NOT EXISTS idx_token_records_createdAt ON token_records(createdAt)",

    // Budget Configs indexes
    "CREATE INDEX IF NOT EXISTS idx_budget_configs_type ON budget_configs(type)",
    "CREATE INDEX IF NOT EXISTS idx_budget_configs_enabled ON budget_configs(enabled)",

    // Budget Usage indexes
    "CREATE INDEX IF NOT EXISTS idx_budget_usage_status ON budget_usage(status)",

    // Strategies indexes
    "CREATE INDEX IF NOT EXISTS idx_strategies_enabled ON strategies(enabled)",
    "CREATE INDEX IF NOT EXISTS idx_strategies_priority ON strategies(priority)",
    "CREATE INDEX IF NOT EXISTS idx_strategies_type ON strategies(type)",

    // Pricing Cache indexes
    "CREATE INDEX IF NOT EXISTS idx_pricing_cache_model ON pricing_cache(model)",
    "CREATE INDEX IF NOT EXISTS idx_pricing_cache_lastUpdated ON pricing_cache(lastUpdated)",

    // Archived Data indexes
    "CREATE INDEX IF NOT EXISTS idx_archived_data_dataType ON archived_data(dataType)",
    "CREATE INDEX IF NOT EXISTS idx_archived_data_archivedAt ON archived_data(archivedAt)",

    // Archive Metadata indexes
    "CREATE INDEX IF NOT EXISTS idx_archive_metadata_archivedAt ON archive_metadata(archivedAt)",
    "CREATE INDEX IF NOT EXISTS idx_archive_metadata_compressionMethod ON archive_metadata(compressionMethod)",
    "CREATE INDEX IF NOT EXISTS idx_archive_metadata_dataType ON archive_metadata(dataType)",
    "CREATE INDEX IF NOT EXISTS idx_archive_metadata_expiresAt ON archive_metadata(expiresAt)",

    // Pruning Decisions indexes
    "CREATE INDEX IF NOT EXISTS idx_pruning_decisions_requestId ON pruning_decisions(requestId)",
    "CREATE INDEX IF NOT EXISTS idx_pruning_decisions_timestamp ON pruning_decisions(timestamp)",

    // Compression Decisions indexes
    "CREATE INDEX IF NOT EXISTS idx_compression_decisions_requestId ON compression_decisions(requestId)",
    "CREATE INDEX IF NOT EXISTS idx_compression_decisions_timestamp ON compression_decisions(timestamp)",

    // Tasks indexes
    "CREATE INDEX IF NOT EXISTS idx_tasks_agentType ON tasks(agentType)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_startedAt ON tasks(startedAt)",

    // Budget Warnings indexes
    "CREATE INDEX IF NOT EXISTS idx_budget_warnings_budgetId ON budget_warnings(budgetId)",
    "CREATE INDEX IF NOT EXISTS idx_budget_warnings_level ON budget_warnings(level)",
    "CREATE INDEX IF NOT EXISTS idx_budget_warnings_timestamp ON budget_warnings(timestamp)",
]

/**
 * Create all database tables and indexes
 */
export async function createSchema(pool: DatabasePool): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const connection = pool.getConnection()

            // Create all tables
            const tableStatements = Object.values(SCHEMA_DEFINITIONS)
            let completed = 0

            const executeNext = () => {
                if (completed >= tableStatements.length) {
                    // Create all indexes
                    const indexStatements = INDEX_DEFINITIONS
                    let indexCompleted = 0

                    const executeIndexNext = () => {
                        if (indexCompleted >= indexStatements.length) {
                            resolve()
                            return
                        }

                        connection.run(indexStatements[indexCompleted], err => {
                            if (err) {
                                reject(
                                    new Error(
                                        `Failed to create index: ${err.message}`
                                    )
                                )
                            } else {
                                indexCompleted++
                                executeIndexNext()
                            }
                        })
                    }

                    executeIndexNext()
                    return
                }

                connection.run(tableStatements[completed], err => {
                    if (err) {
                        reject(
                            new Error(`Failed to create table: ${err.message}`)
                        )
                    } else {
                        completed++
                        executeNext()
                    }
                })
            }

            executeNext()
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            reject(new Error(`Failed to create schema: ${message}`))
        }
    })
}

/**
 * Verify schema integrity
 */
export async function verifySchema(pool: DatabasePool): Promise<{
    valid: boolean
    tables: string[]
    indexes: string[]
    errors: string[]
}> {
    return new Promise(resolve => {
        const connection = pool.getConnection()
        const errors: string[] = []
        const tables: string[] = []
        const indexes: string[] = []

        try {
            // Check tables
            const tableNames = Object.keys(SCHEMA_DEFINITIONS)
            let tableChecked = 0

            const checkNextTable = () => {
                if (tableChecked >= tableNames.length) {
                    // Check indexes
                    let indexChecked = 0

                    const checkNextIndex = () => {
                        if (indexChecked >= INDEX_DEFINITIONS.length) {
                            resolve({
                                valid: errors.length === 0,
                                tables,
                                indexes,
                                errors,
                            })
                            return
                        }

                        const indexSql = INDEX_DEFINITIONS[indexChecked]
                        const match = indexSql.match(/idx_\w+/)
                        if (match) {
                            const indexName = match[0]
                            connection.get(
                                `SELECT name FROM sqlite_master WHERE type='index' AND name=?`,
                                [indexName],
                                (err, row) => {
                                    if (err) {
                                        errors.push(
                                            `Error checking index '${indexName}': ${err.message}`
                                        )
                                    } else if (row) {
                                        indexes.push(indexName)
                                    } else {
                                        errors.push(
                                            `Index '${indexName}' not found`
                                        )
                                    }
                                    indexChecked++
                                    checkNextIndex()
                                }
                            )
                        } else {
                            indexChecked++
                            checkNextIndex()
                        }
                    }

                    checkNextIndex()
                    return
                }

                const tableName = tableNames[tableChecked]
                connection.get(
                    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                    [tableName],
                    (err, row) => {
                        if (err) {
                            errors.push(
                                `Error checking table '${tableName}': ${err.message}`
                            )
                        } else if (row) {
                            tables.push(tableName)
                        } else {
                            errors.push(`Table '${tableName}' not found`)
                        }
                        tableChecked++
                        checkNextTable()
                    }
                )
            }

            checkNextTable()
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            resolve({
                valid: false,
                tables,
                indexes,
                errors: [message],
            })
        }
    })
}

/**
 * Drop all tables (for testing/reset)
 */
export async function dropSchema(pool: DatabasePool): Promise<void> {
    return new Promise((resolve, reject) => {
        const connection = pool.getConnection()
        const tableNames = Object.keys(SCHEMA_DEFINITIONS).reverse()
        let dropped = 0

        const dropNext = () => {
            if (dropped >= tableNames.length) {
                resolve()
                return
            }

            const tableName = tableNames[dropped]
            connection.run(`DROP TABLE IF EXISTS ${tableName}`, err => {
                if (err) {
                    reject(
                        new Error(
                            `Failed to drop table '${tableName}': ${err.message}`
                        )
                    )
                } else {
                    dropped++
                    dropNext()
                }
            })
        }

        dropNext()
    })
}

export { SCHEMA_DEFINITIONS, INDEX_DEFINITIONS }
