/**
 * Unit Tests for Token Killer CLI Tool
 * Tests command parsing, output formatting, and metadata inclusion
 * Implements Requirement 24.1: Unit tests for CLI tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTokenKillerCLI } from '../../../token-killer/visualization/cli'
import {
  formatJsonOutput,
  formatCsvOutput,
  formatTableOutput,
  createMetadata,
} from '../../../token-killer/visualization/cli-formatters'
import type { TokenStats } from '../../../token-killer/visualization/cli'

/**
 * Mock database pool
 */
const mockPool = {
  execute: vi.fn(),
  healthCheck: vi.fn(),
} as any

/**
 * Sample token statistics for testing
 */
const sampleStats: TokenStats = {
  timeWindow: '7d',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-08'),
  totalTokens: 100000,
  inputTokens: 60000,
  outputTokens: 40000,
  totalCost: 5.0,
  costUSD: 5.0,
  costBRL: 25.0,
  requestCount: 50,
  taskCount: 10,
  byAgentType: {
    kiro: { tokens: 50000, cost: 2.5, count: 25 },
    antigravity: { tokens: 30000, cost: 1.5, count: 15 },
    cursor: { tokens: 20000, cost: 1.0, count: 10 },
  },
  byModel: {
    'claude-haiku-4.5': { tokens: 60000, cost: 3.0, count: 30 },
    'gemini-flash-3.1': { tokens: 40000, cost: 2.0, count: 20 },
  },
}

describe('Token Killer CLI Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CLI Command Creation', () => {
    it('should create a CLI program with stats command', () => {
      const program = createTokenKillerCLI(mockPool)
      expect(program).toBeDefined()
      expect(program.name()).toBe('token-killer')
    })

    it('should have stats command with options', () => {
      const program = createTokenKillerCLI(mockPool)
      const statsCommand = program.commands.find((cmd) => cmd.name() === 'stats')
      expect(statsCommand).toBeDefined()
    })

    it('should have budget command', () => {
      const program = createTokenKillerCLI(mockPool)
      const budgetCommand = program.commands.find((cmd) => cmd.name() === 'budget')
      expect(budgetCommand).toBeDefined()
    })

    it('should have strategy command', () => {
      const program = createTokenKillerCLI(mockPool)
      const strategyCommand = program.commands.find((cmd) => cmd.name() === 'strategy')
      expect(strategyCommand).toBeDefined()
    })
  })

  describe('Metadata Creation', () => {
    it('should create metadata with generated_date', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      expect(metadata.generated_date).toBeDefined()
      expect(new Date(metadata.generated_date)).toBeInstanceOf(Date)
    })

    it('should create metadata with data_range', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      expect(metadata.data_range).toBeDefined()
      expect(metadata.data_range.start).toBeDefined()
      expect(metadata.data_range.end).toBeDefined()
    })

    it('should create metadata with filters_applied', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      expect(metadata.filters_applied).toBeDefined()
      expect(metadata.filters_applied.time_window).toBe('7d')
      expect(metadata.filters_applied.days_requested).toBe(7)
      expect(metadata.filters_applied.format).toBe('json')
    })

    it('should calculate correct date range for 24h window', () => {
      const metadata = createMetadata({
        timeWindow: '24h',
        daysRequested: 1,
        format: 'json',
      })

      const start = new Date(metadata.data_range.start)
      const end = new Date(metadata.data_range.end)
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

      expect(diffHours).toBeCloseTo(24, 1)
    })

    it('should calculate correct date range for 30d window', () => {
      const metadata = createMetadata({
        timeWindow: '30d',
        daysRequested: 30,
        format: 'json',
      })

      const start = new Date(metadata.data_range.start)
      const end = new Date(metadata.data_range.end)
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

      expect(diffDays).toBeCloseTo(30, 0)
    })
  })

  describe('JSON Output Format', () => {
    it('should format output as valid JSON', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const output = formatJsonOutput(sampleStats, metadata)
      const parsed = JSON.parse(output)

      expect(parsed).toBeDefined()
      expect(parsed.metadata).toBeDefined()
      expect(parsed.statistics).toBeDefined()
      expect(parsed.breakdown).toBeDefined()
    })

    it('should include all statistics in JSON output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const output = formatJsonOutput(sampleStats, metadata)
      const parsed = JSON.parse(output)

      expect(parsed.statistics.total_tokens).toBe(100000)
      expect(parsed.statistics.input_tokens).toBe(60000)
      expect(parsed.statistics.output_tokens).toBe(40000)
      expect(parsed.statistics.total_cost_usd).toBe(5.0)
      expect(parsed.statistics.total_cost_brl).toBe(25.0)
      expect(parsed.statistics.request_count).toBe(50)
      expect(parsed.statistics.task_count).toBe(10)
    })

    it('should include breakdown by agent type in JSON output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const output = formatJsonOutput(sampleStats, metadata)
      const parsed = JSON.parse(output)

      expect(parsed.breakdown.by_agent_type).toBeDefined()
      expect(parsed.breakdown.by_agent_type.kiro).toBeDefined()
      expect(parsed.breakdown.by_agent_type.kiro.tokens).toBe(50000)
    })

    it('should include breakdown by model in JSON output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const output = formatJsonOutput(sampleStats, metadata)
      const parsed = JSON.parse(output)

      expect(parsed.breakdown.by_model).toBeDefined()
      expect(parsed.breakdown.by_model['claude-haiku-4.5']).toBeDefined()
      expect(parsed.breakdown.by_model['claude-haiku-4.5'].tokens).toBe(60000)
    })

    it('should include metadata in JSON output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const output = formatJsonOutput(sampleStats, metadata)
      const parsed = JSON.parse(output)

      expect(parsed.metadata.generated_date).toBeDefined()
      expect(parsed.metadata.data_range).toBeDefined()
      expect(parsed.metadata.filters_applied).toBeDefined()
    })
  })

  describe('CSV Output Format', () => {
    it('should format output as CSV', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'csv',
      })

      const output = formatCsvOutput(sampleStats, metadata)

      expect(output).toContain('Generated:')
      expect(output).toContain('Data Range:')
      expect(output).toContain('Summary Statistics')
    })

    it('should include metadata comments in CSV output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'csv',
      })

      const output = formatCsvOutput(sampleStats, metadata)

      expect(output).toContain('# Generated:')
      expect(output).toContain('# Data Range:')
      expect(output).toContain('# Time Window:')
    })

    it('should include summary statistics in CSV output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'csv',
      })

      const output = formatCsvOutput(sampleStats, metadata)

      expect(output).toContain('Total Tokens,100000')
      expect(output).toContain('Input Tokens,60000')
      expect(output).toContain('Output Tokens,40000')
    })

    it('should include breakdown by agent type in CSV output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'csv',
      })

      const output = formatCsvOutput(sampleStats, metadata)

      expect(output).toContain('Breakdown by Agent Type')
      expect(output).toContain('kiro,50000')
      expect(output).toContain('antigravity,30000')
    })

    it('should include breakdown by model in CSV output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'csv',
      })

      const output = formatCsvOutput(sampleStats, metadata)

      expect(output).toContain('Breakdown by Model')
      expect(output).toContain('claude-haiku-4.5,60000')
      expect(output).toContain('gemini-flash-3.1,40000')
    })

    it('should be parseable as CSV', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'csv',
      })

      const output = formatCsvOutput(sampleStats, metadata)
      const lines = output.split('\n')

      // Should have multiple sections
      expect(lines.length).toBeGreaterThan(10)

      // Should have headers
      const hasHeaders = lines.some((line) => line.includes('Metric,Value'))
      expect(hasHeaders).toBe(true)
    })
  })

  describe('Table Output Format', () => {
    it('should format output as table', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      expect(output).toContain('Token Killer Statistics Report')
      expect(output).toContain('Summary Statistics')
    })

    it('should include metadata in table output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      expect(output).toContain('Generated:')
      expect(output).toContain('Time Range:')
      expect(output).toContain('Window:')
    })

    it('should include summary statistics in table output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      expect(output).toContain('Total Tokens')
      expect(output).toContain('Input Tokens')
      expect(output).toContain('Output Tokens')
      expect(output).toContain('Total Cost')
    })

    it('should include breakdown by agent type in table output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      expect(output).toContain('Breakdown by Agent Type')
      expect(output).toContain('kiro')
      expect(output).toContain('antigravity')
      expect(output).toContain('cursor')
    })

    it('should include breakdown by model in table output', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      expect(output).toContain('Breakdown by Model')
      expect(output).toContain('claude-haiku-4.5')
      expect(output).toContain('gemini-flash-3.1')
    })

    it('should format numbers with thousands separator', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      // 100000 should be formatted as 100,000
      expect(output).toContain('100,000')
    })

    it('should format currency values', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      expect(output).toContain('USD')
      expect(output).toContain('BRL')
    })

    it('should use box drawing characters for formatting', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      expect(output).toContain('╔')
      expect(output).toContain('╚')
      expect(output).toContain('═')
      expect(output).toContain('─')
    })
  })

  describe('Output Format Consistency', () => {
    it('should have same total tokens across all formats', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const jsonOutput = formatJsonOutput(sampleStats, metadata)
      const csvOutput = formatCsvOutput(sampleStats, metadata)
      const tableOutput = formatTableOutput(sampleStats, metadata)

      const jsonParsed = JSON.parse(jsonOutput)
      expect(jsonParsed.statistics.total_tokens).toBe(100000)
      expect(csvOutput).toContain('Total Tokens,100000')
      expect(tableOutput).toContain('100,000')
    })

    it('should have same cost across all formats', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const jsonOutput = formatJsonOutput(sampleStats, metadata)
      const csvOutput = formatCsvOutput(sampleStats, metadata)

      const jsonParsed = JSON.parse(jsonOutput)
      expect(jsonParsed.statistics.total_cost_usd).toBe(5.0)
      expect(csvOutput).toContain('Total Cost USD,5.00')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty agent type breakdown', () => {
      const emptyStats: TokenStats = {
        ...sampleStats,
        byAgentType: {},
      }

      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(emptyStats, metadata)
      expect(output).toBeDefined()
      expect(output).not.toContain('Breakdown by Agent Type')
    })

    it('should handle empty model breakdown', () => {
      const emptyStats: TokenStats = {
        ...sampleStats,
        byModel: {},
      }

      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(emptyStats, metadata)
      expect(output).toBeDefined()
      expect(output).not.toContain('Breakdown by Model')
    })

    it('should handle zero tokens', () => {
      const zeroStats: TokenStats = {
        ...sampleStats,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
      }

      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const output = formatJsonOutput(zeroStats, metadata)
      const parsed = JSON.parse(output)

      expect(parsed.statistics.total_tokens).toBe(0)
    })

    it('should handle large token counts', () => {
      const largeStats: TokenStats = {
        ...sampleStats,
        totalTokens: 1000000000,
        inputTokens: 600000000,
        outputTokens: 400000000,
      }

      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(largeStats, metadata)
      expect(output).toContain('1,000,000,000')
    })
  })

  describe('Requirement Validation', () => {
    it('should validate Requirement 6.8: JSON output format', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      const output = formatJsonOutput(sampleStats, metadata)
      const parsed = JSON.parse(output)

      // Should be valid JSON
      expect(parsed).toBeDefined()
      // Should include metadata
      expect(parsed.metadata).toBeDefined()
      // Should include statistics
      expect(parsed.statistics).toBeDefined()
    })

    it('should validate Requirement 6.9: CSV output format', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'csv',
      })

      const output = formatCsvOutput(sampleStats, metadata)

      // Should be CSV format
      expect(output).toContain(',')
      // Should include metadata
      expect(output).toContain('# Generated:')
      // Should include data
      expect(output).toContain('Total Tokens')
    })

    it('should validate Requirement 6.10: Table output format with metadata', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'table',
      })

      const output = formatTableOutput(sampleStats, metadata)

      // Should be formatted table
      expect(output).toContain('╔')
      // Should include metadata
      expect(output).toContain('Generated:')
      expect(output).toContain('Time Range:')
      expect(output).toContain('Window:')
      // Should include data
      expect(output).toContain('Summary Statistics')
    })

    it('should validate Requirement 6.10: Metadata inclusion (generated_date)', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      expect(metadata.generated_date).toBeDefined()
      expect(new Date(metadata.generated_date)).toBeInstanceOf(Date)
    })

    it('should validate Requirement 6.10: Metadata inclusion (data_range)', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      expect(metadata.data_range).toBeDefined()
      expect(metadata.data_range.start).toBeDefined()
      expect(metadata.data_range.end).toBeDefined()
    })

    it('should validate Requirement 6.10: Metadata inclusion (filters_applied)', () => {
      const metadata = createMetadata({
        timeWindow: '7d',
        daysRequested: 7,
        format: 'json',
      })

      expect(metadata.filters_applied).toBeDefined()
      expect(metadata.filters_applied.time_window).toBe('7d')
      expect(metadata.filters_applied.days_requested).toBe(7)
      expect(metadata.filters_applied.format).toBe('json')
    })
  })
})
