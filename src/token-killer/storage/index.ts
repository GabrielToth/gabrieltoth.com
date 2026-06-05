/**
 * Storage module - Local SQLite storage with auto-archival
 * Exports database connection, schema, migrations, initialization, and storage management
 */

export {
  DatabasePool,
  getDatabasePool,
  initializeDatabasePool,
  type PoolConfig,
  type HealthCheckResult,
} from './database'

export {
  createSchema,
  verifySchema,
  dropSchema,
  SCHEMA_DEFINITIONS,
  INDEX_DEFINITIONS,
} from './schema'

export {
  MigrationRunner,
  createMigrationRunner,
  DEFAULT_MIGRATIONS,
  type Migration,
  type AppliedMigration,
  type MigrationHistory,
} from './migrations'

export {
  initializeDatabase,
  getDatabaseConnection,
  closeDatabaseConnection,
  resetDatabase,
  getDatabaseStats,
  type InitializationResult,
} from './initialize'

export {
  StorageManager,
  type ArchivalConfig,
  type ArchivalEvent,
  type StorageWarning,
} from './storage-manager'

export {
  ArchivalService,
  type ArchivalConfig as ArchivalServiceConfig,
  type ArchivalResult,
} from './archival'

export {
  CompressionService,
  type CompressionResult,
  type DecompressionResult,
} from './compression'

export {
  ArchiveMetadataTracker,
  type ArchiveMetadataEntry,
  type ArchiveMetadataQueryOptions,
  type ArchiveMetadataStats,
} from './archive-metadata'

export {
  TransparentDecompressionUtil,
  type DecompressedQueryResult,
  type UnifiedQueryOptions,
} from './decompression-utils'

export {
  ArchiveRestorationService,
  type RestorationOptions,
  type RestorationResult,
  type RestorationProgress,
} from './archive-restoration'

export {
  ArchivalIntegrationService,
  type ArchivalIntegrationConfig,
} from './archival-integration'

export {
  StorageRecoveryManager,
  type IntegrityCheckResult,
  type BackupMetadata,
  type RecoveryResult,
  type ConsistencyValidationResult,
} from './recovery'

