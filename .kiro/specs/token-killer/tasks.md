# Implementation Plan: Token Killer

## Overview

Token Killer is a comprehensive token optimization and management system that tracks, analyzes, and optimizes token consumption across multiple LLM providers. The implementation follows a layered architecture: core infrastructure (SQLite, tokenizers), token tracking with multi-model support, budget management with warning system, optimization strategies, integrations with external systems, and visualization through web dashboard and CLI.

The implementation is organized into logical phases that build incrementally, with each phase validated through unit tests and property-based tests before moving to the next phase.

---

## Tasks

### Phase 1: Core Infrastructure Setup

- [x] 1. Set up project structure and core dependencies
  - Create directory structure: `src/core/`, `src/tracker/`, `src/budget/`, `src/optimizer/`, `src/storage/`, `src/integrations/`, `src/visualization/`
  - Install dependencies: `sqlite3`, `tiktoken`, `transformers`, `claude-tokenizer`, `chart.js`, `commander`
  - Create TypeScript configuration and build setup
  - Set up testing framework (Jest with TypeScript support)
  - _Requirements: 1.1, 12.1_

- [x] 2. Initialize SQLite database and schema
  - Create database initialization module with schema creation
  - Implement database connection pooling
  - Create migration system for schema updates
  - Set up database error handling and recovery
  - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 2.1 Write property test for database consistency
    - **Property 9: Local Storage Exclusivity**
    - **Validates: Requirements 12.1, 12.3, 12.8**

  - [ ]* 2.2 Write unit tests for database operations
    - Test CRUD operations on all tables
    - Test connection pooling
    - Test error handling

### Phase 2: Token Tracking Implementation

- [x] 3. Implement multi-model tokenizer integration
  - Create tokenizer factory that selects appropriate library based on model type
  - **Priority 1**: Implement claude-tokenizer integration for Claude Haiku 4.5 (primary)
  - **Priority 2**: Implement Google tokenizer for Gemini Flash 3.1 (secondary)
  - **Priority 3**: Implement Cursor Composer 2.0 tokenizer (tertiary)
  - Create fallback token counting (text length / 4) for unsupported models
  - _Requirements: 1.1, 1.2, 1.9_

  - [ ]* 3.1 Write property test for token count consistency
    - **Property 1: Token Count Consistency**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 3.2 Write unit tests for each tokenizer
    - Test consistency across multiple invocations
    - Test edge cases (empty strings, special characters, very long text)
    - Test tokenizer selection based on model type

- [x] 4. Implement token recording and aggregation
  - Create TokenRecord interface and storage layer
  - Implement token recording with metadata (request_id, task_id, agent_type, timestamp)
  - Implement task-level token aggregation
  - Create running total calculation for active tasks
  - _Requirements: 1.3, 1.5, 1.7_

  - [ ]* 4.1 Write property test for task token aggregation
    - **Property 2: Task Token Aggregation**
    - **Validates: Requirements 1.5, 3.1**

  - [ ]* 4.2 Write unit tests for token recording
    - Test recording with all metadata fields
    - Test aggregation accuracy
    - Test running total updates

- [x] 5. Implement cost calculation and currency conversion
  - Create pricing configuration system (fetch from provider APIs with fallback)
  - Implement cost calculation: (input_tokens × input_price) + (output_tokens × output_price)
  - Implement USD/BRL currency conversion with configurable exchange rate
  - Create pricing update mechanism with weekly user prompts
  - _Requirements: 1.4, 1.10, 1.11, 1.12_

  - [ ]* 5.1 Write property test for cost calculation accuracy
    - **Property 4: Cost Calculation Accuracy**
    - **Validates: Requirements 1.4, 1.12**

  - [ ]* 5.2 Write unit tests for cost calculations
    - Test cost calculation for each supported model
    - Test currency conversion accuracy
    - Test pricing fallback mechanism

- [x] 6. Implement token report generation
  - Create comprehensive token report with input/output tokens, costs in USD and BRL
  - Implement per-request token reports
  - Implement per-task token reports with breakdown by request
  - Create report formatting for display and export
  - _Requirements: 1.8, 11.1, 11.2_

  - [ ]* 6.1 Write unit tests for report generation
    - Test report accuracy and completeness
    - Test formatting for different output types

- [x] 7. Checkpoint - Ensure all token tracking tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Budget Management Implementation

- [x] 8. Implement per-request budget management
  - Create BudgetConfig interface and storage
  - Implement budget creation and retrieval
  - Implement consumption tracking against budget
  - Create warning emission at 50% (YELLOW), 80% (RED), >100% (CRITICAL)
  - Implement budget override functionality for administrators
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8_

  - [ ]* 8.1 Write property test for budget warning emission
    - **Property 3: Budget Warning Emission**
    - **Validates: Requirements 2.3, 2.4, 2.5**

  - [ ]* 8.2 Write unit tests for per-request budgets
    - Test budget creation and retrieval
    - Test warning emission at correct thresholds
    - Test budget override functionality
    - Test audit logging

- [x] 9. Implement per-task budget management
  - Create task budget allocation and tracking
  - Implement cumulative token consumption tracking across all requests in a task
  - Implement warning emission at 50% (YELLOW), 80% (RED), >100% (CRITICAL)
  - Create detailed breakdown reports for task budget overages
  - Implement real-time budget status for monitoring systems
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 9.1 Write property test for task budget tracking
    - **Property 13: Budget Non-Blocking**
    - **Validates: Requirements 2.5, 3.5**

  - [ ]* 9.2 Write unit tests for per-task budgets
    - Test task budget allocation
    - Test cumulative consumption tracking
    - Test warning emission
    - Test real-time status updates

- [x] 10. Implement budget audit logging
  - Create audit log storage for budget events
  - Log all budget threshold crossings with context
  - Log budget overrides with administrator information
  - Create audit report generation
  - _Requirements: 2.6, 3.6_

  - [ ]* 10.1 Write unit tests for audit logging
    - Test audit log creation and retrieval
    - Test audit report generation

- [x] 11. Checkpoint - Ensure all budget management tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Optimization Strategies Implementation

- [x] 12. Implement context pruning strategy
  - Create context analyzer to identify non-essential elements
  - Implement removal of old conversations (>8-10 turns)
  - Implement duplicate message detection and removal
  - Implement unnecessary metadata removal
  - Create preserve list for system prompts, current queries, critical instructions (<critical> tags), active task context
  - Implement dry-run mode with estimated token savings
  - **Note**: Pruning effectiveness (15%+ reduction) will be validated through property-based tests with real content samples
  - _Requirements: 4.1, 4.2, 4.3, 4.8, 4.9_

  - [ ]* 12.1 Write property test for context preservation
    - **Property 5: Context Preservation**
    - **Validates: Requirements 4.2**

  - [ ]* 12.2 Write property test for pruning effectiveness
    - **Property 6: Pruning Effectiveness**
    - **Validates: Requirements 4.3**

  - [ ]* 12.3 Write unit tests for context pruning
    - Test preservation of critical elements
    - Test pruning effectiveness (≥15% reduction)
    - Test dry-run accuracy
    - Test semantic coherence

- [x] 13. Implement response compression strategy
  - Create response analyzer to identify compressible content
  - Implement abbreviation techniques
  - Implement bullet point conversion
  - Implement structured formatting
  - Create protected content types: code blocks, JSON/YAML, tables, Chain of Thought
  - Implement compression metadata tracking
  - Implement original response retrieval flag
  - **Note**: Compression effectiveness (20%+ reduction) will be validated through property-based tests with real content samples
  - _Requirements: 5.1, 5.2, 5.3, 5.8, 5.9, 5.10_

  - [ ]* 13.1 Write property test for protected content types
    - **Property 8: Protected Content Types**
    - **Validates: Requirements 5.8**

  - [ ]* 13.2 Write property test for compression effectiveness
    - **Property 7: Compression Effectiveness**
    - **Validates: Requirements 5.3**

  - [ ]* 13.3 Write unit tests for response compression
    - Test compression effectiveness (≥20% reduction)
    - Test protected content preservation
    - Test readability maintenance
    - Test original response retrieval

- [x] 14. Implement optimization strategy management
  - Create strategy registry with enable/disable functionality
  - Implement strategy priority ordering
  - Implement strategy parameter configuration and validation
  - Implement strategy effectiveness tracking
  - Create strategy execution in priority order: Context Pruning → Response Compression → Prompt Optimization → Caching → Model Routing
  - **Note**: Priority order can be adjusted based on effectiveness metrics - this is the recommended starting order
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.9_

  - [ ]* 14.1 Write property test for strategy execution order
    - **Property 12: Strategy Execution Order**
    - **Validates: Requirements 15.9**

  - [ ]* 14.2 Write unit tests for strategy management
    - Test strategy enable/disable
    - Test parameter validation
    - Test effectiveness tracking
    - Test execution order

- [x] 15. Implement optimization recommendations
  - Create consumption analyzer to identify optimization opportunities
  - Implement baseline comparison and outlier detection
  - Implement recommendation prioritization by potential savings
  - Implement strategy combination suggestions
  - Implement impact tracking for implemented recommendations
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 15.1 Write unit tests for recommendations
    - Test opportunity identification
    - Test prioritization accuracy
    - Test impact tracking

- [x] 16. Implement dry-run mode for optimization strategies
  - Create dry-run execution engine
  - Implement estimated token savings calculation
  - Implement accuracy validation (within 5% of actual)
  - Create dry-run result reporting
  - _Requirements: 4.8, 15.8_

  - [ ]* 16.1 Write property test for dry-run accuracy
    - **Property 11: Dry-Run Accuracy**
    - **Validates: Requirements 15.8**

  - [ ]* 16.2 Write unit tests for dry-run mode
    - Test estimated savings accuracy
    - Test result reporting

- [x] 17. Checkpoint - Ensure all optimization strategy tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Storage and Archival Implementation

- [x] 18. Implement local storage management
  - Create storage size monitoring
  - Implement warning at 500MB threshold
  - Implement automatic archival trigger at 1GB
  - Create data compression for records >30 days old
  - Implement archive folder management
  - **Note**: Works in both Node.js (server-side) and browser environments with appropriate SQLite adapters
  - _Requirements: 12.5, 12.6, 12.7, 12.11_

  - [ ]* 18.1 Write property test for archival trigger accuracy
    - **Property 10: Archival Trigger Accuracy**
    - **Validates: Requirements 12.6, 12.11**

  - [ ]* 18.2 Write unit tests for storage management
    - Test size monitoring
    - Test threshold warnings
    - Test archival triggering
    - Test compression and retrieval

- [x] 19. Implement data archival and compression
  - Create archival process for data >30 days old
  - Implement gzip/brotli compression
  - Create archive metadata tracking
  - Implement transparent decompression for queries
  - Create archive restoration functionality
  - _Requirements: 12.7, 12.11_

  - [ ]* 19.1 Write unit tests for archival
    - Test compression effectiveness
    - Test transparent decompression
    - Test archive restoration

- [x] 20. Implement storage consistency and recovery
  - Create database integrity checks
  - Implement recovery mechanisms for corrupted data
  - Create backup functionality
  - Implement storage consistency validation
  - _Requirements: 12.1, 12.3_

  - [ ]* 20.1 Write unit tests for storage recovery
    - Test integrity checks
    - Test recovery mechanisms
    - Test backup functionality

- [x] 21. Checkpoint - Ensure all storage tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Visualization and Reporting Implementation

- [x] 22. Implement web dashboard foundation
  - Create Express.js API endpoints for token data
  - Implement data aggregation endpoints (24h, 7d, 30d, 90d, all-time)
  - Create endpoints for token breakdown by agent type, request type, optimization strategy
  - Implement anomaly detection endpoint
  - Create error handling and data validation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 22.1 Write unit tests for API endpoints
    - Test data aggregation accuracy
    - Test anomaly detection
    - Test error handling

- [x] 23. Implement web dashboard frontend
  - Create React components for dashboard layout
  - **Technology**: uPlot (optimized for 100K+ data points, handles millions efficiently)
  - Implement uPlot integration for interactive charts with canvas rendering
  - Create time window selector (24h, 7d, 30d, 90d, all-time)
  - Implement real-time data updates with efficient aggregation
  - Create anomaly highlighting and context display
  - Implement loading indicators and error states
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 23.1 Write integration tests for dashboard
    - Test data loading and display
    - Test time window switching
    - Test anomaly highlighting
    - Test real-time updates

- [x] 24. Implement CLI reporting tool
  - Create CLI command: `token-killer stats [--days 7] [--format json|csv|table]`
  - Implement JSON output format
  - Implement CSV output format
  - Implement table output format with formatting
  - Create metadata inclusion (generated_date, data_range, filters_applied)
  - _Requirements: 6.8, 6.9, 6.10_

  - [ ]* 24.1 Write unit tests for CLI tool
    - Test command parsing
    - Test output formatting
    - Test metadata inclusion

- [x] 25. Implement comprehensive reporting
  - Create report generation with total tokens, tokens by agent, tokens by request type, cost estimates
  - Implement trend analysis and forecasting
  - Create multiple export formats (JSON, CSV, PDF)
  - Implement progress indication for long-running reports
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 25.1 Write unit tests for reporting
    - Test report accuracy
    - Test export formats
    - Test trend analysis

- [x] 26. Implement analytics and forecasting
  - Create consumption statistics (mean, median, std dev, percentiles)
  - Implement pattern identification by time of day, day of week, agent type, request type
  - Implement anomaly detection and highlighting
  - Create consumption forecasting with confidence intervals
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 26.1 Write unit tests for analytics
    - Test statistics calculation
    - Test pattern identification
    - Test forecasting accuracy

- [x] 27. Checkpoint - Ensure all visualization tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 7: Integration Implementation

- [ ] 28. Implement Antigravity agent integration
  - Create middleware for automatic token tracking
  - Implement agent-specific budget management
  - Create token consumption summary reporting
  - Implement optimization recommendation suggestions
  - Create real-time token consumption updates
  - Implement error reporting with token data
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [ ]* 28.1 Write integration tests for Antigravity
    - Test middleware integration
    - Test budget enforcement
    - Test real-time updates
    - Test error reporting

- [ ] 29. Implement Cursor IDE integration
  - Create middleware for automatic token tracking
  - Implement IDE status bar display (format: "Tokens: 1,234 / 5,000 (24%)")
  - Implement warning display in IDE
  - Create code-level optimization suggestions
  - Implement real-time status updates
  - Implement error diagnostics with token data
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [ ]* 29.1 Write integration tests for Cursor
    - Test middleware integration
    - Test status bar updates
    - Test warning display
    - Test optimization suggestions

- [ ] 30. Implement Kiro workflow integration
  - Create workflow token tracking
  - Implement spec creation token reporting
  - Implement per-task and per-step token tracking
  - Create budget enforcement during workflow execution
  - Implement workflow optimization suggestions
  - Create real-time token consumption display
  - **Note**: Read Kiro documentation to understand workflow hooks and middleware injection points
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [ ]* 30.1 Write integration tests for Kiro
    - Test workflow tracking
    - Test budget enforcement
    - Test real-time updates

- [ ] 31. Implement Obsidian unidirectional sync
  - Create folder structure: Token-Killer/ → Strategies/, Reports/, Logs/, Analytics/, Archive/
  - Implement strategy export to Obsidian notes
  - Implement report export with metadata
  - Implement analytics export
  - Create manual trigger via command/button
  - Implement conflict prevention during sync
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 31.1 Write integration tests for Obsidian
    - Test folder structure creation
    - Test strategy export
    - Test metadata inclusion
    - Test sync determinism

- [ ] 32. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 8: Advanced Features and Optimization

- [ ] 33. Implement prompt optimization strategy
  - Create prompt analyzer
  - Implement prompt clarity improvements
  - Implement redundancy removal
  - Create dry-run mode with estimated savings
  - _Requirements: 15.9_

  - [ ]* 33.1 Write unit tests for prompt optimization
    - Test clarity improvements
    - Test redundancy removal

- [ ] 34. Implement caching strategy
  - Create response cache with TTL
  - Implement cache key generation
  - Implement cache hit/miss tracking
  - Create dry-run mode with estimated savings
  - _Requirements: 15.9_

  - [ ]* 34.1 Write unit tests for caching
    - Test cache hit/miss
    - Test TTL enforcement

- [ ] 35. Implement model routing strategy
  - Create model cost/quality analysis
  - Implement cheaper model suggestions
  - Implement quality impact assessment
  - Create dry-run mode with estimated savings
  - _Requirements: 15.9_

  - [ ]* 35.1 Write unit tests for model routing
    - Test model suggestions
    - Test quality assessment

- [ ] 36. Implement advanced analytics
  - Create consumption prediction models
  - Implement trend forecasting
  - Create anomaly detection with machine learning
  - Implement cost optimization recommendations
  - _Requirements: 14.4, 14.5_

  - [ ]* 36.1 Write unit tests for advanced analytics
    - Test prediction accuracy
    - Test anomaly detection

- [ ] 37. Checkpoint - Ensure all advanced feature tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 9: Testing and Validation

- [ ] 38. Implement comprehensive integration tests
  - Create end-to-end test scenarios
  - Test multi-model token tracking
  - Test budget enforcement across all integrations
  - Test optimization pipeline with real content
  - Test storage and archival with large datasets
  - _Requirements: All_

  - [ ]* 38.1 Write integration tests for complete workflows
    - Test token tracking → budget management → optimization → reporting
    - Test multi-integration scenarios
    - Test error recovery

- [ ] 39. Implement performance tests
  - Test token tracking overhead (<5% latency increase)
  - Test storage query performance with 100K+ records
  - Test archival performance
  - Test optimization strategy performance
  - Test dashboard performance with large datasets
  - _Requirements: 1.6, 6.6_

  - [ ]* 39.1 Write performance benchmarks
    - Test tracking overhead
    - Test query performance
    - Test dashboard responsiveness

- [ ] 40. Implement security tests
  - Test data privacy (no sensitive data in logs)
  - Test local storage exclusivity (no Supabase token data)
  - Test budget override authentication
  - Test admin-only operations
  - Test user isolation
  - _Requirements: 12.1, 12.3, 12.8_

  - [ ]* 40.1 Write security tests
    - Test data privacy
    - Test access control
    - Test authentication

- [ ] 41. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 10: Documentation and Deployment

- [ ] 42. Create API documentation
  - Document all endpoints with examples
  - Create TypeScript type documentation
  - Document configuration options
  - Create error code reference
  - _Requirements: All_

- [ ] 43. Create user documentation
  - Create getting started guide
  - Document CLI commands
  - Create dashboard user guide
  - Document integration setup for each platform
  - _Requirements: All_

- [ ] 44. Create deployment guide
  - Document local development setup
  - Document production deployment
  - Create environment configuration guide
  - Document backup and recovery procedures
  - _Requirements: All_

- [ ] 45. Final validation and release
  - Verify all requirements are met
  - Verify all tests pass
  - Verify documentation is complete
  - Create release notes
  - _Requirements: All_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are strongly recommended for production quality
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- Property-based tests validate universal correctness properties across all valid inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions and end-to-end workflows
- Performance tests ensure system meets latency and throughput requirements
- Security tests ensure data privacy and access control
- All code must follow TypeScript best practices and project conventions
- All tests must pass before moving to the next phase
- Local SQLite storage is mandatory - no automatic Supabase requests for token data
- Budget warnings are non-blocking - requests/tasks always complete successfully

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": [
        "1",
        "2"
      ],
      "description": "Core infrastructure: project setup and database initialization"
    },
    {
      "id": 1,
      "tasks": [
        "2.1",
        "2.2",
        "3",
        "4",
        "5"
      ],
      "description": "Token tracking foundation: tokenizers, recording, cost calculation"
    },
    {
      "id": 2,
      "tasks": [
        "3.1",
        "3.2",
        "4.1",
        "4.2",
        "5.1",
        "5.2"
      ],
      "description": "Token tracking tests: consistency, aggregation, cost accuracy"
    },
    {
      "id": 3,
      "tasks": [
        "6",
        "8",
        "9"
      ],
      "description": "Token reporting and budget management setup"
    },
    {
      "id": 4,
      "tasks": [
        "6.1",
        "8.1",
        "8.2",
        "9.1",
        "9.2"
      ],
      "description": "Budget and reporting tests"
    },
    {
      "id": 5,
      "tasks": [
        "10",
        "12",
        "13",
        "14"
      ],
      "description": "Optimization strategies: context pruning, compression, management"
    },
    {
      "id": 6,
      "tasks": [
        "10.1",
        "12.1",
        "12.2",
        "12.3",
        "13.1",
        "13.2",
        "13.3",
        "14.1",
        "14.2"
      ],
      "description": "Optimization strategy tests"
    },
    {
      "id": 7,
      "tasks": [
        "15",
        "16",
        "18",
        "19"
      ],
      "description": "Recommendations, dry-run, and storage management"
    },
    {
      "id": 8,
      "tasks": [
        "15.1",
        "16.1",
        "16.2",
        "18.1",
        "18.2",
        "19.1",
        "20.1"
      ],
      "description": "Storage and recommendations tests"
    },
    {
      "id": 9,
      "tasks": [
        "22",
        "23",
        "24",
        "25",
        "26"
      ],
      "description": "Visualization: dashboard, CLI, reporting, analytics"
    },
    {
      "id": 10,
      "tasks": [
        "22.1",
        "23.1",
        "24.1",
        "25.1",
        "26.1"
      ],
      "description": "Visualization tests"
    },
    {
      "id": 11,
      "tasks": [
        "28",
        "29",
        "30",
        "31"
      ],
      "description": "Integrations: Antigravity, Cursor, Kiro, Obsidian"
    },
    {
      "id": 12,
      "tasks": [
        "28.1",
        "29.1",
        "30.1",
        "31.1"
      ],
      "description": "Integration tests"
    },
    {
      "id": 13,
      "tasks": [
        "33",
        "34",
        "35",
        "36"
      ],
      "description": "Advanced features: prompt optimization, caching, model routing, ML analytics"
    },
    {
      "id": 14,
      "tasks": [
        "33.1",
        "34.1",
        "35.1",
        "36.1"
      ],
      "description": "Advanced feature tests"
    },
    {
      "id": 15,
      "tasks": [
        "38",
        "39",
        "40"
      ],
      "description": "Comprehensive testing: integration, performance, security"
    },
    {
      "id": 16,
      "tasks": [
        "38.1",
        "39.1",
        "40.1"
      ],
      "description": "Final test suites"
    },
    {
      "id": 17,
      "tasks": [
        "42",
        "43",
        "44",
        "45"
      ],
      "description": "Documentation and deployment"
    }
  ]
}
```

---

## Acceptance Criteria Summary

### Core Requirements Met

✅ **Token Tracking**: Multi-model support (Claude, Gemini, OpenAI, Grok, Local) with accurate counting and cost calculation  
✅ **Budget Management**: Per-request and per-task budgets with YELLOW/RED/CRITICAL warnings (non-blocking)  
✅ **Optimization Strategies**: Context pruning, response compression, prompt optimization, caching, model routing  
✅ **Local Storage**: SQLite-only storage with auto-archival at 1GB threshold  
✅ **Visualization**: Web dashboard with multiple time windows and CLI reporting tool  
✅ **Integrations**: Antigravity agents, Cursor IDE, Kiro workflows, Obsidian (unidirectional)  
✅ **Testing**: Property-based tests for correctness properties, unit tests for components, integration tests for workflows  
✅ **Performance**: Token tracking overhead <5%, query performance with 100K+ records  
✅ **Security**: Data privacy, local storage exclusivity, access control, audit logging  

### Property-Based Tests Included

1. Token Count Consistency (Req 1.1, 1.2)
2. Task Token Aggregation (Req 1.5, 3.1)
3. Budget Warning Emission (Req 2.3, 2.4, 2.5)
4. Cost Calculation Accuracy (Req 1.4, 1.12)
5. Context Preservation (Req 4.2)
6. Pruning Effectiveness (Req 4.3)
7. Compression Effectiveness (Req 5.3)
8. Protected Content Types (Req 5.8)
9. Local Storage Exclusivity (Req 12.1, 12.3, 12.8)
10. Archival Trigger Accuracy (Req 12.6, 12.11)
11. Dry-Run Accuracy (Req 15.8)
12. Strategy Execution Order (Req 15.9)
13. Budget Non-Blocking (Req 2.5, 3.5)
14. Real-Time Budget Status (Req 2.7, 3.6)
15. Obsidian Sync Determinism (Req 7.4)
