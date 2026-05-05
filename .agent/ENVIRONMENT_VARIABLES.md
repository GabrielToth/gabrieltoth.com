# Environment Variables Guide

This document explains all environment variables used in the gabrieltoth.com project, where they should be configured, and how to set them up.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variable Categories](#environment-variable-categories)
3. [Local Development Setup](#local-development-setup)
4. [Production Setup](#production-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [GitHub Secrets](#github-secrets)
7. [YouTube Channel Linking Setup](#youtube-channel-linking-setup)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Environment variables are used to configure the application for different environments:

- **Local Development** (`.env.local`): Used when running `npm run dev` locally
- **Production** (`.env.production`): Used when deploying to production
- **Vercel** (Project Settings > Environment Variables): Used when deploying to Vercel
- **GitHub Secrets**: Used for CI/CD workflows and sensitive data

### Key Principles

1. **Never commit secrets to git** - All `.env.*` files are in `.gitignore`
2. **Use different credentials per environment** - Development, staging, and production should have separate credentials
3. **Mark sensitive variables** - In Vercel, mark secrets as "Sensitive" so they're not exposed in logs
4. **Use NEXT_PUBLIC_ prefix for client-side variables** - These are exposed to the browser by design
5. **Keep server-side secrets private** - Variables without NEXT_PUBLIC_ prefix are server-only

---

## Environment Variable Categories

### 1. General Settings

| Variable | Type | Where | Purpose |
|----------|------|-------|---------|
| `NODE_ENV` | String | Local, Production | Set to `development` or `production` |
| `DEBUG` | Boolean | Local | Enable verbose server-side logging |
| `NEXT_PUBLIC_DEBUG` | Boolean | Local | Enable debug UI in browser |

**Setup:**
- Local: Set to `development` and `true` for debugging
- Production: Set to `production` and `false` for security

---

### 2. Database (Supabase)

| Variable | Type | Where | Sensitive |
|----------|------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | String | Local, Vercel | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | String | Local, Vercel | No |
| `SUPABASE_SERVICE_ROLE_KEY` | String | Local, Vercel | **YES** |

**Setup:**

1. **Create Supabase Project:**
   - Go to https://supabase.com/
   - Create a new project (separate for dev and prod)
   - Wait for project to be ready (~2 minutes)

2. **Get Credentials:**
   - Go to "Settings" > "API"
   - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon/public key" → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Copy "service_role key" → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

3. **Local Setup:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and fill in Supabase credentials
   ```

4. **Vercel Setup:**
   - Go to Project Settings > Environment Variables
   - Add each variable
   - Mark `SUPABASE_SERVICE_ROLE_KEY` as "Sensitive"

**Important:**
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS)
- Only use in server-side code, never expose to client
- Use different projects for development and production

---

### 3. Authentication (Google OAuth)

| Variable | Type | Where | Sensitive |
|----------|------|-------|-----------|
| `GOOGLE_CLIENT_ID` | String | Local, Vercel | No (server-side) |
| `GOOGLE_CLIENT_SECRET` | String | Local, Vercel | **YES** |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | String | Local, Vercel | No |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` | String | Local, Vercel | No |
| `JWT_SECRET` | String | Local, Vercel | **YES** |

**Setup:**

1. **Create Google OAuth Credentials:**
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable "Google+ API":
     - Go to "APIs & Services" > "Library"
     - Search for "Google+ API"
     - Click "Enable"
   - Create OAuth 2.0 credentials:
     - Go to "APIs & Services" > "Credentials"
     - Click "Create Credentials" > "OAuth client ID"
     - Application type: "Web application"
     - Name: "gabrieltoth.com - Development" (or Production)
     - Authorized JavaScript origins:
       - Local: `http://localhost:3000`
       - Production: `https://gabrieltoth.com`, `https://www.gabrieltoth.com`
     - Authorized redirect URIs:
       - Local: `http://localhost:3000/api/auth/google/callback`
       - Production: `https://gabrieltoth.com/api/auth/google/callback`
     - Click "Create"
   - Copy "Client ID" and "Client secret"

2. **Generate JWT Secret:**
   ```bash
   # Node.js
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Or use online generator
   # https://generate-secret.vercel.app/64
   ```

3. **Local Setup:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and fill in Google OAuth credentials and JWT secret
   ```

4. **Vercel Setup:**
   - Add all variables to Project Settings > Environment Variables
   - Mark `GOOGLE_CLIENT_SECRET` and `JWT_SECRET` as "Sensitive"

**Important:**
- Use DIFFERENT credentials for development and production
- `GOOGLE_CLIENT_SECRET` must be kept secret
- Both `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` should have the same value

---

### 4. Email (SMTP)

| Variable | Type | Where | Sensitive |
|----------|------|-------|-----------|
| `SMTP_HOST` | String | Local, Vercel | No |
| `SMTP_PORT` | Number | Local, Vercel | No |
| `SMTP_USER` | String | Local, Vercel | **YES** |
| `SMTP_PASSWORD` | String | Local, Vercel | **YES** |
| `SMTP_FROM_EMAIL` | String | Local, Vercel | No |
| `SMTP_FROM_NAME` | String | Local, Vercel | No |

**Setup (Gmail):**

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password to `SMTP_PASSWORD`

3. **Fill in Variables:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   SMTP_FROM_EMAIL=noreply@gabrieltoth.com
   SMTP_FROM_NAME=Gabriel Toth
   ```

4. **Vercel Setup:**
   - Add all variables to Project Settings > Environment Variables
   - Mark `SMTP_USER` and `SMTP_PASSWORD` as "Sensitive"

**Alternative Providers:**
- SendGrid: `smtp.sendgrid.net:587`, user: `apikey`, password: `SG.xxxxx`
- Mailgun: `smtp.mailgun.org:587`, user: `postmaster@xxx`, password: `xxxxx`
- AWS SES: `email-smtp.region.amazonaws.com:587`, user: `AKIA...`, password: `xxxxx`

---

### 5. Payments (Stripe)

| Variable | Type | Where | Sensitive |
|----------|------|-------|-----------|
| `STRIPE_SECRET_KEY` | String | Local, Vercel | **YES** |

**Setup:**

1. **Create Stripe Account:**
   - Go to https://dashboard.stripe.com/register
   - Sign up or log in
   - Activate your account (provide business details)

2. **Get API Keys:**
   - Go to "Developers" > "API keys"
   - Toggle "Test mode" ON (for development)
   - Copy "Secret key" (starts with `sk_test_`)
   - For production, toggle "Test mode" OFF and use live keys (starts with `sk_live_`)

3. **Local Setup:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and fill in Stripe test key
   ```

4. **Vercel Setup:**
   - Add `STRIPE_SECRET_KEY` to Project Settings > Environment Variables
   - Mark as "Sensitive"
   - Use test keys for Preview/Development environments
   - Use live keys for Production environment

**Important:**
- Use TEST keys for development (sk_test_)
- Use LIVE keys for production (sk_live_)
- Never commit live keys to git
- Rotate keys if compromised

---

### 6. YouTube Channel Linking

| Variable | Type | Where | Sensitive |
|----------|------|-------|-----------|
| `YOUTUBE_CLIENT_ID` | String | Local, Vercel | No (server-side) |
| `YOUTUBE_CLIENT_SECRET` | String | Local, Vercel | **YES** |
| `YOUTUBE_REDIRECT_URI` | String | Local, Vercel | No |
| `GEOIP_SERVICE_URL` | String | Local, Vercel | No |
| `GEOIP_API_KEY` | String | Local, Vercel | **YES** |
| `TOKEN_ENCRYPTION_KEY` | String | Local, Vercel | **YES** |
| `TOKEN_ENCRYPTION_STRATEGY` | String | Local, Vercel | No |

**Setup:**

1. **YouTube OAuth Credentials:**
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable "YouTube Data API v3":
     - Go to "APIs & Services" > "Library"
     - Search for "YouTube Data API v3"
     - Click "Enable"
   - Create OAuth 2.0 credentials:
     - Go to "APIs & Services" > "Credentials"
     - Click "Create Credentials" > "OAuth client ID"
     - Application type: "Web application"
     - Name: "gabrieltoth.com - YouTube Linking"
     - Authorized JavaScript origins:
       - Local: `http://localhost:3000`
       - Production: `https://gabrieltoth.com`
     - Authorized redirect URIs:
       - Local: `http://localhost:3000/api/youtube/link/callback`
       - Production: `https://gabrieltoth.com/api/youtube/link/callback`
     - Click "Create"
   - Copy "Client ID" and "Client secret"

2. **GeoIP Service (MaxMind):**
   - Go to https://www.maxmind.com/en/geoip2-services
   - Sign up for a free account
   - Go to "Account" > "My License Key"
   - Generate a new license key
   - Copy Account ID and License Key
   - `GEOIP_SERVICE_URL=https://geoip.maxmind.com/geoip/v2.1/city`
   - `GEOIP_API_KEY=your-maxmind-license-key`

3. **Token Encryption Key:**
   ```bash
   # Generate a 64-character hex string (256-bit key)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   - `TOKEN_ENCRYPTION_KEY=your-64-character-hex-key`
   - `TOKEN_ENCRYPTION_STRATEGY=environment` (or `aws-kms`, `local-file`)

4. **Local Setup:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and fill in YouTube, GeoIP, and encryption variables
   ```

5. **Vercel Setup:**
   - Add all variables to Project Settings > Environment Variables
   - Mark `YOUTUBE_CLIENT_SECRET`, `GEOIP_API_KEY`, and `TOKEN_ENCRYPTION_KEY` as "Sensitive"

**Important:**
- Use DIFFERENT YouTube OAuth credentials for development and production
- `YOUTUBE_CLIENT_SECRET` must be kept secret
- `TOKEN_ENCRYPTION_KEY` is used to encrypt stored OAuth tokens
- Keep encryption key secure and rotate periodically

---

### 7. Notifications (Discord)

| Variable | Type | Where | Sensitive |
|----------|------|-------|-----------|
| `DISCORD_WEBHOOK_URL` | String | Local, Vercel | **YES** |
| `SEND_DISCORD_IN_TESTS` | Boolean | Local | No |

**Setup:**

1. **Create Discord Webhook:**
   - Open Discord
   - Go to your server
   - Right-click on a text channel > "Edit Channel"
   - Go to "Integrations" > "Webhooks"
   - Click "New Webhook"
   - Name: "gabrieltoth.com Notifications"
   - Copy "Webhook URL"

2. **Local Setup:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and fill in Discord webhook URL
   SEND_DISCORD_IN_TESTS=true
   ```

3. **Vercel Setup:**
   - Add `DISCORD_WEBHOOK_URL` to Project Settings > Environment Variables
   - Mark as "Sensitive"
   - Set `SEND_DISCORD_IN_TESTS=false` for production

**Use Cases:**
- User registration notifications
- User login notifications
- Error alerts
- Test notifications

---

### 8. Affiliate Programs (Optional)

| Variable | Type | Where | Sensitive |
|----------|------|-------|-----------|
| `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` | String | Local, Vercel | No |

**Setup:**

1. **Get Amazon Associates Tag:**
   - Go to https://affiliate-program.amazon.com/
   - Sign up or log in
   - Complete the application
   - Once approved, go to "Tools" > "Product Links"
   - Your tracking ID is shown at the top (format: `yourname-20`)

2. **Local Setup:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and fill in Amazon tag
   ```

3. **Vercel Setup:**
   - Add `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` to Project Settings > Environment Variables
   - No need to mark as sensitive (it's public)

---

### 9. Cryptocurrency (Optional)

| Variable | Type | Where | Sensitive |
|----------|------|-------|-----------|
| `MONERO_ADDRESS` | String | Local, Vercel | No |
| `MONERO_VIEW_KEY` | String | Local, Vercel | **YES** |

**Setup:**

1. **Create Monero Wallet:**
   - Download Monero wallet: https://www.getmonero.org/downloads/
   - Create a new wallet or restore existing
   - Go to "Settings" > "Seed & keys"
   - Copy:
     - Primary address → `MONERO_ADDRESS`
     - Private view key → `MONERO_VIEW_KEY`

2. **Local Setup:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and fill in Monero credentials
   ```

3. **Vercel Setup:**
   - Add both variables to Project Settings > Environment Variables
   - Mark `MONERO_VIEW_KEY` as "Sensitive"

**Important:**
- View key allows read-only access to transactions
- Never share your spend key!
- Keep wallet backup in a safe place

---

## Local Development Setup

### Step 1: Copy Environment Files

```bash
cp .env.local.example .env.local
cp .env.production.example .env.production
```

### Step 2: Fill in Required Variables

Edit `.env.local` and fill in:

**Minimum Required:**
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`

**For YouTube Channel Linking:**
- `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`
- `GEOIP_API_KEY`
- `TOKEN_ENCRYPTION_KEY`

**For Email Notifications:**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`

### Step 3: Verify Setup

```bash
# Check that all required variables are set
npm run type-check

# Start development server
npm run dev

# Visit http://localhost:3000
```

---

## Production Setup

### Step 1: Create Production Credentials

For each service (Google OAuth, Supabase, Stripe, YouTube, etc.):
- Create SEPARATE credentials for production
- Use production URLs (https://gabrieltoth.com)
- Use live API keys (not test keys)

### Step 2: Set Up Vercel Environment Variables

1. Go to Vercel Project Settings > Environment Variables
2. For each variable:
   - Name: (variable name)
   - Value: (your production value)
   - Environments: Select "Production" and "Preview"
   - Sensitive: Check if it's a secret

### Step 3: Verify Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Run production tests
npm run test
```

---

## Vercel Deployment

### Environment Variable Checklist

**Public Variables (NOT sensitive):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_DEBUG` (should be false)
- `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`

**Sensitive Variables (mark as Sensitive):**
- `GOOGLE_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `YOUTUBE_CLIENT_SECRET`
- `GEOIP_API_KEY`
- `TOKEN_ENCRYPTION_KEY`
- `SMTP_PASSWORD`
- `DISCORD_WEBHOOK_URL`
- `MONERO_VIEW_KEY`

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "feat: add YouTube channel linking"
   git push origin main
   ```

2. **Vercel Auto-Deploy:**
   - Vercel automatically deploys when you push to main
   - Check deployment status at https://vercel.com/dashboard

3. **Verify Deployment:**
   - Visit https://gabrieltoth.com
   - Test YouTube channel linking
   - Check Discord notifications
   - Monitor error logs

---

## GitHub Secrets

GitHub Secrets are used for CI/CD workflows. Add these if you have automated tests or deployments:

| Secret | Value | Purpose |
|--------|-------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Database access in CI/CD |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | Payment testing in CI/CD |
| `YOUTUBE_CLIENT_SECRET` | Your YouTube client secret | YouTube API testing in CI/CD |

**Setup:**

1. Go to GitHub Repository > Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add each secret

---

## YouTube Channel Linking Setup

### Complete Setup Guide

1. **Create YouTube OAuth Credentials** (see section 6 above)

2. **Set Up GeoIP Service:**
   - Sign up at https://www.maxmind.com/
   - Generate license key
   - Add to environment variables

3. **Generate Encryption Key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Configure Environment Variables:**
   ```bash
   YOUTUBE_CLIENT_ID=your-client-id
   YOUTUBE_CLIENT_SECRET=your-client-secret
   YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/link/callback
   GEOIP_SERVICE_URL=https://geoip.maxmind.com/geoip/v2.1/city
   GEOIP_API_KEY=your-maxmind-key
   TOKEN_ENCRYPTION_KEY=your-64-char-hex-key
   TOKEN_ENCRYPTION_STRATEGY=environment
   ```

5. **Deploy to Supabase:**
   ```bash
   # Link to Supabase project
   npx supabase link --project-ref your-project-ref
   
   # Push migrations
   npx supabase db push
   ```

6. **Test YouTube Linking:**
   - Visit http://localhost:3000/youtube/link
   - Click "Link YouTube Channel"
   - Authorize with your YouTube account
   - Verify channel is linked in database

---

## Troubleshooting

### "Cannot find project ref. Have you run supabase link?"

**Solution:**
```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Then push migrations
npx supabase db push
```

### "GOOGLE_CLIENT_SECRET is not set"

**Solution:**
1. Check that `.env.local` exists
2. Verify `GOOGLE_CLIENT_SECRET` is filled in
3. Restart development server: `npm run dev`

### "Stripe API key is invalid"

**Solution:**
1. Verify you're using the correct key (test vs live)
2. Check that key hasn't expired
3. Regenerate key in Stripe dashboard if needed

### "YouTube OAuth redirect URI mismatch"

**Solution:**
1. Check that `YOUTUBE_REDIRECT_URI` matches Google Console
2. For local: `http://localhost:3000/api/youtube/link/callback`
3. For production: `https://gabrieltoth.com/api/youtube/link/callback`
4. Update Google Console if needed

### "Token encryption key is invalid"

**Solution:**
1. Verify key is 64 characters (32 bytes in hex)
2. Verify key contains only hex characters (0-9, a-f)
3. Regenerate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### "SMTP authentication failed"

**Solution:**
1. Verify Gmail 2-Factor Authentication is enabled
2. Generate new App Password
3. Use 16-character app password (not your Gmail password)
4. Verify `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`

---

## Summary

| Environment | Where | Sensitive Variables | Public Variables |
|-------------|-------|-------------------|------------------|
| Local Dev | `.env.local` | All secrets | NEXT_PUBLIC_* |
| Production | `.env.production` | All secrets | NEXT_PUBLIC_* |
| Vercel | Project Settings | Marked as Sensitive | Regular variables |
| GitHub | Secrets & Variables | In Secrets tab | In Variables tab |

**Key Takeaways:**
- Never commit `.env.*` files to git
- Use different credentials per environment
- Mark sensitive variables in Vercel
- Keep encryption keys secure
- Rotate keys periodically
- Use test keys for development, live keys for production

