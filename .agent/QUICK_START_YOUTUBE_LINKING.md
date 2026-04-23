# Quick Start: YouTube Channel Linking Deployment

## TL;DR - What You Need to Do

### 1. Set Up Supabase (5 minutes)
```bash
# Create project at https://supabase.com/
# Get project reference from Settings > General

# Link your local project
npx supabase link --project-ref YOUR_PROJECT_REFERENCE

# Push database migrations
npx supabase db push
```

### 2. Configure Environment Variables (10 minutes)
```bash
# Copy environment file
cp .env.local.example .env.local

# Fill in these required variables:
# - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
# - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET
# - GEOIP_API_KEY
# - TOKEN_ENCRYPTION_KEY
# - STRIPE_SECRET_KEY
# - SMTP_* (email configuration)
```

### 3. Test Locally (5 minutes)
```bash
npm run dev
# Visit http://localhost:3000
# Test YouTube channel linking
```

### 4. Deploy to Vercel (5 minutes)
```bash
git push origin main
# Vercel auto-deploys
# Check https://vercel.com/dashboard
```

---

## Detailed Steps

### Step 1: Create Supabase Project

1. Go to https://supabase.com/
2. Click "New Project"
3. Fill in:
   - Name: `gabrieltoth-dev` (or your project name)
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
4. Click "Create new project"
5. Wait for project to be ready (~2 minutes)

### Step 2: Get Supabase Credentials

1. Go to "Settings" > "API"
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Link and Deploy

```bash
# Get your project reference from Settings > General
# Format: xxxxxxxxxxxxx (13 characters)

npx supabase link --project-ref YOUR_PROJECT_REFERENCE
# Enter your Supabase password when prompted

npx supabase db push
# This pushes all 6 migrations to Supabase
```

### Step 4: Set Up Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and fill in:
```

**Required for YouTube Linking:**
```
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/link/callback
GEOIP_API_KEY=your-maxmind-key
TOKEN_ENCRYPTION_KEY=your-64-char-hex-key
```

**How to get YouTube credentials:**
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials:
   - Type: Web application
   - Authorized origins: `http://localhost:3000`
   - Redirect URIs: `http://localhost:3000/api/youtube/link/callback`
5. Copy Client ID and Client Secret

**How to get GeoIP key:**
1. Go to https://www.maxmind.com/
2. Sign up for free account
3. Generate license key
4. Copy to `GEOIP_API_KEY`

**How to generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Test Locally

```bash
npm run dev
# Visit http://localhost:3000
# Click on YouTube linking
# Authorize with your YouTube account
# Verify channel is linked
```

### Step 6: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "feat: deploy YouTube channel linking"

# Push to GitHub
git push origin main

# Vercel auto-deploys
# Check https://vercel.com/dashboard
```

### Step 7: Set Up Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Add each variable:
   - Name: (variable name)
   - Value: (your production value)
   - Environments: Production, Preview
   - Sensitive: Check if it's a secret

**Mark as Sensitive:**
- `GOOGLE_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `YOUTUBE_CLIENT_SECRET`
- `GEOIP_API_KEY`
- `TOKEN_ENCRYPTION_KEY`
- `SMTP_PASSWORD`

---

## Troubleshooting

### "Cannot find project ref"
```bash
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
```

### "Migrations failed"
1. Check Supabase dashboard > SQL Editor
2. Look for error messages
3. Try pushing again: `npx supabase db push`

### "Environment variable not set"
1. Check `.env.local` exists
2. Verify variable is filled in
3. Restart dev server: `npm run dev`

### "YouTube OAuth redirect URI mismatch"
1. Check `YOUTUBE_REDIRECT_URI` in `.env.local`
2. Verify it matches Google Console
3. For local: `http://localhost:3000/api/youtube/link/callback`
4. For production: `https://gabrieltoth.com/api/youtube/link/callback`

---

## What Was Completed

✅ 75 implementation tasks completed
✅ Database schema designed (5 tables)
✅ OAuth 2.0 service with PKCE
✅ Channel validation and duplicate detection
✅ Suspicious activity detection
✅ Audit logging
✅ Email notifications
✅ Unlinking and recovery flows
✅ Frontend components
✅ 300+ tests with property-based testing
✅ Comprehensive documentation

---

## Documentation Files

- **`.agent/ENVIRONMENT_VARIABLES.md`** - Complete environment setup guide
- **`.agent/SUPABASE_DEPLOYMENT_GUIDE.md`** - Detailed Supabase deployment
- **`.agent/YOUTUBE_LINKING_DEPLOYMENT_STATUS.md`** - Full status and checklist

---

## Next Tasks (After Deployment)

1. **Fix Logout Functionality** - User reported logout is broken
2. **Add Account Menu to Dashboard** - Add user profile section with submenu
3. **Monitor Production** - Check error logs and performance

---

## Estimated Time

- Supabase setup: 5 minutes
- Environment variables: 10 minutes
- Local testing: 5 minutes
- Vercel deployment: 5 minutes
- **Total: ~25 minutes**

---

## Support

For detailed information, see:
- `.agent/ENVIRONMENT_VARIABLES.md` - All environment variables
- `.agent/SUPABASE_DEPLOYMENT_GUIDE.md` - Supabase setup
- `.agent/YOUTUBE_LINKING_DEPLOYMENT_STATUS.md` - Full status

