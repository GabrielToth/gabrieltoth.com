# Insights Tab Components

This directory contains all components for the Insights tab of the dashboard redesign.

## Components

### InsightsContainer
Main container component for the Insights tab. Manages state for metrics and analytics data, and coordinates child components.

**Features:**
- Manages metrics state
- Manages time period selection
- Manages graph data
- Provides filtering logic
- API integration for fetching analytics
- Loading and error states
- Data caching
- Responsive layout

**Props:**
- `children?: React.ReactNode` - Optional children to render instead of default layout

### TimePeriodSelector
Component for selecting the time period for analytics (Last 7 days, Last 30 days, Last 90 days).

**Features:**
- Select time period
- Update metrics and graphs when period changes
- Display selected period
- Responsive design

**Props:**
- `selectedPeriod: '7d' | '30d' | '90d'` - Currently selected period
- `onPeriodChange: (period: '7d' | '30d' | '90d') => void` - Callback when period changes

### MetricsGrid
Container for metric cards displaying key performance indicators.

**Features:**
- Display metric cards in a responsive grid
- Show loading skeleton
- Show error message with retry button
- Responsive design (1 column on mobile, 2 on tablet, 4 on desktop)

**Props:**
- `metrics: Metric[]` - Array of metrics to display
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message
- `onRetry?: () => void` - Retry callback

### MetricCard
Individual metric display with value, change, and icon.

**Features:**
- Display metric name, value, change, and icon
- Show positive/negative change with color coding
- Responsive design
- Accessible

**Props:**
- `metric: Metric` - Metric data to display

### ChannelGraphs
Display performance graphs per social channel.

**Features:**
- Display line or bar charts for performance trends
- Separate graphs for each social channel
- Show data points for: Followers, Engagement, Reach, Impressions
- Clear axes labels and legend
- Responsive design
- Average statistics for each channel
- Data table with recent data points

**Props:**
- `channels: SocialChannel[]` - Array of social channels
- `data: GraphData[]` - Graph data points
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message
- `onRetry?: () => void` - Retry callback

### ChannelComparison
Compare metrics across different social channels.

**Features:**
- Compare metrics across different social channels
- Side-by-side comparison view
- Allow users to select which channels to compare
- Display summary showing highest value for each metric
- Responsive design

**Props:**
- `channels: SocialChannel[]` - Array of social channels
- `selectedChannels: string[]` - Array of selected channel IDs
- `metrics: Metric[]` - Array of metrics to compare
- `onChannelSelectionChange: (channels: string[]) => void` - Callback when selection changes
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message
- `onRetry?: () => void` - Retry callback

## Type Definitions

### Metric
```typescript
interface Metric {
  id: string
  name: string
  value: number
  change: number
  changePercent: number
  icon: string
  channel?: string
}
```

### SocialChannel
```typescript
interface SocialChannel {
  id: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin'
  accountId: string
  accountName: string
  isConnected: boolean
  connectedAt?: Date
}
```

### GraphData
```typescript
interface GraphData {
  date: string
  followers?: number
  engagement?: number
  reach?: number
  impressions?: number
  channel: string
}
```

## Usage

```tsx
import { InsightsContainer } from '@/components/insights'

export default function InsightsPage() {
  return <InsightsContainer />
}
```

## Testing

All components have comprehensive unit tests. Run tests with:

```bash
npm run test -- src/components/insights
```

## Future Enhancements

1. **Recharts Integration**: Replace table-based graphs with interactive Recharts visualizations
2. **Custom Date Range**: Allow users to select custom date ranges
3. **Export Analytics**: Export analytics data to PDF/CSV
4. **Advanced Filtering**: Filter by specific metrics or channels
5. **Real-time Updates**: WebSocket integration for real-time data updates
6. **Caching**: Implement SWR or React Query for better data caching
7. **Performance Optimization**: Memoization and code splitting for large datasets
