# Token Killer - Requirements Document

## Introduction

Token Killer is a comprehensive token optimization and management system designed to reduce token consumption per request and task across the gabrieltoth.com project, Antigravity agents, and Cursor integration. The system provides real-time token tracking, intelligent optimization strategies, visualization of token usage patterns through Graphify, and integration with Obsidian for documentation and management. Token budgeting at both request and task levels ensures predictable resource consumption and cost control.

## Glossary

- **Token**: A unit of text processing used by language models (typically 4 characters ≈ 1 token)
- **Token_Budget**: A predefined maximum number of tokens allowed for a specific request or task
- **Token_Tracker**: The system component responsible for monitoring and recording token consumption
- **Context_Pruning**: The process of removing unnecessary context to reduce token count
- **Response_Compression**: Techniques to reduce response size while maintaining information value
- **Graphify**: Visualization component that displays token usage patterns and trends
- **Obsidian_Integration**: Connection to Obsidian for managing token optimization documentation
- **Request_Context**: The input data, system prompts, and conversation history for a single request
- **Task_Context**: The accumulated context across multiple requests within a task execution
- **Token_Optimization_Strategy**: A specific technique or algorithm for reducing token consumption
- **Antigravity_Agent**: External agent system that integrates with Token Killer
- **Cursor_Agent**: IDE-based agent that integrates with Token Killer
- **gabrieltoth.com**: The primary project where Token Killer is implemented

## Requirements

### Requirement 1: Token Tracking and Monitoring with Multi-Model Support

**User Story:** As a developer, I want to track token consumption across all requests and tasks with accurate counting for multiple LLM providers, so that I can understand where tokens are being used and identify optimization opportunities.

#### Acceptance Criteria

1. WHEN a request is processed, THE Token_Tracker SHALL use proper tokenizer libraries (tiktoken for OpenAI, transformers for Hugging Face models, claude-tokenizer for Anthropic) to count tokens accurately
2. WHEN token counting is performed, THE Token_Tracker SHALL NOT rely on LLM-reported token counts - always use independent tokenizer verification
3. WHEN a request completes, THE Token_Tracker SHALL record: input_tokens, output_tokens, total_tokens, model_used, timestamp, request_id, task_id, agent_type
4. WHEN token consumption is recorded, THE Token_Tracker SHALL include cost estimates based on current model pricing
5. WHEN a task is executed, THE Token_Tracker SHALL aggregate token consumption across all requests within that task
6. WHEN tracking is enabled, THE Token_Tracker SHALL have minimal performance overhead (< 5% latency increase)
7. WHILE a task is executing, THE Token_Tracker SHALL update running totals accessible to the task executor
8. WHEN a message is sent by the user, THE System SHALL generate a comprehensive token report showing: input tokens, input cost, output tokens, output cost, total cost in USD and BRL
9. WHEN supported models are queried, THE System SHALL support (in priority order): Claude Haiku 4.5 (primary), Gemini Flash 3.1 (secondary), Cursor Composer 2.0 (tertiary)
10. WHEN pricing data is needed, THE System SHALL fetch public pricing from provider APIs, with fallback to user-configured values
11. WHEN pricing is not available, THE System SHALL prompt user weekly to verify or update pricing per 1M tokens (input/output) for each model
12. WHEN currency conversion is needed, THE System SHALL support USD (default) and BRL with configurable exchange rate

#### Correctness Properties

1. **Invariant**: Total task tokens = sum of all request tokens within that task
2. **Invariant**: Token count is always non-negative
3. **Invariant**: Token count never decreases during a request
4. **Invariant**: Tokenizer-counted tokens match actual token consumption
5. **Invariant**: Cost calculations are consistent across all models
6. **Round-trip**: Recorded tokens can be retrieved and match original recorded value
7. **Idempotence**: Recording the same token consumption twice should not double-count

---

### Requirement 2: Per-Request Token Budgeting

**User Story:** As a system administrator, I want to set token budgets for individual requests with strong warnings instead of hard blocks, so that I can prevent runaway token consumption while maintaining usability on free tier.

#### Acceptance Criteria

1. WHEN a request is initiated, THE Budget_Manager SHALL check if a token budget is defined for that request type
2. IF a token budget is defined, THEN THE Budget_Manager SHALL track consumption against the limit
3. WHEN a request approaches its budget (50% consumed), THE Budget_Manager SHALL emit a YELLOW warning with current consumption and projected total
4. WHEN a request approaches its budget (80% consumed), THE Budget_Manager SHALL emit a RED warning with urgent notification
5. WHEN a request exceeds its budget, THE Budget_Manager SHALL emit a CRITICAL warning but ALLOW the request to complete (no 429 blocking)
6. WHEN a budget is exceeded, THE System SHALL log the event with request details for audit purposes
7. WHILE a request is executing, THE Budget_Manager SHALL provide real-time budget consumption to the request handler
8. WHERE budget overrides are needed, THE Budget_Manager SHALL allow authenticated administrators to adjust limits

#### Correctness Properties

1. **Invariant**: Budget warnings are always emitted before consumption exceeds budget
2. **Invariant**: Budget enforcement is consistent across all request types
3. **Invariant**: Requests are never blocked due to budget (warnings only)
4. **Round-trip**: Budget limits can be set and retrieved without modification
5. **Idempotence**: Setting the same budget multiple times produces the same result

---

### Requirement 3: Per-Task Token Budgeting

**User Story:** As a task executor, I want to allocate token budgets to entire tasks with strong warnings instead of hard blocks, so that I can manage token consumption across multi-step workflows without interrupting execution.

#### Acceptance Criteria

1. WHEN a task is created, THE Task_Budget_Manager SHALL allow allocation of a total token budget for the entire task
2. WHEN a task is executing, THE Task_Budget_Manager SHALL track cumulative token consumption across all requests
3. IF cumulative tokens approach the task budget (50% consumed), THEN THE Task_Budget_Manager SHALL emit a YELLOW warning to the task executor
4. IF cumulative tokens approach the task budget (80% consumed), THEN THE Task_Budget_Manager SHALL emit a RED warning with detailed breakdown
5. IF cumulative tokens exceed the task budget, THEN THE Task_Budget_Manager SHALL emit a CRITICAL warning but ALLOW task continuation (no pause/block)
6. WHEN a task completes, THE Task_Budget_Manager SHALL record the final token consumption and compare against budget
7. WHERE task budgets are exceeded, THE System SHALL generate a detailed report of token consumption by request
8. WHILE a task is executing, THE Task_Budget_Manager SHALL provide real-time budget status to monitoring systems

#### Correctness Properties

1. **Invariant**: Task budget >= sum of all request budgets within that task
2. **Invariant**: Task token consumption is tracked accurately without blocking
3. **Invariant**: Budget warnings are always emitted before consumption exceeds budget
4. **Round-trip**: Task budgets can be set, modified, and retrieved accurately
5. **Metamorphic**: If a task is split into two subtasks, total budget should equal sum of subtask budgets

---

### Requirement 4: Context Pruning Strategy with Preserve List

**User Story:** As an optimization system, I want to intelligently remove unnecessary context from requests with configurable safety levels, so that I can reduce token consumption without losing critical information.

#### Acceptance Criteria

1. WHEN context pruning is enabled, THE Pruner SHALL analyze request context and identify non-essential elements in priority order: old conversations (>8-10 turns), duplicate messages, unnecessary metadata, old few-shot examples, conversation summaries
2. WHEN analyzing context, THE Pruner SHALL preserve: system prompts, current user query, critical instructions marked with <critical> tags, active task context
3. WHEN pruning context, THE Pruner SHALL reduce token count by at least 15% without degrading response quality
4. WHERE context pruning is applied, THE System SHALL log which elements were removed for audit purposes
5. WHILE pruning is in progress, THE Pruner SHALL maintain semantic coherence of remaining context
6. IF critical context would be removed, THEN THE Pruner SHALL preserve it and log a warning
7. WHEN auto-pruning is enabled (default), THE System SHALL apply pruning automatically to all requests
8. WHEN dry-run mode is enabled, THE System SHALL show estimated token savings (e.g., "-1,847 tokens (-34%)") before applying pruning
9. WHEN a request is made, THE System SHALL provide a toggle to disable auto-pruning for that specific request

#### Correctness Properties

1. **Invariant**: System prompt is never pruned
2. **Invariant**: Current user query is never pruned
3. **Invariant**: Critical instructions (marked with <critical>) are never pruned
4. **Invariant**: Active task context is never pruned
5. **Invariant**: Pruned context size < original context size
6. **Round-trip**: Pruning decisions are deterministic (same input produces same pruning)
7. **Idempotence**: Applying pruning twice produces same result as applying once

---

### Requirement 5: Response Compression Strategy with Protected Content Types

**User Story:** As an optimization system, I want to compress responses to reduce token consumption while protecting critical content types, so that I can deliver information efficiently without sacrificing code quality or data integrity.

#### Acceptance Criteria

1. WHEN response compression is enabled (default), THE Compressor SHALL analyze response content and apply compression techniques
2. WHEN compressing responses, THE Compressor SHALL use: abbreviations, bullet points, structured formatting, removal of redundant explanations
3. WHEN a response is compressed, THE Compressor SHALL reduce token count by at least 20% while preserving information value
4. WHERE compression is applied, THE System SHALL maintain readability and clarity of the response
5. WHEN compression is applied, THE System SHALL include metadata indicating compression was used
6. IF compression would significantly reduce clarity, THEN THE System SHALL skip compression and log the decision
7. WHILE compression is in progress, THE Compressor SHALL ensure all critical information is retained
8. WHEN content types are evaluated, THE System SHALL NEVER compress: code blocks (```), JSON/YAML/structured data, tables, step-by-step reasoning (Chain of Thought), creative or tone-specific responses
9. WHEN a compressed response is returned, THE System SHALL provide a flag (?original=true or header) to retrieve the uncompressed version
10. WHEN the user requests original, THE System SHALL return the full uncompressed response with token count comparison

#### Correctness Properties

1. **Invariant**: Compressed response contains all critical information from original
2. **Invariant**: Compressed response token count < original response token count
3. **Invariant**: Code blocks are never compressed
4. **Invariant**: Structured data (JSON/YAML/tables) is never compressed
5. **Round-trip**: Compression decisions are deterministic
6. **Idempotence**: Applying compression twice produces same result as applying once

---

### Requirement 6: Token Usage Visualization (Graphify) with Multiple Formats

**User Story:** As a developer, I want to visualize token usage patterns and trends through web dashboard and CLI, so that I can identify optimization opportunities and understand consumption patterns.

#### Acceptance Criteria

1. WHEN Graphify is accessed via web, THE Visualizer SHALL display token consumption over time with views: 24h, 7 days (default), 30 days, 90 days, all-time
2. WHEN displaying token data, THE Visualizer SHALL show: total tokens consumed, tokens by agent type, tokens by request type, tokens by optimization strategy
3. WHEN visualizing data, THE Visualizer SHALL render interactive charts using lightweight library (Chart.js or uPlot)
4. WHERE historical data is available, THE Visualizer SHALL display trends and anomalies
5. WHEN an anomaly is detected (consumption > 2 standard deviations), THE Visualizer SHALL highlight it and provide context
6. WHILE data is being loaded, THE Visualizer SHALL show loading indicators and estimated completion time
7. IF data is unavailable, THEN THE Visualizer SHALL display a clear error message with troubleshooting steps
8. WHEN CLI is used, THE System SHALL support command: token-killer stats [--days 7] [--format json|csv|table]
9. WHEN export is requested, THE System SHALL support: PNG of charts, CSV of raw data, PDF is optional
10. WHEN data is exported, THE System SHALL include metadata (generated_date, data_range, filters_applied)

#### Correctness Properties

1. **Invariant**: Visualized totals match database totals
2. **Invariant**: All time windows show consistent data
3. **Round-trip**: Data can be exported and re-imported without loss
4. **Idempotence**: Refreshing the visualization produces same result
5. **Metamorphic**: Sum of parts (by agent type) equals total

---

### Requirement 7: Obsidian Integration with Unidirectional Sync

**User Story:** As a developer, I want to manage token optimization documentation and strategies in Obsidian, so that I can maintain a centralized knowledge base with structured organization.

#### Acceptance Criteria

1. WHEN Obsidian integration is enabled, THE Integration SHALL support manual trigger via "Export to Obsidian" button or command
2. WHEN syncing occurs, THE Integration SHALL create folder structure: Token-Killer/ → Strategies/, Reports/, Logs/, Analytics/, Archive/
3. WHEN a new optimization strategy is created, THE Integration SHALL create a corresponding Obsidian note in Strategies/ folder
4. WHEN syncing occurs, THE Integration SHALL be unidirectional (Token Killer → Obsidian) to avoid conflicts
5. WHEN documentation is synced, THE Integration SHALL include metadata (created_date, last_modified, author)
6. WHEN Obsidian notes are edited, THE Integration SHALL allow full editability - user can improve notes manually
7. WHEN sync is triggered, THE Integration SHALL prevent conflicting updates during the sync operation
8. WHEN auto-sync is enabled (optional), THE Integration SHALL sync bidirectionally with conflict resolution
9. WHERE conflicts occur during bidirectional sync, THE Integration SHALL preserve both versions and flag for manual review

#### Correctness Properties

1. **Invariant**: Obsidian folder structure is consistent
2. **Invariant**: Metadata is always included in exported notes
3. **Round-trip**: Data can be exported to Obsidian and manually edited
4. **Idempotence**: Syncing multiple times produces same result
5. **Confluence**: Sync order doesn't affect final state (commutative)

---

### Requirement 8: Antigravity Agent Integration with Real-Time Tracking

**User Story:** As an Antigravity agent, I want to integrate with Token Killer, so that I can optimize token consumption in my workflows with automatic tracking and real-time updates.

#### Acceptance Criteria

1. WHEN an Antigravity agent initiates a request, THE Integration SHALL automatically track token consumption via middleware
2. WHEN the agent completes a task, THE Integration SHALL provide token consumption summary with breakdown by request
3. WHEN token budget is exceeded, THE Integration SHALL notify the agent and provide optimization recommendations
4. WHERE optimization strategies are available, THE Integration SHALL suggest applicable strategies to the agent
5. WHEN the agent requests optimization, THE Integration SHALL apply selected strategies and report token savings
6. WHILE the agent is executing, THE Integration SHALL provide real-time token consumption updates (every N requests or X% of budget)
7. IF the agent encounters errors, THEN THE Integration SHALL include token consumption data in error reports
8. WHEN agent budgets are configured, THE System SHALL allow agent-specific budgets (typically higher than individual request budgets)
9. WHEN tracking is active, THE Integration SHALL maintain transparency - agent operations are not impacted by tracking overhead

#### Correctness Properties

1. **Invariant**: Token tracking is transparent to the agent
2. **Invariant**: Agent-specific budgets are enforced consistently
3. **Round-trip**: Agent can retrieve its own token consumption history
4. **Idempotence**: Multiple integration calls produce consistent results

---

### Requirement 9: Cursor Agent Integration with IDE Status Display

**User Story:** As a Cursor agent, I want to integrate with Token Killer, so that I can optimize token consumption in IDE-based workflows with real-time status visibility.

#### Acceptance Criteria

1. WHEN Cursor agent initiates a request, THE Integration SHALL automatically track token consumption via middleware
2. WHEN the agent completes a task, THE Integration SHALL provide token consumption summary in the IDE
3. WHEN token budget is exceeded, THE Integration SHALL display a warning in the IDE status bar
4. WHERE optimization is needed, THE Integration SHALL suggest code-level optimizations to reduce tokens
5. WHEN the agent requests optimization, THE Integration SHALL apply strategies and report token savings
6. WHILE the agent is executing, THE Integration SHALL display real-time token consumption in the IDE status bar (format: "Tokens: 1,234 / 5,000 (24%)")
7. IF the agent encounters errors, THEN THE Integration SHALL include token consumption data in error diagnostics
8. WHEN agent budgets are configured, THE System SHALL allow agent-specific budgets (typically higher than individual request budgets)
9. WHEN tracking is active, THE Integration SHALL not impact IDE responsiveness or performance

#### Correctness Properties

1. **Invariant**: Token tracking doesn't impact IDE responsiveness
2. **Invariant**: Status bar updates are real-time and accurate
3. **Round-trip**: Agent can retrieve its own token consumption history
4. **Idempotence**: Multiple integration calls produce consistent results

---

### Requirement 10: Token Optimization Recommendations

**User Story:** As a developer, I want to receive recommendations for optimizing token consumption, so that I can improve efficiency.

#### Acceptance Criteria

1. WHEN token consumption is analyzed, THE Recommender SHALL identify optimization opportunities
2. WHEN analyzing consumption, THE Recommender SHALL compare against baseline and identify outliers
3. WHEN recommendations are generated, THE Recommender SHALL prioritize by potential token savings
4. WHERE multiple strategies apply, THE Recommender SHALL suggest the most effective combination
5. WHEN a recommendation is implemented, THE Recommender SHALL track the impact and update effectiveness scores
6. WHILE recommendations are being generated, THE Recommender SHALL provide estimated token savings
7. IF a recommendation is rejected, THEN THE Recommender SHALL log the reason and adjust future recommendations

#### Correctness Properties

1. **Invariant**: Recommended strategies are applicable to the current context
2. **Round-trip**: Recommendations can be saved and retrieved
3. **Idempotence**: Generating recommendations multiple times produces consistent results
4. **Metamorphic**: Total potential savings = sum of individual strategy savings

---

### Requirement 11: Token Consumption Reporting

**User Story:** As a project manager, I want to generate reports on token consumption, so that I can track costs and identify trends.

#### Acceptance Criteria

1. WHEN a report is requested, THE Reporter SHALL generate comprehensive token consumption data
2. WHEN generating reports, THE Reporter SHALL include: total tokens, tokens by agent, tokens by request type, cost estimates
3. WHEN a report is generated, THE Reporter SHALL support multiple formats (JSON, CSV, PDF)
4. WHERE historical data is available, THE Reporter SHALL include trend analysis and forecasting
5. WHEN a report is exported, THE Reporter SHALL include metadata (generated_date, data_range, filters_applied)
6. WHILE report generation is in progress, THE Reporter SHALL show progress and estimated completion time
7. IF data is incomplete, THEN THE Reporter SHALL note gaps and provide available data with caveats

#### Correctness Properties

1. **Invariant**: Report totals match database totals
2. **Round-trip**: Exported data can be re-imported without loss
3. **Idempotence**: Generating same report multiple times produces identical results

---

### Requirement 12: Local-Only Token Storage with SQLite and Auto-Archival

**User Story:** As a developer, I want token consumption data stored locally only with automatic archival, so that I don't exhaust free tier Supabase limits and maintain efficient local storage.

#### Acceptance Criteria

1. WHEN token consumption is recorded, THE System SHALL store data in local SQLite database only
2. WHEN the system starts, THE System SHALL initialize local SQLite database if it doesn't exist
3. WHEN data is queried, THE System SHALL read from local storage exclusively - NEVER from Supabase for token tracking
4. WHERE historical data is needed, THE System SHALL query local storage for all analytics and reporting
5. WHEN local storage reaches 500MB, THE System SHALL emit a warning to the user
6. WHEN local storage reaches 1GB, THE System SHALL automatically trigger archival process
7. WHEN archival is triggered, THE System SHALL compress old data (>30 days) using gzip or brotli and move to archive/ folder
8. WHILE the system is running, THE System SHALL NOT make any automatic requests to Supabase for token tracking data
9. IF the user explicitly requests export, THE System SHALL allow export to Supabase or external formats (JSON, CSV) as optional manual operation
10. WHEN the system is deployed, THE System SHALL work with local storage in both development and production environments
11. WHEN archived data is needed, THE System SHALL decompress and query transparently without user intervention

#### Correctness Properties

1. **Invariant**: All token tracking data is stored locally only
2. **Invariant**: No automatic Supabase requests are made for token data
3. **Invariant**: Local storage remains consistent and queryable
4. **Invariant**: Archived data can be restored and queried
5. **Round-trip**: Data can be exported and re-imported without loss
6. **Idempotence**: Multiple storage operations produce consistent state

---

### Requirement 13: Kiro Workflow Integration

**User Story:** As a Kiro user, I want Token Killer to integrate with existing Kiro workflows, so that I can optimize tokens in my spec creation and task execution.

#### Acceptance Criteria

1. WHEN a Kiro workflow is executed, THE Integration SHALL automatically track token consumption
2. WHEN a spec is created, THE Integration SHALL provide token consumption summary
3. WHEN tasks are executed, THE Integration SHALL track tokens per task and per step
4. WHERE token budgets are defined, THE Integration SHALL enforce them during workflow execution
5. WHEN optimization is needed, THE Integration SHALL suggest workflow modifications to reduce tokens
6. WHILE a workflow is executing, THE Integration SHALL provide real-time token consumption
7. IF a workflow exceeds token budget, THEN THE Integration SHALL pause and request approval to continue

#### Correctness Properties

1. **Invariant**: Token tracking is transparent to Kiro workflows
2. **Round-trip**: Workflow token consumption can be retrieved and analyzed
3. **Idempotence**: Multiple workflow executions with same inputs produce consistent token consumption

---

### Requirement 14: Token Consumption Analytics

**User Story:** As a data analyst, I want to analyze token consumption patterns, so that I can identify optimization opportunities and predict future consumption.

#### Acceptance Criteria

1. WHEN analytics are requested, THE Analyzer SHALL compute consumption statistics (mean, median, std dev, percentiles)
2. WHEN analyzing data, THE Analyzer SHALL identify patterns by: time of day, day of week, agent type, request type
3. WHEN patterns are identified, THE Analyzer SHALL detect anomalies and unusual consumption
4. WHERE sufficient historical data exists, THE Analyzer SHALL forecast future consumption
5. WHEN forecasting, THE Analyzer SHALL provide confidence intervals for predictions
6. WHILE analysis is in progress, THE Analyzer SHALL show progress and estimated completion time
7. IF data is insufficient, THEN THE Analyzer SHALL indicate minimum data requirements and current status

#### Correctness Properties

1. **Invariant**: Analytics totals match raw data totals
2. **Round-trip**: Analytics can be exported and re-imported
3. **Idempotence**: Analyzing same data multiple times produces identical results
4. **Metamorphic**: Sum of parts (by category) equals total

---

### Requirement 15: Token Optimization Strategy Management with Dry-Run Mode

**User Story:** As a system administrator, I want to manage token optimization strategies with dry-run capability, so that I can enable, disable, and configure optimization techniques with visibility into impact before applying.

#### Acceptance Criteria

1. WHEN strategies are managed, THE Manager SHALL support: enable/disable, configure parameters, set priority
2. WHEN a strategy is enabled, THE Manager SHALL apply it to new requests automatically
3. WHEN a strategy is disabled, THE Manager SHALL stop applying it to new requests
4. WHERE strategy parameters are configurable, THE Manager SHALL validate parameters before applying
5. WHEN strategy effectiveness is measured, THE Manager SHALL track token savings and quality impact
6. WHILE strategies are being applied, THE Manager SHALL log which strategies were used
7. IF a strategy causes quality degradation, THEN THE Manager SHALL disable it and alert administrators
8. WHEN dry-run mode is enabled, THE System SHALL show estimated token savings (e.g., "-1,847 tokens (-34%)") before applying
9. WHEN strategies are applied in sequence, THE System SHALL follow priority order: Context Pruning → Response Compression → Prompt Optimization → Caching → Model Routing
10. WHEN multiple strategies apply, THE System SHALL suggest the most effective combination with cumulative savings estimate

#### Correctness Properties

1. **Invariant**: Only enabled strategies are applied
2. **Invariant**: Strategy parameters are always valid
3. **Invariant**: Dry-run estimates are accurate within 5% of actual savings
4. **Round-trip**: Strategies can be saved and retrieved
5. **Idempotence**: Applying same strategy configuration multiple times produces consistent results

