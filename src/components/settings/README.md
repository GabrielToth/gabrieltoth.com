# Settings Components

This directory contains all components for the Settings Tab of the dashboard redesign.

## Components

### SettingsContainer
Main container for the Settings tab that manages state for all settings sections and coordinates between them.

**Features:**
- Manages user profile state
- Manages preferences state
- Manages connected channels
- Manages security settings
- Manages billing information
- Manages integrations
- Tab-based navigation between sections
- API integration for fetching and updating settings
- Loading and error states
- Data caching

**Props:**
- `children?: React.ReactNode` - Optional children to render instead of default sections

### ProfileSection
User profile management component for editing name, email, and profile photo.

**Features:**
- Edit user name
- Edit user email
- Upload/change profile photo
- Form validation
- Save functionality
- Error handling
- Success messages

**Props:**
- `user: User` - Current user data
- `onSave: (user: User) => void` - Callback when profile is saved
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message

### PreferencesSection
User preferences management component for notifications, language, and theme settings.

**Features:**
- Toggle notifications on/off
- Select language (English, Portuguese, Spanish, French)
- Select theme (Light, Dark, Auto)
- Apply changes immediately
- Persist preferences

**Props:**
- `preferences: Preferences` - Current preferences
- `onSave: (preferences: Preferences) => void` - Callback when preferences are saved

### ChannelsSection
Manage connected social media channels.

**Features:**
- Display connected channels
- Show connection status
- Disconnect channels with confirmation
- Add new channels
- Display available channels
- Connection date tracking

**Props:**
- `channels: SocialChannel[]` - List of channels
- `onDisconnect: (channelId: string) => void` - Callback when channel is disconnected
- `onConnect: () => void` - Callback when add channel is clicked

### SecuritySection
Security settings management for 2FA and password changes.

**Features:**
- Enable/disable 2FA
- 2FA setup with QR code
- Change password form
- Password requirements validation
- Current password verification
- Error handling

**Props:**
- `user: User | null` - Current user data

### BillingSection
Billing and subscription management.

**Features:**
- Display current plan
- Show plan details and price
- Display next billing date
- Upgrade plan option
- Billing history with invoices
- Download invoices
- Invoice status tracking

**Props:**
- `billing: BillingInfo` - Billing information
- `onUpgrade: () => void` - Callback when upgrade is clicked

### IntegrationsSection
Third-party integrations management.

**Features:**
- Display connected integrations
- Show connection status
- Disconnect integrations with confirmation
- Add new integrations
- Display available integrations
- Connection date tracking

**Props:**
- `integrations: Integration[]` - List of integrations
- `onDisconnect: (integrationId: string) => void` - Callback when integration is disconnected
- `onConnect: () => void` - Callback when add integration is clicked

## Data Types

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

### SocialChannel
```typescript
interface SocialChannel {
  id: string
  platform: "facebook" | "instagram" | "twitter" | "tiktok" | "linkedin"
  accountId: string
  accountName: string
  isConnected: boolean
  connectedAt?: Date
}
```

### Preferences
```typescript
interface Preferences {
  notificationsEnabled: boolean
  language: "en" | "pt" | "es" | "fr"
  theme: "light" | "dark" | "auto"
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

### Invoice
```typescript
interface Invoice {
  id: string
  date: Date
  amount: number
  status: "paid" | "pending" | "failed"
  downloadUrl: string
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

## API Integration

The settings components use the User API service (`src/lib/api/user.ts`) for data fetching and updates:

- `fetchUserProfile()` - Get user profile
- `updateUserProfile(user)` - Update user profile
- `fetchUserPreferences()` - Get user preferences
- `updateUserPreferences(preferences)` - Update preferences
- `fetchBillingInfo()` - Get billing information
- `fetchIntegrations()` - Get integrations list
- `connectIntegration(id)` - Connect an integration
- `disconnectIntegration(id)` - Disconnect an integration
- `changePassword(current, new)` - Change password
- `enableTwoFactor()` - Enable 2FA
- `disableTwoFactor()` - Disable 2FA
- `downloadInvoice(id)` - Download invoice

## Usage

```tsx
import { SettingsContainer } from "@/components/settings"

export default function SettingsPage() {
  return <SettingsContainer />
}
```

## Testing

All components include comprehensive unit tests:

- `SettingsContainer.test.tsx` - Tests for main container and tab navigation
- `ProfileSection.test.tsx` - Tests for profile form and validation
- `PreferencesSection.test.tsx` - Tests for preferences toggles and selects
- `ChannelsSection.test.tsx` - Tests for channel management
- `SecuritySection.test.tsx` - Tests for 2FA and password change
- `BillingSection.test.tsx` - Tests for billing display and invoices
- `IntegrationsSection.test.tsx` - Tests for integration management

Run tests with:
```bash
npm run test
```

## Accessibility

All components follow WCAG 2.1 AA standards:

- Proper semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Form labels associated with inputs
- Error messages linked to inputs
- Color contrast ratios meet standards

## Styling

Components use Tailwind CSS with the Vercel color palette:

- Primary Blue: `#0070F3`
- Dark Background: `#000000`
- White: `#FFFFFF`
- Light Gray: `#F5F5F5`
- Dark Gray: `#1A1A1A`
- Border Gray: `#EBEBEB`
- Success Green: `#0FD66F`
- Error Red: `#FF4757`
- Warning Orange: `#FFA502`

## Responsive Design

All components are responsive and work on:

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: ≥ 1024px

## Future Enhancements

- Real API integration
- Advanced analytics
- Custom integrations
- Team collaboration
- Audit logs
- Export settings
