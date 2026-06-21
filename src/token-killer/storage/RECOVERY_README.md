# Storage Recovery and Consistency Module

## Status: ⏸️ DEFERRED

⚠️ **This project is paused indefinitely.** Do not implement or reference these designs in active development. Focus on feature implementation first.

## Overview

The Storage Recovery and Consistency Module provides comprehensive database integrity checks, recovery mechanisms for corrupted data, backup functionality, and storage consistency validation for the Token Killer system.

## Features

### 1. Database Integrity Checks

Performs comprehensive integrity verification including:

- **Database File Validation**: Checks if database file exists and is readable
- **Connection Health**: Verifies database connection responsiveness
- **Schema Integrity**: Validates all required tables and indexes exist
- **Foreign Key Constraints**: Detects orphaned records and constraint violations
- **Data Consistency**: Identifies records with invalid values or inconsistencies
- **Constraint Violations**: Checks CHECK constraints and data type validations
- **Archive Integrity**: Verifies all archived data can be decompressed

### 2. Recovery Mechanisms

Automatically repairs detected issues:

- **Foreign Key Violation Repair**: Removes orphaned records
- **Constraint Violation Repair**: Fixes records violating CHECK constraints
- **Archive Corruption Repair**: Identifies and reports corrupted archives
- **Non-Blocking Recovery**: Continues operation even if some repairs fail

### 3. Backup Functionality

Creates and manages database backups:

- **Compressed Backups**: Uses gzip compression for efficient storage
- **Checksum Verification**: SHA256 checksums ensure backup integrity
- **Metadata Tracking**: Records backup details (size, record count, timestamp)
- **Automatic Cleanup**: Keeps only the 10 most recent backups
- **Backup Restoration**: Restores database from any backup with verification

### 4. Storage Consistency Validation

Validates storage consistency across all components:

- **Record Count Consistency**: Verifies token records count
- **Budget Configuration Consistency**: Checks enabled budget configs
- **Archive Count Consistency**: Validates archive records
- **Strategy Consistency**: Verifies enabled strategies

## Usage

### Initialize Recovery Manager

```typescript
import { StorageRecoveryManager } from './recovery'
import { getDatabasePool } from './database'

const pool = getDatabasePool()
const recoveryManager = new StorageRecoveryManager(pool)
await recoveryManager.initialize()
```

### Check Database Integrity

```typescript
const result = await recoveryManager.checkIntegrity()

console.log('Integrity Check Result:')
console.log(`Valid: ${result.valid}`)
console.log(`Checks: ${result.checks.length}`)
console.log(`Errors: ${result.errors.length}`)
console.log(`Warnings: ${result.warnings.length}`)

// Examine individual checks
result.checks.forEach(check => {
  console.log(`- ${check.name}: ${check.passed ? 'PASS' : 'FAIL'}`)
  if (check.message) {
    console.log(`  ${check.message}`)
  }
})
```

### Perform Recovery

```typescript
const recoveryResult = await recoveryManager.recover()

console.log('Recovery Result:')
console.log(`Success: ${recoveryResult.success}`)
console.log(`Fixed Issues: ${recoveryResult.fixedIssues}`)
console.log(`Recovered Records: ${recoveryResult.recoveredRecords}`)

if (recoveryResult.errors.length > 0) {
  console.log('Errors:')
  recoveryResult.errors.forEach(error => console.log(`- ${error}`))
}

if (recoveryResult.warnings.length > 0) {
  console.log('Warnings:')
  recoveryResult.warnings.forEach(warning => console.log(`- ${warning}`))
}
```

### Create Backup

```typescript
const backup = await recoveryManager.createBackup(
  'Pre-migration backup',
  ['important', 'pre-migration']
)

console.log('Backup Created:')
console.log(`ID: ${backup.id}`)
console.log(`Size: ${backup.originalSize} bytes`)
console.log(`Compressed: ${backup.compressedSize} bytes`)
console.log(`Compression Ratio: ${backup.compressionRatio.toFixed(2)}%`)
console.log(`Checksum: ${backup.checksumSHA256}`)
```

### List Backups

```typescript
const backups = await recoveryManager.listBackups()

console.log('Available Backups:')
backups.forEach(backup => {
  console.log(`- ${backup.id}`)
  console.log(`  Created: ${backup.timestamp}`)
  console.log(`  Records: ${backup.recordCount}`)
  console.log(`  Size: ${backup.compressedSize} bytes`)
  if (backup.description) {
    console.log(`  Description: ${backup.description}`)
  }
})
```

### Restore from Backup

```typescript
try {
  await recoveryManager.restoreFromBackup(backupId)
  console.log('Backup restored successfully')
} catch (error) {
  console.error('Restore failed:', error.message)
}
```

### Validate Consistency

```typescript
const consistencyResult = await recoveryManager.validateConsistency()

console.log('Consistency Validation:')
console.log(`Valid: ${consistencyResult.valid}`)

consistencyResult.checks.forEach(check => {
  console.log(`- ${check.name}:`)
  console.log(`  Expected: ${check.expected}`)
  console.log(`  Actual: ${check.actual}`)
  console.log(`  Status: ${check.passed ? 'PASS' : 'FAIL'}`)
})
```

## Event Handling

The recovery manager emits events for monitoring:

```typescript
recoveryManager.on('initialized', (data) => {
  console.log('Recovery manager initialized')
})

recoveryManager.on('integrity_check_completed', (result) => {
  console.log(`Integrity check completed: ${result.valid ? 'PASS' : 'FAIL'}`)
})

recoveryManager.on('recovery_completed', (result) => {
  console.log(`Recovery completed: ${result.fixedIssues} issues fixed`)
})

recoveryManager.on('backup_created', (metadata) => {
  console.log(`Backup created: ${metadata.id}`)
})

recoveryManager.on('backup_restored', (data) => {
  console.log(`Backup restored: ${data.backupId}`)
})

recoveryManager.on('consistency_validation_completed', (result) => {
  console.log(`Consistency validation: ${result.valid ? 'PASS' : 'FAIL'}`)
})

recoveryManager.on('error', (error) => {
  console.error(`Error: ${error.type} - ${error.message}`)
})
```

## Integrity Check Details

### Database File Check
- Verifies database file exists
- Checks file size is greater than 0
- Ensures file is readable

### Connection Health Check
- Executes simple query to verify connectivity
- Measures response time
- Reports any connection errors

### Schema Integrity Check
- Verifies all required tables exist:
  - token_records
  - budget_configs
  - budget_usage
  - strategies
  - pricing_cache
  - archived_data
  - archive_metadata
  - pruning_decisions
  - compression_decisions
  - tasks
  - budget_warnings

### Foreign Key Constraints Check
- Detects orphaned token_records (taskId references non-existent tasks)
- Reports violation count and details

### Data Consistency Check
- Detects negative token counts
- Verifies totalTokens = inputTokens + outputTokens
- Checks budget usage doesn't exceed limits

### Constraint Violations Check
- Validates agentType values
- Validates budget_configs type values
- Reports violation count by constraint

### Archive Integrity Check
- Attempts to decompress each archive
- Reports corrupted archives
- Provides error details

## Recovery Mechanisms

### Foreign Key Violation Recovery
- Deletes orphaned token_records
- Logs deleted record IDs
- Updates fixedIssues counter

### Constraint Violation Recovery
- Removes records with invalid agentType
- Removes records with invalid budget type
- Preserves valid records

### Archive Corruption Recovery
- Identifies corrupted archives
- Reports errors for manual intervention
- Does not delete corrupted archives automatically

## Backup Management

### Backup Creation
- Reads entire database file
- Compresses with gzip
- Calculates SHA256 checksum
- Stores metadata as JSON
- Automatically cleans up old backups

### Backup Storage
- Location: `.kiro/data/backups/`
- Format: `backup_<timestamp>_<random>.gz`
- Metadata: `backup_<timestamp>_<random>.json`
- Maximum backups kept: 10

### Backup Restoration
- Verifies backup file exists
- Decompresses backup data
- Verifies checksum matches
- Closes current database connection
- Restores database file
- Reinitializes database connection

## Consistency Validation

Validates consistency across all storage components:

- **Token Records Count**: Verifies count is non-negative
- **Enabled Budget Configs**: Checks enabled budget configurations
- **Archive Count**: Validates archive records
- **Enabled Strategies**: Verifies enabled optimization strategies

## Error Handling

The recovery manager handles errors gracefully:

- **Non-blocking Recovery**: Continues even if some repairs fail
- **Detailed Error Reporting**: Provides specific error messages
- **Warning Accumulation**: Collects warnings without stopping
- **Event Emission**: Emits error events for monitoring

## Performance Considerations

- **Integrity Checks**: O(n) where n is number of records
- **Recovery**: O(n) for constraint violation repairs
- **Backup Creation**: O(n) for compression
- **Backup Restoration**: O(n) for decompression
- **Consistency Validation**: O(1) for count checks

## Testing

Comprehensive unit tests cover:

- Initialization and setup
- Integrity checks for all components
- Recovery mechanisms
- Backup creation and restoration
- Consistency validation
- Event emission
- Error handling

Run tests:

```bash
npm run test -- src/token-killer/storage/recovery.test.ts
```

## Integration with Storage Manager

The recovery manager works alongside the storage manager:

- **Storage Manager**: Monitors size, triggers archival
- **Recovery Manager**: Checks integrity, performs recovery, manages backups

Both can be used together for comprehensive storage management:

```typescript
const storageManager = new StorageManager(pool)
const recoveryManager = new StorageRecoveryManager(pool)

await storageManager.initialize()
await recoveryManager.initialize()

// Monitor storage
storageManager.startMonitoring()

// Periodically check integrity
setInterval(async () => {
  const result = await recoveryManager.checkIntegrity()
  if (!result.valid) {
    await recoveryManager.recover()
  }
}, 3600000) // Every hour

// Create daily backups
setInterval(async () => {
  await recoveryManager.createBackup(`Daily backup - ${new Date().toISOString()}`)
}, 86400000) // Every 24 hours
```

## Requirements Mapping

This module implements the following requirements:

- **Requirement 12.1**: Local-only token storage with SQLite
- **Requirement 12.3**: Storage consistency validation
- **Requirement 12.6**: Automatic archival trigger at 1GB
- **Requirement 12.7**: Data compression and archival
- **Requirement 12.11**: Transparent decompression and querying

## Future Enhancements

Potential improvements:

- Incremental backups
- Backup encryption
- Remote backup storage
- Automated recovery scheduling
- Machine learning-based anomaly detection
- Distributed backup replication
- Backup versioning and retention policies
