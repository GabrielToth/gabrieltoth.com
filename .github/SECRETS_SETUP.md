# GitHub Secrets & Variables Configuration

This document records all GitHub Actions secrets and variables that have been configured for CI/CD builds.

## GitHub Variables (Non-sensitive Environment Variables)

The following variables were added as GitHub repository variables (visible in build logs):

### Build Configuration
- `NODE_ENV` = production
- `DEBUG` = false
- `NEXT_PUBLIC_DEBUG` = false

### Application URLs
- `NEXT_PUBLIC_APP_URL` = https://www.gabrieltoth.com
- `NEXT_PUBLIC_SITE_URL` = https://www.gabrieltoth.com
- `NEXT_PUBLIC_SUPABASE_URL` = https://test.supabase.co (for CI builds)

### Locale Settings
- `LANG` = en_US.UTF-8
- `LC_ALL` = en_US.UTF-8

### OAuth Redirect URIs
- `YOUTUBE_REDIRECT_URI` = https://www.gabrieltoth.com/api/youtube/link/callback
- `INSTAGRAM_REDIRECT_URI` = https://www.gabrieltoth.com/api/oauth/callback/instagram
- `TIKTOK_REDIRECT_URI` = https://www.gabrieltoth.com/api/oauth/callback/tiktok
- `FACEBOOK_REDIRECT_URI` = https://www.gabrieltoth.com/api/oauth/callback/facebook

### Security Configuration
- `SUPPRESS_SECURITY_CONFIG_LOGS` = true
- `SUPPRESS_AUTH_SECURITY_STDERR` = true

### Password Hashing (Argon2id)
- `ARGON2_MEMORY_COST` = 64
- `ARGON2_TIME_COST` = 3
- `ARGON2_PARALLELISM` = 2

### CAPTCHA
- `CAPTCHA_PROVIDER` = cloudflare
- `NEXT_PUBLIC_CAPTCHA_SITE_KEY` = 1x00000000000000000000000000000000000001

### Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key-for-ci-build

## Added Secrets (for Build Support - Sensitive)

The following secrets were added to enable the production build to complete successfully:

### Authentication & Security
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (required for server-side DB access)
- `TOKEN_ENCRYPTION_KEY` - Encryption key for storing OAuth tokens securely
- `JWT_SECRET` - JWT secret for temporary token signing during OAuth registration
- `PEPPER_SECRET` - Server-side pepper for password hashing security layer
- `NEXTAUTH_SECRET` - NextAuth session secret
- `NEXTAUTH_URL` - NextAuth URL (http://localhost:3000)

### Password Hashing (Argon2id)
- `ARGON2_MEMORY_COST` - Memory cost for Argon2id (64 MB)
- `ARGON2_TIME_COST` - Time cost iterations (3)
- `ARGON2_PARALLELISM` - Parallelism threads (2)

### OAuth Providers
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Public Google client ID
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` - Google OAuth callback URI
- `YOUTUBE_CLIENT_ID` - YouTube API client ID
- `YOUTUBE_CLIENT_SECRET` - YouTube API client secret
- `YOUTUBE_REDIRECT_URI` - YouTube OAuth callback URI
- `INSTAGRAM_APP_ID` - Instagram/Facebook app ID
- `INSTAGRAM_APP_SECRET` - Instagram/Facebook app secret
- `TIKTOK_CLIENT_KEY` - TikTok client key
- `TIKTOK_CLIENT_SECRET` - TikTok client secret
- `FACEBOOK_APP_ID` - Facebook app ID
- `FACEBOOK_APP_SECRET` - Facebook app secret

### Payment & Services
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `RESEND_API_KEY` - Resend email service API key

## Environment Variables Already Present (Pre-existing)

These secrets were already configured:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `DISCORD_WEBHOOK_URL` - Discord webhook for notifications
- `MONERO_ADDRESS` - Monero payment address
- `MONERO_VIEW_KEY` - Monero view key
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp business API token
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp phone number ID
- `WHATSAPP_VERIFY_TOKEN` - WhatsApp webhook verify token
- `PIX_KEY` - PIX payment key (Brazil)
- `PIX_MERCHANT_NAME` - PIX merchant name
- `PIX_MERCHANT_CITY` - PIX merchant city
- `CYPRESS_RECORD_KEY` - Cypress test recording key
- `BASE_URL` - Base URL for testing

## Important Notes

1. **CI Build Only**: All secrets marked as "for Build Support" contain test/placeholder values suitable for CI builds only. They are NOT production credentials.

2. **Production Credentials**: Real production credentials should be:
   - Kept secure and never committed to git
   - Managed through Vercel's dashboard or similar service
   - Rotated regularly
   - Never shared or exposed in logs

3. **Build Process**: The GitHub Actions workflow uses these secrets during `npm run build` to enable the Next.js production build to compile successfully without infrastructure-dependent tests interfering.

4. **Test Exclusions**: The following test files are excluded from the default test suite because they require full Supabase infrastructure:
   - `src/app/api/auth/register/route.test.ts`
   - `src/app/api/auth/google/callback/route.test.ts`
   - `src/app/api/auth/login/route.test.ts`
   - `src/app/api/auth/complete-account/route.test.ts`
   - And others listed in `vitest.config.ts`

These can be run locally with `npm run test:all` when infrastructure is available.

## Setup Command Reference

All secrets were added using GitHub CLI:
```bash
gh secret set VARIABLE_NAME --body "value"
```

To update a secret in the future, use the same command with the new value.
