/**
 * Token Killer Dashboard Storybook Stories
 * Demonstrates all dashboard components and their usage
 */

import type { Meta, StoryObj } from '@storybook/react'
import { TokenKillerDashboard } from './TokenKillerDashboard'
import { TimeWindowSelector } from './TimeWindowSelector'
import { AnomalyHighlight } from './AnomalyHighlight'
import { LoadingIndicator } from './LoadingIndicator'
import { ErrorState } from './ErrorState'
import { DashboardHeader } from './DashboardHeader'
import type { AnomalyDetectionResult } from './types'

/**
 * Main Dashboard Story
 */
const meta: Meta<typeof TokenKillerDashboard> = {
  title: 'Token Killer/Dashboard',
  component: TokenKillerDashboard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TokenKillerDashboard>

export const Default: Story = {
  render: () => <TokenKillerDashboard />,
}

/**
 * Time Window Selector Stories
 */
const timeWindowMeta: Meta<typeof TimeWindowSelector> = {
  title: 'Token Killer/Components/TimeWindowSelector',
  component: TimeWindowSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const TimeWindowSelectorStory: StoryObj<typeof TimeWindowSelector> = {
  render: (args) => (
    <TimeWindowSelector
      selectedWindow={args.selectedWindow}
      onWindowChange={args.onWindowChange}
    />
  ),
  args: {
    selectedWindow: '7d',
    onWindowChange: (window) => console.log('Selected window:', window),
  },
}

/**
 * Anomaly Highlight Stories
 */
const anomalyMeta: Meta<typeof AnomalyHighlight> = {
  title: 'Token Killer/Components/AnomalyHighlight',
  component: AnomalyHighlight,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

const mockAnomalies: AnomalyDetectionResult = {
  anomalies: [
    {
      timestamp: new Date('2024-01-05'),
      totalTokens: 25000,
      zScore: 2.5,
      deviation: '150% above mean',
      context: '250 records on 2024-01-05',
    },
    {
      timestamp: new Date('2024-01-06'),
      totalTokens: 22000,
      zScore: 2.2,
      deviation: '120% above mean',
      context: '220 records on 2024-01-06',
    },
  ],
  mean: 10000,
  stdDev: 5000,
  threshold: 2,
  dataPoints: 7,
}

export const AnomalyHighlightStory: StoryObj<typeof AnomalyHighlight> = {
  render: () => <AnomalyHighlight anomalies={mockAnomalies} />,
}

/**
 * Loading Indicator Stories
 */
const loadingMeta: Meta<typeof LoadingIndicator> = {
  title: 'Token Killer/Components/LoadingIndicator',
  component: LoadingIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const LoadingIndicatorStory: StoryObj<typeof LoadingIndicator> = {
  render: () => <LoadingIndicator />,
}

/**
 * Error State Stories
 */
const errorMeta: Meta<typeof ErrorState> = {
  title: 'Token Killer/Components/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const ErrorStateStory: StoryObj<typeof ErrorState> = {
  render: (args) => (
    <ErrorState
      error={args.error}
      onRetry={args.onRetry}
    />
  ),
  args: {
    error: 'Failed to fetch token statistics: Connection timeout',
    onRetry: () => console.log('Retrying...'),
  },
}

/**
 * Dashboard Header Stories
 */
const headerMeta: Meta<typeof DashboardHeader> = {
  title: 'Token Killer/Components/DashboardHeader',
  component: DashboardHeader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const DashboardHeaderStory: StoryObj<typeof DashboardHeader> = {
  render: (args) => (
    <DashboardHeader
      autoRefresh={args.autoRefresh}
      onAutoRefreshChange={args.onAutoRefreshChange}
      onRefresh={args.onRefresh}
    />
  ),
  args: {
    autoRefresh: true,
    onAutoRefreshChange: (enabled) => console.log('Auto-refresh:', enabled),
    onRefresh: () => console.log('Refreshing...'),
  },
}

/**
 * Documentation Story
 */
export const Documentation: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Token Killer Dashboard</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-gray-700 mb-4">
          The Token Killer Dashboard provides comprehensive visualization of token consumption
          across your applications with interactive charts, real-time updates, and anomaly detection.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Multiple time windows (24h, 7d, 30d, 90d, all-time)</li>
          <li>Interactive charts with uPlot for high-performance rendering</li>
          <li>Anomaly detection with context information</li>
          <li>Real-time data updates with auto-refresh</li>
          <li>Responsive design for desktop and mobile</li>
          <li>Dark mode support</li>
          <li>Token breakdown by agent type, model, and strategy</li>
          <li>Cost tracking in USD and BRL</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Components</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">TokenKillerDashboard</h3>
            <p className="text-gray-700">Main dashboard component that orchestrates all sub-components</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">TimeWindowSelector</h3>
            <p className="text-gray-700">Allows users to select different time windows for visualization</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">TokenStatsChart</h3>
            <p className="text-gray-700">Displays token consumption over time using uPlot</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">TokenBreakdownChart</h3>
            <p className="text-gray-700">Shows token distribution by various dimensions</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">AnomalyHighlight</h3>
            <p className="text-gray-700">Displays detected anomalies with context and recommendations</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">LoadingIndicator</h3>
            <p className="text-gray-700">Shows skeleton loading state while data is being fetched</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">ErrorState</h3>
            <p className="text-gray-700">Displays error messages with troubleshooting steps</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">DashboardHeader</h3>
            <p className="text-gray-700">Header with title and controls for refresh and auto-refresh</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Integration</h2>
        <p className="text-gray-700 mb-4">The dashboard communicates with the following API endpoints:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 font-mono text-sm">
          <li>GET /api/token-killer/stats/:timeWindow</li>
          <li>GET /api/token-killer/breakdown/:timeWindow/:breakdownType</li>
          <li>GET /api/token-killer/anomalies/:timeWindow</li>
          <li>GET /api/token-killer/health</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Requirements Met</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>✅ Requirement 6.1: Time window selector</li>
          <li>✅ Requirement 6.2: Token consumption data</li>
          <li>✅ Requirement 6.3: Interactive charts with canvas rendering</li>
          <li>✅ Requirement 6.4: Anomaly detection</li>
          <li>✅ Requirement 6.5: Context display</li>
          <li>✅ Requirement 6.6: Loading indicators</li>
          <li>✅ Requirement 6.7: Error states</li>
        </ul>
      </section>
    </div>
  ),
}
