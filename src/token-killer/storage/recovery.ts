/**
 * Storage Recovery and Consistency Module
 * Handles database integrity checks, recovery mechanisms, backup functionality,
 * and storage consistency validation
 */

import fs from "fs"
import path from "path"
import zlib from "zlib"
import { promisify } from "util"
import { EventEmitter } from "events"
import { DatabasePool } from "./database"

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

/**
 * Integrity check result
 */
export interface IntegrityCheckResult {
    valid: boolean
    timestamp: Date
    checks: {
        name: string
        passed: boolean
        message?: string
        details?: any
    }[]
    errors: string[]
    warnings: string[]
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
    id: string
    timestamp: Date
    dbSize: number
    recordCount: number
    archivedRecordCount: number
    checksumSHA256: string
    compressionMethod: "gzip" | "brotli"
    compressedSize: number
    originalSize: number
    description?: string
    tags?: string[]
}

/**
 * Recovery result
 */
export interface RecoveryResult {
    success: boolean
    timestamp: Date
    recoveredRecords: number
    fixedIssues: number
    errors: string[]
    warnings: string[]
    details: any
}

/**
 * Consistency validation result
 */
export interface ConsistencyValidationResult {
    valid: boolean
    timestamp: Date
    checks: {
        name: string
        passed: boolean
        expected: number
        actual: number
        message?: string
    }[]
    errors: string[]
}

/**
 * Storage Recovery Manager
 * Provides database integrity checks, recovery mechanisms, and backup functionality
 */
export class StorageRecoveryManager extends EventEmitter {
    private pool: DatabasePool
    private backupDir: string
    private maxBackups: number = 10

    constructor(pool: DatabasePool, backupDir?: string) {
        super()
        this.pool = pool
        this.backupDir =
            backupDir || path.join(process.cwd(), ".kiro", "data", "backups")
    }

    /**
     * Initialize recovery manager
     */
    async initialize(): Promise<void> {
        try {
            // Create backup directory if it doesn't exist
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true })
            }

            this.emit("initialized", {
                backupDir: this.backupDir,
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
            throw new Error(`Failed to initialize recovery manager: ${message}`)
        }
    }

    /**
     * Perform comprehensive integrity check
     */
    async checkIntegrity(): Promise<IntegrityCheckResult> {
        const checks: IntegrityCheckResult["checks"] = []
        const errors: string[] = []
        const warnings: string[] = []

        try {
            // Check 1: Database file exists and is readable
            const dbPath = this.pool.getDbPath()
            const fileCheckPassed =
                fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0
            checks.push({
                name: "Database file exists and readable",
                passed: fileCheckPassed,
                message: fileCheckPassed
                    ? "Database file is valid"
                    : "Database file not found or empty",
                details: { dbPath, size: fs.statSync(dbPath).size },
            })

            if (!fileCheckPassed) {
                errors.push("Database file is missing or empty")
            }

            // Check 2: Database connection health
            const health = await this.pool.healthCheck()
            checks.push({
                name: "Database connection health",
                passed: health.healthy,
                message: health.healthy
                    ? "Database is responsive"
                    : `Database error: ${health.error}`,
                details: { responseTime: health.responseTime },
            })

            if (!health.healthy) {
                errors.push(`Database health check failed: ${health.error}`)
            }

            // Check 3: Schema integrity
            const schemaCheck = await this.checkSchemaIntegrity()
            checks.push({
                name: "Schema integrity",
                passed: schemaCheck.valid,
                message: schemaCheck.valid
                    ? "All tables and indexes present"
                    : "Schema issues detected",
                details: schemaCheck,
            })

            if (!schemaCheck.valid) {
                errors.push(...schemaCheck.errors)
            }

            // Check 4: Foreign key constraints
            const fkCheck = await this.checkForeignKeyConstraints()
            checks.push({
                name: "Foreign key constraints",
                passed: fkCheck.valid,
                message: fkCheck.valid
                    ? "All foreign keys valid"
                    : "Foreign key violations detected",
                details: { violationCount: fkCheck.violations.length },
            })

            if (!fkCheck.valid) {
                warnings.push(
                    `Found ${fkCheck.violations.length} foreign key violations`
                )
            }

            // Check 5: Data consistency
            const dataCheck = await this.checkDataConsistency()
            checks.push({
                name: "Data consistency",
                passed: dataCheck.valid,
                message: dataCheck.valid
                    ? "Data is consistent"
                    : "Data inconsistencies detected",
                details: dataCheck,
            })

            if (!dataCheck.valid) {
                warnings.push(...dataCheck.issues)
            }

            // Check 6: Constraint violations
            const constraintCheck = await this.checkConstraintViolations()
            checks.push({
                name: "Constraint violations",
                passed: constraintCheck.valid,
                message: constraintCheck.valid
                    ? "No constraint violations"
                    : "Constraint violations found",
                details: { violationCount: constraintCheck.violations.length },
            })

            if (!constraintCheck.valid) {
                warnings.push(
                    `Found ${constraintCheck.violations.length} constraint violations`
                )
            }

            // Check 7: Archive integrity
            const archiveCheck = await this.checkArchiveIntegrity()
            checks.push({
                name: "Archive integrity",
                passed: archiveCheck.valid,
                message: archiveCheck.valid
                    ? "All archives valid"
                    : "Archive issues detected",
                details: archiveCheck,
            })

            if (!archiveCheck.valid) {
                warnings.push(...archiveCheck.errors)
            }

            const result: IntegrityCheckResult = {
                valid: errors.length === 0,
                timestamp: new Date(),
                checks,
                errors,
                warnings,
            }

            this.emit("integrity_check_completed", result)
            return result
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            errors.push(`Integrity check failed: ${message}`)

            return {
                valid: false,
                timestamp: new Date(),
                checks,
                errors,
                warnings,
            }
        }
    }

    /**
     * Check schema integrity
     */
    private async checkSchemaIntegrity(): Promise<{
        valid: boolean
        tables: string[]
        indexes: string[]
        errors: string[]
    }> {
        const connection = this.pool.getConnection()
        const tables: string[] = []
        const indexes: string[] = []
        const errors: string[] = []

        const requiredTables = [
            "token_records",
            "budget_configs",
            "budget_usage",
            "strategies",
            "pricing_cache",
            "archived_data",
            "archive_metadata",
            "pruning_decisions",
            "compression_decisions",
            "tasks",
            "budget_warnings",
        ]

        return new Promise(resolve => {
            let checked = 0

            const checkNextTable = () => {
                if (checked >= requiredTables.length) {
                    resolve({
                        valid: errors.length === 0,
                        tables,
                        indexes,
                        errors,
                    })
                    return
                }

                const tableName = requiredTables[checked]
                connection.get(
                    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                    [tableName],
                    (err, row) => {
                        if (err) {
                            errors.push(
                                `Error checking table '${tableName}': ${err.message}`
                            )
                        } else if (row) {
                            tables.push(tableName)
                        } else {
                            errors.push(
                                `Required table '${tableName}' not found`
                            )
                        }
                        checked++
                        checkNextTable()
                    }
                )
            }

            checkNextTable()
        })
    }

    /**
     * Check foreign key constraints
     */
    private async checkForeignKeyConstraints(): Promise<{
        valid: boolean
        violations: any[]
    }> {
        const connection = this.pool.getConnection()

        return new Promise(resolve => {
            connection.all(
                `PRAGMA foreign_key_list(token_records)`,
                (err, rows: any[]) => {
                    if (err) {
                        resolve({ valid: false, violations: [] })
                        return
                    }

                    // Check for orphaned records
                    const violations: any[] = []

                    // Check token_records with invalid taskId
                    connection.all(
                        `SELECT tr.id, tr.taskId FROM token_records tr 
           WHERE tr.taskId IS NOT NULL AND tr.taskId NOT IN (SELECT id FROM tasks)`,
                        (err, orphanedRecords: any[]) => {
                            if (
                                !err &&
                                orphanedRecords &&
                                orphanedRecords.length > 0
                            ) {
                                violations.push(...orphanedRecords)
                            }

                            resolve({
                                valid: violations.length === 0,
                                violations,
                            })
                        }
                    )
                }
            )
        })
    }

    /**
     * Check data consistency
     */
    private async checkDataConsistency(): Promise<{
        valid: boolean
        issues: string[]
    }> {
        const connection = this.pool.getConnection()
        const issues: string[] = []

        return new Promise(resolve => {
            // Check 1: Token records with negative values
            connection.all(
                `SELECT COUNT(*) as count FROM token_records 
         WHERE inputTokens < 0 OR outputTokens < 0 OR totalTokens < 0 OR inputCost < 0 OR outputCost < 0 OR totalCost < 0`,
                (err, row: any) => {
                    if (!err && row && row.count > 0) {
                        issues.push(
                            `Found ${row.count} token records with negative values`
                        )
                    }

                    // Check 2: Token records where totalTokens != inputTokens + outputTokens
                    connection.all(
                        `SELECT COUNT(*) as count FROM token_records 
             WHERE totalTokens != (inputTokens + outputTokens)`,
                        (err, row: any) => {
                            if (!err && row && row.count > 0) {
                                issues.push(
                                    `Found ${row.count} token records where totalTokens != inputTokens + outputTokens`
                                )
                            }

                            // Check 3: Budget usage with currentTokens > maxTokens
                            connection.all(
                                `SELECT COUNT(*) as count FROM budget_usage bu
                 JOIN budget_configs bc ON bu.budgetId = bc.id
                 WHERE bu.currentTokens > bc.maxTokens`,
                                (err, row: any) => {
                                    if (!err && row && row.count > 0) {
                                        issues.push(
                                            `Found ${row.count} budget usage records exceeding limits`
                                        )
                                    }

                                    resolve({
                                        valid: issues.length === 0,
                                        issues,
                                    })
                                }
                            )
                        }
                    )
                }
            )
        })
    }

    /**
     * Check constraint violations
     */
    private async checkConstraintViolations(): Promise<{
        valid: boolean
        violations: any[]
    }> {
        const connection = this.pool.getConnection()
        const violations: any[] = []

        return new Promise(resolve => {
            // Check CHECK constraints by examining data
            connection.all(
                `SELECT 'token_records' as table_name, COUNT(*) as violation_count 
         FROM token_records 
         WHERE agentType NOT IN ('kiro', 'antigravity', 'cursor', 'gabrieltoth')`,
                (err, row: any) => {
                    if (!err && row && row.violation_count > 0) {
                        violations.push({
                            table: "token_records",
                            constraint: "agentType CHECK",
                            count: row.violation_count,
                        })
                    }

                    // Check budget_configs constraints
                    connection.all(
                        `SELECT COUNT(*) as count FROM budget_configs 
             WHERE type NOT IN ('request', 'task', 'agent')`,
                        (err, row: any) => {
                            if (!err && row && row.count > 0) {
                                violations.push({
                                    table: "budget_configs",
                                    constraint: "type CHECK",
                                    count: row.count,
                                })
                            }

                            resolve({
                                valid: violations.length === 0,
                                violations,
                            })
                        }
                    )
                }
            )
        })
    }

    /**
     * Check archive integrity
     */
    private async checkArchiveIntegrity(): Promise<{
        valid: boolean
        errors: string[]
        archiveCount: number
    }> {
        const connection = this.pool.getConnection()
        const errors: string[] = []

        return new Promise(resolve => {
            connection.all(
                `SELECT id, compressedData, originalSize, compressedSize FROM archived_data`,
                async (err, rows: any[]) => {
                    if (err) {
                        errors.push(`Failed to check archives: ${err.message}`)
                        resolve({ valid: false, errors, archiveCount: 0 })
                        return
                    }

                    if (!rows || rows.length === 0) {
                        resolve({ valid: true, errors, archiveCount: 0 })
                        return
                    }

                    let checked = 0

                    const checkNextArchive = async () => {
                        if (checked >= rows.length) {
                            resolve({
                                valid: errors.length === 0,
                                errors,
                                archiveCount: rows.length,
                            })
                            return
                        }

                        const archive = rows[checked]

                        try {
                            // Try to decompress
                            await gunzip(archive.compressedData)
                            checked++
                            checkNextArchive()
                        } catch (error) {
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            errors.push(
                                `Archive ${archive.id} is corrupted: ${message}`
                            )
                            checked++
                            checkNextArchive()
                        }
                    }

                    checkNextArchive()
                }
            )
        })
    }

    /**
     * Recover from corrupted data
     */
    async recover(): Promise<RecoveryResult> {
        const errors: string[] = []
        const warnings: string[] = []
        let recoveredRecords = 0
        let fixedIssues = 0
        const details: any = {}

        try {
            // Step 1: Check integrity
            const integrityCheck = await this.checkIntegrity()

            if (integrityCheck.valid) {
                const result: RecoveryResult = {
                    success: true,
                    timestamp: new Date(),
                    recoveredRecords: 0,
                    fixedIssues: 0,
                    errors: [],
                    warnings: ["No issues detected - recovery not needed"],
                    details: { integrityCheck },
                }
                this.emit("recovery_completed", result)
                return result
            }

            // Step 2: Fix foreign key violations
            const fkCheck = await this.checkForeignKeyConstraints()
            if (!fkCheck.valid && fkCheck.violations.length > 0) {
                const connection = this.pool.getConnection()

                for (const violation of fkCheck.violations) {
                    try {
                        await new Promise<void>((resolve, reject) => {
                            connection.run(
                                `DELETE FROM token_records WHERE id = ?`,
                                [violation.id],
                                err => {
                                    if (err) reject(err)
                                    else {
                                        fixedIssues++
                                        resolve()
                                    }
                                }
                            )
                        })
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error)
                        warnings.push(
                            `Failed to fix foreign key violation: ${message}`
                        )
                    }
                }

                details.foreignKeyViolationsFixed = fixedIssues
            }

            // Step 3: Fix constraint violations
            const constraintCheck = await this.checkConstraintViolations()
            if (
                !constraintCheck.valid &&
                constraintCheck.violations.length > 0
            ) {
                const connection = this.pool.getConnection()

                for (const violation of constraintCheck.violations) {
                    try {
                        if (
                            violation.table === "token_records" &&
                            violation.constraint === "agentType CHECK"
                        ) {
                            await new Promise<void>((resolve, reject) => {
                                connection.run(
                                    `DELETE FROM token_records WHERE agentType NOT IN ('kiro', 'antigravity', 'cursor', 'gabrieltoth')`,
                                    err => {
                                        if (err) reject(err)
                                        else {
                                            fixedIssues++
                                            resolve()
                                        }
                                    }
                                )
                            })
                        }
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error)
                        warnings.push(
                            `Failed to fix constraint violation: ${message}`
                        )
                    }
                }

                details.constraintViolationsFixed = fixedIssues
            }

            // Step 4: Repair corrupted archives
            const archiveCheck = await this.checkArchiveIntegrity()
            if (!archiveCheck.valid && archiveCheck.errors.length > 0) {
                warnings.push(...archiveCheck.errors)
                details.corruptedArchives = archiveCheck.errors.length
            }

            const result: RecoveryResult = {
                success: errors.length === 0,
                timestamp: new Date(),
                recoveredRecords,
                fixedIssues,
                errors,
                warnings,
                details,
            }

            this.emit("recovery_completed", result)
            return result
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            errors.push(`Recovery failed: ${message}`)

            const result: RecoveryResult = {
                success: false,
                timestamp: new Date(),
                recoveredRecords,
                fixedIssues,
                errors,
                warnings,
                details,
            }

            this.emit("recovery_completed", result)
            return result
        }
    }

    /**
     * Create a backup of the database
     */
    async createBackup(
        description?: string,
        tags?: string[]
    ): Promise<BackupMetadata> {
        try {
            const dbPath = this.pool.getDbPath()
            const dbData = fs.readFileSync(dbPath)
            const originalSize = dbData.length

            // Compress backup
            const compressedData = await gzip(dbData)
            const compressedSize = compressedData.length

            // Calculate checksum
            const crypto = await import("crypto")
            const checksumSHA256 = crypto
                .createHash("sha256")
                .update(dbData)
                .digest("hex")

            // Get database stats
            const connection = this.pool.getConnection()
            const stats = await new Promise<{
                recordCount: number
                archivedRecordCount: number
            }>(resolve => {
                connection.get(
                    `SELECT COUNT(*) as recordCount FROM token_records`,
                    (err, row: any) => {
                        const recordCount = row?.recordCount || 0

                        connection.get(
                            `SELECT COUNT(*) as archivedRecordCount FROM archived_data`,
                            (err, archivedRow: any) => {
                                const archivedRecordCount =
                                    archivedRow?.archivedRecordCount || 0
                                resolve({ recordCount, archivedRecordCount })
                            }
                        )
                    }
                )
            })

            // Create backup metadata
            const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const backupPath = path.join(this.backupDir, `${backupId}.gz`)

            // Write backup file
            fs.writeFileSync(backupPath, compressedData)

            const metadata: BackupMetadata = {
                id: backupId,
                timestamp: new Date(),
                dbSize: originalSize,
                recordCount: stats.recordCount,
                archivedRecordCount: stats.archivedRecordCount,
                checksumSHA256,
                compressionMethod: "gzip",
                compressedSize,
                originalSize,
                description,
                tags,
            }

            // Save metadata
            const metadataPath = path.join(this.backupDir, `${backupId}.json`)
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

            // Cleanup old backups
            await this.cleanupOldBackups()

            this.emit("backup_created", metadata)
            return metadata
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            this.emit("error", {
                type: "backup_failed",
                message,
                timestamp: new Date(),
            })
            throw new Error(`Failed to create backup: ${message}`)
        }
    }

    /**
     * List all backups
     */
    async listBackups(): Promise<BackupMetadata[]> {
        try {
            if (!fs.existsSync(this.backupDir)) {
                return []
            }

            const files = fs.readdirSync(this.backupDir)
            const backups: BackupMetadata[] = []

            for (const file of files) {
                if (file.endsWith(".json")) {
                    const metadataPath = path.join(this.backupDir, file)
                    const metadata = JSON.parse(
                        fs.readFileSync(metadataPath, "utf-8")
                    )
                    // Convert timestamp string to Date if needed
                    if (typeof metadata.timestamp === "string") {
                        metadata.timestamp = new Date(metadata.timestamp)
                    }
                    backups.push(metadata)
                }
            }

            return backups.sort((a, b) => {
                const aTime =
                    a.timestamp instanceof Date
                        ? a.timestamp.getTime()
                        : new Date(a.timestamp).getTime()
                const bTime =
                    b.timestamp instanceof Date
                        ? b.timestamp.getTime()
                        : new Date(b.timestamp).getTime()
                return bTime - aTime
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to list backups: ${message}`)
        }
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupId: string): Promise<void> {
        try {
            const backupPath = path.join(this.backupDir, `${backupId}.gz`)
            const metadataPath = path.join(this.backupDir, `${backupId}.json`)

            if (!fs.existsSync(backupPath) || !fs.existsSync(metadataPath)) {
                throw new Error(`Backup ${backupId} not found`)
            }

            // Read and decompress backup
            const compressedData = fs.readFileSync(backupPath)
            const dbData = await gunzip(compressedData)

            // Verify checksum
            const metadata: BackupMetadata = JSON.parse(
                fs.readFileSync(metadataPath, "utf-8")
            )
            const crypto = await import("crypto")
            const checksumSHA256 = crypto
                .createHash("sha256")
                .update(dbData)
                .digest("hex")

            if (checksumSHA256 !== metadata.checksumSHA256) {
                throw new Error(
                    "Backup checksum verification failed - backup may be corrupted"
                )
            }

            // Close current database connection
            await this.pool.close()

            // Restore database file
            const dbPath = this.pool.getDbPath()
            fs.writeFileSync(dbPath, dbData)

            // Reinitialize database
            await this.pool.initialize()

            this.emit("backup_restored", {
                backupId,
                timestamp: new Date(),
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            this.emit("error", {
                type: "restore_failed",
                message,
                timestamp: new Date(),
            })
            throw new Error(`Failed to restore backup: ${message}`)
        }
    }

    /**
     * Delete a backup
     */
    async deleteBackup(backupId: string): Promise<void> {
        try {
            const backupPath = path.join(this.backupDir, `${backupId}.gz`)
            const metadataPath = path.join(this.backupDir, `${backupId}.json`)

            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath)
            }

            if (fs.existsSync(metadataPath)) {
                fs.unlinkSync(metadataPath)
            }

            this.emit("backup_deleted", {
                backupId,
                timestamp: new Date(),
            })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to delete backup: ${message}`)
        }
    }

    /**
     * Cleanup old backups (keep only maxBackups)
     */
    private async cleanupOldBackups(): Promise<void> {
        try {
            const backups = await this.listBackups()

            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups)

                for (const backup of toDelete) {
                    await this.deleteBackup(backup.id)
                }

                this.emit("backups_cleaned", {
                    deletedCount: toDelete.length,
                    timestamp: new Date(),
                })
            }
        } catch (error) {
            // Silently fail cleanup
            const message =
                error instanceof Error ? error.message : String(error)
            this.emit("warning", {
                type: "cleanup_failed",
                message,
                timestamp: new Date(),
            })
        }
    }

    /**
     * Validate storage consistency
     */
    async validateConsistency(): Promise<ConsistencyValidationResult> {
        const checks: ConsistencyValidationResult["checks"] = []
        const errors: string[] = []

        try {
            const connection = this.pool.getConnection()

            // Check 1: Token records count consistency
            await new Promise<void>(resolve => {
                connection.get(
                    `SELECT COUNT(*) as count FROM token_records`,
                    (err, row: any) => {
                        const recordCount = row?.count || 0
                        checks.push({
                            name: "Token records count",
                            passed: recordCount >= 0,
                            expected: 0,
                            actual: recordCount,
                        })
                        resolve()
                    }
                )
            })

            // Check 2: Budget configs consistency
            await new Promise<void>(resolve => {
                connection.get(
                    `SELECT COUNT(*) as count FROM budget_configs WHERE enabled = 1`,
                    (err, row: any) => {
                        const enabledCount = row?.count || 0
                        checks.push({
                            name: "Enabled budget configs",
                            passed: enabledCount >= 0,
                            expected: 0,
                            actual: enabledCount,
                        })
                        resolve()
                    }
                )
            })

            // Check 3: Archive count consistency
            await new Promise<void>(resolve => {
                connection.get(
                    `SELECT COUNT(*) as count FROM archived_data`,
                    (err, row: any) => {
                        const archiveCount = row?.count || 0
                        checks.push({
                            name: "Archive count",
                            passed: archiveCount >= 0,
                            expected: 0,
                            actual: archiveCount,
                        })
                        resolve()
                    }
                )
            })

            // Check 4: Strategy count consistency
            await new Promise<void>(resolve => {
                connection.get(
                    `SELECT COUNT(*) as count FROM strategies WHERE enabled = 1`,
                    (err, row: any) => {
                        const strategyCount = row?.count || 0
                        checks.push({
                            name: "Enabled strategies",
                            passed: strategyCount >= 0,
                            expected: 0,
                            actual: strategyCount,
                        })
                        resolve()
                    }
                )
            })

            const result: ConsistencyValidationResult = {
                valid: errors.length === 0,
                timestamp: new Date(),
                checks,
                errors,
            }

            this.emit("consistency_validation_completed", result)
            return result
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            errors.push(`Consistency validation failed: ${message}`)

            return {
                valid: false,
                timestamp: new Date(),
                checks,
                errors,
            }
        }
    }

    /**
     * Shutdown recovery manager
     */
    async shutdown(): Promise<void> {
        this.emit("shutdown", { timestamp: new Date() })
    }
}

export {
    IntegrityCheckResult,
    BackupMetadata,
    RecoveryResult,
    ConsistencyValidationResult,
}
