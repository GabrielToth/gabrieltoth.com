# Token Killer - Technical Design Document

## Status: ⏸️ DEFERRED

⚠️ **This project is paused indefinitely.** Do not implement or reference these designs in active development. Focus on feature implementation first.

## 1. System Architecture Overview

Token Killer is a modular token optimization and tracking system with the following core layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
│  (Kiro, Antigravity, Cursor, gabrieltoth.com)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Middleware Layer                           │
│  (Request Interceptor, Task Tracker, Budget Monitor)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Optimization Layer                          │
│  (Context Pruner, Response Compressor, Strategy Manager)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Core Services Layer                        │
│  (Token Tracker, Budget Manager, Tokenizer Adapter)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Storage & Analytics Layer                   │
│  (SQLite Local DB, Analytics Engine, Visualization)         │
└─────────────────────────────────────────────────────────────┘
```

## 2. Core Components

### 2.1 Token Tracker Service

**Purpose**: Accurate token counting across multiple LLM providers

**Responsibilities**:
- Count tokens using provider-specific tokenizers (not LLM-reported counts)
- Record token consumption with metadata (input, output, total, model, timestamp, request_id, task_id, agent_type)
- Calculate cost estimates based on current pricing
- Aggregate tokens at task level
- Maintain < 5% performance overhead

**Implementation Details**:
- **Tokenizer Adapters** (provider-specific):
  - `ClaudeTokenizer`: Uses `@anthropic-ai/sdk` tokenizer for Claude Haiku 4.5
  - `GeminiTokenizer`: Uses Google's tokenizer for Gemini Flash 3.1
  - `CursorTokenizer`: Uses Cursor Composer 2.0 tokenizer
  - Fallback: Approximate counting (4 chars ≈ 1 token) for unknown models

- **Token Record Schema**:
  ```typescript
  interface TokenRecord {
    id: string
    requestId: string
    taskId?: string
    agentType: 'kiro' | 'antigravity' | 'cursor' | 'gabrieltoth'
    model: 'claude-haiku-4.5' | 'gemini-flash-3.1' | 'cursor-composer-2.0'
    inputTokens: number
    outputTokens: number
    totalTokens: number
    inputCost: number // USD
    outputCost: number // USD
    totalCost: number // USD
    timestamp: Date
    metadata?: Record<string, any>
  }
  ```

- **Pricing Management**:
  - Fetch from provider APIs (Anthropic, Google, Cursor)
  - Cache pricing for 24 hours
  - Fallback to user-configured values
  - Weekly prompt to verify/update pricing if unavailable
  - Support USD (default) and BRL with configurable exchange rate

### 2.2 Budget Manager Service

**Purpose**: Track and enforce token budgets at request and task levels

**Responsibilities**:
- Check budget definitions for request types
- Track consumption against limits
- Emit warnings at 50%, 80%, and 100%+ thresholds
- Allow budget overrides for authenticated admins
- Log budget events for audit

**Implementation Details**:
- **Budget Levels**:
  - Request-level: Per request type (e.g., "spec-creation", "code-generation")
  - Task-level: Per task execution
  - Agent-level: Per agent type (Kiro, Antigravity, Cursor)

- **Warning System**:
  - 50% consumed: YELLOW warning with current/projected totals
  - 80% consumed: RED warning with urgent notification
  - 100%+ consumed: CRITICAL warning (non-blocking)

- **Budget Record Schema**:
  ```typescript
  interface BudgetConfig {
    id: string
    type: 'request' | 'task' | 'agent'
    name: string
    maxTokens: number
    warningThresholds: { yellow: 50, red: 80 } // percentages
    enabled: boolean
    createdAt: Date
    updatedAt: Date
  }

  interface BudgetUsage {
    budgetId: string
    currentTokens: number
    maxTokens: number
    percentageUsed: number
    status: 'ok' | 'warning_yellow' | 'warning_red' | 'exceeded'
    lastUpdated: Date
  }
  ```

### 2.3 Context Pruning Service

**Purpose**: Intelligently reduce token consumption by removing non-essential context

**Responsibilities**:
- Analyze request context and identify non-essential elements
- Preserve critical elements (system prompts, current query, critical tags, task context)
- Achieve ≥15% token reduction without quality degradation
- Log pruning decisions for audit
- Support dry-run mode with estimated savings

**Implementation Details**:
- **Pruning Priority** (lowest to highest priority for removal):
  1. Old conversations (>8-10 turns)
  2. Duplicate messages
  3. Unnecessary metadata
  4. Old few-shot examples
  5. Conversation summaries

- **Preserve List** (never prune):
  - System prompts
  - Current user query
  - Critical instructions (marked with `<critical>` tags)
  - Active task context

- **Pruning Algorithm**:
  ```
  1. Parse request context into segments
  2. Identify preserve-list items
  3. Calculate token count for each segment
  4. Sort removable segments by priority
  5. Remove segments until ≥15% reduction achieved
  6. Verify semantic coherence
  7. Log pruning decisions
  8. Return pruned context
  ```

- **Dry-Run Mode**:
  - Show estimated token savings (e.g., "-1,847 tokens (-34%)")
  - Display which elements would be removed
  - Allow user to confirm or adjust

### 2.4 Response Compression Service

**Purpose**: Reduce response token consumption while protecting critical content

**Responsibilities**:
- Analyze response content and apply compression techniques
- Achieve ≥20% token reduction while preserving information
- Never compress code blocks, structured data, tables, reasoning chains
- Maintain readability and clarity
- Support retrieval of uncompressed version

**Implementation Details**:
- **Compression Techniques**:
  - Abbreviations (e.g., "approximately" → "approx.")
  - Bullet points instead of prose
  - Structured formatting (tables, lists)
  - Removal of redundant explanations
  - Concise phrasing

- **Protected Content Types** (never compress):
  - Code blocks (```...```)
  - JSON/YAML/structured data
  - Tables
  - Step-by-step reasoning (Chain of Thought)
  - Creative or tone-specific responses

- **Compression Detection**:
  - Analyze response structure
  - Identify compressible sections
  - Calculate potential savings
  - Skip if clarity would be significantly reduced

- **Uncompressed Retrieval**:
  - Add `?original=true` query parameter or header
  - Return full uncompressed response with token count comparison

### 2.5 Strategy Manager Service

**Purpose**: Manage and apply token optimization strategies

**Responsibilities**:
- Enable/disable strategies
- Configure strategy parameters
- Set strategy priority order
- Track strategy effectiveness
- Support dry-run mode with cumulative savings estimates

**Implementation Details**:
- **Strategy Priority Order** (applied sequentially):
  1. Context Pruning (15-30% savings)
  2. Response Compression (20-40% savings)
  3. Prompt Optimization (10-20% savings)
  4. Caching (50-90% savings for repeated queries)
  5. Model Routing (5-15% savings by selecting optimal model)

- **Strategy Configuration**:
  ```typescript
  interface Strategy {
    id: string
    name: string
    type: 'pruning' | 'compression' | 'optimization' | 'caching' | 'routing'
    enabled: boolean
    priority: number
    parameters: Record<string, any>
    estimatedSavings: number // percentage
    actualSavings: number // percentage (tracked)
    qualityImpact: 'none' | 'low' | 'medium' | 'high'
    createdAt: Date
    updatedAt: Date
  }
  ```

- **Dry-Run Mode**:
  - Calculate cumulative savings from all enabled strategies
  - Show estimated token reduction (e.g., "-3,500 tokens (-45%)")
  - Display strategy breakdown
  - Allow user to enable/disable individual strategies

### 2.6 Local SQLite Storage Service

**Purpose**: Store all token tracking data locally without Supabase

**Responsibilities**:
- Initialize SQLite database on startup
- Store all token records, budgets, strategies, analytics
- Query data for reporting and visualization
- Auto-archive old data (>30 days) when storage reaches 1GB
- Compress archived data using gzip/brotli
- Support transparent decompression and querying

**Implementation Details**:
- **Database Schema**:
  ```sql
  -- Token Records
  CREATE TABLE token_records (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    taskId TEXT,
    agentType TEXT NOT NULL,
    model TEXT NOT NULL,
    inputTokens INTEGER NOT NULL,
    outputTokens INTEGER NOT NULL,
    totalTokens INTEGER NOT NULL,
    inputCost REAL NOT NULL,
    outputCost REAL NOT NULL,
    totalCost REAL NOT NULL,
    timestamp DATETIME NOT NULL,
    metadata TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Budget Configurations
  CREATE TABLE budget_configs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    maxTokens INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Budget Usage
  CREATE TABLE budget_usage (
    id TEXT PRIMARY KEY,
    budgetId TEXT NOT NULL REFERENCES budget_configs(id),
    currentTokens INTEGER NOT NULL,
    status TEXT NOT NULL,
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Strategies
  CREATE TABLE strategies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    priority INTEGER NOT NULL,
    parameters TEXT,
    estimatedSavings REAL,
    actualSavings REAL,
    qualityImpact TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pricing Cache
  CREATE TABLE pricing_cache (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL UNIQUE,
    inputPrice REAL NOT NULL,
    outputPrice REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Archived Data (compressed)
  CREATE TABLE archived_data (
    id TEXT PRIMARY KEY,
    dataType TEXT NOT NULL,
    compressedData BLOB NOT NULL,
    originalSize INTEGER NOT NULL,
    compressedSize INTEGER NOT NULL,
    compressionMethod TEXT DEFAULT 'gzip',
    archivedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```

- **Storage Management**:
  - Monitor local storage size
  - Warn at 500MB
  - Auto-archive at 1GB
  - Archive data >30 days old
  - Compress using gzip (default) or brotli
  - Move to `archive/` folder

- **Query Interface**:
  - Transparent decompression for archived data
  - Unified query API (works with both active and archived data)
  - No user intervention needed

### 2.7 Analytics Engine

**Purpose**: Analyze token consumption patterns and generate insights

**Responsibilities**:
- Compute consumption statistics (mean, median, std dev, percentiles)
- Identify patterns by time, agent type, request type
- Detect anomalies (>2 standard deviations)
- Forecast future consumption with confidence intervals
- Generate comprehensive reports

**Implementation Details**:
- **Statistics Computed**:
  - Mean, median, mode
  - Standard deviation, variance
  - Percentiles (25th, 50th, 75th, 90th, 95th, 99th)
  - Min, max, range

- **Pattern Detection**:
  - By time of day (hourly, daily, weekly)
  - By agent type (Kiro, Antigravity, Cursor)
  - By request type (spec-creation, code-generation, etc.)
  - By model (Claude, Gemini, Cursor)

- **Anomaly Detection**:
  - Calculate z-score for each data point
  - Flag points with |z-score| > 2
  - Provide context and potential causes

- **Forecasting**:
  - Use exponential smoothing or ARIMA
  - Provide confidence intervals (95%, 99%)
  - Minimum 7 days of historical data required

## 3. Integration Points

### 3.1 Kiro Integration

**Middleware Injection**:
- Hook into Kiro's request/response cycle
- Track tokens per spec phase (requirements, design, tasks)
- Enforce task-level budgets
- Pause and request approval if budget exceeded

**Data Flow**:
```
Kiro Workflow → Token Killer Middleware → Track Tokens → Update Budget → Continue/Pause
```

### 3.2 Antigravity Agent Integration

**Middleware Injection**:
- Auto-track token consumption via middleware
- Provide real-time updates (every N requests or X% of budget)
- Suggest optimization strategies
- Include token data in error reports

**Agent-Specific Budgets**:
- Higher than individual request budgets
- Configurable per agent instance
- Real-time consumption visibility

### 3.3 Cursor IDE Integration

**Status Bar Display**:
- Format: "Tokens: 1,234 / 5,000 (24%)"
- Real-time updates
- Color-coded warnings (yellow at 50%, red at 80%)

**IDE Features**:
- Suggest code-level optimizations
- Display token consumption summary after task
- Include token data in error diagnostics
- No impact on IDE responsiveness

### 3.4 gabrieltoth.com Integration

**Request Tracking**:
- Track all API requests
- Monitor token consumption per endpoint
- Enforce request-level budgets
- Generate usage reports

## 4. Visualization Layer (Graphify)

### 4.1 Technology Choice: uPlot

**Rationale**:
- **Performance**: Handles 100K+ data points efficiently (vs Chart.js which struggles >10K)
- **Bundle Size**: ~15KB gzipped (vs Chart.js ~40KB)
- **Rendering**: Canvas-based, optimized for large datasets
- **Interactivity**: Smooth zooming, panning, tooltips
- **Suitable for**: Millions of token records with real-time updates

### 4.2 Dashboard Views

**Time Windows**:
- 24 hours (default: hourly buckets)
- 7 days (default: daily buckets)
- 30 days (daily buckets)
- 90 days (weekly buckets)
- All-time (monthly buckets)

**Visualizations**:
1. **Total Tokens Over Time**: Line chart with area fill
2. **Tokens by Agent Type**: Stacked area chart
3. **Tokens by Request Type**: Horizontal bar chart
4. **Tokens by Optimization Strategy**: Pie chart
5. **Cost Trends**: Line chart (USD and BRL)
6. **Anomalies**: Scatter plot with highlighted outliers

**Interactive Features**:
- Hover tooltips with detailed data
- Click to drill down into specific time periods
- Filter by agent type, request type, model
- Export as PNG, CSV, JSON

### 4.3 CLI Commands

```bash
# Display stats in table format
token-killer stats [--days 7] [--format json|csv|table]

# Export data
token-killer export [--format json|csv|pdf] [--output file.csv]

# View current budget status
token-killer budget status

# Configure strategies
token-killer strategy list
token-killer strategy enable <strategy-id>
token-killer strategy disable <strategy-id>
token-killer strategy configure <strategy-id> --param key=value
```

## 5. Obsidian Integration

**Sync Direction**: Unidirectional (Token Killer → Obsidian)

**Folder Structure**:
```
Token-Killer/
├── Strategies/
│   ├── context-pruning.md
│   ├── response-compression.md
│   └── ...
├── Reports/
│   ├── daily-summary.md
│   ├── weekly-analysis.md
│   └── ...
├── Logs/
│   ├── optimization-log.md
│   └── ...
├── Analytics/
│   ├── consumption-patterns.md
│   ├── anomalies.md
│   └── ...
└── Archive/
    └── [old reports and logs]
```

**Sync Trigger**: Manual via "Export to Obsidian" button or command

**Metadata Included**:
- created_date
- last_modified
- author
- data_range (for reports)
- filters_applied

**Editability**: Full - users can improve notes manually

**Conflict Prevention**: Lock during sync operation

## 6. Data Flow Diagrams

### 6.1 Request Processing Flow

```
User Request
    ↓
[Middleware] Intercept Request
    ↓
[Token Tracker] Count Input Tokens
    ↓
[Budget Manager] Check Budget (50%, 80%, 100%+)
    ↓
[Strategy Manager] Apply Optimization Strategies (dry-run)
    ↓
Send to LLM
    ↓
[Token Tracker] Count Output Tokens
    ↓
[Response Compressor] Compress Response (if enabled)
    ↓
[Budget Manager] Update Budget Usage
    ↓
[Analytics Engine] Record Metrics
    ↓
[SQLite] Store Token Record
    ↓
Return Response to User
```

### 6.2 Task Execution Flow

```
Task Start
    ↓
[Budget Manager] Initialize Task Budget
    ↓
Request 1 → [Token Tracker] → [Budget Manager] → [SQLite]
    ↓
Request 2 → [Token Tracker] → [Budget Manager] → [SQLite]
    ↓
... (multiple requests)
    ↓
Task Complete
    ↓
[Analytics Engine] Aggregate Task Tokens
    ↓
[Budget Manager] Compare Against Budget
    ↓
Generate Task Summary Report
    ↓
[SQLite] Store Task Record
```

## 7. Performance Considerations

### 7.1 Token Tracking Overhead

**Target**: < 5% latency increase

**Optimization Strategies**:
- Async token counting (non-blocking)
- Batch database writes (every 10 records or 5 seconds)
- In-memory cache for pricing data
- Lazy-load analytics (on-demand)

### 7.2 Storage Optimization

**SQLite Indexing**:
```sql
CREATE INDEX idx_token_records_timestamp ON token_records(timestamp);
CREATE INDEX idx_token_records_taskId ON token_records(taskId);
CREATE INDEX idx_token_records_agentType ON token_records(agentType);
CREATE INDEX idx_token_records_model ON token_records(model);
```

**Archival Strategy**:
- Archive data >30 days old
- Compress using gzip (default) or brotli
- Maintain queryable interface for archived data

### 7.3 Visualization Performance

**uPlot Optimization**:
- Aggregate data into buckets (hourly, daily, weekly, monthly)
- Lazy-load historical data
- Virtual scrolling for large datasets
- Canvas rendering for efficiency

## 8. Error Handling & Resilience

### 8.1 Tokenizer Failures

**Fallback Chain**:
1. Try provider-specific tokenizer
2. Fall back to approximate counting (4 chars ≈ 1 token)
3. Log error for debugging
4. Continue processing (non-blocking)

### 8.2 Pricing Data Unavailable

**Fallback Chain**:
1. Use cached pricing (24-hour cache)
2. Use user-configured values
3. Prompt user weekly to verify/update
4. Use conservative estimates (round up)

### 8.3 Database Failures

**Resilience**:
- In-memory buffer for token records (max 1000 records)
- Retry writes with exponential backoff
- Alert user if storage unavailable
- Continue tracking (data not lost)

### 8.4 Budget Enforcement

**Non-Blocking Design**:
- Warnings only (no hard blocks)
- Requests always complete
- Log all budget events
- Allow admin overrides

## 9. Security Considerations

### 9.1 Data Privacy

- All token data stored locally (SQLite)
- No automatic Supabase requests
- Optional manual export only
- User controls data retention

### 9.2 Access Control

- Budget overrides require authentication
- Admin-only strategy configuration
- Audit logging for all changes

### 9.3 Pricing Data

- Fetch from official provider APIs only
- Validate pricing before caching
- User can override with custom values

## 10. Deployment Architecture

### 10.1 Local Development

- SQLite database in project root or `.kiro/data/`
- No external dependencies required
- Works offline

### 10.2 Production Deployment

- SQLite database in persistent storage
- Auto-archival enabled
- Monitoring and alerting for storage usage
- Regular backups of SQLite database

### 10.3 Multi-Environment Support

- Same codebase for development and production
- Environment-specific configuration (pricing, budgets)
- Transparent operation across environments
