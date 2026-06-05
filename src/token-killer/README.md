# Token Killer - Token Optimization and Management System

Token Killer is a comprehensive token optimization and management system designed to reduce token consumption per request and task across multiple LLM providers.

## Project Structure

```
src/token-killer/
├── core/                    # Core types and interfaces
│   ├── types.ts            # TypeScript interfaces for all components
│   └── index.ts
├── tracker/                # Token tracking across multiple LLM providers
│   └── index.ts
├── budget/                 # Per-request and per-task budget management
│   └── index.ts
├── optimizer/              # Optimization strategies (pruning, compression, etc.)
│   └── index.ts
├── storage/                # Local SQLite storage with auto-archival
│   └── index.ts
├── integrations/           # Integration with Kiro, Antigravity, Cursor, Obsidian
│   └── index.ts
├── visualization/          # Web dashboard, CLI reporting, analytics
│   └── index.ts
├── index.ts               # Main module export
└── README.md              # This file
```

## Core Features

### 1. Token Tracking (`tracker/`)
- Multi-model support: Claude Haiku 4.5, Gemini Flash 3.1, Cursor Composer 2.0
- Accurate token counting using provider-specific tokenizers
- Cost calculation in USD and BRL
- Per-request and per-task aggregation
- Minimal performance overhead (<5% latency increase)

### 2. Budget Management (`budget/`)
- Per-request token budgets
- Per-task token budgets
- Non-blocking warnings at 50% (YELLOW), 80% (RED), and >100% (CRITICAL)
- Budget override functionality for administrators
- Audit logging for all budget events

### 3. Optimization Strategies (`optimizer/`)
- Context pruning (15%+ token reduction)
- Response compression (20%+ token reduction)
- Prompt optimization
- Caching strategies
- Model routing
- Dry-run mode with estimated savings

### 4. Local Storage (`storage/`)
- SQLite-only storage (no automatic Supabase requests)
- Auto-archival at 1GB threshold
- Data compression for records >30 days old
- Transparent decompression for queries
- Storage consistency and recovery

### 5. Visualization (`visualization/`)
- Web dashboard with multiple time windows (24h, 7d, 30d, 90d, all-time)
- Interactive charts using uPlot (optimized for 100K+ data points)
- CLI reporting tool: `token-killer stats [--days 7] [--format json|csv|table]`
- Analytics and forecasting
- Anomaly detection

### 6. Integrations (`integrations/`)
- **Kiro**: Workflow token tracking and budget enforcement
- **Antigravity**: Agent-specific budgets and real-time updates
- **Cursor**: IDE status bar display and optimization suggestions
- **Obsidian**: Unidirectional sync for documentation

## Dependencies

- `sqlite3`: Local database storage
- `@anthropic-ai/sdk`: Claude tokenizer
- `@google-ai/generativelanguage`: Gemini tokenizer
- `uplot`: High-performance charting library
- `commander`: CLI command parsing
- `express`: API server for dashboard

## Getting Started

### Installation

All dependencies are already installed. To verify:

```bash
npm list sqlite3 @anthropic-ai/sdk @google-ai/generativelanguage uplot commander express
```

### Build

```bash
npm run build
```

### Testing

```bash
npm run test
```

## Implementation Phases

The implementation is organized into 10 phases:

1. **Core Infrastructure Setup** (Current) - Project structure and dependencies
2. **Token Tracking Implementation** - Multi-model tokenizers and recording
3. **Budget Management Implementation** - Per-request and per-task budgets
4. **Optimization Strategies Implementation** - Pruning, compression, management
5. **Storage and Archival Implementation** - SQLite storage with auto-archival
6. **Visualization and Reporting Implementation** - Dashboard, CLI, analytics
7. **Integration Implementation** - Kiro, Antigravity, Cursor, Obsidian
8. **Advanced Features and Optimization** - Prompt optimization, caching, routing
9. **Testing and Validation** - Integration, performance, security tests
10. **Documentation and Deployment** - API docs, user guides, deployment

## Type Definitions

All core types are defined in `core/types.ts`:

- `TokenRecord`: Token consumption record
- `BudgetConfig`: Budget configuration
- `BudgetUsage`: Budget usage tracking
- `BudgetWarning`: Budget warning event
- `Strategy`: Optimization strategy
- `PricingInfo`: Model pricing information
- `TokenReport`: Token consumption report
- `DryRunResult`: Optimization dry-run result
- `StorageStats`: Storage statistics
- `ArchiveMetadata`: Archive metadata

## Next Steps

1. Implement token tracking with multi-model support (Phase 2)
2. Implement budget management (Phase 3)
3. Implement optimization strategies (Phase 4)
4. Implement storage layer (Phase 5)
5. Implement visualization (Phase 6)
6. Implement integrations (Phase 7)
7. Advanced features (Phase 8)
8. Testing and validation (Phase 9)
9. Documentation and deployment (Phase 10)

## References

- Design Document: `.kiro/specs/token-killer/design.md`
- Requirements: `.kiro/specs/token-killer/requirements.md`
- Tasks: `.kiro/specs/token-killer/tasks.md`
