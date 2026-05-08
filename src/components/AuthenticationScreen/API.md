# Authentication Screen API Documentation

## Overview

The Authentication Screen is a comprehensive authentication interface that consolidates all login methods (Google, Email, SSO, Apple, Facebook) into a unified, minimal button row interface. This documentation covers all components, hooks, and types used in the authentication flow.

## Components

### AuthenticationScreen

Main authentication screen component that manages overall authentication state and coordinates button row and email form rendering.

#### Props

```typescript
interface AuthenticationScreenProps {
  onAuthSuccess: (user: User) => void
  onAuthError: (error: Error) => void
  redirectTo?: string
}
```

- **onAuthSuccess**: Callback function called when authentication succeeds. Receives the authenticated user object.
- **onAuthError**: Callback function called when authentication fails. Receives the error object.
- **redirectTo**: Optional URL to redirect to after successful authentication. Defaults to `/dashboard`.

#### State

```typescript
interface AuthenticationScreenState {
  showEmailForm: boolean
  loadingProvider: 'google' | 'email' | 'sso' | null
  error: string | null
}
```

- **showEmailForm**: Whether the email authentication form is currently visible.
- **loadingProvider**: Which authentication provider is currently loading (if any).
- **error**: Current error message to display (if any).

#### Usage

```typescript
import { AuthenticationScreen } from '@/components/AuthenticationScreen'

export function LoginPage() {
  const handleAuthSuccess = (user) => {
    console.log('User logged in:', user)
    // Redirect to dashboard
    window.location.href = '/dashboard'
  }

  const handleAuthError = (error) => {
    console.error('Authentication failed:', error)
  }

  return (
    <AuthenticationScreen
      onAuthSuccess={handleAuthSuccess}
      onAuthError={handleAuthError}
      redirectTo="/dashboard"
    />
  )
}
```

#### Features

- Displays all authentication methods as buttons in a single row
- Manages email form visibility
- Handles error display and auto-dismiss
- Responsive design for mobile, tablet, and desktop
- Full keyboard navigation support
- Screen reader compatible
- Loading state management

---

### AuthButtonRow

Renders all authentication method buttons in a horizontal row with responsive layout.

#### Props

```typescript
interface AuthButtonRowProps {
  onGoogleClick: () => void
  onEmailClick: () => void
  onSSOClick: () => void
  loadingProvider?: 'google' | 'email' | 'sso' | null
  error?: string | null
}
```

- **onGoogleClick**: Callback when Google button is clicked.
- **onEmailClick**: Callback when Email button is clicked.
- **onSSOClick**: Callback when SSO button is clicked.
- **loadingProvider**: Which provider is currently loading (shows spinner).
- **error**: Current error message (for styling purposes).

#### Usage

```typescript
import { AuthButtonRow } from '@/components/AuthenticationScreen/AuthButtonRow'

export function MyAuthComponent() {
  return (
    <AuthButtonRow
      onGoogleClick={() => console.log('Google clicked')}
      onEmailClick={() => console.log('Email clicked')}
      onSSOClick={() => console.log('SSO clicked')}
      loadingProvider={null}
    />
  )
}
```

#### Features

- Renders 5 buttons: Google, Email, SSO, Apple (disabled), Facebook (disabled)
- Responsive layout: single row on desktop/tablet, wraps on mobile
- Button sizing: 60px (desktop), 56px (tablet), 48px (mobile)
- Proper spacing and alignment
- ARIA labels and semantic HTML
- Disabled buttons for future authentication methods

---

### AuthButton

Individual authentication button component with support for multiple states.

#### Props

```typescript
interface AuthButtonProps {
  provider: 'google' | 'email' | 'sso' | 'apple' | 'facebook'
  isDisabled: boolean
  isLoading?: boolean
  onClick: () => void
  ariaLabel: string
  icon: React.ReactNode
}
```

- **provider**: Authentication provider type.
- **isDisabled**: Whether the button is disabled.
- **isLoading**: Whether the button is in loading state (shows spinner).
- **onClick**: Callback when button is clicked.
- **ariaLabel**: Accessible label for screen readers.
- **icon**: React node to render as the button icon.

#### Usage

```typescript
import { AuthButton } from '@/components/AuthenticationScreen/AuthButtonRow/AuthButton'
import { FaGoogle } from 'react-icons/fa'

export function MyButton() {
  return (
    <AuthButton
      provider="google"
      icon={<FaGoogle size={24} />}
      ariaLabel="Sign in with Google"
      isDisabled={false}
      isLoading={false}
      onClick={() => console.log('Google clicked')}
    />
  )
}
```

#### Button States

- **Default**: Blue background, white icon
- **Hover**: Darker blue background, subtle shadow
- **Focus**: 2px solid focus outline
- **Active**: Subtle shadow, no transform
- **Disabled**: Gray background, reduced opacity
- **Loading**: Spinner animation, disabled interaction

#### Features

- Memoized to prevent unnecessary re-renders
- Smooth transitions (200ms)
- Keyboard accessible (Enter, Space)
- Loading spinner animation
- Proper ARIA attributes

---

## Hooks

### useAuthentication

Manages overall authentication state and success/error handling.

#### Returns

```typescript
interface UseAuthenticationReturn {
  handleAuthSuccess: (user: User) => void
  handleAuthError: (error: Error) => void
}
```

#### Usage

```typescript
import { useAuthentication } from '@/hooks/useAuthentication'

export function MyComponent() {
  const { handleAuthSuccess, handleAuthError } = useAuthentication('/dashboard')

  const handleLogin = async () => {
    try {
      const user = await loginUser()
      handleAuthSuccess(user)
    } catch (error) {
      handleAuthError(error)
    }
  }

  return <button onClick={handleLogin}>Login</button>
}
```

---

### useGoogleAuth

Wraps Google OAuth authentication flow.

#### Returns

```typescript
interface UseGoogleAuthReturn {
  handleGoogleClick: () => void
  error: Error | null
}
```

#### Usage

```typescript
import { useGoogleAuth } from '@/hooks/useGoogleAuth'

export function MyComponent() {
  const { handleGoogleClick, error } = useGoogleAuth(
    handleAuthSuccess,
    handleAuthError
  )

  return (
    <>
      <button onClick={handleGoogleClick}>Sign in with Google</button>
      {error && <p>{error.message}</p>}
    </>
  )
}
```

---

### useSSOAuth

Wraps Single Sign-On authentication flow.

#### Returns

```typescript
interface UseSSOAuthReturn {
  handleSSOClick: () => void
  error: Error | null
}
```

#### Usage

```typescript
import { useSSOAuth } from '@/hooks/useSSOAuth'

export function MyComponent() {
  const { handleSSOClick, error } = useSSOAuth(
    handleAuthSuccess,
    handleAuthError
  )

  return (
    <>
      <button onClick={handleSSOClick}>Sign in with SSO</button>
      {error && <p>{error.message}</p>}
    </>
  )
}
```

---

### useEmailAuth

Wraps email authentication flow.

#### Returns

```typescript
interface UseEmailAuthReturn {
  handleEmailSubmit: (email: string, password: string) => Promise<void>
  error: Error | null
}
```

#### Usage

```typescript
import { useEmailAuth } from '@/hooks/useEmailAuth'

export function MyComponent() {
  const { handleEmailSubmit, error } = useEmailAuth(
    handleAuthSuccess,
    handleAuthError
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    const email = e.target.email.value
    const password = e.target.password.value
    await handleEmailSubmit(email, password)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" />
        <input type="password" name="password" />
        <button type="submit">Sign in</button>
      </form>
      {error && <p>{error.message}</p>}
    </>
  )
}
```

---

## Types

### AuthProvider

```typescript
type AuthProvider = 'google' | 'email' | 'sso' | 'apple' | 'facebook'
```

Represents the authentication provider type.

### User

```typescript
interface User {
  id: string
  email: string
  name: string
  provider: AuthProvider
  createdAt: Date
}
```

Represents an authenticated user.

### AuthenticationScreenProps

```typescript
interface AuthenticationScreenProps {
  onAuthSuccess: (user: User) => void
  onAuthError: (error: Error) => void
  redirectTo?: string
}
```

Props for the AuthenticationScreen component.

### AuthenticationScreenState

```typescript
interface AuthenticationScreenState {
  showEmailForm: boolean
  loadingProvider: AuthProvider | null
  error: string | null
}
```

State for the AuthenticationScreen component.

### AuthButtonRowProps

```typescript
interface AuthButtonRowProps {
  onGoogleClick: () => void
  onEmailClick: () => void
  onSSOClick: () => void
  loadingProvider?: AuthProvider | null
  error?: string | null
}
```

Props for the AuthButtonRow component.

### AuthButtonProps

```typescript
interface AuthButtonProps {
  provider: AuthProvider
  isDisabled: boolean
  isLoading?: boolean
  onClick: () => void
  ariaLabel: string
  icon: React.ReactNode
}
```

Props for the AuthButton component.

---

## Error Handling

### Authentication Errors

The authentication system handles various error types:

- **Google OAuth Errors**: User cancels OAuth flow, network errors, invalid credentials
- **SSO Errors**: SSO provider unavailable, invalid configuration
- **Email Errors**: Invalid email format, email already registered, weak password

### Error Display

Errors are displayed in a dismissible alert above the button row:

```typescript
{error && (
  <div className={styles.errorAlert} role="alert">
    <span className={styles.errorMessage}>{error}</span>
    <button
      className={styles.errorClose}
      onClick={handleDismissError}
      aria-label="Close error message"
    >
      ×
    </button>
  </div>
)}
```

### Error Recovery

- User can retry authentication by clicking button again
- Error message auto-dismisses after 5 seconds
- User can manually dismiss error by clicking close button

---

## Accessibility

### Keyboard Navigation

- **Tab**: Move focus to next button
- **Shift+Tab**: Move focus to previous button
- **Enter**: Activate focused button
- **Space**: Activate focused button

### ARIA Labels

Each button has a descriptive ARIA label:

- Google: "Sign in with Google"
- Email: "Sign in with email"
- SSO: "Sign in with Single Sign-On"
- Apple: "Sign in with Apple (coming soon)"
- Facebook: "Sign in with Facebook (coming soon)"

### Screen Reader Support

- Button labels are announced clearly
- Disabled state is announced
- Loading state is announced with live region updates
- Error messages are announced with role="alert"

### Focus Management

- Focus outline is visible (2px solid outline)
- Focus order follows visual order (left to right)
- Focus is managed when transitioning to email form
- Focus is restored after authentication completes

### Color Contrast

- Button text contrast ratio: 4.5:1 (WCAG AA)
- Disabled button contrast ratio: 3:1 (WCAG AA)
- Focus outline contrast ratio: 4.5:1 (WCAG AA)

---

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Button Sizing

| Breakpoint | Width | Height | Gap  |
| ---------- | ----- | ------ | ---- |
| Desktop    | 60px  | 60px   | 16px |
| Tablet     | 56px  | 56px   | 12px |
| Mobile     | 48px  | 48px   | 8px  |

### Touch Targets

- Minimum 44px × 44px on mobile (meets accessibility standards)
- Mobile buttons are 48px × 48px (exceeds minimum)

---

## Performance

### Optimization Techniques

- React.memo for AuthButton to prevent unnecessary re-renders
- useCallback for click handlers to maintain referential equality
- useMemo for computed values
- CSS animations for loading spinner (GPU accelerated)

### Performance Targets

- Component render time: < 100ms
- Button click response time: < 50ms
- No layout shifts (CLS < 0.1)
- No memory leaks on mount/unmount

---

## Testing

### Unit Tests

- AuthButton: 34 tests
- AuthButtonRow: 7 tests + 25 responsive tests
- AuthenticationScreen: 25 tests
- Accessibility: 23 tests

### Test Coverage

- > 80% code coverage
- All component states tested
- All user interactions tested
- Accessibility features tested
- Responsive design tested

### Running Tests

```bash
# Run all authentication tests
npm run test src/components/AuthenticationScreen

# Run specific test file
npm run test src/components/AuthenticationScreen/AuthButton.test.tsx

# Run with coverage
npm run test:coverage src/components/AuthenticationScreen
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

---

## Future Enhancements

- Add Apple Sign-In when implemented
- Add Facebook Login when implemented
- Add biometric authentication (fingerprint, face recognition)
- Add passwordless email authentication
- Add two-factor authentication
- Add social login linking to existing accounts
- Add custom theme support
- Add internationalization (i18n)

---

## Support

For issues or questions, please refer to the project documentation or contact the development team.
