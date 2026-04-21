# Dashboard Components

This directory contains the core layout components for the dashboard redesign.

## Components

### NavMenu

Main navigation tabs component for dashboard sections.

**Features:**
- Accepts items array with id, label, and optional icon
- Active state indicator with blue highlight
- Click callback for navigation
- Tailwind CSS styling with Vercel color palette
- Accessible with ARIA attributes
- Focus indicators for keyboard navigation

**Props:**
- `items: NavItem[]` - Array of navigation items
- `activeItem: string` - ID of currently active item
- `onItemClick: (itemId: string) => void` - Callback when item is clicked
- `className?: string` - Optional custom CSS classes

**Types:**
```tsx
interface NavItem {
  id: string
  label: string
  icon?: React.ReactNode
}

interface NavMenuProps {
  items: NavItem[]
  activeItem: string
  onItemClick: (itemId: string) => void
  className?: string
}
```

**Example:**
```tsx
import { NavMenu, type NavItem } from '@/components/dashboard'

const items: NavItem[] = [
  { id: 'publish', label: 'Publish', icon: '📝' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function MyComponent() {
  const [activeItem, setActiveItem] = useState('publish')

  return (
    <NavMenu
      items={items}
      activeItem={activeItem}
      onItemClick={setActiveItem}
    />
  )
}
```

### ChannelConnector

Social channel connection management UI component.

**Features:**
- Display icons for supported social networks
- Show connection status (connected/disconnected)
- Allow users to connect/disconnect channels
- Visual indicators for connection status (checkmark for connected)
- Connection status summary
- Tailwind CSS styling with Vercel color palette
- Accessible with ARIA attributes
- Hover tooltips for channel names

**Props:**
- `channels: SocialChannel[]` - Array of social channels
- `onConnect: (channelId: string) => void` - Callback when channel is connected
- `onDisconnect: (channelId: string) => void` - Callback when channel is disconnected
- `className?: string` - Optional custom CSS classes

**Types:**
```tsx
interface SocialChannel {
  id: string
  name: string
  icon: React.ReactNode
  isConnected: boolean
}

interface ChannelConnectorProps {
  channels: SocialChannel[]
  onConnect: (channelId: string) => void
  onDisconnect: (channelId: string) => void
  className?: string
}
```

**Example:**
```tsx
import { ChannelConnector, type SocialChannel } from '@/components/dashboard'

const channels: SocialChannel[] = [
  { id: 'facebook', name: 'Facebook', icon: 'f', isConnected: true },
  { id: 'instagram', name: 'Instagram', icon: '📷', isConnected: false },
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏', isConnected: true },
  { id: 'tiktok', name: 'TikTok', icon: '♪', isConnected: false },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', isConnected: false },
]

export default function MyComponent() {
  const [channels, setChannels] = useState(channels)

  const handleConnect = (channelId: string) => {
    setChannels(
      channels.map(ch =>
        ch.id === channelId ? { ...ch, isConnected: true } : ch
      )
    )
  }

  const handleDisconnect = (channelId: string) => {
    setChannels(
      channels.map(ch =>
        ch.id === channelId ? { ...ch, isConnected: false } : ch
      )
    )
  }

  return (
    <ChannelConnector
      channels={channels}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  )
}
```

### DashboardLayout

Main layout wrapper for authenticated dashboard. Combines Sidebar navigation with main content area.

**Features:**
- Responsive design (sidebar collapses to hamburger on mobile <768px)
- Manages sidebar open/close state
- Handles tab navigation
- Mobile overlay when sidebar is open

**Props:**
- `children: React.ReactNode` - Main content to display
- `activeTab: 'publish' | 'insights' | 'settings'` - Currently active tab
- `onTabChange?: (tab: 'publish' | 'insights' | 'settings') => void` - Callback when tab changes

**Example:**
```tsx
import { DashboardLayout } from '@/components/dashboard'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'publish' | 'insights' | 'settings'>('publish')

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Your content here */}
    </DashboardLayout>
  )
}
```

### Sidebar

Navigation and organization info sidebar component.

**Features:**
- Logo display (40x40)
- Navigation menu (Publish, Insights, Settings)
- Connect Channels section with social network icons
- Organization info display
- Logout button
- Responsive: 240px on desktop, hamburger menu on mobile
- Both desktop and mobile versions rendered (mobile hidden on desktop via CSS)

**Props:**
- `activeTab: string` - Currently active tab
- `onTabChange: (tab: string) => void` - Callback when tab changes
- `isOpen?: boolean` - Mobile sidebar open state
- `onClose?: () => void` - Callback to close mobile sidebar
- `organization?: { name: string; plan: 'free' | 'pro' | 'enterprise' }` - Organization info
- `onLogout?: () => void` - Callback when logout is clicked

**Example:**
```tsx
import { Sidebar } from '@/components/dashboard'

export default function MyComponent() {
  return (
    <Sidebar
      activeTab="publish"
      onTabChange={(tab) => console.log(tab)}
      organization={{ name: 'My Org', plan: 'pro' }}
      onLogout={() => console.log('Logging out')}
    />
  )
}
```

## Styling

Components use Tailwind CSS with the Vercel color palette:
- Primary Blue: `#0070F3` (bg-blue-600)
- Dark Background: `#000000`
- White: `#FFFFFF`
- Light Gray: `#F5F5F5`
- Border Gray: `#EBEBEB`

## Responsive Design

- **Desktop (≥1024px)**: Full sidebar visible on left
- **Tablet (768px-1024px)**: Sidebar visible but may be adjusted
- **Mobile (<768px)**: Sidebar hidden, hamburger menu in header

## Accessibility

- Semantic HTML elements (`<nav>`, `<main>`, `<aside>`)
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus indicators on interactive elements
- Proper heading hierarchy

## Testing

All components include comprehensive unit tests:
- `NavMenu.test.tsx` - 11 tests
- `ChannelConnector.test.tsx` - 16 tests
- `DashboardLayout.test.tsx` - 8 tests
- `Sidebar.test.tsx` - 14 tests

Run tests with:
```bash
npm run test -- src/components/dashboard/
```

## Future Enhancements

- Add real social channel connection logic
- Integrate with authentication system
- Add organization switcher
- Add user profile menu
- Add notifications badge
- Add theme toggle
