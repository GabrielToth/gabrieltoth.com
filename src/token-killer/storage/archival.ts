/**
 * Archival Module
 * Handles archival process for data >30 days old
 * Manages archival scheduling, triggering, and lifecycle
 */

import { EventEmitter } from 'events'
import { DatabasePool } from './database'
import { CompressionService } from './compression'
import { ArchiveMetadataTracker } from './archive-metadata'

/**
 * Archival configuration
 */
export interface ArchivalConfig {
  dataRetentionDays: number
  compressionMethod: 'gzip' | 'brotli'
  autoArchivalEnabled: boolean
  archivalSchedule?: 'hourly' | 'daily' | 'weekly' | 'manual'
  maxRecordsPerArchival?: number
  batchSize?: number
}

/**
 * Archival result
 */
export interface ArchivalResult {
  archiveId: string
  recordsArchived: number
  originalSize: number
  compressedSize: number
  compressionRatio: number
  duration: number // milliseconds
  timestamp: Date
  success: boolean
  error?: string
}

/**
 * Archival Service
 * Manages the archival process for old data
 */
export class ArchivalService extends EventEmitter {
  private pool: DatabasePool
  private compressionService: CompressionService
  private metadataTracker: ArchiveMetadataTracker
  private config: ArchivalConfig
  private isArchiving: boolean = false
  private lastArchivalTime?: Date
  private archivalScheduleInterval?: NodeJS.Timeout

  constructor(
    pool: DatabasePool,
    compressionService: CompressionService,
    metadataTracker: ArchiveMetadataTracker,
    config: Partial<ArchivalConfig> = {}
  ) {
    super()
    this.pool = pool
    this.compressionService = compressionService
    this.metadataTracker = metadataTracker
    this.config = {
      dataRetentionDays: config.dataRetentionDays ?? 30,
      compressionMethod: config.compressionMethod ?? 'gzip',
      autoArchivalEnabled: config.autoArchivalEnabled ?? true,
      archivalSchedule: config.archivalSchedule ?? 'daily',
      maxRecordsPerArchival: config.maxRecordsPerArchival ?? 10000,
      batchSize: config.batchSize ?? 1000,
    }
  }

  /**
   * Initialize archival service
   */
  async initialize(): Promise<void> {
    try {
      this.emit('initialized', {
        config: this.config,
        timestamp: new Date(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.emit('error', {
        type: 'initialization_failed',
        message,
        timestamp: new Date(),
      })
      throw new Error(`Failed to initialize archival service: ${message}`)
    }
  }

  /**
   * Start archival scheduling
   */
  startScheduling(): void {
    if (!this.config.autoArchivalEnabled || this.config.archivalSchedule === 'manual') {
      return
    }

    // Clear existing schedule if any
    if (this.archivalScheduleInterval) {
      clearInterval(this.archivalScheduleInterval)
    }

    const scheduleMs = this.getScheduleInterval()

    this.archivalScheduleInterval = setInterval(() => {
      this.archiveOldData().catch((error) => {
        this.emit('error', {
          type: 'scheduled_archival_failed',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        })
      })
    }, scheduleMs)

    this.emit('scheduling_started', {
      schedule: this.config.archivalSchedule,
      intervalMs: scheduleMs,
      timestamp: new Date(),
    })
  }

  /**
   * Stop archival scheduling
   */
  stopScheduling(): void {
    if (this.archivalScheduleInterval) {
      clearInterval(this.archivalScheduleInterval)
      this.archivalScheduleInterval = undefined
    }

    this.emit('scheduling_stopped', { timestamp: new Date() })
  }

  /**
   * Archive data older than retention period
   */
  async archiveOldData(): Promise<ArchivalResult> {
    if (this.isArchiving) {
      throw new Error('Archival already in progress')
    }

    this.isArchiving = true
    const startTime = Date.now()

    try {
      const connection = this.pool.getConnection()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionDays)

      return new Promise(async (resolve, reject) => {
        // Get count of records to archive
        connection.get(
          `SELECT COUNT(*) as recordCount FROM token_records WHERE timestamp < ?`,
          [cutoffDate.toISOString()],
          async (err, countRow: any) => {
            if (err) {
              this.isArchiving = false
              reject(new Error(`Failed to count records for archival: ${err.message}`))
              return
            }

            const totalRecords = countRow?.recordCount || 0

            if (totalRecords === 0) {
              this.isArchiving = false
              const result: ArchivalResult = {
                archiveId: '',
                recordsArchived: 0,
                originalSize: 0,
                compressedSize: 0,
                compressionRatio: 0,
                duration: Date.now() - startTime,
                timestamp: new Date(),
                success: true,
              }
              this.emit('no_records_to_archive', result)
              resolve(result)
              return
            }

            // Limit records to archive
            const recordsToArchive = Math.min(
              totalRecords,
              this.config.maxRecordsPerArchival || 10000
            )

            try {
              // Fetch records in batches
              const allRecords: any[] = []
              const batchSize = this.config.batchSize || 1000

              for (let offset = 0; offset < recordsToArchive; offset += batchSize) {
                const records = await this.fetchRecordsBatch(
                  connection,
                  cutoffDate,
                  batchSize,
                  offset
                )
                allRecords.push(...records)
              }

              // Compress records
              const compressionResult = await this.compressionService.compress(
                allRecords,
                this.config.compressionMethod
              )

              // Generate archive ID
              const archiveId = `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

              // Store archive in database
              await this.storeArchive(
                connection,
                archiveId,
                compressionResult,
                allRecords.length
              )

              // Delete archived records from active table
              await this.deleteArchivedRecords(connection, cutoffDate, allRecords.length)

              // Track metadata
              await this.metadataTracker.trackArchival({
                archiveId,
                recordCount: allRecords.length,
                originalSize: compressionResult.originalSize,
                compressedSize: compressionResult.compressedSize,
                compressionRatio: compressionResult.compressionRatio,
                compressionMethod: this.config.compressionMethod,
                archivedAt: new Date(),
              })

              this.lastArchivalTime = new Date()
              this.isArchiving = false

              const result: ArchivalResult = {
                archiveId,
                recordsArchived: allRecords.length,
                originalSize: compressionResult.originalSize,
                compressedSize: compressionResult.compressedSize,
                compressionRatio: compressionResult.compressionRatio,
                duration: Date.now() - startTime,
                timestamp: new Date(),
                success: true,
              }

              this.emit('archival_completed', result)
              resolve(result)
            } catch (error) {
              this.isArchiving = false
              const message = error instanceof Error ? error.message : String(error)
              const result: ArchivalResult = {
                archiveId: '',
                recordsArchived: 0,
                originalSize: 0,
                compressedSize: 0,
                compressionRatio: 0,
                duration: Date.now() - startTime,
                timestamp: new Date(),
                success: false,
                error: message,
              }
              this.emit('archival_failed', result)
              reject(new Error(`Failed to archive data: ${message}`))
            }
          }
        )
      })
    } catch (error) {
      this.isArchiving = false
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to archive old data: ${message}`)
    }
  }

  /**
   * Fetch records in batch
   */
  private fetchRecordsBatch(
    connection: any,
    cutoffDate: Date,
    batchSize: number,
    offset: number
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      connection.all(
        `SELECT * FROM token_records WHERE timestamp < ? ORDER BY timestamp ASC LIMIT ? OFFSET ?`,
        [cutoffDate.toISOString(), batchSize, offset],
        (err, rows: any[]) => {
          if (err) {
            reject(new Error(`Failed to fetch records batch: ${err.message}`))
          } else {
            resolve(rows || [])
          }
        }
      )
    })
  }

  /**
   * Store archive in database
   */
  private storeArchive(
    connection: any,
    archiveId: string,
    compressionResult: any,
    recordCount: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.run(
        `INSERT INTO archived_data (id, dataType, compressedData, originalSize, compressedSize, compressionMethod, recordCount, archivedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          archiveId,
          'token_records',
          compressionResult.compressedData,
          compressionResult.originalSize,
          compressionResult.compressedSize,
          this.config.compressionMethod,
          recordCount,
          new Date().toISOString(),
        ],
        (err) => {
          if (err) {
            reject(new Error(`Failed to store archive: ${err.message}`))
          } else {
            resolve()
          }
        }
      )
    })
  }

  /**
   * Delete archived records from active table
   */
  private deleteArchivedRecords(
    connection: any,
    cutoffDate: Date,
    recordCount: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.run(
        `DELETE FROM token_records WHERE timestamp < ?`,
        [cutoffDate.toISOString()],
        (err) => {
          if (err) {
            reject(new Error(`Failed to delete archived records: ${err.message}`))
          } else {
            resolve()
          }
        }
      )
    })
  }

  /**
   * Get schedule interval in milliseconds
   */
  private getScheduleInterval(): number {
    switch (this.config.archivalSchedule) {
      case 'hourly':
        return 60 * 60 * 1000 // 1 hour
      case 'daily':
        return 24 * 60 * 60 * 1000 // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000 // 7 days
      default:
        return 24 * 60 * 60 * 1000 // default to daily
    }
  }

  /**
   * Get archival status
   */
  getStatus(): {
    isArchiving: boolean
    lastArchivalTime?: Date
    config: ArchivalConfig
  } {
    return {
      isArchiving: this.isArchiving,
      lastArchivalTime: this.lastArchivalTime,
      config: this.config,
    }
  }

  /**
   * Shutdown archival service
   */
  async shutdown(): Promise<void> {
    this.stopScheduling()
    this.emit('shutdown', { timestamp: new Date() })
  }
}

export { ArchivalConfig, ArchivalResult }
