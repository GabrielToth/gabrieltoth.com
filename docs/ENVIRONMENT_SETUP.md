# Environment Variables Setup Guide

## Overview

This project uses environment variables for configuration. There are different setup procedures for **local development** and **Vercel production deployment**.

## Local Development Setup

### 1. Copy Example Files

```bash
# Copy development environment template
cp .env.local.example .env.local

# Copy production environment template (optional, for testing)
cp .env.production.example .env.production
```

### 2. Fill in Your Values

Edit `.env.local` and fill in your actual credentials:

```bash
# Open in your editor
code .env.local
```

**Required for basic development:**
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (for Google OAuth)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (for database)
- `STRIPE_SECRET_KEY` (for payments)

**Optional but recommended:**
- `DISCORD_WEBHOOK_URL` (for notifications)
- `MONERO_ADDRESS` and `MONERO_VIEW_KEY` (for crypto payments)

### 3. Start Development Server

```bash
npm run dev
```

The server will automatically load variables from `.env.local`.

## Vercel Production Setup

### ⚠️ Important: Never Commit `.env.local` or `.env.production`

These files are in `.gitignore` and should **never** be committed to git. They contain sensitive credentials.

### 1. Set Environment Variables in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add each variable:

```
Name: GOOGLE_CLIENT_ID
Value: your-production-google-client-id
Environments: Production, Preview
Sensitive: ✅ (mark as sensitive)
```

### 2. Environment Variable Categories

#### Sensitive Variables (Mark as Sensitive ✅)
These should be marked as sensitive in Vercel to prevent exposure in logs:

- `GOOGLE_CLIENT_ID` (server-side)
- `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `DISCORD_WEBHOOK_URL`
- `MONERO_VIEW_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if using)

#### Public Variables (Don't Mark as Sensitive ❌)
These are exposed to the browser by design (prefixed with `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`
- `NEXT_PUBLIC_DEBUG`

### 3. Recommended Setup

**For each environment variable:**

1. Copy the variable name from `.env.production.example`
2. Paste into Vercel dashboard
3. Fill in your production value
4. Select environments: **Production** and **Preview**
5. Mark as sensitive if it's a secret
6. Click "Save"

### 4. Verify Deployment

After setting all variables:

1. Trigger a new deployment:
   ```bash
   git push origin main
   ```

2. Check deployment logs in Vercel dashboard
3. Verify no errors about missing environment variables

## Environment Variable Reference

### Google OAuth

**Development:**
```
GOOGLE_CLIENT_ID=your-dev-client-id
GOOGLE_CLIENT_SECRET=your-dev-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-dev-client-id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Production:**
```
GOOGLE_CLIENT_ID=your-prod-client-id
GOOGLE_CLIENT_SECRET=your-prod-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-prod-client-id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://www.gabrieltoth.com/api/auth/google/callback
```

### Supabase

**Development:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-dev-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
```

**Production:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-prod-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

### Stripe

**Development (Test Mode):**
```
STRIPE_SECRET_KEY=sk_test_your-test-key
```

**Production (Live Mode):**
```
STRIPE_SECRET_KEY=sk_live_your-live-key
```

## Troubleshooting

### "Environment variable not found" Error

**Problem:** Deployment fails with "Environment variable X not found"

**Solution:**
1. Check Vercel dashboard > Settings > Environment Variables
2. Verify the variable name matches exactly (case-sensitive)
3. Ensure it's set for the correct environment (Production/Preview)
4. Trigger a new deployment after adding variables

### Variables Not Loading Locally

**Problem:** `.env.local` variables not loading in development

**Solution:**
1. Verify `.env.local` file exists in project root
2. Check file is not in `.gitignore` (it should be)
3. Restart development server: `npm run dev`
4. Verify variable names don't have typos

### Sensitive Data Exposed in Logs

**Problem:** Secret keys appearing in Vercel deployment logs

**Solution:**
1. Go to Vercel dashboard > Settings > Environment Variables
2. Edit the variable
3. Check "Sensitive" checkbox
4. Trigger a new deployment

## Security Best Practices

✅ **DO:**
- Use different credentials for development and production
- Mark sensitive variables as sensitive in Vercel
- Store backups of credentials in a password manager
- Rotate keys if compromised
- Use strong, randomly generated secrets

❌ **DON'T:**
- Commit `.env.local` or `.env.production` to git
- Share credentials via email or chat
- Use the same credentials for dev and prod
- Expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Commit production secrets to git history

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Environment Setup](https://supabase.com/docs/guides/api/environment-variables)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Stripe API Keys](https://stripe.com/docs/keys)

