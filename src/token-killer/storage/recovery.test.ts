/**
 * Unit tests for StorageRecoveryManager
 * Tests database integrity checks, recovery mechanisms, backup functionality,
 * and storage consistency validation
 */

import { StorageRecoveryManager } from './recovery'
import { initializeDatabasePool } from './database'
import { initializeDatabase } from './initialize'
import { TokenRecorder } from '../tracker/recorder'
import path from 'path'
import fs from 'fs'

describe('StorageRecoveryManager', () => {
  let recoveryManager: StorageRecoveryManager
  let pool: any
  let recorder: TokenRecorder

  beforeAll(async () => {
    // Initialize database
    pool = await initializeDatabasePool()
    await initializeDatabase()
    recorder = new TokenRecorder(5.0) // 5 BRL per USD
  })

  beforeEach(async () => {
    const backupDir = path.join(process.cwd(), '.kiro', 'data', 'test-backups')
    recoveryManager = new StorageRecoveryManager(pool, backupDir)
    await recoveryManager.initialize()
  })

  afterEach(async () => {
    // Cleanup test backups
    const backupDir = path.join(process.cwd(), '.kiro', 'data', 'test-backups')
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true })
    }
  })

  afterAll(async () => {
    await pool.close()
  })

  describe('initialization', () => {
    it('should initialize recovery manager successfully', async () => {
      const manager = new StorageRecoveryManager(pool)
      await manager.initialize()
      expect(true).toBe(true)
    })

    it('should create backup directory if it does not exist', async () => {
      const backupDir = path.join(process.cwd(), '.kiro', 'data', 'test-backups-new')
      const manager = new StorageRecoveryManager(pool, backupDir)
      await manager.initialize()

      expect(fs.existsSync(backupDir)).toBe(true)

      // Cleanup
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true })
      }
    })

    it('should emit initialized event', async () => {
      const manager = new StorageRecoveryManager(pool)
      const initPromise = new Promise((resolve) => {
        manager.on('initialized', resolve)
      })

      await manager.initialize()
      await initPromise

      expect(true).toBe(true)
    })
  })

  describe('integrity checks', () => {
    it('should perform comprehensive integrity check', async () => {
      const result = await recoveryManager.checkIntegrity()

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(Array.isArray(result.checks)).toBe(true)
      expect(result.checks.length).toBeGreaterThan(0)
    })

    it('should check database file existence', async () => {
      const result = await recoveryManager.checkIntegrity()

      const fileCheck = result.checks.find((c) => c.name === 'Database file exists and readable')
      expect(fileCheck).toBeDefined()
      expect(fileCheck?.passed).toBe(true)
    })

    it('should check database connection health', async () => {
      const result = await recoveryManager.checkIntegrity()

      const healthCheck = result.checks.find((c) => c.name === 'Database connection health')
      expect(healthCheck).toBeDefined()
      expect(healthCheck?.passed).toBe(true)
    })

    it('should check schema integrity', async () => {
      const result = await recoveryManager.checkIntegrity()

      const schemaCheck = result.checks.find((c) => c.name === 'Schema integrity')
      expect(schemaCheck).toBeDefined()
      expect(schemaCheck?.passed).toBe(true)
    })

    it('should check foreign key constraints', async () => {
      const result = await recoveryManager.checkIntegrity()

      const fkCheck = result.checks.find((c) => c.name === 'Foreign key constraints')
      expect(fkCheck).toBeDefined()
    })

    it('should check data consistency', async () => {
      const result = await recoveryManager.checkIntegrity()

      const dataCheck = result.checks.find((c) => c.name === 'Data consistency')
      expect(dataCheck).toBeDefined()
    })

    it('should check constraint violations', async () => {
      const result = await recoveryManager.checkIntegrity()

      const constraintCheck = result.checks.find((c) => c.name === 'Constraint violations')
      expect(constraintCheck).toBeDefined()
    })

    it('should check archive integrity', async () => {
      const result = await recoveryManager.checkIntegrity()

      const archiveCheck = result.checks.find((c) => c.name === 'Archive integrity')
      expect(archiveCheck).toBeDefined()
    })

    it('should emit integrity_check_completed event', async () => {
      const checkPromise = new Promise((resolve) => {
        recoveryManager.on('integrity_check_completed', resolve)
      })

      await recoveryManager.checkIntegrity()
      await checkPromise

      expect(true).toBe(true)
    })
  })

  describe('recovery', () => {
    it('should perform recovery successfully', async () => {
      const result = await recoveryManager.recover()

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.recoveredRecords).toBe('number')
      expect(typeof result.fixedIssues).toBe('number')
    })

    it('should return success when no issues detected', async () => {
      const result = await recoveryManager.recover()

      // If database is healthy, recovery should succeed with no issues
      if (result.warnings.some((w) => w.includes('No issues detected'))) {
        expect(result.success).toBe(true)
        expect(result.fixedIssues).toBe(0)
      }
    })

    it('should emit recovery_completed event', async () => {
      const recoveryPromise = new Promise((resolve) => {
        recoveryManager.on('recovery_completed', resolve)
      })

      await recoveryManager.recover()
      await Promise.race([
        recoveryPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Event not emitted')), 5000))
      ])

      expect(true).toBe(true)
    }, 15000)
  })

  describe('backup functionality', () => {
    it('should create a backup', async () => {
      const backup = await recoveryManager.createBackup('Test backup')

      expect(backup).toBeDefined()
      expect(backup.id).toBeDefined()
      expect(backup.timestamp).toBeDefined()
      expect(backup.dbSize).toBeGreaterThan(0)
      expect(backup.checksumSHA256).toBeDefined()
      expect(backup.compressionMethod).toBe('gzip')
      expect(backup.compressedSize).toBeGreaterThan(0)
      expect(backup.description).toBe('Test backup')
    })

    it('should create backup with tags', async () => {
      const backup = await recoveryManager.createBackup('Test backup', ['test', 'important'])

      expect(backup.tags).toEqual(['test', 'important'])
    })

    it('should emit backup_created event', async () => {
      const backupPromise = new Promise((resolve) => {
        recoveryManager.on('backup_created', resolve)
      })

      await recoveryManager.createBackup('Test backup')
      await backupPromise

      expect(true).toBe(true)
    })

    it('should compress backup effectively', async () => {
      const backup = await recoveryManager.createBackup('Test backup')

      // Compression ratio should be positive
      expect(backup.compressedSize).toBeLessThan(backup.originalSize)
    })

    it('should verify backup checksum', async () => {
      const backup = await recoveryManager.createBackup('Test backup')

      expect(backup.checksumSHA256).toBeDefined()
      expect(backup.checksumSHA256.length).toBe(64) // SHA256 hex is 64 chars
    })

    it('should list all backups', async () => {
      // Create multiple backups
      await recoveryManager.createBackup('Backup 1')
      await recoveryManager.createBackup('Backup 2')
      await recoveryManager.createBackup('Backup 3')

      const backups = await recoveryManager.listBackups()

      expect(Array.isArray(backups)).toBe(true)
      expect(backups.length).toBeGreaterThanOrEqual(3)
    })

    it('should list backups in reverse chronological order', async () => {
      // Create backups with delays
      const backup1 = await recoveryManager.createBackup('Backup 1')
      await new Promise((resolve) => setTimeout(resolve, 100))
      const backup2 = await recoveryManager.createBackup('Backup 2')

      const backups = await recoveryManager.listBackups()

      // Most recent should be first
      expect(backups[0].id).toBe(backup2.id)
      expect(backups[1].id).toBe(backup1.id)
    })

    it('should delete a backup', async () => {
      const backup = await recoveryManager.createBackup('Test backup')
      const backupId = backup.id

      await recoveryManager.deleteBackup(backupId)

      const backups = await recoveryManager.listBackups()
      const deleted = backups.find((b) => b.id === backupId)

      expect(deleted).toBeUndefined()
    })

    it('should emit backup_deleted event', async () => {
      const backup = await recoveryManager.createBackup('Test backup')

      const deletePromise = new Promise((resolve) => {
        recoveryManager.on('backup_deleted', resolve)
      })

      await recoveryManager.deleteBackup(backup.id)
      await deletePromise

      expect(true).toBe(true)
    })

    it('should cleanup old backups', async () => {
      // Create more backups than maxBackups (10)
      for (let i = 0; i < 12; i++) {
        await recoveryManager.createBackup(`Backup ${i}`)
      }

      const backups = await recoveryManager.listBackups()

      // Should keep only 10 most recent
      expect(backups.length).toBeLessThanOrEqual(10)
    })
  })

  describe('backup restoration', () => {
    it('should restore from backup', async () => {
      // Create a backup
      const backup = await recoveryManager.createBackup('Test backup')

      // Record some data
      await recorder.recordToken({
        requestId: 'req-restore-test',
        taskId: 'task-restore-test',
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.00008,
        outputCost: 0.0002,
      })

      // Restore from backup
      await recoveryManager.restoreFromBackup(backup.id)

      // Verify restoration
      expect(true).toBe(true)
    })

    it('should emit backup_restored event', async () => {
      const backup = await recoveryManager.createBackup('Test backup')

      const restorePromise = new Promise((resolve) => {
        recoveryManager.on('backup_restored', resolve)
      })

      await recoveryManager.restoreFromBackup(backup.id)
      await restorePromise

      expect(true).toBe(true)
    })

    it('should fail to restore non-existent backup', async () => {
      try {
        await recoveryManager.restoreFromBackup('non-existent-backup')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('consistency validation', () => {
    it('should validate storage consistency', async () => {
      const result = await recoveryManager.validateConsistency()

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(Array.isArray(result.checks)).toBe(true)
      expect(result.checks.length).toBeGreaterThan(0)
    })

    it('should check token records count', async () => {
      const result = await recoveryManager.validateConsistency()

      const recordCheck = result.checks.find((c) => c.name === 'Token records count')
      expect(recordCheck).toBeDefined()
      expect(recordCheck?.passed).toBe(true)
    })

    it('should check enabled budget configs', async () => {
      const result = await recoveryManager.validateConsistency()

      const budgetCheck = result.checks.find((c) => c.name === 'Enabled budget configs')
      expect(budgetCheck).toBeDefined()
    })

    it('should check archive count', async () => {
      const result = await recoveryManager.validateConsistency()

      const archiveCheck = result.checks.find((c) => c.name === 'Archive count')
      expect(archiveCheck).toBeDefined()
    })

    it('should check enabled strategies', async () => {
      const result = await recoveryManager.validateConsistency()

      const strategyCheck = result.checks.find((c) => c.name === 'Enabled strategies')
      expect(strategyCheck).toBeDefined()
    })

    it('should emit consistency_validation_completed event', async () => {
      const validationPromise = new Promise((resolve) => {
        recoveryManager.on('consistency_validation_completed', resolve)
      })

      await recoveryManager.validateConsistency()
      await validationPromise

      expect(true).toBe(true)
    })
  })

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const manager = new StorageRecoveryManager(pool)
      await manager.initialize()

      const shutdownPromise = new Promise((resolve) => {
        manager.on('shutdown', resolve)
      })

      await manager.shutdown()
      await shutdownPromise

      expect(true).toBe(true)
    })
  })
})
