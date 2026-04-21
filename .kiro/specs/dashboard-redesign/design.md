# Design Document - Dashboard Redesign

## Overview

This document specifies the technical design for the dashboard redesign, including component architecture, layout structure, color system, and implementation details using Next.js 16, TypeScript, and Tailwind CSS.

## Color Palette (Vercel-inspired)

```
Primary Blue:     #0070F3
Dark Background:  #000000
White:            #FFFFFF
Light Gray:       #F5F5F5
Dark Gray:        #1A1A1A
Border Gray:      #EBEBEB
Success Green:    #0FD66F
Error Red:        #FF4757
Warning Orange:   #FFA502
Text Primary:     #000000
Text Secondary:   #666666
```

## Layout Architecture

### Main Layout Structure

```
┌─────────────────────────────────────────┐
│         Header (optional)               │
├──────────────┬──────────────────────────┤
│              │                          │
│   Sidebar    │    Main Content Area     │
│   (240px)    │                          │
│              │                          │
│              │                          │
└──────────────┴──────────────────────────┘
```

### Sidebar Components

```
┌─────────────────────────┐
│  Logo (40x40)           │
├─────────────────────────┤
│  Navigation Menu        │
│  • Publish              │
│  • Insights             │
│  • Settings             │
├─────────────────────────┤
│  Connect Channels       │
│  • Facebook             │
│  • Instagram            │
│  • Twitter/X            │
│  • TikTok               │
│  • LinkedIn             │
│  • More channels        │
├─────────────────────────┤
│  Organization Info      │
│  • Name                 │
│  • Plan                 │
├─────────────────────────┤
│  Logout Button          │
└─────────────────────────┘
```

## Component Architecture

### 1. Layout Components

#### DashboardLayout
- **Purpose**: Main layout wrapper for authenticated dashboard
- **Props**: 
  - `children: React.ReactNode`
  - `activeTab: 'publish' | 'insights' | 'settings'`
- **Structure**: Sidebar + Main content area
- **Responsive**: Sidebar collapses to hamburger on mobile (<768px)

#### Sidebar
- **Purpose**: Navigation and organization info
- **Props**:
  - `activeTab: string`
  - `onTabChange: (tab: string) => void`
  - `organization: Organization`
- **Children**: Logo, Navigation, Channels, OrgInfo, Logout

### 2. Navigation Components

#### NavMenu
- **Purpose**: Main navigation tabs
- **Props**:
  - `items: NavItem[]`
  - `activeItem: string`
  - `onItemClick: (item: string) => void`
- **Items**: Publish, Insights, Settings

#### ChannelConnector
- **Purpose**: Social channel connection UI
- **Props**:
  - `channels: SocialChannel[]`
  - `onConnect: (channel: string) => void`
  - `onDisconnect: (channel: string) => void`
- **Channels**: Facebook, Instagram, Twitter/X, TikTok, LinkedIn

### 3. Publish Tab Components

#### PublishContainer
- **Purpose**: Main container for Publish tab
- **Props**: None (uses context/hooks for data)
- **Children**: FilterBar, PostList

#### FilterBar
- **Purpose**: Filter posts by social channel
- **Props**:
  - `channels: SocialChannel[]`
  - `selectedChannels: string[]`
  - `onFilterChange: (channels: string[]) => void`
- **Features**: Multi-select, clear all button

#### PostList
- **Purpose**: Display list of posts
- **Props**:
  - `posts: Post[]`
  - `onEdit: (post: Post) => void`
  - `onDelete: (post: Post) => void`
- **Children**: PostCard (repeated)

#### PostCard
- **Purpose**: Individual post display
- **Props**:
  - `post: Post`
  - `onEdit: () => void`
  - `onDelete: () => void`
- **Fields**: Title, scheduled date, status, channels, actions

### 4. Insights Tab Components

#### InsightsContainer
- **Purpose**: Main container for Insights tab
- **Props**: None (uses context/hooks for data)
- **Children**: TimePeriodSelector, MetricsGrid, ChannelGraphs, ChannelComparison

#### TimePeriodSelector
- **Purpose**: Select time period for analytics
- **Props**:
  - `selectedPeriod: '7d' | '30d' | '90d'`
  - `onPeriodChange: (period: string) => void`
- **Options**: Last 7 days, Last 30 days, Last 90 days

#### MetricsGrid
- **Purpose**: Display key metrics in card layout
- **Props**:
  - `metrics: Metric[]`
- **Children**: MetricCard (repeated)

#### MetricCard
- **Purpose**: Individual metric display
- **Props**:
  - `metric: Metric`
  - `icon: React.ReactNode`
- **Fields**: Name, value, change, icon

#### ChannelGraphs
- **Purpose**: Display performance graphs per channel
- **Props**:
  - `channels: SocialChannel[]`
  - `data: GraphData[]`
- **Chart Type**: Line or bar chart (using Recharts)

#### ChannelComparison
- **Purpose**: Compare metrics across channels
- **Props**:
  - `channels: SocialChannel[]`
  - `metrics: Metric[]`
- **Display**: Side-by-side comparison table

### 5. Settings Tab Components

#### SettingsContainer
- **Purpose**: Main container for Settings tab
- **Props**: None (uses context/hooks for data)
- **Children**: ProfileSection, PreferencesSection, ChannelsSection, SecuritySection, BillingSection, IntegrationsSection

#### ProfileSection
- **Purpose**: User profile management
- **Props**:
  - `user: User`
  - `onSave: (user: User) => void`
- **Fields**: Name, Email, Profile Photo

#### PreferencesSection
- **Purpose**: User preferences
- **Props**:
  - `preferences: Preferences`
  - `onSave: (preferences: Preferences) => void`
- **Fields**: Notifications toggle, Language select, Theme select

#### ChannelsSection
- **Purpose**: Manage connected social channels
- **Props**:
  - `channels: SocialChannel[]`
  - `onDisconnect: (channel: string) => void`
  - `onConnect: () => void`
- **Display**: List of connected channels with disconnect buttons

#### SecuritySection
- **Purpose**: Security settings
- **Props**:
  - `user: User`
  - `onUpdate: (data: SecurityData) => void`
- **Fields**: 2FA toggle, Password change form

#### BillingSection
- **Purpose**: Billing and subscription management
- **Props**:
  - `billing: BillingInfo`
  - `onUpgrade: () => void`
- **Fields**: Current plan, next billing date, upgrade button, invoice history

#### IntegrationsSection
- **Purpose**: Third-party integrations
- **Props**:
  - `integrations: Integration[]`
  - `onConnect: (app: string) => void`
  - `onDisconnect: (app: string) => void`
- **Display**: List of connected apps with connect/disconnect buttons

### 6. Shared UI Components

#### Card
- **Purpose**: Content container
- **Props**:
  - `className?: string`
  - `children: React.ReactNode`
- **Styling**: White background, light gray border, rounded corners

#### Button
- **Purpose**: Interactive button
- **Props**:
  - `variant: 'primary' | 'secondary' | 'danger'`
  - `size: 'sm' | 'md' | 'lg'`
  - `onClick: () => void`
  - `disabled?: boolean`
  - `children: React.ReactNode`
- **Variants**:
  - Primary: #0070F3 background, white text
  - Secondary: #F5F5F5 background, black text
  - Danger: #FF4757 background, white text

#### Tab
- **Purpose**: Tab navigation
- **Props**:
  - `tabs: TabItem[]`
  - `activeTab: string`
  - `onTabChange: (tab: string) => void`
- **Display**: Horizontal tab bar with underline indicator

#### Modal
- **Purpose**: Dialog overlay
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `title: string`
  - `children: React.ReactNode`
- **Features**: Backdrop, close button, centered content

#### Form
- **Purpose**: Form wrapper with validation
- **Props**:
  - `onSubmit: (data: any) => void`
  - `children: React.ReactNode`
- **Features**: Error display, submit button

#### Input
- **Purpose**: Text input field
- **Props**:
  - `label: string`
  - `value: string`
  - `onChange: (value: string) => void`
  - `error?: string`
  - `placeholder?: string`
- **Features**: Label, error message, placeholder

#### Select
- **Purpose**: Dropdown select
- **Props**:
  - `label: string`
  - `options: Option[]`
  - `value: string`
  - `onChange: (value: string) => void`
  - `error?: string`
- **Features**: Label, error message, placeholder

#### Toggle
- **Purpose**: On/off switch
- **Props**:
  - `label: string`
  - `checked: boolean`
  - `onChange: (checked: boolean) => void`
- **Features**: Label, visual toggle indicator

#### Icon
- **Purpose**: SVG icon wrapper
- **Props**:
  - `name: string`
  - `size: 'sm' | 'md' | 'lg'`
  - `color?: string`
- **Icons**: Facebook, Instagram, Twitter, TikTok, LinkedIn, Settings, Logout, etc.

## Data Models

### User
```typescript
interface User {
  id: string
  name: string
  email: string
  profilePhoto?: string
  createdAt: Date
  updatedAt: Date
}
```

### Organization
```typescript
interface Organization {
  id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  channels: SocialChannel[]
  createdAt: Date
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

### Post
```typescript
interface Post {
  id: string
  title: string
  content: string
  scheduledAt: Date
  publishedAt?: Date
  status: 'scheduled' | 'published' | 'failed'
  channels: string[]
  errorMessage?: string
  createdAt: Date
}
```

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

### Preferences
```typescript
interface Preferences {
  notificationsEnabled: boolean
  language: 'en' | 'pt' | 'es' | 'fr'
  theme: 'light' | 'dark' | 'auto'
}
```

### BillingInfo
```typescript
interface BillingInfo {
  plan: string
  price: number
  nextBillingDate: Date
  invoices: Invoice[]
}
```

### Integration
```typescript
interface Integration {
  id: string
  name: string
  icon: string
  isConnected: boolean
  connectedAt?: Date
}
```

## Styling Strategy

### Tailwind CSS Configuration

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    colors: {
      primary: '#0070F3',
      dark: '#000000',
      white: '#FFFFFF',
      gray: {
        50: '#F5F5F5',
        100: '#EBEBEB',
        600: '#666666',
        900: '#1A1A1A',
      },
      success: '#0FD66F',
      error: '#FF4757',
      warning: '#FFA502',
    },
    spacing: {
      sidebar: '240px',
      card: '16px',
    },
  },
}
```

### Component Styling Patterns

#### Card Component
```css
.card {
  @apply bg-white border border-gray-100 rounded-lg p-4 shadow-sm;
}
```

#### Button Component
```css
.btn-primary {
  @apply bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition;
}

.btn-secondary {
  @apply bg-gray-50 text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition;
}

.btn-danger {
  @apply bg-error text-white px-4 py-2 rounded-lg hover:bg-red-600 transition;
}
```

## Responsive Design Breakpoints

```
Mobile:   < 768px   (single column, hamburger menu)
Tablet:   768px - 1024px (adjusted layout)
Desktop:  ≥ 1024px  (full layout with sidebar)
```

### Mobile Adjustments
- Sidebar converts to hamburger menu
- Single column layout for all content
- Touch-friendly button sizes (44x44px minimum)
- Readable text sizes (16px minimum)

## Accessibility Features

### WCAG 2.1 AA Compliance

1. **Color Contrast**: All text meets 4.5:1 contrast ratio
2. **Keyboard Navigation**: All interactive elements accessible via Tab key
3. **Focus Indicators**: Visible focus rings on all focusable elements
4. **Semantic HTML**: Proper use of `<button>`, `<nav>`, `<main>`, `<section>`, etc.
5. **ARIA Labels**: Icon-only buttons have `aria-label` attributes
6. **Alt Text**: All images have descriptive alt text
7. **Form Labels**: All inputs have associated `<label>` elements
8. **Screen Reader Support**: Proper heading hierarchy and landmark regions

## File Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── publish/
│   │   │   └── page.tsx
│   │   ├── insights/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── NavMenu.tsx
│   │   └── ChannelConnector.tsx
│   ├── publish/
│   │   ├── PublishContainer.tsx
│   │   ├── FilterBar.tsx
│   │   ├── PostList.tsx
│   │   └── PostCard.tsx
│   ├── insights/
│   │   ├── InsightsContainer.tsx
│   │   ├── TimePeriodSelector.tsx
│   │   ├── MetricsGrid.tsx
│   │   ├── MetricCard.tsx
│   │   ├── ChannelGraphs.tsx
│   │   └── ChannelComparison.tsx
│   ├── settings/
│   │   ├── SettingsContainer.tsx
│   │   ├── ProfileSection.tsx
│   │   ├── PreferencesSection.tsx
│   │   ├── ChannelsSection.tsx
│   │   ├── SecuritySection.tsx
│   │   ├── BillingSection.tsx
│   │   └── IntegrationsSection.tsx
│   └── ui/
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── Tab.tsx
│       ├── Modal.tsx
│       ├── Form.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Toggle.tsx
│       └── Icon.tsx
├── hooks/
│   ├── useDashboard.ts
│   ├── usePublish.ts
│   ├── useInsights.ts
│   └── useSettings.ts
├── types/
│   ├── dashboard.ts
│   ├── social.ts
│   ├── analytics.ts
│   └── user.ts
└── lib/
    ├── api/
    │   ├── social.ts
    │   ├── analytics.ts
    │   └── user.ts
    └── utils/
        ├── formatting.ts
        └── validation.ts
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Set up layout components (DashboardLayout, Sidebar)
- Create shared UI components (Card, Button, Input, etc.)
- Implement navigation and routing

### Phase 2: Publish Tab (Week 2)
- Create PublishContainer, FilterBar, PostList, PostCard
- Implement post filtering and actions
- Connect to API for post data

### Phase 3: Insights Tab (Week 3)
- Create InsightsContainer and metric components
- Implement time period selector
- Create charts using Recharts
- Implement channel comparison

### Phase 4: Settings Tab (Week 4)
- Create all settings sections
- Implement form validation
- Connect to API for user data updates

### Phase 5: Polish & Testing (Week 5)
- Responsive design refinement
- Accessibility testing and fixes
- Performance optimization
- Cross-browser testing

## Performance Considerations

1. **Code Splitting**: Lazy load tab components
2. **Image Optimization**: Use Next.js Image component
3. **Caching**: Cache API responses with SWR or React Query
4. **Bundle Size**: Tree-shake unused Tailwind CSS
5. **Rendering**: Use React.memo for expensive components

## Security Considerations

1. **Authentication**: Verify user session before rendering dashboard
2. **Authorization**: Check user permissions for each section
3. **CSRF Protection**: Include CSRF tokens in forms
4. **XSS Prevention**: Sanitize user input and API responses
5. **API Security**: Use secure headers and HTTPS only

## Testing Strategy

1. **Unit Tests**: Test individual components with Jest
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test user workflows with Playwright
4. **Accessibility Tests**: Use axe-core for automated testing
5. **Visual Regression**: Use Percy or similar tools

## Future Enhancements

1. Dark mode toggle
2. Custom date range selector
3. Export analytics to PDF/CSV
4. Scheduled post templates
5. Team collaboration features
6. Advanced analytics and AI insights
7. Mobile app version
8. API for third-party integrations
