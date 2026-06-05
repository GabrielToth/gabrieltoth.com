/**
 * Unit tests for database initialization module
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  initializeDatabase,
  getDatabaseConnectionInstance,
  closeDatabaseConnection,
  getDatabaseStats,
} from '../../../token-killer/storage/initialize'
import fs from 'fs'
import path from 'path'

describe('Database Initialization Module', () => {
  let dbPath: string

  beforeAll(async () => {
    // Initialize database
    const result = await initializeDatabase()
    dbPath = result.dbPath
  })

  afterAll(async () => {
    await closeDatabaseConnection()

    // Wait a bit for file to be released
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Clean up test database
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  })

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      const result = await initializeDatabase()

      expect(result.success).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should create database file', async () => {
      const result = await initializeDatabase()

      expect(result.dbPath).toBeDefined()
      expect(result.dbPath.length).toBeGreaterThan(0)
      expect(fs.existsSync(result.dbPath)).toBe(true)
    })

    it('should report database size', async () => {
      const result = await initializeDatabase()

      expect(result.dbSize).toBeGreaterThanOrEqual(0)
      expect(typeof result.dbSize).toBe('number')
    })

    it('should verify schema validity', async () => {
      const result = await initializeDatabase()

      expect(result.schemaValid).toBe(true)
    })

    it('should apply migrations', async () => {
      const result = await initializeDatabase()

      expect(result.migrationsApplied).toBeGreaterThanOrEqual(0)
    })

    it('should include timestamp', async () => {
      const result = await initializeDatabase()

      expect(result.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Initialization Result', () => {
    it('should have success flag', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')
    })

    it('should have database path', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('dbPath')
      expect(typeof result.dbPath).toBe('string')
    })

    it('should have database size', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('dbSize')
      expect(typeof result.dbSize).toBe('number')
    })

    it('should have schema validity flag', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('schemaValid')
      expect(typeof result.schemaValid).toBe('boolean')
    })

    it('should have migrations applied count', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('migrationsApplied')
      expect(typeof result.migrationsApplied).toBe('number')
    })

    it('should have errors array', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should have warnings array', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('warnings')
      expect(Array.isArray(result.warnings)).toBe(true)
    })
  })

  describe('Database Connection', () => {
    it('should get database connection', () => {
      const connection = getDatabaseConnectionInstance()

      expect(connection).toBeDefined()
    })

    it('should return same connection instance', () => {
      const connection1 = getDatabaseConnectionInstance()
      const connection2 = getDatabaseConnectionInstance()

      expect(connection1).toBe(connection2)
    })
  })

  describe('Database Statistics', () => {
    it('should get database statistics', () => {
      const stats = getDatabaseStats()

      expect(stats).toBeDefined()
      expect(stats).toHaveProperty('initialized')
      expect(stats).toHaveProperty('connectionCount')
      expect(stats).toHaveProperty('maxConnections')
      expect(stats).toHaveProperty('dbPath')
      expect(stats).toHaveProperty('dbSize')
    })

    it('should report initialized status', () => {
      const stats = getDatabaseStats()

      expect(stats?.initialized).toBe(true)
    })

    it('should report connection count', () => {
      const stats = getDatabaseStats()

      expect(stats?.connectionCount).toBeGreaterThan(0)
    })

    it('should report database path', () => {
      const stats = getDatabaseStats()

      expect(stats?.dbPath).toBeDefined()
      expect(stats?.dbPath.length).toBeGreaterThan(0)
    })

    it('should report database size', () => {
      const stats = getDatabaseStats()

      expect(stats?.dbSize).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Database File Location', () => {
    it('should create database in .kiro/data directory', async () => {
      const result = await initializeDatabase()

      expect(result.dbPath).toContain('.kiro')
      expect(result.dbPath).toContain('data')
    })

    it('should use token-killer.db filename', async () => {
      const result = await initializeDatabase()

      expect(path.basename(result.dbPath)).toBe('token-killer.db')
    })

    it('should create directory structure if needed', async () => {
      const result = await initializeDatabase()
      const dataDir = path.dirname(result.dbPath)

      expect(fs.existsSync(dataDir)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should include error messages if initialization fails', async () => {
      const result = await initializeDatabase()

      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    it('should include warnings if applicable', async () => {
      const result = await initializeDatabase()

      expect(result).toHaveProperty('warnings')
      expect(Array.isArray(result.warnings)).toBe(true)
    })
  })

  describe('Connection Lifecycle', () => {
    it('should close database connection', async () => {
      await closeDatabaseConnection()

      // After closing, stats should return null or have initialized as false
      const stats = getDatabaseStats()
      expect(stats === null || stats?.initialized === false).toBe(true)
    })
  })
})
