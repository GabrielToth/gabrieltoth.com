/**
 * Archive Metadata Tracker Module
 * Tracks and manages metadata for archived data
 */

import { DatabasePool } from "./database"
import { ArchiveMetadata } from "../core/types"

/**
 * Archive metadata entry
 */
export interface ArchiveMetadataEntry {
    archiveId: string
    recordCount: number
    originalSize: number
    compressedSize: number
    compressionRatio: number
    compressionMethod: "gzip" | "brotli"
    archivedAt: Date
    dataType?: string
    tags?: string[]
    description?: string
    expiresAt?: Date
}

/**
 * Archive metadata query options
 */
export interface ArchiveMetadataQueryOptions {
    limit?: number
    offset?: number
    sortBy?: "archivedAt" | "recordCount" | "compressedSize"
    sortOrder?: "asc" | "desc"
    filterByCompressionMethod?: "gzip" | "brotli"
    filterByDataType?: string
    filterByTags?: string[]
}

/**
 * Archive metadata statistics
 */
export interface ArchiveMetadataStats {
    totalArchives: number
    totalRecordsArchived: number
    totalOriginalSize: number
    totalCompressedSize: number
    averageCompressionRatio: number
    oldestArchive?: Date
    newestArchive?: Date
    byCompressionMethod: {
        gzip: {
            count: number
            totalSize: number
            totalCompressed: number
        }
        brotli: {
            count: number
            totalSize: number
            totalCompressed: number
        }
    }
}

/**
 * Archive Metadata Tracker
 * Manages metadata for all archives
 */
export class ArchiveMetadataTracker {
    private pool: DatabasePool

    constructor(pool: DatabasePool) {
        this.pool = pool
    }

    /**
     * Track a new archival
     */
    async trackArchival(metadata: ArchiveMetadataEntry): Promise<void> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.run(
                    `INSERT INTO archive_metadata (
            archiveId, recordCount, originalSize, compressedSize, compressionRatio,
            compressionMethod, archivedAt, dataType, tags, description, expiresAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        metadata.archiveId,
                        metadata.recordCount,
                        metadata.originalSize,
                        metadata.compressedSize,
                        metadata.compressionRatio,
                        metadata.compressionMethod,
                        metadata.archivedAt.toISOString(),
                        metadata.dataType || "token_records",
                        metadata.tags ? JSON.stringify(metadata.tags) : null,
                        metadata.description || null,
                        metadata.expiresAt
                            ? metadata.expiresAt.toISOString()
                            : null,
                    ],
                    err => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to track archival metadata: ${err.message}`
                                )
                            )
                        } else {
                            resolve()
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to track archival: ${message}`)
        }
    }

    /**
     * Get metadata for a specific archive
     */
    async getArchiveMetadata(
        archiveId: string
    ): Promise<ArchiveMetadataEntry | null> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.get(
                    `SELECT * FROM archive_metadata WHERE archiveId = ?`,
                    [archiveId],
                    (err, row: any) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to get archive metadata: ${err.message}`
                                )
                            )
                        } else if (!row) {
                            resolve(null)
                        } else {
                            resolve({
                                archiveId: row.archiveId,
                                recordCount: row.recordCount,
                                originalSize: row.originalSize,
                                compressedSize: row.compressedSize,
                                compressionRatio: row.compressionRatio,
                                compressionMethod: row.compressionMethod,
                                archivedAt: new Date(row.archivedAt),
                                dataType: row.dataType,
                                tags: row.tags
                                    ? JSON.parse(row.tags)
                                    : undefined,
                                description: row.description,
                                expiresAt: row.expiresAt
                                    ? new Date(row.expiresAt)
                                    : undefined,
                            })
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to get archive metadata: ${message}`)
        }
    }

    /**
     * Query archives with filtering and sorting
     */
    async queryArchives(
        options: ArchiveMetadataQueryOptions = {}
    ): Promise<ArchiveMetadataEntry[]> {
        try {
            const connection = this.pool.getConnection()
            const limit = options.limit ?? 100
            const offset = options.offset ?? 0
            const sortBy = options.sortBy ?? "archivedAt"
            const sortOrder = options.sortOrder ?? "desc"

            let query = `SELECT * FROM archive_metadata WHERE 1=1`
            const params: any[] = []

            // Add filters
            if (options.filterByCompressionMethod) {
                query += ` AND compressionMethod = ?`
                params.push(options.filterByCompressionMethod)
            }

            if (options.filterByDataType) {
                query += ` AND dataType = ?`
                params.push(options.filterByDataType)
            }

            // Add sorting
            query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`

            // Add pagination
            query += ` LIMIT ? OFFSET ?`
            params.push(limit, offset)

            return new Promise((resolve, reject) => {
                connection.all(query, params, (err, rows: any[]) => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to query archives: ${err.message}`
                            )
                        )
                    } else {
                        const archives = (rows || []).map(row => ({
                            archiveId: row.archiveId,
                            recordCount: row.recordCount,
                            originalSize: row.originalSize,
                            compressedSize: row.compressedSize,
                            compressionRatio: row.compressionRatio,
                            compressionMethod: row.compressionMethod,
                            archivedAt: new Date(row.archivedAt),
                            dataType: row.dataType,
                            tags: row.tags ? JSON.parse(row.tags) : undefined,
                            description: row.description,
                            expiresAt: row.expiresAt
                                ? new Date(row.expiresAt)
                                : undefined,
                        }))
                        resolve(archives)
                    }
                })
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to query archives: ${message}`)
        }
    }

    /**
     * Get all archives
     */
    async getAllArchives(): Promise<ArchiveMetadataEntry[]> {
        return this.queryArchives({ limit: 10000 })
    }

    /**
     * Get archives by compression method
     */
    async getArchivesByCompressionMethod(
        method: "gzip" | "brotli"
    ): Promise<ArchiveMetadataEntry[]> {
        return this.queryArchives({ filterByCompressionMethod: method })
    }

    /**
     * Get archives by data type
     */
    async getArchivesByDataType(
        dataType: string
    ): Promise<ArchiveMetadataEntry[]> {
        return this.queryArchives({ filterByDataType: dataType })
    }

    /**
     * Get archives by tags
     */
    async getArchivesByTags(tags: string[]): Promise<ArchiveMetadataEntry[]> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.all(
                    `SELECT * FROM archive_metadata WHERE tags IS NOT NULL ORDER BY archivedAt DESC`,
                    (err, rows: any[]) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to get archives by tags: ${err.message}`
                                )
                            )
                        } else {
                            const filtered = (rows || [])
                                .filter(row => {
                                    if (!row.tags) return false
                                    const archiveTags = JSON.parse(row.tags)
                                    return tags.some(tag =>
                                        archiveTags.includes(tag)
                                    )
                                })
                                .map(row => ({
                                    archiveId: row.archiveId,
                                    recordCount: row.recordCount,
                                    originalSize: row.originalSize,
                                    compressedSize: row.compressedSize,
                                    compressionRatio: row.compressionRatio,
                                    compressionMethod: row.compressionMethod,
                                    archivedAt: new Date(row.archivedAt),
                                    dataType: row.dataType,
                                    tags: row.tags
                                        ? JSON.parse(row.tags)
                                        : undefined,
                                    description: row.description,
                                    expiresAt: row.expiresAt
                                        ? new Date(row.expiresAt)
                                        : undefined,
                                }))
                            resolve(filtered)
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to get archives by tags: ${message}`)
        }
    }

    /**
     * Update archive metadata
     */
    async updateArchiveMetadata(
        archiveId: string,
        updates: Partial<ArchiveMetadataEntry>
    ): Promise<void> {
        try {
            const connection = this.pool.getConnection()
            const updateFields: string[] = []
            const params: any[] = []

            if (updates.description !== undefined) {
                updateFields.push("description = ?")
                params.push(updates.description)
            }

            if (updates.tags !== undefined) {
                updateFields.push("tags = ?")
                params.push(updates.tags ? JSON.stringify(updates.tags) : null)
            }

            if (updates.expiresAt !== undefined) {
                updateFields.push("expiresAt = ?")
                params.push(
                    updates.expiresAt ? updates.expiresAt.toISOString() : null
                )
            }

            if (updateFields.length === 0) {
                return
            }

            params.push(archiveId)

            return new Promise((resolve, reject) => {
                connection.run(
                    `UPDATE archive_metadata SET ${updateFields.join(", ")} WHERE archiveId = ?`,
                    params,
                    err => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to update archive metadata: ${err.message}`
                                )
                            )
                        } else {
                            resolve()
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to update archive metadata: ${message}`)
        }
    }

    /**
     * Delete archive metadata
     */
    async deleteArchiveMetadata(archiveId: string): Promise<void> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.run(
                    `DELETE FROM archive_metadata WHERE archiveId = ?`,
                    [archiveId],
                    err => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to delete archive metadata: ${err.message}`
                                )
                            )
                        } else {
                            resolve()
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to delete archive metadata: ${message}`)
        }
    }

    /**
     * Get archive statistics
     */
    async getArchiveStats(): Promise<ArchiveMetadataStats> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.get(
                    `SELECT 
            COUNT(*) as totalArchives,
            SUM(recordCount) as totalRecordsArchived,
            SUM(originalSize) as totalOriginalSize,
            SUM(compressedSize) as totalCompressedSize,
            AVG(compressionRatio) as averageCompressionRatio,
            MIN(archivedAt) as oldestArchive,
            MAX(archivedAt) as newestArchive
          FROM archive_metadata`,
                    async (err, row: any) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to get archive stats: ${err.message}`
                                )
                            )
                            return
                        }

                        // Get stats by compression method
                        connection.all(
                            `SELECT compressionMethod, COUNT(*) as count, SUM(originalSize) as totalSize, SUM(compressedSize) as totalCompressed
              FROM archive_metadata
              GROUP BY compressionMethod`,
                            (err, methodRows: any[]) => {
                                if (err) {
                                    reject(
                                        new Error(
                                            `Failed to get compression method stats: ${err.message}`
                                        )
                                    )
                                    return
                                }

                                const byMethod = {
                                    gzip: {
                                        count: 0,
                                        totalSize: 0,
                                        totalCompressed: 0,
                                    },
                                    brotli: {
                                        count: 0,
                                        totalSize: 0,
                                        totalCompressed: 0,
                                    },
                                }

                                for (const methodRow of methodRows || []) {
                                    if (
                                        methodRow.compressionMethod === "gzip"
                                    ) {
                                        byMethod.gzip = {
                                            count: methodRow.count,
                                            totalSize: methodRow.totalSize || 0,
                                            totalCompressed:
                                                methodRow.totalCompressed || 0,
                                        }
                                    } else if (
                                        methodRow.compressionMethod === "brotli"
                                    ) {
                                        byMethod.brotli = {
                                            count: methodRow.count,
                                            totalSize: methodRow.totalSize || 0,
                                            totalCompressed:
                                                methodRow.totalCompressed || 0,
                                        }
                                    }
                                }

                                resolve({
                                    totalArchives: row.totalArchives || 0,
                                    totalRecordsArchived:
                                        row.totalRecordsArchived || 0,
                                    totalOriginalSize:
                                        row.totalOriginalSize || 0,
                                    totalCompressedSize:
                                        row.totalCompressedSize || 0,
                                    averageCompressionRatio:
                                        row.averageCompressionRatio || 0,
                                    oldestArchive: row.oldestArchive
                                        ? new Date(row.oldestArchive)
                                        : undefined,
                                    newestArchive: row.newestArchive
                                        ? new Date(row.newestArchive)
                                        : undefined,
                                    byCompressionMethod: byMethod,
                                })
                            }
                        )
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to get archive stats: ${message}`)
        }
    }

    /**
     * Clean up expired archives
     */
    async cleanupExpiredArchives(): Promise<number> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.run(
                    `DELETE FROM archive_metadata WHERE expiresAt IS NOT NULL AND expiresAt < ?`,
                    [new Date().toISOString()],
                    function (err) {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to cleanup expired archives: ${err.message}`
                                )
                            )
                        } else {
                            resolve(this.changes || 0)
                        }
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to cleanup expired archives: ${message}`)
        }
    }
}

export {
    ArchiveMetadataEntry,
    ArchiveMetadataQueryOptions,
    ArchiveMetadataStats,
}
