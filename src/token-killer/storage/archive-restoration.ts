/**
 * Archive Restoration Module
 * Handles restoration of archived data back to active storage
 */

import { EventEmitter } from "events"
import { DatabasePool } from "./database"
import { CompressionService } from "./compression"
import { ArchiveMetadataTracker } from "./archive-metadata"

/**
 * Restoration options
 */
export interface RestorationOptions {
    archiveId: string
    deleteAfterRestore?: boolean
    batchSize?: number
    predicate?: (record: any) => boolean
}

/**
 * Restoration result
 */
export interface RestorationResult {
    archiveId: string
    recordsRestored: number
    recordsSkipped: number
    duration: number // milliseconds
    timestamp: Date
    success: boolean
    error?: string
}

/**
 * Restoration progress
 */
export interface RestorationProgress {
    archiveId: string
    totalRecords: number
    restoredRecords: number
    skippedRecords: number
    percentageComplete: number
    estimatedTimeRemaining: number // milliseconds
}

/**
 * Archive Restoration Service
 * Manages restoration of archived data
 */
export class ArchiveRestorationService extends EventEmitter {
    private pool: DatabasePool
    private compressionService: CompressionService
    private metadataTracker: ArchiveMetadataTracker
    private isRestoring: boolean = false
    private restorationProgress?: RestorationProgress

    constructor(
        pool: DatabasePool,
        compressionService: CompressionService,
        metadataTracker: ArchiveMetadataTracker
    ) {
        super()
        this.pool = pool
        this.compressionService = compressionService
        this.metadataTracker = metadataTracker
    }

    /**
     * Restore archive to active storage
     */
    async restoreArchive(
        options: RestorationOptions
    ): Promise<RestorationResult> {
        if (this.isRestoring) {
            throw new Error("Restoration already in progress")
        }

        this.isRestoring = true
        const startTime = Date.now()

        try {
            const connection = this.pool.getConnection()
            const batchSize = options.batchSize || 1000

            return new Promise(async (resolve, reject) => {
                // Get archive metadata
                const metadata = await this.metadataTracker.getArchiveMetadata(
                    options.archiveId
                )

                if (!metadata) {
                    this.isRestoring = false
                    reject(new Error(`Archive not found: ${options.archiveId}`))
                    return
                }

                // Fetch compressed data
                connection.get(
                    `SELECT compressedData, compressionMethod FROM archived_data WHERE id = ?`,
                    [options.archiveId],
                    async (err, row: any) => {
                        if (err) {
                            this.isRestoring = false
                            reject(
                                new Error(
                                    `Failed to fetch archive: ${err.message}`
                                )
                            )
                            return
                        }

                        if (!row) {
                            this.isRestoring = false
                            reject(
                                new Error(
                                    `Archive data not found: ${options.archiveId}`
                                )
                            )
                            return
                        }

                        try {
                            // Decompress data
                            const decompressed =
                                await this.compressionService.decompress(
                                    row.compressedData,
                                    row.compressionMethod
                                )

                            const records = decompressed.data
                            const totalRecords = records.length

                            // Apply predicate if provided
                            const recordsToRestore = options.predicate
                                ? records.filter(options.predicate)
                                : records

                            const skippedRecords =
                                totalRecords - recordsToRestore.length

                            // Initialize progress
                            this.restorationProgress = {
                                archiveId: options.archiveId,
                                totalRecords: recordsToRestore.length,
                                restoredRecords: 0,
                                skippedRecords,
                                percentageComplete: 0,
                                estimatedTimeRemaining: 0,
                            }

                            // Restore records in batches
                            let restoredCount = 0
                            const startRestoreTime = Date.now()

                            const restoreNextBatch = () => {
                                if (restoredCount >= recordsToRestore.length) {
                                    // All records restored
                                    if (options.deleteAfterRestore) {
                                        // Delete archive after successful restoration
                                        connection.run(
                                            `DELETE FROM archived_data WHERE id = ?`,
                                            [options.archiveId],
                                            async err => {
                                                if (err) {
                                                    this.isRestoring = false
                                                    reject(
                                                        new Error(
                                                            `Failed to delete archive after restoration: ${err.message}`
                                                        )
                                                    )
                                                } else {
                                                    // Delete metadata
                                                    await this.metadataTracker.deleteArchiveMetadata(
                                                        options.archiveId
                                                    )

                                                    this.isRestoring = false
                                                    const result: RestorationResult =
                                                        {
                                                            archiveId:
                                                                options.archiveId,
                                                            recordsRestored:
                                                                restoredCount,
                                                            recordsSkipped:
                                                                skippedRecords,
                                                            duration:
                                                                Date.now() -
                                                                startTime,
                                                            timestamp:
                                                                new Date(),
                                                            success: true,
                                                        }

                                                    this.emit(
                                                        "restoration_completed",
                                                        result
                                                    )
                                                    resolve(result)
                                                }
                                            }
                                        )
                                    } else {
                                        this.isRestoring = false
                                        const result: RestorationResult = {
                                            archiveId: options.archiveId,
                                            recordsRestored: restoredCount,
                                            recordsSkipped: skippedRecords,
                                            duration: Date.now() - startTime,
                                            timestamp: new Date(),
                                            success: true,
                                        }

                                        this.emit(
                                            "restoration_completed",
                                            result
                                        )
                                        resolve(result)
                                    }
                                    return
                                }

                                // Get next batch
                                const batch = recordsToRestore.slice(
                                    restoredCount,
                                    restoredCount + batchSize
                                )

                                // Insert batch
                                let inserted = 0

                                const insertNextRecord = () => {
                                    if (inserted >= batch.length) {
                                        restoredCount += batch.length

                                        // Update progress
                                        const elapsedTime =
                                            Date.now() - startRestoreTime
                                        const recordsPerMs =
                                            restoredCount / elapsedTime
                                        const remainingRecords =
                                            recordsToRestore.length -
                                            restoredCount
                                        const estimatedTimeRemaining =
                                            remainingRecords / recordsPerMs

                                        this.restorationProgress = {
                                            archiveId: options.archiveId,
                                            totalRecords:
                                                recordsToRestore.length,
                                            restoredRecords: restoredCount,
                                            skippedRecords,
                                            percentageComplete:
                                                (restoredCount /
                                                    recordsToRestore.length) *
                                                100,
                                            estimatedTimeRemaining,
                                        }

                                        this.emit(
                                            "restoration_progress",
                                            this.restorationProgress
                                        )

                                        // Continue with next batch
                                        restoreNextBatch()
                                        return
                                    }

                                    const record = batch[inserted]

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
                                            record.metadata
                                                ? JSON.stringify(
                                                      record.metadata
                                                  )
                                                : null,
                                            record.createdAt,
                                        ],
                                        err => {
                                            if (err) {
                                                this.isRestoring = false
                                                reject(
                                                    new Error(
                                                        `Failed to restore record: ${err.message}`
                                                    )
                                                )
                                            } else {
                                                inserted++
                                                insertNextRecord()
                                            }
                                        }
                                    )
                                }

                                insertNextRecord()
                            }

                            restoreNextBatch()
                        } catch (error) {
                            this.isRestoring = false
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            const result: RestorationResult = {
                                archiveId: options.archiveId,
                                recordsRestored: 0,
                                recordsSkipped: 0,
                                duration: Date.now() - startTime,
                                timestamp: new Date(),
                                success: false,
                                error: message,
                            }
                            this.emit("restoration_failed", result)
                            reject(
                                new Error(
                                    `Failed to restore archive: ${message}`
                                )
                            )
                        }
                    }
                )
            })
        } catch (error) {
            this.isRestoring = false
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to restore archive: ${message}`)
        }
    }

    /**
     * Restore multiple archives
     */
    async restoreMultipleArchives(
        archiveIds: string[],
        deleteAfterRestore: boolean = false
    ): Promise<RestorationResult[]> {
        const results: RestorationResult[] = []

        for (const archiveId of archiveIds) {
            try {
                const result = await this.restoreArchive({
                    archiveId,
                    deleteAfterRestore,
                })
                results.push(result)
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                results.push({
                    archiveId,
                    recordsRestored: 0,
                    recordsSkipped: 0,
                    duration: 0,
                    timestamp: new Date(),
                    success: false,
                    error: message,
                })
            }
        }

        return results
    }

    /**
     * Restore all archives
     */
    async restoreAllArchives(
        deleteAfterRestore: boolean = false
    ): Promise<RestorationResult[]> {
        try {
            const archives = await this.metadataTracker.getAllArchives()
            const archiveIds = archives.map(a => a.archiveId)
            return this.restoreMultipleArchives(archiveIds, deleteAfterRestore)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to restore all archives: ${message}`)
        }
    }

    /**
     * Get restoration progress
     */
    getProgress(): RestorationProgress | undefined {
        return this.restorationProgress
    }

    /**
     * Check if restoration is in progress
     */
    isRestorationInProgress(): boolean {
        return this.isRestoring
    }

    /**
     * Cancel restoration (if supported)
     */
    async cancelRestoration(): Promise<void> {
        if (this.isRestoring) {
            this.isRestoring = false
            this.emit("restoration_cancelled", {
                timestamp: new Date(),
            })
        }
    }
}

export { RestorationOptions, RestorationResult, RestorationProgress }
