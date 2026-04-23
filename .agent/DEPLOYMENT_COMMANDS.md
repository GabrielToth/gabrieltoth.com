# YouTube Channel Linking - Deployment Commands Reference

## Quick Command Reference

Copy and paste these commands in order to deploy the YouTube Channel Linking feature.

---

## Phase 1: Supabase Setup

### Step 1: Link to Supabase Project

```bash
# Replace YOUR_PROJECT_REFERENCE with your actual project reference
# Get it from Supabase dashboard > Settings > General
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
```

**Example:**
```bash
npx supabase link --project-ref abcdefghijklmnop
```

### Step 2: Push Database Migrations

```bash
npx supabase db push
```

**Expected output:**
```
Applying migration 20250101000001_create_youtube_channels_table.sql
Applying migration 20250101000002_create_linking_activity_table.sql
Applying migration 20250101000003_create_recovery_tokens_table.sql
Applying migration 20250101000004_create_audit_logs_table.sql
Applying migration 20250101000005_create_unlink_revocation_window_table.sql
Applying migration 20250101000006_create_data_retention_policies.sql
```

### Step 3: Verify Tables Created

Go to Supabase dashboard > SQL Editor and run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'youtube_%'
ORDER BY table_name;
```

**Expected result:**
```
youtube_channels
youtube_linking_activity
youtube_recovery_tokens
youtube_audit_logs
youtube_unlink_revocation_window
```

---

## Phase 2: Generate Encryption Key

### Generate Token Encryption Key

```bash
# Generate a 64-character hex string (256-bit key)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Save the output** - you'll need it for environment variables.

---

## Phase 3: Local Environment Setup

### Step 1: Copy Environment File

```bash
cp .env.local.example .env.local
```

### Step 2: Edit .env.local

Open `.env.local` and fill in all the values:

```bash
# Supabase (from Supabase dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# YouTube OAuth (from Google Cloud Console)
YOUTUBE_CLIENT_ID=your-client-id
YOUTUBE_CLIENT_SECRET=your-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/link/callback

# GeoIP (from MaxMind)
GEOIP_API_KEY=your-maxmind-key

# Token Encryption (generated above)
TOKEN_ENCRYPTION_KEY=your-64-char-hex-key
TOKEN_ENCRYPTION_STRATEGY=environment

# Other required variables (from previous setup)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=your-stripe-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@gabrieltoth.com
SMTP_FROM_NAME=Gabriel Toth
```

---

## Phase 4: Local Testing

### Step 1: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
> next dev
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local
```

### Step 2: Run Tests

```bash
npm run test
```

**Expected output:**
```
PASS  src/__tests__/lib/youtube/oauth-service.test.ts
PASS  src/__tests__/lib/youtube/channel-validation.test.ts
...
Test Suites: 10 passed, 10 total
Tests:       300+ passed, 300+ total
```

### Step 3: Run Tests with Coverage

```bash
npm run test:coverage
```

**Expected output:**
```
Coverage summary:
  Statements   : 85%+
  Branches     : 80%+
  Functions    : 85%+
  Lines        : 85%+
```

### Step 4: Build for Production

```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Linting and type checking
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
...
```

### Step 5: Test YouTube Linking Locally

1. Visit http://localhost:3000
2. Log in with your account
3. Navigate to YouTube linking page
4. Click "Link YouTube Channel"
5. Authorize with your YouTube account
6. Verify channel is linked

---

## Phase 5: Vercel Environment Variables

### Set Environment Variables in Vercel

Go to Vercel Project Settings > Environment Variables and add:

**Public Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://gabrieltoth.com/api/auth/google/callback
```

**Sensitive Variables (mark as Sensitive):**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=your-stripe-live-key
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=https://gabrieltoth.com/api/youtube/link/callback
GEOIP_API_KEY=your-maxmind-key
TOKEN_ENCRYPTION_KEY=your-64-char-hex-key
TOKEN_ENCRYPTION_STRATEGY=environment
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@gabrieltoth.com
SMTP_FROM_NAME=Gabriel Toth
```

---

## Phase 6: Git Commit and Push

### Check Git Status

```bash
git status
```

**Expected output:**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

### View Recent Commits

```bash
git log --oneline -5
```

**Expected output:**
```
0d0e9ee docs: add comprehensive deployment guides
b4e8667 feat: implement YouTube channel linking
...
```

---

## Phase 7: Verify Production Deployment

### Check Vercel Deployment Status

```bash
# Go to https://vercel.com/dashboard
# Select your project
# Check the latest deployment status
```

### Test Production YouTube Linking

1. Visit https://gabrieltoth.com
2. Log in with your account
3. Navigate to YouTube linking page
4. Test the YouTube linking flow

### Check Production Logs

```bash
# Go to https://vercel.com/dashboard
# Select your project
# Go to Monitoring > Logs
# Check for any errors
```

---

## Phase 8: Verify Supabase Production

### Check Database Tables

Go to Supabase dashboard > Table Editor and verify:
- [ ] `youtube_channels` table exists
- [ ] `youtube_linking_activity` table exists
- [ ] `youtube_recovery_tokens` table exists
- [ ] `youtube_audit_logs` table exists
- [ ] `youtube_unlink_revocation_window` table exists

### Check RLS Policies

Go to Supabase dashboard > Authentication > Policies and verify:
- [ ] RLS enabled on all tables
- [ ] Policies are configured correctly

---

## Troubleshooting Commands

### Check Supabase Connection

```bash
# Verify Supabase link
npx supabase status
```

### View Migration History

```bash
# List all migrations
npx supabase migration list
```

### Rollback Last Migration

```bash
# WARNING: This will delete data!
npx supabase db reset
```

### Check Environment Variables

```bash
# Verify .env.local is loaded
npm run dev

# Check in browser console:
# console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### Run Specific Tests

```bash
# Run YouTube OAuth tests
npm run test -- oauth-service.test.ts

# Run channel validation tests
npm run test -- channel-validation.test.ts

# Run with coverage
npm run test:coverage -- oauth-service.test.ts
```

### Check Build Errors

```bash
# Build with verbose output
npm run build -- --debug

# Check TypeScript errors
npm run type-check

# Check linting errors
npm run lint
```

---

## Useful Links

| Resource | URL |
|----------|-----|
| Supabase Dashboard | https://supabase.com/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |
| Google Cloud Console | https://console.cloud.google.com/ |
| MaxMind GeoIP | https://www.maxmind.com/ |
| GitHub Repository | https://github.com/GabrielToth/gabrieltoth.com |

---

## Environment Variable Checklist

### Supabase Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set (Sensitive)

### YouTube OAuth Variables
- [ ] `YOUTUBE_CLIENT_ID` - Set
- [ ] `YOUTUBE_CLIENT_SECRET` - Set (Sensitive)
- [ ] `YOUTUBE_REDIRECT_URI` - Set

### GeoIP Variables
- [ ] `GEOIP_API_KEY` - Set (Sensitive)

### Token Encryption Variables
- [ ] `TOKEN_ENCRYPTION_KEY` - Set (Sensitive)
- [ ] `TOKEN_ENCRYPTION_STRATEGY` - Set to `environment`

### Other Required Variables
- [ ] `GOOGLE_CLIENT_ID` - Set
- [ ] `GOOGLE_CLIENT_SECRET` - Set (Sensitive)
- [ ] `JWT_SECRET` - Set (Sensitive)
- [ ] `STRIPE_SECRET_KEY` - Set (Sensitive)

### Email Variables (Optional)
- [ ] `SMTP_HOST` - Set
- [ ] `SMTP_PORT` - Set
- [ ] `SMTP_USER` - Set (Sensitive)
- [ ] `SMTP_PASSWORD` - Set (Sensitive)
- [ ] `SMTP_FROM_EMAIL` - Set
- [ ] `SMTP_FROM_NAME` - Set

---

## Quick Deployment Summary

```bash
# 1. Link to Supabase
npx supabase link --project-ref YOUR_PROJECT_REFERENCE

# 2. Push migrations
npx supabase db push

# 3. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Setup local environment
cp .env.local.example .env.local
# Edit .env.local with all credentials

# 5. Test locally
npm run dev
npm run test
npm run build

# 6. Set Vercel environment variables
# Go to https://vercel.com/dashboard

# 7. Verify production
# Visit https://gabrieltoth.com
# Test YouTube linking flow

# 8. Monitor logs
# Go to https://vercel.com/dashboard > Monitoring > Logs
```

---

**Last Updated**: April 23, 2026
**Status**: Ready for deployment
