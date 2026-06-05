/**
 * CLI Output Formatters
 * Provides formatting functions for JSON, CSV, and table output
 * Implements Requirements 6.8, 6.9, 6.10: Multiple output formats with metadata
 */

import type { TokenStats, TimeWindow } from './cli'

/**
 * Metadata for CLI output
 */
interface CliMetadata {
  generated_date: string
  data_range: {
    start: string
    end: string
  }
  filters_applied: {
    time_window: TimeWindow
    days_requested: number
    format: string
  }
}

/**
 * Create metadata for CLI output
 * Requirement 6.10: Metadata inclusion (generated_date, data_range, filters_applied)
 */
export function createMetadata(options: {
  timeWindow: TimeWindow
  daysRequested: number
  format: string
}): CliMetadata {
  const now = new Date()
  const start = new Date()

  // Calculate start date based on time window
  switch (options.timeWindow) {
    case '24h':
      start.setHours(start.getHours() - 24)
      break
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    case 'all-time':
      start.setFullYear(2000)
      break
  }

  return {
    generated_date: now.toISOString(),
    data_range: {
      start: start.toISOString(),
      end: now.toISOString(),
    },
    filters_applied: {
      time_window: options.timeWindow,
      days_requested: options.daysRequested,
      format: options.format,
    },
  }
}

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Format currency value
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${formatted} ${currency}`
}

/**
 * Format JSON output
 * Requirement 6.8: JSON output format
 */
export function formatJsonOutput(stats: TokenStats, metadata: CliMetadata): string {
  const output = {
    metadata,
    statistics: {
      total_tokens: stats.totalTokens,
      input_tokens: stats.inputTokens,
      output_tokens: stats.outputTokens,
      total_cost_usd: stats.costUSD,
      total_cost_brl: stats.costBRL,
      request_count: stats.requestCount,
      task_count: stats.taskCount,
    },
    breakdown: {
      by_agent_type: stats.byAgentType,
      by_model: stats.byModel,
    },
  }

  return JSON.stringify(output, null, 2)
}

/**
 * Format CSV output
 * Requirement 6.9: CSV output format
 */
export function formatCsvOutput(stats: TokenStats, metadata: CliMetadata): string {
  const lines: string[] = []

  // Add metadata as comments
  lines.push(`# Generated: ${metadata.generated_date}`)
  lines.push(`# Data Range: ${metadata.data_range.start} to ${metadata.data_range.end}`)
  lines.push(`# Time Window: ${metadata.filters_applied.time_window}`)
  lines.push('')

  // Add summary statistics
  lines.push('Summary Statistics')
  lines.push('Metric,Value')
  lines.push(`Total Tokens,${stats.totalTokens}`)
  lines.push(`Input Tokens,${stats.inputTokens}`)
  lines.push(`Output Tokens,${stats.outputTokens}`)
  lines.push(`Total Cost USD,${stats.costUSD.toFixed(2)}`)
  lines.push(`Total Cost BRL,${stats.costBRL.toFixed(2)}`)
  lines.push(`Request Count,${stats.requestCount}`)
  lines.push(`Task Count,${stats.taskCount}`)
  lines.push('')

  // Add breakdown by agent type
  if (Object.keys(stats.byAgentType).length > 0) {
    lines.push('Breakdown by Agent Type')
    lines.push('Agent Type,Tokens,Cost USD,Request Count')
    for (const [agentType, data] of Object.entries(stats.byAgentType)) {
      lines.push(
        `${agentType},${data.tokens},${data.cost.toFixed(2)},${data.count}`
      )
    }
    lines.push('')
  }

  // Add breakdown by model
  if (Object.keys(stats.byModel).length > 0) {
    lines.push('Breakdown by Model')
    lines.push('Model,Tokens,Cost USD,Request Count')
    for (const [model, data] of Object.entries(stats.byModel)) {
      lines.push(
        `${model},${data.tokens},${data.cost.toFixed(2)},${data.count}`
      )
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Format table output with ASCII table
 * Requirement 6.10: Table output format with formatting
 */
export function formatTableOutput(stats: TokenStats, metadata: CliMetadata): string {
  const lines: string[] = []

  // Header
  lines.push('╔════════════════════════════════════════════════════════════════╗')
  lines.push('║                  Token Killer Statistics Report                ║')
  lines.push('╚════════════════════════════════════════════════════════════════╝')
  lines.push('')

  // Metadata section
  lines.push('📊 Report Metadata')
  lines.push('─'.repeat(64))
  lines.push(`Generated:  ${metadata.generated_date}`)
  lines.push(`Time Range: ${metadata.data_range.start.split('T')[0]} to ${metadata.data_range.end.split('T')[0]}`)
  lines.push(`Window:     ${metadata.filters_applied.time_window}`)
  lines.push('')

  // Summary statistics
  lines.push('📈 Summary Statistics')
  lines.push('─'.repeat(64))
  lines.push(`Total Tokens:      ${formatNumber(stats.totalTokens)}`)
  lines.push(`  Input Tokens:    ${formatNumber(stats.inputTokens)}`)
  lines.push(`  Output Tokens:   ${formatNumber(stats.outputTokens)}`)
  lines.push('')
  lines.push(`Total Cost:        ${formatCurrency(stats.costUSD, 'USD')}`)
  lines.push(`                   ${formatCurrency(stats.costBRL, 'BRL')}`)
  lines.push('')
  lines.push(`Requests:          ${formatNumber(stats.requestCount)}`)
  lines.push(`Tasks:             ${formatNumber(stats.taskCount)}`)
  lines.push('')

  // Breakdown by agent type
  if (Object.keys(stats.byAgentType).length > 0) {
    lines.push('🤖 Breakdown by Agent Type')
    lines.push('─'.repeat(64))
    lines.push(
      formatTableRow(
        ['Agent Type', 'Tokens', 'Cost (USD)', 'Requests'],
        [20, 15, 15, 12]
      )
    )
    lines.push('─'.repeat(64))

    for (const [agentType, data] of Object.entries(stats.byAgentType)) {
      lines.push(
        formatTableRow(
          [
            agentType,
            formatNumber(data.tokens),
            formatCurrency(data.cost, 'USD'),
            formatNumber(data.count),
          ],
          [20, 15, 15, 12]
        )
      )
    }
    lines.push('')
  }

  // Breakdown by model
  if (Object.keys(stats.byModel).length > 0) {
    lines.push('🧠 Breakdown by Model')
    lines.push('─'.repeat(64))
    lines.push(
      formatTableRow(
        ['Model', 'Tokens', 'Cost (USD)', 'Requests'],
        [20, 15, 15, 12]
      )
    )
    lines.push('─'.repeat(64))

    for (const [model, data] of Object.entries(stats.byModel)) {
      lines.push(
        formatTableRow(
          [
            model,
            formatNumber(data.tokens),
            formatCurrency(data.cost, 'USD'),
            formatNumber(data.count),
          ],
          [20, 15, 15, 12]
        )
      )
    }
    lines.push('')
  }

  // Footer
  lines.push('═'.repeat(64))

  return lines.join('\n')
}

/**
 * Format a table row with specified column widths
 */
function formatTableRow(columns: string[], widths: number[]): string {
  return columns
    .map((col, i) => {
      const width = widths[i] || 15
      return col.padEnd(width)
    })
    .join('')
}

export type { CliMetadata }
