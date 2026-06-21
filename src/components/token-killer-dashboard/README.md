# Token Killer Dashboard Components

## Status: ⏸️ DEFERRED

⚠️ **This project is paused indefinitely.** Do not implement or reference these designs in active development. Focus on feature implementation first.

Web dashboard frontend for visualizing token consumption with interactive charts and real-time updates.

## Overview

The Token Killer Dashboard provides a comprehensive visualization of token consumption across your applications with the following features:

- **Multiple Time Windows**: 24h, 7d, 30d, 90d, all-time
- **Interactive Charts**: uPlot-based visualization optimized for 100K+ data points
- **Anomaly Detection**: Automatic detection and highlighting of unusual consumption patterns
- **Real-time Updates**: Auto-refresh capability with configurable intervals
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Full dark mode support for comfortable viewing

## Components

### TokenKillerDashboard

Main dashboard component that orchestrates all sub-components.

```tsx
import { TokenKillerDashboard } from '@/components/token-killer-dashboard'

export default function Page() {
  return <TokenKillerDashboard />
}
```

### TimeWindowSelector

Allows users to select different time windows for data visualization.

```tsx
import { TimeWindowSelector } from '@/components/token-killer-dashboard'

<TimeWindowSelector
  selectedWindow="7d"
  onWindowChange={(window) => console.log(window)}
/>
```

### TokenStatsChart

Displays token consumption over time using uPlot for high-performance rendering.

```tsx
import { TokenStatsChart } from '@/components/token-killer-dashboard'

<TokenStatsChart data={statsData} timeWindow="7d" />
```

### TokenBreakdownChart

Shows token distribution by agent type, request type, model, or optimization strategy.

```tsx
import { TokenBreakdownChart } from '@/components/token-killer-dashboard'

<TokenBreakdownChart
  data={statsData}
  breakdownType="agent-type"
  timeWindow="7d"
/>
```

### AnomalyHighlight

Displays detected anomalies with context and recommendations.

```tsx
import { AnomalyHighlight } from '@/components/token-killer-dashboard'

<AnomalyHighlight anomalies={anomalyData} />
```

### LoadingIndicator

Shows skeleton loading state while data is being fetched.

```tsx
import { LoadingIndicator } from '@/components/token-killer-dashboard'

<LoadingIndicator />
```

### ErrorState

Displays error messages with troubleshooting steps and retry functionality.

```tsx
import { ErrorState } from '@/components/token-killer-dashboard'

<ErrorState
  error="Failed to fetch data"
  onRetry={() => fetchData()}
/>
```

### DashboardHeader

Header component with title and controls for auto-refresh and manual refresh.

```tsx
import { DashboardHeader } from '@/components/token-killer-dashboard'

<DashboardHeader
  autoRefresh={true}
  onAutoRefreshChange={(enabled) => console.log(enabled)}
  onRefresh={() => fetchData()}
/>
```

## API Integration

The dashboard components communicate with the Token Killer API endpoints:

- `GET /api/token-killer/stats/:timeWindow` - Get aggregated token statistics
- `GET /api/token-killer/breakdown/:timeWindow/:breakdownType` - Get token breakdown
- `GET /api/token-killer/anomalies/:timeWindow` - Get anomaly detection results
- `GET /api/token-killer/health` - Health check endpoint

## Types

All TypeScript types are exported from the `types.ts` file:

```tsx
import type {
  TimeWindow,
  AggregatedTokenData,
  AnomalyDetectionResult,
  TokenBreakdown,
  TokenBreakdownResponse,
} from '@/components/token-killer-dashboard'
```

## Features

### Time Windows

- **24h**: Hourly data aggregation
- **7d**: Daily data aggregation (default)
- **30d**: Weekly data aggregation
- **90d**: Weekly data aggregation
- **all-time**: Monthly data aggregation

### Chart Technology

Uses **uPlot** for high-performance rendering:
- Handles 100K+ data points efficiently
- Canvas-based rendering for optimal performance
- Smooth zooming and panning
- Interactive tooltips and legends
- ~15KB gzipped bundle size

### Real-time Updates

- Auto-refresh every 30 seconds (configurable)
- Manual refresh button
- Toggle for auto-refresh on/off
- Non-blocking updates

### Anomaly Detection

- Z-score based anomaly detection
- Configurable threshold (default: 2σ)
- Context information for each anomaly
- Recommendations for investigation

## Styling

Components use Tailwind CSS with:
- Light and dark mode support
- Responsive design (mobile, tablet, desktop)
- Accessible color contrasts
- Smooth transitions and animations

## Performance Considerations

1. **Data Aggregation**: API aggregates data into appropriate buckets based on time window
2. **Lazy Loading**: Charts are rendered only when visible
3. **Efficient Updates**: Only changed data is re-rendered
4. **Memory Management**: Charts are properly destroyed on unmount
5. **Responsive Sizing**: Charts automatically resize on window resize

## Error Handling

- Graceful error messages with troubleshooting steps
- Retry functionality for failed requests
- Fallback UI for missing data
- Console logging for debugging

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast mode support
- Screen reader friendly

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Requirements Met

✅ Requirement 6.1: Time window selector (24h, 7d, 30d, 90d, all-time)
✅ Requirement 6.2: Token consumption data with multiple time windows
✅ Requirement 6.3: Interactive charts with canvas rendering
✅ Requirement 6.4: Anomaly detection and highlighting
✅ Requirement 6.5: Context display for anomalies
✅ Requirement 6.6: Loading indicators
✅ Requirement 6.7: Error states with troubleshooting

## Future Enhancements

- Export charts as PNG/PDF
- Custom date range selection
- Advanced filtering options
- Comparison between time periods
- Predictive analytics
- Custom alerts and notifications
