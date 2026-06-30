# GitHub Secrets & Variables Configuration

This document tracks all GitHub Actions secrets and variables required for the CI/CD pipeline.

**Status**: ✅ All configured as of Issue #98

---

## Important Notes

- **SMTP**: No email server configured (disabled in CI/CD)
- **DATABASE**: Uses production Vercel database (localhost not available in GitHub Actions)
- **Local Development**: Uses local Docker PostgreSQL via .env.local (not committed)

---

## GitHub Secrets (Sensitive - 21 total)

| Secret | Purpose | Value Type | Scope |
|--------|---------|------------|-------|
| ARGON2_MEMORY_COST | Password hashing memory cost | 64 | CI |
| ARGON2_PARALLELISM | Password hashing parallelism | 2 | CI |
| ARGON2_TIME_COST | Password hashing iterations | 3 | CI |
| CAPTCHA_SECRET_KEY | Cloudflare Turnstile secret | Test credentials | CI |
| FACEBOOK_APP_ID | Facebook OAuth credential | App ID | Production |
| FACEBOOK_APP_SECRET | Facebook OAuth secret | Secret key | Production |
| GOOGLE_CLIENT_ID | Google OAuth credential | Client ID | Production |
| GOOGLE_CLIENT_SECRET | Google OAuth secret | Secret key | Production |
| INSTAGRAM_APP_ID | Instagram Graph API credential | App ID | Production |
| INSTAGRAM_APP_SECRET | Instagram Graph API secret | Secret key | Production |
| INSTAGRAM_WEBHOOK_VERIFY_TOKEN | Instagram webhook verification | Token | Production |
| JWT_SECRET | JWT token signing key | 64-char hex | Production |
| NEXTAUTH_SECRET | NextAuth.js secret | Secret string | Production |
| NEXTAUTH_URL | NextAuth.js URL | https://www.gabrieltoth.com | Production |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | Google OAuth client (public) | Client ID | Production |
| NEXT_PUBLIC_GOOGLE_REDIRECT_URI | Google OAuth redirect | https://www.gabrieltoth.com/api/auth/google/callback | Production |
| PEPPER_SECRET | Password hashing pepper | 64-char hex | Production |
| RESEND_API_KEY | Resend email service API key | API key | Production |
| STRIPE_SECRET_KEY | Stripe payment API key | sk_test_ or sk_live_ | Production |
| SUPABASE_SERVICE_ROLE_KEY | Supabase admin key (RLS bypass) | Service role key | Production |
| TIKTOK_CLIENT_SECRET | TikTok OAuth secret | Secret key | Production |
| TOKEN_ENCRYPTION_KEY | OAuth token encryption key | 64-char hex | Production |
| YOUTUBE_CLIENT_SECRET | YouTube OAuth secret | Secret key | Production |

---

## GitHub Variables (Non-sensitive - 6 total)

| Variable | Value | Purpose | Scope |
|----------|-------|---------|-------|
| CACHE_ENABLED | true | Enable caching | CI |
| CACHE_MAX_MEMORY | 256mb | Cache memory limit | CI |
| CACHE_TTL | 3600 | Cache time-to-live (seconds) | CI |
| SESSION_TIMEOUT | 1800000 | Session timeout (ms) | CI |
| VERIFICATION_TOKEN_EXPIRY | 86400000 | Token expiry (ms) | CI |
| USE_REDIS | true | Enable Redis cache | CI |

---

## How to Update

### Add or Update a Secret
```bash
gh secret set SECRET_NAME --body "secret-value"
```

### Add or Update a Variable
```bash
gh variable set VARIABLE_NAME --body "value"
```

### List All Secrets
```bash
gh secret list
```

### List All Variables
```bash
gh variable list
```

---

## Local Development

**Important**: Never commit `.env.local` to git.

1. Copy `.env.local.example` to `.env.local`
2. Fill in local development values:
   - **DATABASE_URL**: Use local Docker PostgreSQL (localhost:5432)
   - **SMTP**: Configure your email service or leave empty if not needed
3. Do NOT commit `.env.local`
4. GitHub Actions uses production database (Vercel) via SUPABASE_SERVICE_ROLE_KEY

---

## Test Verification

All tests pass with these configurations:
```
✅ 357 test files passed
✅ 6666 tests passed
✅ No CI/CD failures
```

Run locally:
```bash
npm run test
```

---

## Notes

- **CAPTCHA_SECRET_KEY**: Uses Cloudflare Turnstile test credentials
- **DATABASE**: CI/CD uses Vercel production database (SUPABASE_SERVICE_ROLE_KEY)
- **Local Development**: Uses Docker PostgreSQL (DATABASE_URL in .env.local)
- **SMTP**: Not configured (no email server required for CI/CD)
- **PEPPER_SECRET** & **JWT_SECRET**: Should be rotated in production
- **Production vs Development**: CI/CD uses production credentials; local dev uses separate values
- **Local .env.local**: Not affected by GitHub configuration

---

## Last Updated
**Issue #98** - Configure all Vercel environment variables for CI/CD
