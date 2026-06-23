/**
 * Archival Integration Module
 * Integrates all archival, compression, and restoration components
 */

import { EventEmitter } from "events"
import { DatabasePool } from "./database"
import { ArchivalService, ArchivalConfig } from "./archival"
import { CompressionService } from "./compression"
import { ArchiveMetadataTracker } from "./archive-metadata"
import { TransparentDecompressionUtil } from "./decompression-utils"
import { ArchiveRestorationService } from "./archive-restoration"

/**
 * Archival integration configuration
 */
export interface ArchivalIntegrationConfig {
    dataRetentionDays?: number
    compressionMethod?: "gzip" | "brotli"
    autoArchivalEnabled?: boolean
    archivalSchedule?: "hourly" | "daily" | "weekly" | "manual"
    maxRecordsPerArchival?: number
    batchSize?: number
    archiveFolder?: string
    checkIntervalMs?: number
}

/**
 * Archival Integration Service
 * Provides unified interface for all archival operations
 */
export class ArchivalIntegrationService extends EventEmitter {
    private pool: DatabasePool
    private archivalService: ArchivalService
    private compressionService: CompressionService
    private metadataTracker: ArchiveMetadataTracker
    private decompressionUtil: TransparentDecompressionUtil
    private restorationService: ArchiveRestorationService
    private isInitialized: boolean = false

    constructor(pool: DatabasePool, config: ArchivalIntegrationConfig = {}) {
        super()
        this.pool = pool

        // Initialize services
        this.compressionService = new CompressionService()
        this.metadataTracker = new ArchiveMetadataTracker(pool)
        this.decompressionUtil = new TransparentDecompressionUtil(
            pool,
            this.compressionService,
            this.metadataTracker
        )
        this.restorationService = new ArchiveRestorationService(
            pool,
            this.compressionService,
            this.metadataTracker
        )

        const archivalConfig: ArchivalConfig = {
            dataRetentionDays: config.dataRetentionDays ?? 30,
            compressionMethod: config.compressionMethod ?? "gzip",
            autoArchivalEnabled: config.autoArchivalEnabled ?? true,
            archivalSchedule: config.archivalSchedule ?? "daily",
            maxRecordsPerArchival: config.maxRecordsPerArchival ?? 10000,
            batchSize: config.batchSize ?? 1000,
        }

        this.archivalService = new ArchivalService(
            pool,
            this.compressionService,
            this.metadataTracker,
            archivalConfig
        )

        // Forward events from services
        this.setupEventForwarding()
    }

    /**
     * Initialize archival integration
     */
    async initialize(): Promise<void> {
        try {
            await this.archivalService.initialize()
            this.isInitialized = true
            this.emit("initialized", { timestamp: new Date() })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            this.emit("error", {
                type: "initialization_failed",
                message,
                timestamp: new Date(),
            })
            throw new Error(
                `Failed to initialize archival integration: ${message}`
            )
        }
    }

    /**
     * Start archival scheduling
     */
    startScheduling(): void {
        if (!this.isInitialized) {
            throw new Error("Archival integration not initialized")
        }
        this.archivalService.startScheduling()
    }

    /**
     * Stop archival scheduling
     */
    stopScheduling(): void {
        this.archivalService.stopScheduling()
    }

    /**
     * Manually trigger archival
     */
    async archiveNow(): Promise<any> {
        if (!this.isInitialized) {
            throw new Error("Archival integration not initialized")
        }
        return this.archivalService.archiveOldData()
    }

    /**
     * Get compression service
     */
    getCompressionService(): CompressionService {
        return this.compressionService
    }

    /**
     * Get metadata tracker
     */
    getMetadataTracker(): ArchiveMetadataTracker {
        return this.metadataTracker
    }

    /**
     * Get decompression utility
     */
    getDecompressionUtil(): TransparentDecompressionUtil {
        return this.decompressionUtil
    }

    /**
     * Get restoration service
     */
    getRestorationService(): ArchiveRestorationService {
        return this.restorationService
    }

    /**
     * Query active data
     */
    async queryActive(predicate?: (record: any) => boolean): Promise<any[]> {
        const result = await this.decompressionUtil.queryActive(predicate)
        return result.records
    }

    /**
     * Query archived data
     */
    async queryArchived(
        archiveId: string,
        predicate?: (record: any) => boolean
    ): Promise<any[]> {
        const result = await this.decompressionUtil.queryArchived(
            archiveId,
            predicate
        )
        return result.records
    }

    /**
     * Query all data (active + archived)
     */
    async queryAll(predicate?: (record: any) => boolean): Promise<any[]> {
        return this.decompressionUtil.getAllRecords(predicate)
    }

    /**
     * Get records by date range
     */
    async getRecordsByDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<any[]> {
        const results = await this.decompressionUtil.getRecordsByDateRange(
            startDate,
            endDate
        )
        return results.flatMap(r => r.records)
    }

    /**
     * Get records by agent type
     */
    async getRecordsByAgentType(agentType: string): Promise<any[]> {
        const results =
            await this.decompressionUtil.getRecordsByAgentType(agentType)
        return results.flatMap(r => r.records)
    }

    /**
     * Get records by model
     */
    async getRecordsByModel(model: string): Promise<any[]> {
        const results = await this.decompressionUtil.getRecordsByModel(model)
        return results.flatMap(r => r.records)
    }

    /**
     * Get records by task ID
     */
    async getRecordsByTaskId(taskId: string): Promise<any[]> {
        const results = await this.decompressionUtil.getRecordsByTaskId(taskId)
        return results.flatMap(r => r.records)
    }

    /**
     * Get records by request ID
     */
    async getRecordsByRequestId(requestId: string): Promise<any[]> {
        const results =
            await this.decompressionUtil.getRecordsByRequestId(requestId)
        return results.flatMap(r => r.records)
    }

    /**
     * Search records
     */
    async search(searchTerm: string, searchFields?: string[]): Promise<any[]> {
        const results = await this.decompressionUtil.search(
            searchTerm,
            searchFields
        )
        return results.flatMap(r => r.records)
    }

    /**
     * Get archive statistics
     */
    async getArchiveStats(): Promise<any> {
        return this.metadataTracker.getArchiveStats()
    }

    /**
     * Get all archives
     */
    async getAllArchives(): Promise<any[]> {
        return this.metadataTracker.getAllArchives()
    }

    /**
     * Restore archive
     */
    async restoreArchive(
        archiveId: string,
        deleteAfterRestore: boolean = false
    ): Promise<any> {
        return this.restorationService.restoreArchive({
            archiveId,
            deleteAfterRestore,
        })
    }

    /**
     * Restore multiple archives
     */
    async restoreMultipleArchives(
        archiveIds: string[],
        deleteAfterRestore: boolean = false
    ): Promise<any[]> {
        return this.restorationService.restoreMultipleArchives(
            archiveIds,
            deleteAfterRestore
        )
    }

    /**
     * Restore all archives
     */
    async restoreAllArchives(
        deleteAfterRestore: boolean = false
    ): Promise<any[]> {
        return this.restorationService.restoreAllArchives(deleteAfterRestore)
    }

    /**
     * Get total record count
     */
    async getTotalRecordCount(): Promise<{
        activeCount: number
        archivedCount: number
        totalCount: number
    }> {
        return this.decompressionUtil.countTotalRecords()
    }

    /**
     * Get aggregated statistics
     */
    async getAggregatedStats(): Promise<any> {
        return this.decompressionUtil.getAggregatedStats()
    }

    /**
     * Clean up expired archives
     */
    async cleanupExpiredArchives(): Promise<number> {
        return this.metadataTracker.cleanupExpiredArchives()
    }

    /**
     * Get archival status
     */
    getArchivalStatus(): any {
        return this.archivalService.getStatus()
    }

    /**
     * Check if restoration is in progress
     */
    isRestorationInProgress(): boolean {
        return this.restorationService.isRestorationInProgress()
    }

    /**
     * Get restoration progress
     */
    getRestorationProgress(): any {
        return this.restorationService.getProgress()
    }

    /**
     * Setup event forwarding from services
     */
    private setupEventForwarding(): void {
        // Forward archival service events
        this.archivalService.on("archival_completed", event => {
            this.emit("archival_completed", event)
        })

        this.archivalService.on("archival_failed", event => {
            this.emit("archival_failed", event)
        })

        this.archivalService.on("no_records_to_archive", event => {
            this.emit("no_records_to_archive", event)
        })

        this.archivalService.on("error", event => {
            this.emit("error", event)
        })

        // Forward restoration service events
        this.restorationService.on("restoration_completed", event => {
            this.emit("restoration_completed", event)
        })

        this.restorationService.on("restoration_failed", event => {
            this.emit("restoration_failed", event)
        })

        this.restorationService.on("restoration_progress", event => {
            this.emit("restoration_progress", event)
        })
    }

    /**
     * Shutdown archival integration
     */
    async shutdown(): Promise<void> {
        this.stopScheduling()
        await this.archivalService.shutdown()
        this.emit("shutdown", { timestamp: new Date() })
    }
}

export { ArchivalIntegrationConfig }
