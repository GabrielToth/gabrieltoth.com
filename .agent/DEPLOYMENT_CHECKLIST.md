# YouTube Channel Linking - Deployment Checklist

## 🎯 Overview

This checklist guides you through deploying the YouTube Channel Linking feature to production. The feature is fully implemented and tested. Follow these steps in order.

---

## Phase 1: Supabase Setup (30 minutes)

### Step 1.1: Create Supabase Project

- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Fill in project details:
  - Organization: Select your organization
  - Project name: `gabrieltoth-prod` (or similar)
  - Database password: Generate a strong password
  - Region: Select closest to your users
- [ ] Click "Create new project"
- [ ] Wait for project to be ready (~2 minutes)

### Step 1.2: Get Project Reference

- [ ] Go to "Settings" > "General"
- [ ] Copy the "Project Reference" (format: `xxxxxxxxxxxxx`)
- [ ] Save this for later: `PROJECT_REF = _______________`

### Step 1.3: Link Local Project to Supabase

```bash
# In your terminal, run:
npx supabase link --project-ref YOUR_PROJECT_REFERENCE

# You'll be prompted to enter your Supabase password
# This creates a .supabase/config.json file (don't commit this!)
```

- [ ] Supabase link successful

### Step 1.4: Push Database Migrations

```bash
# Push all migrations to Supabase
npx supabase db push

# You should see output like:
# Applying migration 20250101000001_create_youtube_channels_table.sql
# Applying migration 20250101000002_create_linking_activity_table.sql
# ... (6 migrations total)
```

- [ ] All 6 migrations applied successfully

### Step 1.5: Verify Database Tables

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor"
4. Run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'youtube_%'
ORDER BY table_name;
```

- [ ] All 5 tables created:
  - [ ] `youtube_channels`
  - [ ] `youtube_linking_activity`
  - [ ] `youtube_recovery_tokens`
  - [ ] `youtube_audit_logs`
  - [ ] `youtube_unlink_revocation_window`

### Step 1.6: Enable Row Level Security (RLS)

1. Go to "Authentication" > "Policies"
2. For each table, enable RLS:
   - Click on the table
   - Toggle "Enable RLS"

- [ ] RLS enabled on `youtube_channels`
- [ ] RLS enabled on `youtube_linking_activity`
- [ ] RLS enabled on `youtube_recovery_tokens`
- [ ] RLS enabled on `youtube_audit_logs`
- [ ] RLS enabled on `youtube_unlink_revocation_window`

### Step 1.7: Add RLS Policies

For each table, add the recommended policies from `.agent/SUPABASE_DEPLOYMENT_GUIDE.md`:

- [ ] Policies added to `youtube_channels`
- [ ] Policies added to `youtube_audit_logs`

---

## Phase 2: Environment Variables Setup (20 minutes)

### Step 2.1: Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Settings" > "API"
4. Copy:
   - "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - "anon/public key" → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - "service_role key" → `SUPABASE_SERVICE_ROLE_KEY`

- [ ] Supabase credentials copied

### Step 2.2: Get YouTube OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "YouTube Data API v3":
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "gabrieltoth.com - YouTube Linking"
   - Authorized JavaScript origins:
     - `https://gabrieltoth.com`
     - `https://www.gabrieltoth.com`
   - Authorized redirect URIs:
     - `https://gabrieltoth.com/api/youtube/link/callback`
   - Click "Create"
5. Copy "Client ID" and "Client secret"

- [ ] YouTube OAuth credentials obtained

### Step 2.3: Get GeoIP API Key

1. Go to https://www.maxmind.com/
2. Sign up for a free account
3. Go to "Account" > "My License Key"
4. Generate a new license key
5. Copy Account ID and License Key

- [ ] GeoIP API key obtained

### Step 2.4: Generate Token Encryption Key

```bash
# Generate a 64-character hex string (256-bit key)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] Token encryption key generated: `_______________`

### Step 2.5: Set Up Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Add each variable:

**Public Variables (NOT sensitive):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = (your anon key)
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = (your Google client ID)
- [ ] `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` = `https://gabrieltoth.com/api/auth/google/callback`

**Sensitive Variables (mark as Sensitive):**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (your service role key) - Mark as Sensitive
- [ ] `GOOGLE_CLIENT_SECRET` = (your Google client secret) - Mark as Sensitive
- [ ] `JWT_SECRET` = (your JWT secret) - Mark as Sensitive
- [ ] `STRIPE_SECRET_KEY` = (your Stripe live key) - Mark as Sensitive
- [ ] `YOUTUBE_CLIENT_ID` = (your YouTube client ID)
- [ ] `YOUTUBE_CLIENT_SECRET` = (your YouTube client secret) - Mark as Sensitive
- [ ] `YOUTUBE_REDIRECT_URI` = `https://gabrieltoth.com/api/youtube/link/callback`
- [ ] `GEOIP_API_KEY` = (your MaxMind API key) - Mark as Sensitive
- [ ] `TOKEN_ENCRYPTION_KEY` = (your encryption key) - Mark as Sensitive
- [ ] `TOKEN_ENCRYPTION_STRATEGY` = `environment`

**Email Variables (if using SMTP):**
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`
- [ ] `SMTP_USER` = (your email) - Mark as Sensitive
- [ ] `SMTP_PASSWORD` = (your app password) - Mark as Sensitive
- [ ] `SMTP_FROM_EMAIL` = `noreply@gabrieltoth.com`
- [ ] `SMTP_FROM_NAME` = `Gabriel Toth`

**Discord Webhook (optional):**
- [ ] `DISCORD_WEBHOOK_URL` = (your webhook URL) - Mark as Sensitive

---

## Phase 3: Local Testing (15 minutes)

### Step 3.1: Update Local Environment

```bash
# Copy environment file
cp .env.local.example .env.local

# Edit .env.local and fill in all credentials
# Use the same values from Supabase and Google Console
```

- [ ] `.env.local` updated with all credentials

### Step 3.2: Start Development Server

```bash
npm run dev
```

- [ ] Development server started successfully
- [ ] No errors in console

### Step 3.3: Test YouTube Linking Flow

1. Visit http://localhost:3000
2. Log in with your account
3. Navigate to YouTube linking page
4. Click "Link YouTube Channel"
5. Authorize with your YouTube account
6. Verify channel is linked in database

- [ ] YouTube linking flow works locally

### Step 3.4: Run Tests

```bash
npm run test
npm run test:coverage
```

- [ ] All tests pass
- [ ] Coverage is acceptable (>80%)

### Step 3.5: Build for Production

```bash
npm run build
```

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No warnings

---

## Phase 4: Production Deployment (10 minutes)

### Step 4.1: Verify Git Status

```bash
git status
```

- [ ] Working directory is clean
- [ ] All changes are committed

### Step 4.2: Check Recent Commits

```bash
git log --oneline -5
```

- [ ] Latest commit is the YouTube channel linking feature
- [ ] Commit message is descriptive

### Step 4.3: Verify Vercel Deployment

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Deployments"
4. Check the latest deployment

- [ ] Latest deployment is successful
- [ ] No build errors
- [ ] All environment variables are set

### Step 4.4: Test Production

1. Visit https://gabrieltoth.com
2. Log in with your account
3. Navigate to YouTube linking page
4. Test the YouTube linking flow

- [ ] Production YouTube linking works
- [ ] No errors in browser console
- [ ] No errors in Vercel logs

### Step 4.5: Monitor Error Logs

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Monitoring" > "Logs"
4. Check for any errors

- [ ] No critical errors in logs
- [ ] All requests are successful

---

## Phase 5: Post-Deployment Verification (10 minutes)

### Step 5.1: Verify Database

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Table Editor"
4. Check `youtube_channels` table

- [ ] Table is accessible
- [ ] No data corruption
- [ ] RLS policies are working

### Step 5.2: Verify API Routes

Test the following API routes:

```bash
# Test YouTube linking start
curl -X POST https://gabrieltoth.com/api/youtube/link/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

- [ ] API routes are responding
- [ ] No 500 errors
- [ ] Proper error handling

### Step 5.3: Check Email Notifications

1. Link a YouTube channel
2. Check your email for notification

- [ ] Email notification received
- [ ] Email content is correct
- [ ] Links are working

### Step 5.4: Monitor Performance

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Analytics"
4. Check performance metrics

- [ ] Page load time is acceptable (<2s)
- [ ] No performance degradation
- [ ] API response times are good

### Step 5.5: Check Security

1. Verify HTTPS is enabled
2. Check security headers
3. Verify no sensitive data in logs

- [ ] HTTPS is enabled
- [ ] Security headers are present
- [ ] No sensitive data exposed

---

## Phase 6: Documentation & Handoff (5 minutes)

### Step 6.1: Update Documentation

- [ ] Update `.agent/YOUTUBE_LINKING_DEPLOYMENT_STATUS.md` with deployment date
- [ ] Document any custom configurations
- [ ] Add troubleshooting notes

### Step 6.2: Create Runbook

- [ ] Document how to handle common issues
- [ ] Document how to rollback if needed
- [ ] Document how to scale if needed

### Step 6.3: Notify Team

- [ ] Send deployment notification
- [ ] Share documentation links
- [ ] Provide support contact info

---

## 🚨 Troubleshooting

### Issue: "Cannot find project ref. Have you run supabase link?"

**Solution:**
```bash
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
```

### Issue: "Migration failed"

**Solution:**
1. Check Supabase dashboard for errors
2. Go to "SQL Editor" and check for syntax errors
3. Try pushing again: `npx supabase db push`

### Issue: "YouTube OAuth redirect URI mismatch"

**Solution:**
1. Verify `YOUTUBE_REDIRECT_URI` matches Google Console
2. For production: `https://gabrieltoth.com/api/youtube/link/callback`
3. Update Google Console if needed

### Issue: "Token encryption key is invalid"

**Solution:**
1. Verify key is 64 characters (32 bytes in hex)
2. Verify key contains only hex characters (0-9, a-f)
3. Regenerate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Issue: "SMTP authentication failed"

**Solution:**
1. Verify Gmail 2-Factor Authentication is enabled
2. Generate new App Password
3. Use 16-character app password (not your Gmail password)
4. Verify `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`

---

## 📞 Support

For issues or questions:

1. **Check Documentation**
   - `.agent/ENVIRONMENT_VARIABLES.md` - Environment setup
   - `.agent/SUPABASE_DEPLOYMENT_GUIDE.md` - Supabase deployment
   - `.agent/YOUTUBE_LINKING_DEPLOYMENT_STATUS.md` - Deployment status

2. **Check Logs**
   - Supabase dashboard > "SQL Editor" for database errors
   - Vercel dashboard > "Deployments" for deployment errors
   - Browser console for client-side errors

3. **Rollback Procedure**
   - See `.agent/EMERGENCY_ROLLBACK.md` for emergency rollback steps

---

## ✅ Deployment Complete!

Once all checkboxes are complete, your YouTube Channel Linking feature is live in production!

**Next Steps:**
1. Monitor error logs for 24 hours
2. Gather user feedback
3. Plan for future enhancements
4. Document lessons learned

---

**Last Updated**: April 23, 2026
**Status**: Ready for deployment
