# Data Archival and Compression Module

This module provides comprehensive data archival, compression, and restoration functionality for the Token Killer system. It enables efficient storage management by automatically archiving old data and compressing it using gzip or brotli compression.

## Overview

The archival system consists of five main components:

1. **ArchivalService** - Manages the archival process for data >30 days old
2. **CompressionService** - Handles data compression and decompression
3. **ArchiveMetadataTracker** - Tracks and manages metadata for all archives
4. **TransparentDecompressionUtil** - Provides transparent access to both active and archived data
5. **ArchiveRestorationService** - Handles restoration of archived data back to active storage
6. **ArchivalIntegrationService** - Unified interface integrating all components

## Components

### 1. ArchivalService

Manages the archival process for data older than the retention period (default: 30 days).

**Features:**
- Automatic or manual archival triggering
- Configurable archival schedule (hourly, daily, weekly, manual)
- Batch processing for large datasets
- Event-based notifications
- Progress tracking

**Usage:**

```typescript
import { ArchivalService } from './archival'

const archivalService = new ArchivalService(
  pool,
  compressionService,
  metadataTracker,
  {
    dataRetentionDays: 30,
    compressionMethod: 'gzip',
    autoArchivalEnabled: true,
    archivalSchedule: 'daily',
    maxRecordsPerArchival: 10000,
    batchSize: 1000,
  }
)

// Initialize
await archivalService.initialize()

// Start automatic scheduling
archivalService.startScheduling()

// Listen for events
archivalService.on('archival_completed', (result) => {
  console.log(`Archived ${result.recordsArchived} records`)
  console.log(`Compression ratio: ${result.compressionRatio.toFixed(2)}%`)
})

// Manually trigger archival
const result = await archivalService.archiveOldData()
```

### 2. CompressionService

Provides compression and decompression utilities using gzip or brotli.

**Features:**
- Support for gzip and brotli compression methods
- Compression ratio estimation
- Method recommendation based on data size
- Comparison of compression methods
- Chunked compression for large datasets

**Usage:**

```typescript
import { CompressionService } from './compression'

const compressionService = new CompressionService()

// Compress data
const result = await compressionService.compress(records, 'gzip')
console.log(`Original: ${result.originalSize} bytes`)
console.log(`Compressed: ${result.compressedSize} bytes`)
console.log(`Ratio: ${result.compressionRatio.toFixed(2)}%`)

// Decompress data
const decompressed = await compressionService.decompress(
  result.compressedData,
  'gzip'
)
console.log(`Decompressed ${decompressed.data.length} records`)

// Get compression recommendation
const method = compressionService.recommendCompressionMethod(records)
console.log(`Recommended method: ${method}`)

// Compare compression methods
const comparison = await compressionService.compareCompressionMethods(records)
console.log(`Gzip ratio: ${comparison.gzip.compressionRatio.toFixed(2)}%`)
console.log(`Brotli ratio: ${comparison.brotli.compressionRatio.toFixed(2)}%`)
console.log(`Recommendation: ${comparison.recommendation}`)
```

### 3. ArchiveMetadataTracker

Tracks and manages metadata for all archives.

**Features:**
- Store and retrieve archive metadata
- Query archives with filtering and sorting
- Archive statistics and analytics
- Tag-based organization
- Expiration management

**Usage:**

```typescript
import { ArchiveMetadataTracker } from './archive-metadata'

const metadataTracker = new ArchiveMetadataTracker(pool)

// Track a new archival
await metadataTracker.trackArchival({
  archiveId: 'archive_123',
  recordCount: 1000,
  originalSize: 5000000,
  compressedSize: 1500000,
  compressionRatio: 70,
  compressionMethod: 'gzip',
  archivedAt: new Date(),
  dataType: 'token_records',
  tags: ['2024-01', 'production'],
  description: 'January 2024 token records',
})

// Get archive metadata
const metadata = await metadataTracker.getArchiveMetadata('archive_123')

// Query archives
const archives = await metadataTracker.queryArchives({
  filterByCompressionMethod: 'gzip',
  sortBy: 'archivedAt',
  sortOrder: 'desc',
  limit: 10,
})

// Get archives by compression method
const gzipArchives = await metadataTracker.getArchivesByCompressionMethod('gzip')

// Get archives by tags
const januaryArchives = await metadataTracker.getArchivesByTags(['2024-01'])

// Get archive statistics
const stats = await metadataTracker.getArchiveStats()
console.log(`Total archives: ${stats.totalArchives}`)
console.log(`Total records archived: ${stats.totalRecordsArchived}`)
console.log(`Total original size: ${stats.totalOriginalSize} bytes`)
console.log(`Total compressed size: ${stats.totalCompressedSize} bytes`)
console.log(`Average compression ratio: ${stats.averageCompressionRatio.toFixed(2)}%`)

// Update archive metadata
await metadataTracker.updateArchiveMetadata('archive_123', {
  tags: ['2024-01', 'production', 'verified'],
  description: 'January 2024 token records - verified',
})

// Clean up expired archives
const deleted = await metadataTracker.cleanupExpiredArchives()
console.log(`Deleted ${deleted} expired archives`)
```

### 4. TransparentDecompressionUtil

Provides transparent access to both active and archived data without requiring manual decompression.

**Features:**
- Query active data
- Query archived data with automatic decompression
- Unified queries across active and archived data
- Date range queries
- Agent type, model, task ID, and request ID filtering
- Full-text search
- Aggregated statistics

**Usage:**

```typescript
import { TransparentDecompressionUtil } from './decompression-utils'

const decompressionUtil = new TransparentDecompressionUtil(
  pool,
  compressionService,
  metadataTracker
)

// Query active data
const activeRecords = await decompressionUtil.queryActive(
  (record) => record.agentType === 'kiro'
)

// Query archived data (automatic decompression)
const archivedRecords = await decompressionUtil.queryArchived(
  'archive_123',
  (record) => record.model === 'claude-haiku-4.5'
)

// Unified query (active + archived)
const allRecords = await decompressionUtil.getAllRecords(
  (record) => record.totalTokens > 1000
)

// Query by date range
const records = await decompressionUtil.getRecordsByDateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31')
)

// Query by agent type
const kiroRecords = await decompressionUtil.getRecordsByAgentType('kiro')

// Query by model
const claudeRecords = await decompressionUtil.getRecordsByModel('claude-haiku-4.5')

// Query by task ID
const taskRecords = await decompressionUtil.getRecordsByTaskId('task_123')

// Query by request ID
const requestRecords = await decompressionUtil.getRecordsByRequestId('req_123')

// Search records
const searchResults = await decompressionUtil.search('kiro', ['agentType', 'requestId'])

// Count total records
const counts = await decompressionUtil.countTotalRecords()
console.log(`Active: ${counts.activeCount}`)
console.log(`Archived: ${counts.archivedCount}`)
console.log(`Total: ${counts.totalCount}`)

// Get aggregated statistics
const stats = await decompressionUtil.getAggregatedStats()
console.log(`Total records: ${stats.totalRecords}`)
console.log(`Total tokens: ${stats.totalTokens}`)
console.log(`Total cost (USD): $${stats.totalCostUSD.toFixed(2)}`)
console.log(`Average tokens per record: ${stats.averageTokensPerRecord.toFixed(2)}`)
```

### 5. ArchiveRestorationService

Handles restoration of archived data back to active storage.

**Features:**
- Restore single or multiple archives
- Selective restoration with predicates
- Batch processing for large datasets
- Progress tracking
- Optional deletion after restoration
- Event-based notifications

**Usage:**

```typescript
import { ArchiveRestorationService } from './archive-restoration'

const restorationService = new ArchiveRestorationService(
  pool,
  compressionService,
  metadataTracker
)

// Restore single archive
const result = await restorationService.restoreArchive({
  archiveId: 'archive_123',
  deleteAfterRestore: true,
  predicate: (record) => record.agentType === 'kiro',
})
console.log(`Restored ${result.recordsRestored} records`)

// Restore multiple archives
const results = await restorationService.restoreMultipleArchives(
  ['archive_123', 'archive_124'],
  true
)

// Restore all archives
const allResults = await restorationService.restoreAllArchives(true)

// Listen for progress
restorationService.on('restoration_progress', (progress) => {
  console.log(
    `${progress.percentageComplete.toFixed(2)}% complete - ${progress.estimatedTimeRemaining}ms remaining`
  )
})

// Check restoration status
if (restorationService.isRestorationInProgress()) {
  const progress = restorationService.getProgress()
  console.log(`Restoring: ${progress?.restoredRecords}/${progress?.totalRecords}`)
}
```

### 6. ArchivalIntegrationService

Unified interface that integrates all archival components.

**Features:**
- Single entry point for all archival operations
- Automatic event forwarding
- Simplified API
- Transparent data access
- Comprehensive statistics

**Usage:**

```typescript
import { ArchivalIntegrationService } from './archival-integration'

const archivalIntegration = new ArchivalIntegrationService(pool, {
  dataRetentionDays: 30,
  compressionMethod: 'gzip',
  autoArchivalEnabled: true,
  archivalSchedule: 'daily',
})

// Initialize
await archivalIntegration.initialize()

// Start automatic archival
archivalIntegration.startScheduling()

// Listen for events
archivalIntegration.on('archival_completed', (event) => {
  console.log(`Archived ${event.recordsArchived} records`)
})

// Query all data transparently
const allRecords = await archivalIntegration.queryAll()

// Query by date range
const records = await archivalIntegration.getRecordsByDateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31')
)

// Get statistics
const stats = await archivalIntegration.getAggregatedStats()

// Restore archive
await archivalIntegration.restoreArchive('archive_123', true)

// Get archive statistics
const archiveStats = await archivalIntegration.getArchiveStats()

// Cleanup expired archives
const deleted = await archivalIntegration.cleanupExpiredArchives()

// Shutdown
await archivalIntegration.shutdown()
```

## Database Schema

The archival system uses the following tables:

### archived_data
Stores compressed archived records.

```sql
CREATE TABLE archived_data (
  id TEXT PRIMARY KEY,
  dataType TEXT NOT NULL,
  compressedData BLOB NOT NULL,
  originalSize INTEGER NOT NULL,
  compressedSize INTEGER NOT NULL,
  compressionMethod TEXT NOT NULL DEFAULT 'gzip',
  recordCount INTEGER NOT NULL DEFAULT 0,
  archivedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### archive_metadata
Tracks metadata for all archives.

```sql
CREATE TABLE archive_metadata (
  archiveId TEXT PRIMARY KEY,
  recordCount INTEGER NOT NULL,
  originalSize INTEGER NOT NULL,
  compressedSize INTEGER NOT NULL,
  compressionRatio REAL NOT NULL,
  compressionMethod TEXT NOT NULL DEFAULT 'gzip',
  archivedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  dataType TEXT NOT NULL DEFAULT 'token_records',
  tags TEXT,
  description TEXT,
  expiresAt DATETIME,
  FOREIGN KEY (archiveId) REFERENCES archived_data(id) ON DELETE CASCADE
)
```

## Configuration

### ArchivalIntegrationConfig

```typescript
interface ArchivalIntegrationConfig {
  dataRetentionDays?: number // Default: 30
  compressionMethod?: 'gzip' | 'brotli' // Default: 'gzip'
  autoArchivalEnabled?: boolean // Default: true
  archivalSchedule?: 'hourly' | 'daily' | 'weekly' | 'manual' // Default: 'daily'
  maxRecordsPerArchival?: number // Default: 10000
  batchSize?: number // Default: 1000
  archiveFolder?: string // Default: '.kiro/data/archive'
  checkIntervalMs?: number // Default: 60000
}
```

## Events

### ArchivalService Events

- `initialized` - Service initialized
- `archival_completed` - Archival completed successfully
- `archival_failed` - Archival failed
- `no_records_to_archive` - No records to archive
- `error` - Error occurred

### ArchiveRestorationService Events

- `restoration_completed` - Restoration completed
- `restoration_failed` - Restoration failed
- `restoration_progress` - Restoration progress update
- `restoration_cancelled` - Restoration cancelled

### ArchivalIntegrationService Events

All events from ArchivalService and ArchiveRestorationService are forwarded.

## Performance Considerations

1. **Compression Method Selection**
   - Use gzip for smaller datasets (<1MB) - faster compression
   - Use brotli for larger datasets (>1MB) - better compression ratio

2. **Batch Processing**
   - Default batch size: 1000 records
   - Adjust based on available memory and performance requirements

3. **Archival Scheduling**
   - Daily archival (default) balances performance and storage efficiency
   - Adjust schedule based on data volume and retention requirements

4. **Transparent Decompression**
   - Decompression happens on-demand
   - Cached in memory during query execution
   - No persistent decompressed storage

## Error Handling

All services include comprehensive error handling:

- Validation of input parameters
- Graceful degradation on compression failures
- Detailed error messages for debugging
- Event-based error reporting

## Best Practices

1. **Regular Archival**
   - Enable automatic archival scheduling
   - Monitor archival events for failures

2. **Metadata Management**
   - Use tags for organization
   - Set expiration dates for temporary archives
   - Regularly clean up expired archives

3. **Restoration**
   - Test restoration procedures regularly
   - Use predicates to restore specific subsets
   - Delete archives after successful restoration to save space

4. **Monitoring**
   - Track compression ratios
   - Monitor archival duration
   - Alert on archival failures

## Integration with StorageManager

The ArchivalIntegrationService works seamlessly with the existing StorageManager:

```typescript
import { StorageManager } from './storage-manager'
import { ArchivalIntegrationService } from './archival-integration'

// StorageManager handles storage size monitoring and warnings
const storageManager = new StorageManager(pool, config)
storageManager.startMonitoring()

// ArchivalIntegrationService handles archival and compression
const archivalIntegration = new ArchivalIntegrationService(pool, config)
await archivalIntegration.initialize()
archivalIntegration.startScheduling()

// Both work together for complete storage management
```

## Troubleshooting

### Archival Not Triggering

1. Check if `autoArchivalEnabled` is true
2. Verify archival schedule is not 'manual'
3. Check for errors in event listeners
4. Verify database connectivity

### Decompression Failures

1. Verify compression method matches stored method
2. Check for database corruption
3. Ensure sufficient memory for decompression
4. Check file permissions on archive folder

### Restoration Issues

1. Verify archive exists and is not corrupted
2. Check for duplicate records in active storage
3. Ensure sufficient disk space
4. Verify database write permissions

## Future Enhancements

1. Incremental archival (archive only new records)
2. Parallel compression for multiple archives
3. Archive encryption
4. Cloud storage integration
5. Archive versioning
6. Differential compression
