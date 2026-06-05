/**
 * SQLite Database Connection Module
 * Handles database initialization, connection pooling, and lifecycle management
 */

import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'

// Enable verbose mode for debugging
sqlite3.verbose()

/**
 * Database connection pool configuration
 */
interface PoolConfig {
  maxConnections: number
  connectionTimeout: number
  idleTimeout: number
}

/**
 * Database health check result
 */
interface HealthCheckResult {
  healthy: boolean
  timestamp: Date
  error?: string
  responseTime: number
}

/**
 * Database connection pool manager
 */
class DatabasePool extends EventEmitter {
  private connections: Map<string, sqlite3.Database> = new Map()
  private config: PoolConfig
  private dataDir: string
  private dbPath: string
  private isInitialized: boolean = false
  private healthCheckInterval?: NodeJS.Timeout

  constructor(config: Partial<PoolConfig> = {}) {
    super()
    this.config = {
      maxConnections: config.maxConnections ?? 5,
      connectionTimeout: config.connectionTimeout ?? 5000,
      idleTimeout: config.idleTimeout ?? 30000,
    }

    // Determine data directory
    this.dataDir = path.join(process.cwd(), '.kiro', 'data')
    this.dbPath = path.join(this.dataDir, 'token-killer.db')
  }

  /**
   * Initialize the database pool and create database file if needed
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Create data directory if it doesn't exist
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }

      // Create primary connection
      const connection = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          throw err
        }
      })

      // Enable foreign keys
      connection.run('PRAGMA foreign_keys = ON')

      // Set journal mode for better concurrency
      connection.run('PRAGMA journal_mode = WAL')

      // Set synchronous mode for performance
      connection.run('PRAGMA synchronous = NORMAL')

      // Set cache size
      connection.run('PRAGMA cache_size = -64000')

      this.connections.set('primary', connection)
      this.isInitialized = true

      this.emit('initialized', {
        dbPath: this.dbPath,
        timestamp: new Date(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.emit('error', {
        type: 'initialization_failed',
        message,
        timestamp: new Date(),
      })
      throw new Error(`Failed to initialize database: ${message}`)
    }
  }

  /**
   * Get a database connection from the pool
   */
  getConnection(): sqlite3.Database {
    if (!this.isInitialized) {
      throw new Error('Database pool not initialized. Call initialize() first.')
    }

    const connection = this.connections.get('primary')
    if (!connection) {
      throw new Error('No database connection available')
    }

    return connection
  }

  /**
   * Execute a query with automatic connection management
   */
  async execute<T>(
    query: string,
    params?: any[],
    options?: { readonly?: boolean }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const connection = this.getConnection()

      if (options?.readonly) {
        connection.all(query, params || [], (err, rows) => {
          if (err) {
            const message = err.message
            this.emit('error', {
              type: 'query_failed',
              query,
              message,
              timestamp: new Date(),
            })
            reject(new Error(`Query failed: ${message}`))
          } else {
            resolve(rows as T)
          }
        })
      } else {
        connection.run(query, params || [], function (err) {
          if (err) {
            const message = err.message
            this.emit('error', {
              type: 'query_failed',
              query,
              message,
              timestamp: new Date(),
            })
            reject(new Error(`Query failed: ${message}`))
          } else {
            resolve({
              lastID: this.lastID,
              changes: this.changes,
            } as T)
          }
        })
      }
    })
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (db: sqlite3.Database) => Promise<T>): Promise<T> {
    const connection = this.getConnection()

    return new Promise(async (resolve, reject) => {
      connection.run('BEGIN TRANSACTION', async (err) => {
        if (err) {
          const message = err.message
          this.emit('error', {
            type: 'transaction_failed',
            message,
            timestamp: new Date(),
          })
          reject(new Error(`Transaction failed: ${message}`))
          return
        }

        try {
          const result = await callback(connection)

          connection.run('COMMIT', (err) => {
            if (err) {
              connection.run('ROLLBACK')
              reject(err)
            } else {
              resolve(result)
            }
          })
        } catch (error) {
          connection.run('ROLLBACK', () => {
            reject(error)
          })
        }
      })
    })
  }

  /**
   * Perform a health check on the database
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    return new Promise((resolve) => {
      try {
        const connection = this.getConnection()
        connection.get('SELECT 1', (err) => {
          const responseTime = Date.now() - startTime

          if (err) {
            resolve({
              healthy: false,
              timestamp: new Date(),
              error: err.message,
              responseTime,
            })
          } else {
            resolve({
              healthy: true,
              timestamp: new Date(),
              responseTime,
            })
          }
        })
      } catch (error) {
        const responseTime = Date.now() - startTime
        const message = error instanceof Error ? error.message : String(error)

        resolve({
          healthy: false,
          timestamp: new Date(),
          error: message,
          responseTime,
        })
      }
    })
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      return
    }

    this.healthCheckInterval = setInterval(async () => {
      const result = await this.healthCheck()
      this.emit('health_check', result)

      if (!result.healthy) {
        this.emit('error', {
          type: 'health_check_failed',
          message: result.error,
          timestamp: result.timestamp,
        })
      }
    }, intervalMs)
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
    }
  }

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    this.stopHealthChecks()

    for (const [name, connection] of this.connections.entries()) {
      try {
        connection.close()
        this.connections.delete(name)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.emit('error', {
          type: 'close_failed',
          connection: name,
          message,
          timestamp: new Date(),
        })
      }
    }

    this.isInitialized = false
    this.emit('closed', { timestamp: new Date() })
  }

  /**
   * Get database file path
   */
  getDbPath(): string {
    return this.dbPath
  }

  /**
   * Get database file size in bytes
   */
  getDbSize(): number {
    try {
      if (fs.existsSync(this.dbPath)) {
        const stats = fs.statSync(this.dbPath)
        return stats.size
      }
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      connectionCount: this.connections.size,
      maxConnections: this.config.maxConnections,
      dbPath: this.dbPath,
      dbSize: this.getDbSize(),
    }
  }
}

// Singleton instance
let poolInstance: DatabasePool | null = null

/**
 * Get or create the database pool instance
 */
export function getDatabasePool(config?: Partial<PoolConfig>): DatabasePool {
  if (!poolInstance) {
    poolInstance = new DatabasePool(config)
  }
  return poolInstance
}

/**
 * Initialize the database pool
 */
export async function initializeDatabasePool(
  config?: Partial<PoolConfig>
): Promise<DatabasePool> {
  const pool = getDatabasePool(config)
  await pool.initialize()
  return pool
}

export { DatabasePool, PoolConfig, HealthCheckResult }
