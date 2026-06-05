# Token Killer Web Dashboard API

## Overview

The Token Killer Web Dashboard API provides Express.js endpoints for token data aggregation, analytics, and visualization. It implements Requirements 6.1-6.5 of the Token Killer specification.

## Features

- **Token Statistics Aggregation**: Retrieve aggregated token consumption data for multiple time windows (24h, 7d, 30d, 90d, all-time)
- **Token Breakdown**: Get token consumption breakdown by agent type, request type, model, or optimization strategy
- **Anomaly Detection**: Detect and report anomalies in token consumption using statistical analysis (Z-score)
- **Health Checks**: Monitor API and database health
- **Error Handling**: Comprehensive error handling with descriptive error messages
- **Data Validation**: Input validation for all parameters

## API Endpoints

### 1. Get Token Statistics

**Endpoint**: `GET /api/token-killer/stats/:timeWindow`

**Parameters**:
- `timeWindow` (path): Time window for aggregation
  - Valid values: `24h`, `7d`, `30d`, `90d`, `all-time`

**Response**:
```json
{
  "timeWindow": "7d",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-08T00:00:00.000Z",
  "totalTokens": 2700,
  "inputTokens": 1800,
  "outputTokens": 900,
  "totalCost": 0.09,
  "costUSD": 0.09,
  "costBRL": 0.45,
  "requestCount": 18,
  "taskCount": 3,
  "byAgentType": {
    "kiro": {
      "tokens": 1500,
      "cost": 0.05,
      "count": 10
    },
    "cursor": {
      "tokens": 1200,
      "cost": 0.04,
      "count": 8
    }
  },
  "byRequestType": {},
  "byModel": {
    "claude-haiku-4.5": {
      "tokens": 1500,
      "cost": 0.05,
      "count": 10
    },
    "cursor-composer-2.0": {
      "tokens": 1200,
      "cost": 0.04,
      "count": 8
    }
  },
  "byOptimizationStrategy": {}
}
```

**Error Response** (400):
```json
{
  "error": "INVALID_TIME_WINDOW",
  "code": "INVALID_TIME_WINDOW",
  "message": "Invalid time window: invalid. Must be one of: 24h, 7d, 30d, 90d, all-time",
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

### 2. Get Token Breakdown

**Endpoint**: `GET /api/token-killer/breakdown/:timeWindow/:breakdownType`

**Parameters**:
- `timeWindow` (path): Time window for aggregation (24h, 7d, 30d, 90d, all-time)
- `breakdownType` (path): Breakdown dimension
  - Valid values: `agent-type`, `request-type`, `model`, `strategy`

**Response**:
```json
{
  "timeWindow": "7d",
  "breakdownType": "agent-type",
  "breakdown": [
    {
      "category": "kiro",
      "inputTokens": 1000,
      "outputTokens": 500,
      "totalTokens": 1500,
      "totalCost": 0.05,
      "count": 10,
      "percentage": 55.56
    },
    {
      "category": "cursor",
      "inputTokens": 800,
      "outputTokens": 400,
      "totalTokens": 1200,
      "totalCost": 0.04,
      "count": 8,
      "percentage": 44.44
    }
  ],
  "totalTokens": 2700
}
```

**Error Response** (400):
```json
{
  "error": "INVALID_BREAKDOWN_TYPE",
  "code": "INVALID_BREAKDOWN_TYPE",
  "message": "Invalid breakdown type: invalid. Must be one of: agent-type, request-type, model, strategy",
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

### 3. Detect Anomalies

**Endpoint**: `GET /api/token-killer/anomalies/:timeWindow?threshold=2`

**Parameters**:
- `timeWindow` (path): Time window for analysis (24h, 7d, 30d, 90d, all-time)
- `threshold` (query, optional): Z-score threshold for anomaly detection (default: 2, range: 0-10)

**Response**:
```json
{
  "anomalies": [
    {
      "timestamp": "2024-01-05T00:00:00.000Z",
      "totalTokens": 5000,
      "zScore": 1.75,
      "deviation": "169.5% above mean",
      "context": "20 records on 2024-01-05"
    }
  ],
  "mean": 2037.5,
  "stdDev": 1710.77,
  "threshold": 2,
  "dataPoints": 7
}
```

**Error Response** (400):
```json
{
  "error": "INVALID_THRESHOLD",
  "code": "INVALID_THRESHOLD",
  "message": "Threshold must be between 0 and 10",
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

### 4. Health Check

**Endpoint**: `GET /api/token-killer/health`

**Response** (200):
```json
{
  "status": "healthy",
  "responseTime": 10,
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

**Error Response** (503):
```json
{
  "status": "unhealthy",
  "error": "Database connection failed",
  "responseTime": 5000,
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

## Integration with Express Backend

### Basic Integration

```typescript
import express from 'express'
import { DatabasePool } from './token-killer/storage/database'
import { integrateTokenKillerAPI } from './token-killer/visualization'

const app = express()

// Initialize Token Killer database pool
const tokenKillerPool = new DatabasePool()
await tokenKillerPool.initialize()

// Integrate Token Killer API
integrateTokenKillerAPI(app, tokenKillerPool)

// Start server
app.listen(4000, () => {
  console.log('Server running on port 4000')
})
```

### Standalone Router

```typescript
import { createStandaloneTokenKillerRouter } from './token-killer/visualization'

const tokenKillerRouter = createStandaloneTokenKillerRouter(tokenKillerPool)
app.use(tokenKillerRouter)
```

## Data Validation

All endpoints validate input parameters:

- **Time Window**: Must be one of `24h`, `7d`, `30d`, `90d`, `all-time`
- **Breakdown Type**: Must be one of `agent-type`, `request-type`, `model`, `strategy`
- **Threshold**: Must be a number between 0 and 10
- **Token Counts**: Must be non-negative integers
- **Costs**: Must be non-negative numbers
- **Percentages**: Must be between 0 and 100

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

**Common Error Codes**:
- `INVALID_TIME_WINDOW`: Invalid time window parameter
- `INVALID_BREAKDOWN_TYPE`: Invalid breakdown type parameter
- `INVALID_THRESHOLD`: Invalid threshold parameter
- `STATS_RETRIEVAL_FAILED`: Failed to retrieve statistics
- `BREAKDOWN_RETRIEVAL_FAILED`: Failed to retrieve breakdown
- `ANOMALY_DETECTION_FAILED`: Failed to detect anomalies
- `HEALTH_CHECK_FAILED`: Health check failed
- `NOT_FOUND`: Endpoint not found

## Performance Considerations

- **Query Optimization**: All queries use indexed columns for fast retrieval
- **Aggregation**: Data is aggregated at the database level for efficiency
- **Caching**: Consider implementing caching for frequently accessed time windows
- **Pagination**: For large datasets, consider implementing pagination

## Requirements Mapping

- **Requirement 6.1**: Token consumption data with multiple time windows (24h, 7d, 30d, 90d, all-time)
- **Requirement 6.2**: Token breakdown by agent type, request type, model
- **Requirement 6.3**: Token breakdown by optimization strategy
- **Requirement 6.4**: Anomaly detection endpoint with Z-score analysis
- **Requirement 6.5**: Error handling and data validation

## Testing

Run the unit tests:

```bash
npm run test -- src/__tests__/token-killer/visualization/api.test.ts
```

Test coverage includes:
- Data aggregation accuracy
- Breakdown calculations
- Anomaly detection
- Error handling
- Data validation
- Date range calculations

## Future Enhancements

- Implement caching for frequently accessed time windows
- Add pagination support for large datasets
- Implement real-time data streaming via WebSockets
- Add export functionality (CSV, JSON, PDF)
- Implement advanced filtering and search
- Add machine learning-based anomaly detection
