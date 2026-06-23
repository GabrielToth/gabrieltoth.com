/**
 * Storage Management Module
 * Handles local storage size monitoring, archival, and compression
 * Works in both Node.js (server-side) and browser environments with appropriate SQLite adapters
 */

import fs from "fs"
import path from "path"
import zlib from "zlib"
import { promisify } from "util"
import { EventEmitter } from "events"
import { DatabasePool } from "./database"
import { StorageStats, ArchiveMetadata } from "../core/types"

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

/**
 * Storage thresholds in bytes
 */
const STORAGE_THRESHOLDS = {
    WARNING: 500 * 1024 * 1024, // 500MB
    ARCHIVAL: 1024 * 1024 * 1024, // 1GB
}

/**
 * Archival configuration
 */
interface ArchivalConfig {
    dataRetentionDays: number // Archive data older than this
    compressionMethod: "gzip" | "brotli"
    archiveFolder: string
    autoArchivalEnabled: boolean
    checkIntervalMs: number // How often to check storage size
}

/**
 * Storage warning event
 */
export interface StorageWarning {
    level: "warning" | "critical"
    currentSize: number
    threshold: number
    percentageUsed: number
    timestamp: Date
    message: string
}

/**
 * Archival event
 */
export interface ArchivalEvent {
    archivedRecordCount: number
    originalSize: number
    compressedSize: number
    compressionRatio: number
    timestamp: Date
    archiveId: string
}

/**
 * Storage Manager
 * Monitors local storage, triggers archival, and manages compressed data
 */
export class StorageManager extends EventEmitter {
    private pool: DatabasePool
    private config: ArchivalConfig
    private dataDir: string
    private archiveDir: string
    private isMonitoring: boolean = false
    private monitoringInterval?: NodeJS.Timeout
    private lastWarningLevel?: "warning" | "critical"

    constructor(pool: DatabasePool, config: Partial<ArchivalConfig> = {}) {
        super()
        this.pool = pool
        this.config = {
            dataRetentionDays: config.dataRetentionDays ?? 30,
            compressionMethod: config.compressionMethod ?? "gzip",
            archiveFolder:
                config.archiveFolder ??
                path.join(process.cwd(), ".kiro", "data", "archive"),
            autoArchivalEnabled: config.autoArchivalEnabled ?? true,
            checkIntervalMs: config.checkIntervalMs ?? 60000, // Check every minute
        }

        this.dataDir = path.join(process.cwd(), ".kiro", "data")
        this.archiveDir = this.config.archiveFolder
    }

    /**
     * Initialize storage manager
     */
    async initialize(): Promise<void> {
        try {
            // Create archive directory if it doesn't exist
            if (!fs.existsSync(this.archiveDir)) {
                fs.mkdirSync(this.archiveDir, { recursive: true })
            }

            this.emit("initialized", {
                archiveDir: this.archiveDir,
                timestamp: new Date(),
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            this.emit("error", {
                type: "initialization_failed",
                message,
                timestamp: new Date(),
            })
            throw new Error(`Failed to initialize storage manager: ${message}`)
        }
    }

    /**
     * Start monitoring storage size
     */
    startMonitoring(): void {
        if (this.isMonitoring) {
            return
        }

        this.isMonitoring = true

        // Perform initial check
        this.checkStorageSize().catch(error => {
            this.emit("error", {
                type: "monitoring_error",
                message: error instanceof Error ? error.message : String(error),
                timestamp: new Date(),
            })
        })

        // Set up periodic checks
        this.monitoringInterval = setInterval(() => {
            this.checkStorageSize().catch(error => {
                this.emit("error", {
                    type: "monitoring_error",
                    message:
                        error instanceof Error ? error.message : String(error),
                    timestamp: new Date(),
                })
            })
        }, this.config.checkIntervalMs)

        this.emit("monitoring_started", {
            checkIntervalMs: this.config.checkIntervalMs,
            timestamp: new Date(),
        })
    }

    /**
     * Stop monitoring storage size
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
            this.monitoringInterval = undefined
        }

        this.isMonitoring = false
        this.emit("monitoring_stopped", { timestamp: new Date() })
    }

    /**
     * Check current storage size and emit warnings if needed
     */
    async checkStorageSize(): Promise<StorageStats> {
        try {
            const stats = await this.getStorageStats()

            // Check thresholds
            if (stats.totalSize >= STORAGE_THRESHOLDS.ARCHIVAL) {
                // Trigger archival if enabled
                if (this.config.autoArchivalEnabled) {
                    await this.archiveOldData()
                }

                // Emit critical warning
                if (this.lastWarningLevel !== "critical") {
                    const warning: StorageWarning = {
                        level: "critical",
                        currentSize: stats.totalSize,
                        threshold: STORAGE_THRESHOLDS.ARCHIVAL,
                        percentageUsed:
                            (stats.totalSize / STORAGE_THRESHOLDS.ARCHIVAL) *
                            100,
                        timestamp: new Date(),
                        message: `Storage size (${this.formatBytes(stats.totalSize)}) has reached critical threshold (${this.formatBytes(STORAGE_THRESHOLDS.ARCHIVAL)})`,
                    }
                    this.lastWarningLevel = "critical"
                    this.emit("storage_warning", warning)
                }
            } else if (stats.totalSize >= STORAGE_THRESHOLDS.WARNING) {
                // Emit warning
                if (this.lastWarningLevel !== "warning") {
                    const warning: StorageWarning = {
                        level: "warning",
                        currentSize: stats.totalSize,
                        threshold: STORAGE_THRESHOLDS.WARNING,
                        percentageUsed:
                            (stats.totalSize / STORAGE_THRESHOLDS.WARNING) *
                            100,
                        timestamp: new Date(),
                        message: `Storage size (${this.formatBytes(stats.totalSize)}) has reached warning threshold (${this.formatBytes(STORAGE_THRESHOLDS.WARNING)})`,
                    }
                    this.lastWarningLevel = "warning"
                    this.emit("storage_warning", warning)
                }
            } else {
                // Clear warning level
                this.lastWarningLevel = undefined
            }

            return stats
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to check storage size: ${message}`)
        }
    }

    /**
     * Get current storage statistics
     */
    async getStorageStats(): Promise<StorageStats> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                // Get active data count
                connection.get(
                    `SELECT COUNT(*) as recordCount FROM token_records`,
                    (err, row: any) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to get active record count: ${err.message}`
                                )
                            )
                            return
                        }

                        const activeRecordCount = row?.recordCount || 0
                        const activeSize = this.pool.getDbSize()

                        // Get archived data size
                        connection.get(
                            `SELECT 
                COUNT(*) as archivedRecordCount,
                SUM(COALESCE(compressedSize, 0)) as archivedSize
              FROM archived_data`,
                            (err, archivedRow: any) => {
                                if (err) {
                                    reject(
                                        new Error(
                                            `Failed to get archived record count: ${err.message}`
                                        )
                                    )
                                    return
                                }

                                const archivedRecordCount =
                                    archivedRow?.archivedRecordCount || 0
                                const archivedSize =
                                    archivedRow?.archivedSize || 0

                                // Calculate archive folder size
                                let archiveFolderSize = 0
                                try {
                                    if (fs.existsSync(this.archiveDir)) {
                                        const files = fs.readdirSync(
                                            this.archiveDir
                                        )
                                        for (const file of files) {
                                            const filePath = path.join(
                                                this.archiveDir,
                                                file
                                            )
                                            const stats = fs.statSync(filePath)
                                            archiveFolderSize += stats.size
                                        }
                                    }
                                } catch (error) {
                                    // Ignore errors reading archive folder
                                }

                                resolve({
                                    totalSize: activeSize + archiveFolderSize,
                                    recordCount: activeRecordCount,
                                    archivedSize: archiveFolderSize,
                                    archivedRecordCount,
                                })
                            }
                        )
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to get storage stats: ${message}`)
        }
    }

    /**
     * Archive data older than retention period
     */
    async archiveOldData(): Promise<ArchivalEvent> {
        try {
            const connection = this.pool.getConnection()
            const cutoffDate = new Date()
            cutoffDate.setDate(
                cutoffDate.getDate() - this.config.dataRetentionDays
            )

            return new Promise(async (resolve, reject) => {
                // Get records to archive
                connection.all(
                    `SELECT * FROM token_records WHERE timestamp < ? ORDER BY timestamp ASC`,
                    [cutoffDate.toISOString()],
                    async (err, rows: any[]) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to fetch records for archival: ${err.message}`
                                )
                            )
                            return
                        }

                        if (!rows || rows.length === 0) {
                            // No records to archive
                            resolve({
                                archivedRecordCount: 0,
                                originalSize: 0,
                                compressedSize: 0,
                                compressionRatio: 0,
                                timestamp: new Date(),
                                archiveId: "",
                            })
                            return
                        }

                        try {
                            // Serialize records to JSON
                            const jsonData = JSON.stringify(rows)
                            const originalSize = Buffer.byteLength(
                                jsonData,
                                "utf8"
                            )

                            // Compress data
                            const compressedData = await gzip(jsonData)
                            const compressedSize = compressedData.length
                            const compressionRatio =
                                (1 - compressedSize / originalSize) * 100

                            // Generate archive ID
                            const archiveId = `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

                            // Store in database
                            connection.run(
                                `INSERT INTO archived_data (id, dataType, compressedData, originalSize, compressedSize, compressionMethod, recordCount, archivedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    archiveId,
                                    "token_records",
                                    compressedData,
                                    originalSize,
                                    compressedSize,
                                    this.config.compressionMethod,
                                    rows.length,
                                    new Date().toISOString(),
                                ],
                                async err => {
                                    if (err) {
                                        reject(
                                            new Error(
                                                `Failed to store archived data: ${err.message}`
                                            )
                                        )
                                        return
                                    }

                                    // Delete archived records from active table
                                    connection.run(
                                        `DELETE FROM token_records WHERE timestamp < ?`,
                                        [cutoffDate.toISOString()],
                                        err => {
                                            if (err) {
                                                reject(
                                                    new Error(
                                                        `Failed to delete archived records: ${err.message}`
                                                    )
                                                )
                                                return
                                            }

                                            const event: ArchivalEvent = {
                                                archivedRecordCount:
                                                    rows.length,
                                                originalSize,
                                                compressedSize,
                                                compressionRatio,
                                                timestamp: new Date(),
                                                archiveId,
                                            }

                                            this.emit(
                                                "archival_completed",
                                                event
                                            )
                                            resolve(event)
                                        }
                                    )
                                }
                            )
                        } catch (error) {
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            reject(
                                new Error(`Failed to compress data: ${message}`)
                            )
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to archive old data: ${message}`)
        }
    }

    /**
     * Retrieve and decompress archived data
     */
    async getArchivedData(archiveId: string): Promise<any[]> {
        try {
            const connection = this.pool.getConnection()

            return new Promise(async (resolve, reject) => {
                connection.get(
                    `SELECT compressedData FROM archived_data WHERE id = ?`,
                    [archiveId],
                    async (err, row: any) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to fetch archived data: ${err.message}`
                                )
                            )
                            return
                        }

                        if (!row) {
                            reject(new Error(`Archive not found: ${archiveId}`))
                            return
                        }

                        try {
                            const decompressedData = await gunzip(
                                row.compressedData
                            )
                            const records = JSON.parse(
                                decompressedData.toString("utf8")
                            )
                            resolve(records)
                        } catch (error) {
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            reject(
                                new Error(
                                    `Failed to decompress archived data: ${message}`
                                )
                            )
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to get archived data: ${message}`)
        }
    }

    /**
     * Query archived data transparently (decompress and search)
     */
    async queryArchivedData(
        archiveId: string,
        predicate?: (record: any) => boolean
    ): Promise<any[]> {
        try {
            const records = await this.getArchivedData(archiveId)

            if (predicate) {
                return records.filter(predicate)
            }

            return records
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to query archived data: ${message}`)
        }
    }

    /**
     * Get list of all archives
     */
    async listArchives(): Promise<ArchiveMetadata[]> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.all(
                    `SELECT id, dataType, originalSize, compressedSize, compressionMethod, recordCount, archivedAt
          FROM archived_data
          ORDER BY archivedAt DESC`,
                    (err, rows: any[]) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to list archives: ${err.message}`
                                )
                            )
                            return
                        }

                        const archives: ArchiveMetadata[] = (rows || []).map(
                            row => ({
                                id: row.id,
                                dataType: row.dataType,
                                originalSize: row.originalSize,
                                compressedSize: row.compressedSize,
                                compressionMethod: row.compressionMethod,
                                archivedAt: new Date(row.archivedAt),
                                recordCount: row.recordCount,
                            })
                        )

                        resolve(archives)
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to list archives: ${message}`)
        }
    }

    /**
     * Delete an archive
     */
    async deleteArchive(archiveId: string): Promise<void> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.run(
                    `DELETE FROM archived_data WHERE id = ?`,
                    [archiveId],
                    err => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to delete archive: ${err.message}`
                                )
                            )
                        } else {
                            this.emit("archive_deleted", {
                                archiveId,
                                timestamp: new Date(),
                            })
                            resolve()
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to delete archive: ${message}`)
        }
    }

    /**
     * Restore archived data back to active storage
     */
    async restoreArchive(archiveId: string): Promise<number> {
        try {
            const records = await this.getArchivedData(archiveId)
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                // Insert records back into active table
                let inserted = 0

                const insertNext = () => {
                    if (inserted >= records.length) {
                        // Delete archive after successful restoration
                        connection.run(
                            `DELETE FROM archived_data WHERE id = ?`,
                            [archiveId],
                            err => {
                                if (err) {
                                    reject(
                                        new Error(
                                            `Failed to delete archive after restoration: ${err.message}`
                                        )
                                    )
                                } else {
                                    this.emit("archive_restored", {
                                        archiveId,
                                        recordCount: records.length,
                                        timestamp: new Date(),
                                    })
                                    resolve(records.length)
                                }
                            }
                        )
                        return
                    }

                    const record = records[inserted]
                    connection.run(
                        `INSERT INTO token_records (id, requestId, taskId, agentType, model, inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost, timestamp, metadata, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            record.id,
                            record.requestId,
                            record.taskId,
                            record.agentType,
                            record.model,
                            record.inputTokens,
                            record.outputTokens,
                            record.totalTokens,
                            record.inputCost,
                            record.outputCost,
                            record.totalCost,
                            record.timestamp,
                            record.metadata,
                            record.createdAt,
                        ],
                        err => {
                            if (err) {
                                reject(
                                    new Error(
                                        `Failed to restore record: ${err.message}`
                                    )
                                )
                            } else {
                                inserted++
                                insertNext()
                            }
                        }
                    )
                }

                insertNext()
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to restore archive: ${message}`)
        }
    }

    /**
     * Format bytes to human-readable string
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return "0 Bytes"

        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown(): Promise<void> {
        this.stopMonitoring()
        this.emit("shutdown", { timestamp: new Date() })
    }
}

export { ArchivalConfig, ArchivalEvent, StorageWarning }
