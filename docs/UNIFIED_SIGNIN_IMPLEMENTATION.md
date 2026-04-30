# Unified Sign-In Implementation Guide

## Overview

This document describes the unified sign-in/registration system that consolidates separate login and register pages into a single, streamlined authentication flow.

## Architecture

### User Flow

```
User visits /signin
    ↓
Step 1: Email Verification
  - User enters email
  - System checks if user exists
    ↓
    ├─ User exists → Step 2: Password Entry
    └─ User doesn't exist → Step 3: Registration Form
    ↓
Step 2: Password Entry (Existing Users)
  - User enters password
  - System authenticates
  - Redirect to /dashboard
    ↓
Step 3: Registration Form (New Users)
  - User enters password (min 8 chars)
  - User confirms password
  - User agrees to terms
  - System creates account
  - Redirect to /auth/complete-account
```

### Entry Points

| Route | Behavior |
|-------|----------|
| `/signin` | Main unified sign-in page |
| `/login` | Redirects to `/signin` |
| `/register` | Redirects to `/signin` |
| `/auth/complete-account` | Account setup after registration |

### Authentication Methods

1. **Email + Password**
   - Traditional email/password authentication
   - Automatic user detection
   - Separate flows for existing vs new users

2. **Google OAuth**
   - One-click sign-in with Google
   - Automatic account creation if needed
   - Redirects to complete-account for new users

3. **SSO (Single Sign-On)**
   - Enterprise SSO support
   - Domain-based authentication
   - Requires Supabase SSO configuration

## File Structure

```
src/
├── app/[locale]/
│   ├── signin/
│   │   └── page.tsx                    # Main signin page
│   ├── login/
│   │   └── page.tsx                    # Redirects to /signin
│   ├── register/
│   │   └── page.tsx                    # Redirects to /signin
│   └── auth/
│       └── complete-account/
│           ├── page.tsx                # Account completion page
│           ├── complete-account-form.tsx
│           ├── components/
│           ├── hooks/
│           └── steps/
├── components/auth/
│   ├── unified-signin-form.tsx         # Multi-step form component
│   ├── google-login-button.tsx         # Google OAuth button
│   └── ...
├── lib/auth/
│   ├── unified-auth.ts                 # Authentication logic
│   ├── auth-options.ts                 # NextAuth configuration
│   └── ...
└── i18n/
    ├── en/auth.json                    # English translations
    ├── pt-BR/auth.json                 # Portuguese translations
    ├── es/auth.json                    # Spanish translations
    └── de/auth.json                    # German translations
```

## Key Components

### UnifiedSignInForm (`src/components/auth/unified-signin-form.tsx`)

Multi-step form component that handles:
- Email verification
- Password entry for existing users
- Registration form for new users
- Error handling and validation
- Loading states

**Props:**
```typescript
interface UnifiedSignInFormProps {
    locale: string
}
```

**State Management:**
- `step`: Current form step (email | password | register)
- `email`: User email
- `password`: User password
- `confirmPassword`: Password confirmation
- `error`: Error message
- `isLoading`: Loading state
- `userExists`: Whether user exists

### Unified Auth Module (`src/lib/auth/unified-auth.ts`)

Core authentication functions:

```typescript
// Check if user exists by email
checkUserExists(email: string): Promise<UnifiedAuthResult>

// Sign in with email and password
signInWithEmail(email: string, password: string): Promise<UnifiedAuthResult>

// Sign up with email and password
signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>): Promise<UnifiedAuthResult>

// Sign in with OAuth provider
signInWithOAuth(provider: "google" | "github"): Promise<void>

// Sign in with SSO
signInWithSSO(email: string): Promise<void>
```

## Validation Rules

### Email
- Must be valid email format
- Checked against database for existence

### Password
- Minimum 8 characters
- Must match confirmation password
- No additional complexity requirements (can be customized)

### Registration
- Email must not already exist
- Passwords must match
- User must agree to terms

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Email Verification Tokens
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt (Supabase default)
- Minimum 8 characters enforced
- No plaintext passwords stored

### Email Verification
- New users receive verification email
- Email must be verified before full access
- Verification tokens expire after 24 hours

### Session Management
- Sessions stored in database
- Automatic cleanup of expired sessions
- CSRF protection enabled

### Rate Limiting
- Email verification: 5 attempts per hour
- Password attempts: 5 attempts per hour
- Account creation: 3 per hour per IP

## Translations

Supported languages:
- English (en)
- Portuguese (pt-BR)
- Spanish (es)
- German (de)

Translation keys in `src/i18n/[locale]/auth.json`:
- `signin.*` - Sign-in page strings
- `login.*` - Legacy login strings (for compatibility)
- `register.*` - Legacy register strings (for compatibility)

## Testing

### Unit Tests
```bash
npm run test -- src/__tests__/auth/unified-signin.test.ts
```

### Integration Tests
```bash
npm run test -- src/__tests__/auth/unified-signin.integration.test.ts
```

### E2E Tests
```bash
npm run test:e2e -- tests/auth/unified-signin.e2e.ts
```

### Security Tests
```bash
npm run test -- src/__tests__/security/auth-security.test.ts
```

## Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://yourdomain.com
```

### Database Setup
1. Run migrations: `npx supabase db push`
2. Enable RLS on all auth tables
3. Create RLS policies for security
4. Set up email templates in Supabase

### Verification Checklist
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm run test`
- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Email templates configured
- [ ] OAuth providers configured
- [ ] SSO configured (if using)

## Troubleshooting

### "User not found" error
- Check if user exists in database
- Verify email is correct
- Check email verification status

### "Invalid password" error
- Verify password is correct
- Check password length (min 8 chars)
- Ensure caps lock is off

### "Email already exists" error
- User already has account
- Try signing in instead
- Use "Forgot password" if needed

### OAuth not working
- Verify OAuth credentials in Supabase
- Check redirect URLs are correct
- Ensure CORS is configured

### SSO not working
- Verify SSO domain is configured
- Check email domain matches
- Ensure SSO provider is connected

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Passwordless authentication (magic links)
- [ ] Social login (GitHub, Microsoft, etc.)
- [ ] Account linking (multiple auth methods)
- [ ] Session management UI
- [ ] Login history
- [ ] Device management
- [ ] Biometric authentication

## References

- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
