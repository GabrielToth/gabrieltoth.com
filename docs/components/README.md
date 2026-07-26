# Component Library

> React component documentation with live examples

## 📦 Component Categories

- [Auth Components](#auth-components)
- [Dashboard Components](#dashboard-components)
- [Publishing Components](#publishing-components)
- [Analytics Components](#analytics-components)
- [UI Primitives](#ui-primitives)

---

## Auth Components

### LoginForm

Email/password authentication form with validation.

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void
  onError?: (error: Error) => void
  redirectTo?: string
}
```

**Example:**
```tsx
<LoginForm 
  onSuccess={(user) => router.push('/dashboard')}
  redirectTo="/dashboard"
/>
```

**Features:**
- ✅ Email validation
- ✅ Password strength indicator
- ✅ CAPTCHA protection
- ✅ Rate limiting
- ✅ i18n support (4 languages)

**Storybook:** [`LoginForm.stories.tsx`](../../src/components/auth/login-form.stories.tsx)

---

### RegisterForm

User registration with email verification.

**Props:**
```typescript
interface RegisterFormProps {
  onSuccess?: (userId: string) => void
  defaultEmail?: string
  requireVerification?: boolean
}
```

**Example:**
```tsx
<RegisterForm 
  onSuccess={(userId) => showSuccessMessage()}
  requireVerification={true}
/>
```

**Features:**
- ✅ Password strength validation (min 8 chars, uppercase, lowercase, number)
- ✅ Email verification
- ✅ CAPTCHA protection
- ✅ Terms of service acceptance

---

### GoogleOAuthPersonalInfo

Google OAuth additional info collection.

**Props:**
```typescript
interface GoogleOAuthPersonalInfoProps {
  googleData: {
    email: string
    name: string
    picture?: string
  }
  onSubmit: (data: CompleteProfileData) => void
}
```

**Example:**
```tsx
<GoogleOAuthPersonalInfo
  googleData={{ email: 'user@gmail.com', name: 'John Doe' }}
  onSubmit={handleComplete}
/>
```

---

## Dashboard Components

### Sidebar

Main navigation sidebar with channel status.

**Props:**
```typescript
interface SidebarProps {
  currentPath: string
  channels: ConnectedChannel[]
  credits: number
}
```

**Example:**
```tsx
<Sidebar
  currentPath="/dashboard/publish"
  channels={connectedChannels}
  credits={1500}
/>
```

**Features:**
- ✅ Active route highlighting
- ✅ Channel connection status
- ✅ Credit balance display
- ✅ Responsive (mobile drawer)

---

### ChannelConnector

Connect social media accounts.

**Props:**
```typescript
interface ChannelConnectorProps {
  platform: 'youtube' | 'twitch' | 'kick' | 'twitter'
  isConnected: boolean
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
}
```

**Example:**
```tsx
<ChannelConnector
  platform="youtube"
  isConnected={false}
  onConnect={handleYouTubeConnect}
  onDisconnect={handleYouTubeDisconnect}
/>
```

---

### NavMenu

Top navigation menu with user profile.

**Props:**
```typescript
interface NavMenuProps {
  user: User
  onLogout: () => void
  notifications: Notification[]
}
```

---

## Publishing Components

### PostingInterface

Multi-network content publishing interface.

**Props:**
```typescript
interface PostingInterfaceProps {
  connectedNetworks: Network[]
  onPublish: (data: PublicationData) => Promise<void>
  credits: number
}
```

**Example:**
```tsx
<PostingInterface
  connectedNetworks={['youtube', 'twitter']}
  onPublish={handlePublish}
  credits={1500}
/>
```

**Features:**
- ✅ Multi-network selection
- ✅ Rich text editor
- ✅ Media upload (images/videos)
- ✅ Scheduling
- ✅ Character count per network
- ✅ Preview mode

---

### NetworkSelectStep

Network selection wizard step.

**Props:**
```typescript
interface NetworkSelectStepProps {
  availableNetworks: Network[]
  selectedNetworks: string[]
  onSelectionChange: (networks: string[]) => void
}
```

---

### StepProgressBar

Multi-step progress indicator.

**Props:**
```typescript
interface StepProgressBarProps {
  steps: Step[]
  currentStep: number
  completedSteps: number[]
}
```

---

## Analytics Components

### InsightsContainer

Analytics dashboard container.

**Props:**
```typescript
interface InsightsContainerProps {
  channels: Channel[]
  period: '7d' | '30d' | '90d'
  onPeriodChange: (period: string) => void
}
```

**Example:**
```tsx
<InsightsContainer
  channels={connectedChannels}
  period="30d"
  onPeriodChange={setPeriod}
/>
```

---

### MetricsGrid

Grid of metric cards.

**Props:**
```typescript
interface MetricsGridProps {
  metrics: Metric[]
  loading?: boolean
}

interface Metric {
  label: string
  value: number
  change?: number
  icon?: React.ReactNode
}
```

**Example:**
```tsx
<MetricsGrid
  metrics={[
    { label: 'Views', value: 125000, change: 15.5 },
    { label: 'Likes', value: 5000, change: 8.2 }
  ]}
/>
```

---

### ChannelComparison

Compare metrics across channels.

**Props:**
```typescript
interface ChannelComparisonProps {
  channels: ChannelMetrics[]
  metric: 'views' | 'likes' | 'engagement'
}
```

---

## UI Primitives

### Button

Base button component.

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

**Example:**
```tsx
<Button variant="primary" loading={isSubmitting}>
  Save Changes
</Button>
```

---

### Card

Container card with optional header/footer.

**Props:**
```typescript
interface CardProps {
  title?: string
  description?: string
  footer?: React.ReactNode
  children: React.ReactNode
}
```

---

### Input

Form input with validation.

**Props:**
```typescript
interface InputProps {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  type?: 'text' | 'email' | 'password' | 'number'
}
```

---

## Styling Guidelines

All components use:
- **Tailwind CSS** for styling
- **Radix UI** for primitives
- **CVA** (class-variance-authority) for variant management

**Color Palette:**
```css
--primary: hsl(220, 90%, 50%)
--secondary: hsl(260, 90%, 50%)
--success: hsl(140, 70%, 45%)
--danger: hsl(0, 70%, 50%)
--background: hsl(0, 0%, 100%)
--foreground: hsl(0, 0%, 0%)
```

---

## Component Development

### Creating a New Component

1. Create component file:
```bash
src/components/category/ComponentName.tsx
```

2. Add TypeScript types:
```typescript
export interface ComponentNameProps {
  // props
}
```

3. Implement component:
```tsx
export function ComponentName({ ...props }: ComponentNameProps) {
  return <div>...</div>
}
```

4. Create Storybook story:
```bash
src/components/category/ComponentName.stories.tsx
```

5. Add tests:
```bash
src/components/category/ComponentName.test.tsx
```

---

## Testing Components

Run Storybook locally:
```bash
npm run storybook
```

View at: http://localhost:6006

---

## Component Status

| Component | Docs | Tests | Storybook | i18n |
|-----------|------|-------|-----------|------|
| LoginForm | ✅ | ✅ | ✅ | ✅ |
| RegisterForm | ✅ | ✅ | ✅ | ✅ |
| Sidebar | ✅ | ✅ | 🚧 | ✅ |
| PostingInterface | ✅ | 🚧 | 🚧 | ✅ |
| InsightsContainer | ✅ | 🚧 | ❌ | ✅ |

---

**Last updated**: 2026-07-26  
**Component Library Version**: 1.24.0
