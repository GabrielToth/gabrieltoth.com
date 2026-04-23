# YouTube Channel Linking - Quick Deployment Guide

## TL;DR - 5 Minute Overview

The YouTube Channel Linking feature is fully implemented and ready to deploy. Here's what you need to do:

### 1. Supabase Setup (5 minutes)

```bash
# Create project at https://supabase.com/dashboard
# Get project reference from Settings > General

# Link local project
npx supabase link --project-ref YOUR_PROJECT_REFERENCE

# Push migrations
npx supabase db push

# Verify tables created
# Go to Supabase dashboard > SQL Editor and run:
# SELECT table_name FROM information_schema.tables 
# WHERE table_schema = 'public' AND table_name LIKE 'youtube_%'
```

### 2. Get Credentials (10 minutes)

**From Supabase (Settings > API):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**From Google Cloud Console:**
- Create YouTube OAuth credentials
- Get `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`
- Set redirect URI: `https://gabrieltoth.com/api/youtube/link/callback`

**From MaxMind:**
- Get `GEOIP_API_KEY`

**Generate:**
```bash
# Token encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set Vercel Environment Variables (5 minutes)

Go to Vercel Project Settings > Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (mark as Sensitive)
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=... (mark as Sensitive)
YOUTUBE_REDIRECT_URI=https://gabrieltoth.com/api/youtube/link/callback
GEOIP_API_KEY=... (mark as Sensitive)
TOKEN_ENCRYPTION_KEY=... (mark as Sensitive)
TOKEN_ENCRYPTION_STRATEGY=environment
```

### 4. Test Locally (5 minutes)

```bash
# Update .env.local with credentials
cp .env.local.example .env.local
# Edit .env.local and fill in all values

# Start dev server
npm run dev

# Test YouTube linking at http://localhost:3000
# Run tests
npm run test

# Build for production
npm run build
```

### 5. Deploy (automatic)

```bash
# Vercel auto-deploys when you push to main
# The code is already pushed!
# Just check https://vercel.com/dashboard
```

---

## What's Included

✅ **Database Schema** (5 tables)
- `youtube_channels` - Linked channels
- `youtube_linking_activity` - Activity log
- `youtube_recovery_tokens` - Recovery tokens
- `youtube_audit_logs` - Audit trail
- `youtube_unlink_revocation_window` - Revocation window

✅ **OAuth 2.0 Service**
- PKCE support
- Token encryption
- Automatic refresh

✅ **Security Features**
- Channel validation
- Duplicate detection
- Suspicious activity detection (GeoIP)
- Email notifications
- Audit logging

✅ **Tests**
- 300+ test cases
- Property-based testing
- Integration tests
- E2E tests

---

## Key Files

| File | Purpose |
|------|---------|
| `.agent/DEPLOYMENT_CHECKLIST.md` | Detailed step-by-step checklist |
| `.agent/ENVIRONMENT_VARIABLES.md` | All environment variables explained |
| `.agent/SUPABASE_DEPLOYMENT_GUIDE.md` | Supabase setup guide |
| `supabase/migrations/` | Database migrations |
| `src/lib/youtube/` | YouTube service implementation |
| `src/app/api/youtube/` | API routes |

---

## Common Issues

### "Cannot find project ref"
```bash
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
```

### "Migration failed"
- Check Supabase dashboard for errors
- Try again: `npx supabase db push`

### "YouTube OAuth redirect URI mismatch"
- Verify redirect URI in Google Console matches `YOUTUBE_REDIRECT_URI`
- Should be: `https://gabrieltoth.com/api/youtube/link/callback`

### "Token encryption key is invalid"
- Must be 64 hex characters (32 bytes)
- Regenerate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Verification Checklist

- [ ] Supabase project created
- [ ] Migrations pushed successfully
- [ ] All 5 tables created
- [ ] RLS enabled on tables
- [ ] Vercel environment variables set
- [ ] Local tests passing
- [ ] Local build successful
- [ ] YouTube linking tested locally
- [ ] Vercel deployment successful
- [ ] Production YouTube linking tested

---

## Next Steps

1. Follow the detailed checklist in `.agent/DEPLOYMENT_CHECKLIST.md`
2. Monitor error logs for 24 hours
3. Gather user feedback
4. Plan for future enhancements

---

**Status**: ✅ Ready to deploy
**Last Updated**: April 23, 2026
