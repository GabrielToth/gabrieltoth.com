# Token Killer CLI Tool

## Status: ⏸️ DEFERRED

⚠️ **This project is paused indefinitely.** Do not implement or reference these designs in active development. Focus on feature implementation first.

## Overview

The Token Killer CLI tool provides command-line access to token consumption statistics and reporting. It supports multiple output formats (JSON, CSV, table) with comprehensive metadata inclusion.

## Features

- **Multiple Output Formats**: JSON, CSV, and formatted table output
- **Flexible Time Windows**: 24h, 7d, 30d, 90d, or all-time reporting
- **Metadata Inclusion**: Generated date, data range, and applied filters
- **Breakdown Analysis**: Token consumption by agent type and model
- **Cost Reporting**: USD and BRL currency support
- **Easy Integration**: Commander.js-based CLI with intuitive commands

## Installation

The CLI tool is part of the Token Killer package. To use it:

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Basic Command

```bash
token-killer stats [--days 7] [--format json|csv|table]
```

### Examples

#### Display 7-day statistics in table format (default)

```bash
token-killer stats
```

Output:
```
╔════════════════════════════════════════════════════════════════╗
║                  Token Killer Statistics Report                ║
╚════════════════════════════════════════════════════════════════╝

📊 Report Metadata
─────────────────────────────────────────────────────────────────
Generated:  2024-01-08T15:30:45.123Z
Time Range: 2024-01-01 to 2024-01-08
Window:     7d

📈 Summary Statistics
─────────────────────────────────────────────────────────────────
Total Tokens:      100,000
  Input Tokens:    60,000
  Output Tokens:   40,000

Total Cost:        5.00 USD
                   25.00 BRL

Requests:          50
Tasks:             10

🤖 Breakdown by Agent Type
─────────────────────────────────────────────────────────────────
Agent Type           Tokens          Cost (USD)      Requests
─────────────────────────────────────────────────────────────────
kiro                 50,000          2.50            25
antigravity          30,000          1.50            15
cursor               20,000          1.00            10

🧠 Breakdown by Model
─────────────────────────────────────────────────────────────────
Model                Tokens          Cost (USD)      Requests
─────────────────────────────────────────────────────────────────
claude-haiku-4.5     60,000          3.00            30
gemini-flash-3.1     40,000          2.00            20

════════════════════════════════════════════════════════════════
```

#### Display 24-hour statistics in JSON format

```bash
token-killer stats --days 1 --format json
```

Output:
```json
{
  "metadata": {
    "generated_date": "2024-01-08T15:30:45.123Z",
    "data_range": {
      "start": "2024-01-07T15:30:45.123Z",
      "end": "2024-01-08T15:30:45.123Z"
    },
    "filters_applied": {
      "time_window": "24h",
      "days_requested": 1,
      "format": "json"
    }
  },
  "statistics": {
    "total_tokens": 100000,
    "input_tokens": 60000,
    "output_tokens": 40000,
    "total_cost_usd": 5.0,
    "total_cost_brl": 25.0,
    "request_count": 50,
    "task_count": 10
  },
  "breakdown": {
    "by_agent_type": {
      "kiro": {
        "tokens": 50000,
        "cost": 2.5,
        "count": 25
      },
      "antigravity": {
        "tokens": 30000,
        "cost": 1.5,
        "count": 15
      },
      "cursor": {
        "tokens": 20000,
        "cost": 1.0,
        "count": 10
      }
    },
    "by_model": {
      "claude-haiku-4.5": {
        "tokens": 60000,
        "cost": 3.0,
        "count": 30
      },
      "gemini-flash-3.1": {
        "tokens": 40000,
        "cost": 2.0,
        "count": 20
      }
    }
  }
}
```

#### Display 30-day statistics in CSV format

```bash
token-killer stats --days 30 --format csv
```

Output:
```csv
# Generated: 2024-01-08T15:30:45.123Z
# Data Range: 2023-12-09T15:30:45.123Z to 2024-01-08T15:30:45.123Z
# Time Window: 30d

Summary Statistics
Metric,Value
Total Tokens,100000
Input Tokens,60000
Output Tokens,40000
Total Cost USD,5.00
Total Cost BRL,25.00
Request Count,50
Task Count,10

Breakdown by Agent Type
Agent Type,Tokens,Cost USD,Request Count
kiro,50000,2.50,25
antigravity,30000,1.50,15
cursor,20000,1.00,10

Breakdown by Model
Model,Tokens,Cost USD,Request Count
claude-haiku-4.5,60000,3.00,30
gemini-flash-3.1,40000,2.00,20
```

## Options

### `--days <number>`

Number of days to report (default: 7)

- `1`: Last 24 hours
- `7`: Last 7 days (default)
- `30`: Last 30 days
- `90`: Last 90 days
- Any other number: All-time data

```bash
token-killer stats --days 30
```

### `--format <format>`

Output format (default: table)

- `table`: Formatted ASCII table with box drawing characters
- `json`: JSON format for programmatic use
- `csv`: CSV format for spreadsheet import

```bash
token-killer stats --format json
```

## Output Formats

### Table Format

- **Best for**: Human-readable reports, terminal display
- **Features**:
  - Box drawing characters for visual structure
  - Formatted numbers with thousands separators
  - Currency formatting (USD/BRL)
  - Emoji indicators for sections
  - Metadata header with generation date and time range

### JSON Format

- **Best for**: Programmatic use, API integration, data processing
- **Features**:
  - Valid JSON structure
  - Complete metadata inclusion
  - Nested breakdown by agent type and model
  - Easy parsing and manipulation

### CSV Format

- **Best for**: Spreadsheet import, data analysis, archival
- **Features**:
  - Metadata as comments (lines starting with #)
  - Multiple sections separated by blank lines
  - Standard CSV format for Excel/Google Sheets
  - Breakdown tables for agent types and models

## Metadata Inclusion

All output formats include comprehensive metadata:

### `generated_date`

ISO 8601 timestamp of when the report was generated

```
2024-01-08T15:30:45.123Z
```

### `data_range`

Start and end dates for the reported data

```json
{
  "start": "2024-01-01T00:00:00.000Z",
  "end": "2024-01-08T15:30:45.123Z"
}
```

### `filters_applied`

Filters used to generate the report

```json
{
  "time_window": "7d",
  "days_requested": 7,
  "format": "table"
}
```

## Statistics Included

### Summary Statistics

- **Total Tokens**: Sum of all input and output tokens
- **Input Tokens**: Tokens sent to the LLM
- **Output Tokens**: Tokens generated by the LLM
- **Total Cost**: Cost in USD and BRL
- **Request Count**: Number of individual requests
- **Task Count**: Number of tasks executed

### Breakdown by Agent Type

- **kiro**: Kiro workflow agent
- **antigravity**: Antigravity agent
- **cursor**: Cursor IDE agent
- **gabrieltoth**: gabrieltoth.com platform

For each agent type:
- Tokens consumed
- Cost in USD
- Number of requests

### Breakdown by Model

- **claude-haiku-4.5**: Anthropic Claude Haiku 4.5
- **gemini-flash-3.1**: Google Gemini Flash 3.1
- **cursor-composer-2.0**: Cursor Composer 2.0

For each model:
- Tokens consumed
- Cost in USD
- Number of requests

## Environment Variables

### `BRL_EXCHANGE_RATE`

Exchange rate for USD to BRL conversion (default: 5)

```bash
export BRL_EXCHANGE_RATE=5.5
token-killer stats
```

## Error Handling

The CLI provides clear error messages for invalid inputs:

```bash
# Invalid format
$ token-killer stats --format xml
Error: Invalid format 'xml'. Must be one of: json, csv, table

# Invalid days
$ token-killer stats --days -5
Error: --days must be a positive integer

# Database connection error
$ token-killer stats
Error: Failed to retrieve token statistics: Connection refused
```

## Integration Examples

### Bash Script

```bash
#!/bin/bash

# Generate daily report
token-killer stats --days 1 --format json > daily-report.json

# Generate weekly CSV for spreadsheet
token-killer stats --days 7 --format csv > weekly-report.csv

# Display current status
token-killer stats --format table
```

### Node.js Integration

```typescript
import { createTokenKillerCLI } from './token-killer/visualization/cli'
import { initializeDatabase } from './token-killer/storage/initialize'

async function generateReport() {
  const pool = await initializeDatabase()
  const program = createTokenKillerCLI(pool)
  
  // Parse command-line arguments
  await program.parseAsync(['node', 'script.js', 'stats', '--format', 'json'])
}

generateReport()
```

### Cron Job

```bash
# Generate daily report at 9 AM
0 9 * * * /usr/local/bin/token-killer stats --days 1 --format csv >> /var/log/token-killer-daily.csv

# Generate weekly report every Monday at 8 AM
0 8 * * 1 /usr/local/bin/token-killer stats --days 7 --format json > /var/reports/weekly-$(date +\%Y-\%m-\%d).json
```

## Requirements Implemented

- **Requirement 6.8**: JSON output format with complete statistics
- **Requirement 6.9**: CSV output format for spreadsheet import
- **Requirement 6.10**: Table output format with formatting and metadata inclusion
- **Requirement 6.10**: Metadata inclusion (generated_date, data_range, filters_applied)

## Testing

Run the CLI tests:

```bash
npm run test -- src/__tests__/token-killer/visualization/cli.test.ts
```

Tests cover:
- Command parsing and validation
- Output formatting for all formats
- Metadata creation and inclusion
- Edge cases (empty data, large numbers, etc.)
- Requirement validation

## Future Enhancements

- Budget status command
- Strategy management commands
- Real-time monitoring mode
- Export to external services
- Custom report templates
- Scheduled report generation
