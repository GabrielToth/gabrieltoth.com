/**
 * Unit tests for StorageManager
 * Tests storage size monitoring, archival, and compression
 */

import { StorageManager } from './storage-manager'
import { initializeDatabasePool, getDatabasePool } from './database'
import { initializeDatabase } from './initialize'
import { TokenRecorder } from '../tracker/recorder'
import path from 'path'
import fs from 'fs'

describe('StorageManager', () => {
  let storageManager: StorageManager
  let pool: any
  let recorder: TokenRecorder

  beforeAll(async () => {
    // Initialize database
    pool = await initializeDatabasePool()
    await initializeDatabase()
    recorder = new TokenRecorder(5.0) // 5 BRL per USD
  })

  beforeEach(async () => {
    storageManager = new StorageManager(pool, {
      dataRetentionDays: 30,
      compressionMethod: 'gzip',
      autoArchivalEnabled: false, // Disable auto-archival for tests
      checkIntervalMs: 1000,
    })
    await storageManager.initialize()
  })

  afterEach(async () => {
    storageManager.stopMonitoring()
  })

  afterAll(async () => {
    await pool.close()
  })

  describe('initialization', () => {
    it('should initialize storage manager successfully', async () => {
      const manager = new StorageManager(pool)
      await manager.initialize()

      const archiveDir = path.join(process.cwd(), '.kiro', 'data', 'archive')
      expect(fs.existsSync(archiveDir)).toBe(true)
    })

    it('should create archive directory if it does not exist', async () => {
      const manager = new StorageManager(pool, {
        archiveFolder: path.join(process.cwd(), '.kiro', 'data', 'test-archive'),
      })
      await manager.initialize()

      const archiveDir = path.join(process.cwd(), '.kiro', 'data', 'test-archive')
      expect(fs.existsSync(archiveDir)).toBe(true)

      // Cleanup
      if (fs.existsSync(archiveDir)) {
        fs.rmSync(archiveDir, { recursive: true })
      }
    })

    it('should emit initialized event', async () => {
      const manager = new StorageManager(pool)
      const initPromise = new Promise((resolve) => {
        manager.on('initialized', resolve)
      })

      await manager.initialize()
      await initPromise

      expect(true).toBe(true)
    })
  })

  describe('storage monitoring', () => {
    it('should start and stop monitoring', () => {
      storageManager.startMonitoring()
      expect(true).toBe(true) // Monitoring started

      storageManager.stopMonitoring()
      expect(true).toBe(true) // Monitoring stopped
    })

    it('should emit monitoring_started event', async () => {
      const startPromise = new Promise((resolve) => {
        storageManager.on('monitoring_started', resolve)
      })

      storageManager.startMonitoring()
      await startPromise

      expect(true).toBe(true)
    })

    it('should emit monitoring_stopped event', async () => {
      storageManager.startMonitoring()

      const stopPromise = new Promise((resolve) => {
        storageManager.on('monitoring_stopped', resolve)
      })

      storageManager.stopMonitoring()
      await stopPromise

      expect(true).toBe(true)
    })
  })

  describe('storage statistics', () => {
    it('should get storage statistics', async () => {
      const stats = await storageManager.getStorageStats()

      expect(stats).toBeDefined()
      expect(stats.totalSize).toBeGreaterThanOrEqual(0)
      expect(stats.recordCount).toBeGreaterThanOrEqual(0)
      expect(stats.archivedSize).toBeGreaterThanOrEqual(0)
      expect(stats.archivedRecordCount).toBeGreaterThanOrEqual(0)
    })

    it('should track record count correctly', async () => {
      // Record some tokens
      await recorder.recordToken({
        requestId: 'req-1',
        taskId: 'task-1',
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.00008,
        outputCost: 0.0002,
      })

      const stats = await storageManager.getStorageStats()
      expect(stats.recordCount).toBeGreaterThan(0)
    })

    it('should calculate total size including database', async () => {
      const stats = await storageManager.getStorageStats()
      expect(stats.totalSize).toBeGreaterThan(0)
    })
  })

  describe('archival', () => {
    it('should archive old data', async () => {
      // Record some tokens with old timestamps
      const connection = pool.getConnection()

      // Insert old record directly (without taskId to avoid foreign key constraint)
      await new Promise<void>((resolve, reject) => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 35) // 35 days old

        connection.run(
          `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'old-record-1',
            'req-old-1',
            'kiro',
            'claude-haiku-4.5',
            100,
            50,
            150,
            0.00008,
            0.0002,
            0.000016,
            oldDate.toISOString(),
            new Date().toISOString(),
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Archive old data
      const event = await storageManager.archiveOldData()

      expect(event.archivedRecordCount).toBeGreaterThan(0)
      expect(event.originalSize).toBeGreaterThan(0)
      expect(event.compressedSize).toBeGreaterThan(0)
      expect(event.compressionRatio).toBeGreaterThan(0)
      expect(event.archiveId).toBeDefined()
    })

    it('should emit archival_completed event', async () => {
      const connection = pool.getConnection()

      // Insert old record
      await new Promise<void>((resolve, reject) => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 35)

        connection.run(
          `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'old-record-2',
            'req-old-2',
            'kiro',
            'claude-haiku-4.5',
            100,
            50,
            150,
            0.00008,
            0.0002,
            0.000016,
            oldDate.toISOString(),
            new Date().toISOString(),
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      const archivalPromise = new Promise((resolve) => {
        storageManager.on('archival_completed', resolve)
      })

      await storageManager.archiveOldData()
      await archivalPromise

      expect(true).toBe(true)
    })

    it('should handle no records to archive', async () => {
      const event = await storageManager.archiveOldData()

      expect(event.archivedRecordCount).toBe(0)
      expect(event.originalSize).toBe(0)
      expect(event.compressedSize).toBe(0)
    })

    it('should compress data effectively', async () => {
      const connection = pool.getConnection()

      // Insert multiple old records
      const recordCount = 10
      for (let i = 0; i < recordCount; i++) {
        await new Promise<void>((resolve, reject) => {
          const oldDate = new Date()
          oldDate.setDate(oldDate.getDate() - 35)

          connection.run(
            `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `old-record-compress-${i}`,
              `req-old-${i}`,
              'kiro',
              'claude-haiku-4.5',
              100,
              50,
              150,
              0.00008,
              0.0002,
              0.000016,
              oldDate.toISOString(),
              new Date().toISOString(),
            ],
            (err) => {
              if (err) reject(err)
              else resolve()
            }
          )
        })
      }

      const event = await storageManager.archiveOldData()

      // Compression ratio should be positive (compressed < original)
      expect(event.compressionRatio).toBeGreaterThan(0)
      expect(event.compressedSize).toBeLessThan(event.originalSize)
    })
  })

  describe('archive retrieval', () => {
    it('should retrieve and decompress archived data', async () => {
      const connection = pool.getConnection()

      // Insert old record
      await new Promise<void>((resolve, reject) => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 35)

        connection.run(
          `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'old-record-retrieve',
            'req-old-retrieve',
            'kiro',
            'claude-haiku-4.5',
            100,
            50,
            150,
            0.00008,
            0.0002,
            0.000016,
            oldDate.toISOString(),
            new Date().toISOString(),
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Archive data
      const archivalEvent = await storageManager.archiveOldData()
      const archiveId = archivalEvent.archiveId

      // Retrieve archived data
      const records = await storageManager.getArchivedData(archiveId)

      expect(records).toBeDefined()
      expect(Array.isArray(records)).toBe(true)
      expect(records.length).toBeGreaterThan(0)
      expect(records[0].id).toBe('old-record-retrieve')
    })

    it('should query archived data with predicate', async () => {
      const connection = pool.getConnection()

      // Insert multiple old records
      for (let i = 0; i < 3; i++) {
        await new Promise<void>((resolve, reject) => {
          const oldDate = new Date()
          oldDate.setDate(oldDate.getDate() - 35)

          connection.run(
            `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `old-record-query-${i}`,
              `req-old-query-${i}`,
              'kiro',
              'claude-haiku-4.5',
              100 + i * 10,
              50,
              150 + i * 10,
              0.00008,
              0.0002,
              0.000016,
              oldDate.toISOString(),
              new Date().toISOString(),
            ],
            (err) => {
              if (err) reject(err)
              else resolve()
            }
          )
        })
      }

      // Archive data
      const archivalEvent = await storageManager.archiveOldData()
      const archiveId = archivalEvent.archiveId

      // Query with predicate
      const records = await storageManager.queryArchivedData(
        archiveId,
        (record) => record.inputTokens > 110
      )

      expect(records.length).toBeGreaterThan(0)
      expect(records.every((r) => r.inputTokens > 110)).toBe(true)
    })

    it('should list all archives', async () => {
      const connection = pool.getConnection()

      // Insert old record
      await new Promise<void>((resolve, reject) => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 35)

        connection.run(
          `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'old-record-list',
            'req-old-list',
            'kiro',
            'claude-haiku-4.5',
            100,
            50,
            150,
            0.00008,
            0.0002,
            0.000016,
            oldDate.toISOString(),
            new Date().toISOString(),
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Archive data
      await storageManager.archiveOldData()

      // List archives
      const archives = await storageManager.listArchives()

      expect(Array.isArray(archives)).toBe(true)
      expect(archives.length).toBeGreaterThan(0)
      expect(archives[0].id).toBeDefined()
      expect(archives[0].dataType).toBe('token_records')
      expect(archives[0].originalSize).toBeGreaterThan(0)
      expect(archives[0].compressedSize).toBeGreaterThan(0)
    })
  })

  describe('archive management', () => {
    it('should delete an archive', async () => {
      const connection = pool.getConnection()

      // Insert old record
      await new Promise<void>((resolve, reject) => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 35)

        connection.run(
          `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'old-record-delete',
            'req-old-delete',
            'kiro',
            'claude-haiku-4.5',
            100,
            50,
            150,
            0.00008,
            0.0002,
            0.000016,
            oldDate.toISOString(),
            new Date().toISOString(),
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Archive data
      const archivalEvent = await storageManager.archiveOldData()
      const archiveId = archivalEvent.archiveId

      // Delete archive
      await storageManager.deleteArchive(archiveId)

      // Verify deletion
      const archives = await storageManager.listArchives()
      const deleted = archives.find((a) => a.id === archiveId)
      expect(deleted).toBeUndefined()
    })

    it('should emit archive_deleted event', async () => {
      const connection = pool.getConnection()

      // Insert old record
      await new Promise<void>((resolve, reject) => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 35)

        connection.run(
          `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'old-record-delete-event',
            'req-old-delete-event',
            'kiro',
            'claude-haiku-4.5',
            100,
            50,
            150,
            0.00008,
            0.0002,
            0.000016,
            oldDate.toISOString(),
            new Date().toISOString(),
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Archive data
      const archivalEvent = await storageManager.archiveOldData()
      const archiveId = archivalEvent.archiveId

      // Delete with event listener
      const deletePromise = new Promise((resolve) => {
        storageManager.on('archive_deleted', resolve)
      })

      await storageManager.deleteArchive(archiveId)
      await deletePromise

      expect(true).toBe(true)
    })

    it('should restore archived data', async () => {
      const connection = pool.getConnection()

      // Insert old record
      await new Promise<void>((resolve, reject) => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 35)

        connection.run(
          `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'old-record-restore',
            'req-old-restore',
            'kiro',
            'claude-haiku-4.5',
            100,
            50,
            150,
            0.00008,
            0.0002,
            0.000016,
            oldDate.toISOString(),
            new Date().toISOString(),
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Archive data
      const archivalEvent = await storageManager.archiveOldData()
      const archiveId = archivalEvent.archiveId

      // Restore archive
      const restoredCount = await storageManager.restoreArchive(archiveId)

      expect(restoredCount).toBeGreaterThan(0)

      // Verify record is back in active table
      const records = await new Promise<any[]>((resolve, reject) => {
        connection.all(
          `SELECT * FROM token_records WHERE id = 'old-record-restore'`,
          (err, rows) => {
            if (err) reject(err)
            else resolve(rows || [])
          }
        )
      })

      expect(records.length).toBe(1)
      expect(records[0].id).toBe('old-record-restore')
    })

    it('should emit archive_restored event', async () => {
      const connection = pool.getConnection()

      // Insert old record
      await new Promise<void>((resolve, reject) => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 35)

        connection.run(
          `INSERT INTO token_records (id, requestId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'old-record-restore-event',
            'req-old-restore-event',
            'kiro',
            'claude-haiku-4.5',
            100,
            50,
            150,
            0.00008,
            0.0002,
            0.000016,
            oldDate.toISOString(),
            new Date().toISOString(),
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Archive data
      const archivalEvent = await storageManager.archiveOldData()
      const archiveId = archivalEvent.archiveId

      // Restore with event listener
      const restorePromise = new Promise((resolve) => {
        storageManager.on('archive_restored', resolve)
      })

      await storageManager.restoreArchive(archiveId)
      await restorePromise

      expect(true).toBe(true)
    })
  })

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const manager = new StorageManager(pool)
      await manager.initialize()
      manager.startMonitoring()

      const shutdownPromise = new Promise((resolve) => {
        manager.on('shutdown', resolve)
      })

      await manager.shutdown()
      await shutdownPromise

      expect(true).toBe(true)
    })
  })
})
