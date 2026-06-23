/**
 * Transparent Decompression Utilities
 * Provides transparent decompression for queries and data retrieval
 */

import { DatabasePool } from "./database"
import { CompressionService } from "./compression"
import { ArchiveMetadataTracker } from "./archive-metadata"

/**
 * Query result with decompression
 */
export interface DecompressedQueryResult {
    records: any[]
    source: "active" | "archived"
    archiveId?: string
    decompressed: boolean
    duration: number // milliseconds
}

/**
 * Unified query options
 */
export interface UnifiedQueryOptions {
    includeArchived?: boolean
    archiveIds?: string[]
    predicate?: (record: any) => boolean
    limit?: number
    offset?: number
}

/**
 * Transparent Decompression Utility
 * Provides transparent access to both active and archived data
 */
export class TransparentDecompressionUtil {
    private pool: DatabasePool
    private compressionService: CompressionService
    private metadataTracker: ArchiveMetadataTracker

    constructor(
        pool: DatabasePool,
        compressionService: CompressionService,
        metadataTracker: ArchiveMetadataTracker
    ) {
        this.pool = pool
        this.compressionService = compressionService
        this.metadataTracker = metadataTracker
    }

    /**
     * Query active data
     */
    async queryActive(
        predicate?: (record: any) => boolean,
        limit?: number,
        offset?: number
    ): Promise<DecompressedQueryResult> {
        const startTime = Date.now()

        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                let query = `SELECT * FROM token_records`
                const params: any[] = []

                if (limit) {
                    query += ` LIMIT ? OFFSET ?`
                    params.push(limit, offset || 0)
                }

                connection.all(query, params, (err, rows: any[]) => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to query active data: ${err.message}`
                            )
                        )
                    } else {
                        const records = rows || []
                        const filtered = predicate
                            ? records.filter(predicate)
                            : records

                        resolve({
                            records: filtered,
                            source: "active",
                            decompressed: false,
                            duration: Date.now() - startTime,
                        })
                    }
                })
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to query active data: ${message}`)
        }
    }

    /**
     * Query archived data with transparent decompression
     */
    async queryArchived(
        archiveId: string,
        predicate?: (record: any) => boolean
    ): Promise<DecompressedQueryResult> {
        const startTime = Date.now()

        try {
            const connection = this.pool.getConnection()

            return new Promise(async (resolve, reject) => {
                connection.get(
                    `SELECT compressedData, compressionMethod FROM archived_data WHERE id = ?`,
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
                            // Decompress data
                            const decompressed =
                                await this.compressionService.decompress(
                                    row.compressedData,
                                    row.compressionMethod
                                )

                            // Apply predicate if provided
                            const filtered = predicate
                                ? decompressed.data.filter(predicate)
                                : decompressed.data

                            resolve({
                                records: filtered,
                                source: "archived",
                                archiveId,
                                decompressed: true,
                                duration: Date.now() - startTime,
                            })
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
            throw new Error(`Failed to query archived data: ${message}`)
        }
    }

    /**
     * Query all archives with transparent decompression
     */
    async queryAllArchives(
        predicate?: (record: any) => boolean
    ): Promise<DecompressedQueryResult[]> {
        try {
            const archives = await this.metadataTracker.getAllArchives()
            const results: DecompressedQueryResult[] = []

            for (const archive of archives) {
                const result = await this.queryArchived(
                    archive.archiveId,
                    predicate
                )
                results.push(result)
            }

            return results
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to query all archives: ${message}`)
        }
    }

    /**
     * Unified query across active and archived data
     */
    async unifiedQuery(
        options: UnifiedQueryOptions = {}
    ): Promise<DecompressedQueryResult[]> {
        const results: DecompressedQueryResult[] = []

        try {
            // Query active data
            const activeResult = await this.queryActive(
                options.predicate,
                options.limit,
                options.offset
            )
            results.push(activeResult)

            // Query archived data if requested
            if (options.includeArchived) {
                if (options.archiveIds && options.archiveIds.length > 0) {
                    // Query specific archives
                    for (const archiveId of options.archiveIds) {
                        const archivedResult = await this.queryArchived(
                            archiveId,
                            options.predicate
                        )
                        results.push(archivedResult)
                    }
                } else {
                    // Query all archives
                    const archivedResults = await this.queryAllArchives(
                        options.predicate
                    )
                    results.push(...archivedResults)
                }
            }

            return results
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to perform unified query: ${message}`)
        }
    }

    /**
     * Get all records (active + archived) with transparent decompression
     */
    async getAllRecords(predicate?: (record: any) => boolean): Promise<any[]> {
        try {
            const results = await this.unifiedQuery({
                includeArchived: true,
                predicate,
            })

            // Combine all records from all sources
            const allRecords: any[] = []
            for (const result of results) {
                allRecords.push(...result.records)
            }

            return allRecords
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to get all records: ${message}`)
        }
    }

    /**
     * Get records by date range (searches both active and archived)
     */
    async getRecordsByDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<DecompressedQueryResult[]> {
        const predicate = (record: any) => {
            const recordDate = new Date(record.timestamp)
            return recordDate >= startDate && recordDate <= endDate
        }

        return this.unifiedQuery({
            includeArchived: true,
            predicate,
        })
    }

    /**
     * Get records by agent type (searches both active and archived)
     */
    async getRecordsByAgentType(
        agentType: string
    ): Promise<DecompressedQueryResult[]> {
        const predicate = (record: any) => record.agentType === agentType

        return this.unifiedQuery({
            includeArchived: true,
            predicate,
        })
    }

    /**
     * Get records by model (searches both active and archived)
     */
    async getRecordsByModel(model: string): Promise<DecompressedQueryResult[]> {
        const predicate = (record: any) => record.model === model

        return this.unifiedQuery({
            includeArchived: true,
            predicate,
        })
    }

    /**
     * Get records by task ID (searches both active and archived)
     */
    async getRecordsByTaskId(
        taskId: string
    ): Promise<DecompressedQueryResult[]> {
        const predicate = (record: any) => record.taskId === taskId

        return this.unifiedQuery({
            includeArchived: true,
            predicate,
        })
    }

    /**
     * Get records by request ID (searches both active and archived)
     */
    async getRecordsByRequestId(
        requestId: string
    ): Promise<DecompressedQueryResult[]> {
        const predicate = (record: any) => record.requestId === requestId

        return this.unifiedQuery({
            includeArchived: true,
            predicate,
        })
    }

    /**
     * Count total records (active + archived)
     */
    async countTotalRecords(): Promise<{
        activeCount: number
        archivedCount: number
        totalCount: number
    }> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.get(
                    `SELECT COUNT(*) as activeCount FROM token_records`,
                    async (err, activeRow: any) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to count active records: ${err.message}`
                                )
                            )
                            return
                        }

                        connection.get(
                            `SELECT SUM(recordCount) as archivedCount FROM archived_data`,
                            (err, archivedRow: any) => {
                                if (err) {
                                    reject(
                                        new Error(
                                            `Failed to count archived records: ${err.message}`
                                        )
                                    )
                                } else {
                                    const activeCount =
                                        activeRow?.activeCount || 0
                                    const archivedCount =
                                        archivedRow?.archivedCount || 0
                                    resolve({
                                        activeCount,
                                        archivedCount,
                                        totalCount: activeCount + archivedCount,
                                    })
                                }
                            }
                        )
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to count total records: ${message}`)
        }
    }

    /**
     * Get aggregated statistics (active + archived)
     */
    async getAggregatedStats(): Promise<{
        totalRecords: number
        totalTokens: number
        totalCostUSD: number
        totalCostBRL: number
        averageTokensPerRecord: number
        averageCostPerRecord: number
    }> {
        try {
            const connection = this.pool.getConnection()

            return new Promise((resolve, reject) => {
                connection.get(
                    `SELECT 
            COUNT(*) as recordCount,
            SUM(totalTokens) as totalTokens,
            SUM(totalCost) as totalCost
          FROM token_records`,
                    async (err, activeRow: any) => {
                        if (err) {
                            reject(
                                new Error(
                                    `Failed to get active stats: ${err.message}`
                                )
                            )
                            return
                        }

                        connection.get(
                            `SELECT 
                SUM(recordCount) as recordCount,
                SUM(CAST(json_extract(compressedData, '$.totalTokens') AS INTEGER)) as totalTokens,
                SUM(CAST(json_extract(compressedData, '$.totalCost') AS REAL)) as totalCost
              FROM archived_data`,
                            (err, archivedRow: any) => {
                                if (err) {
                                    reject(
                                        new Error(
                                            `Failed to get archived stats: ${err.message}`
                                        )
                                    )
                                } else {
                                    const activeRecords =
                                        activeRow?.recordCount || 0
                                    const activeTokens =
                                        activeRow?.totalTokens || 0
                                    const activeCost = activeRow?.totalCost || 0

                                    const archivedRecords =
                                        archivedRow?.recordCount || 0
                                    const archivedTokens =
                                        archivedRow?.totalTokens || 0
                                    const archivedCost =
                                        archivedRow?.totalCost || 0

                                    const totalRecords =
                                        activeRecords + archivedRecords
                                    const totalTokens =
                                        activeTokens + archivedTokens
                                    const totalCost = activeCost + archivedCost

                                    resolve({
                                        totalRecords,
                                        totalTokens,
                                        totalCostUSD: totalCost,
                                        totalCostBRL: totalCost * 5.0, // Approximate conversion
                                        averageTokensPerRecord:
                                            totalRecords > 0
                                                ? totalTokens / totalRecords
                                                : 0,
                                        averageCostPerRecord:
                                            totalRecords > 0
                                                ? totalCost / totalRecords
                                                : 0,
                                    })
                                }
                            }
                        )
                    }
                )
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to get aggregated stats: ${message}`)
        }
    }

    /**
     * Search records across active and archived data
     */
    async search(
        searchTerm: string,
        searchFields: string[] = ["requestId", "taskId", "agentType", "model"]
    ): Promise<DecompressedQueryResult[]> {
        const predicate = (record: any) => {
            return searchFields.some(field => {
                const value = record[field]
                return (
                    value &&
                    String(value)
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                )
            })
        }

        return this.unifiedQuery({
            includeArchived: true,
            predicate,
        })
    }
}

export { DecompressedQueryResult, UnifiedQueryOptions }
