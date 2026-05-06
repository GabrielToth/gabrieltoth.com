# Vercel Environment Variables Setup

## ⚠️ CRITICAL SECURITY ISSUE FIXED

The `.env.production` file was committing actual secrets to git, which Vercel was blocking with 403 Forbidden errors.

**Solution**: All sensitive variables have been moved to Vercel Project Settings.

---

## How to Configure Environment Variables in Vercel

### Step 1: Go to Vercel Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `gabrieltoth.com`
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add Each Sensitive Variable

For each variable below, click **Add New** and fill in:
- **Name**: (variable name)
- **Value**: (your actual secret value)
- **Environments**: Select `Production` and `Preview`
- **Sensitive**: ✅ Check this box for all secrets

---

## Required Sensitive Variables

### Google OAuth
```
Name: GOOGLE_CLIENT_SECRET
Value: [Your Google Client Secret from Google Cloud Console]
Sensitive: ✅ YES
Environments: Production, Preview
```

### Supabase
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Your Supabase Service Role Key]
Sensitive: ✅ YES
Environments: Production, Preview
```

### Stripe
```
Name: STRIPE_SECRET_KEY
Value: [Your Stripe Secret Key (sk_live_...)]
Sensitive: ✅ YES
Environments: Production, Preview
```

### Resend (Email Service)
```
Name: RESEND_API_KEY
Value: [Your Resend API Key]
Sensitive: ✅ YES
Environments: Production, Preview
```

### Discord Webhook
```
Name: DISCORD_WEBHOOK_URL
Value: [Your Discord Webhook URL]
Sensitive: ✅ YES
Environments: Production, Preview
```

### YouTube OAuth
```
Name: YOUTUBE_CLIENT_SECRET
Value: [Your YouTube Client Secret]
Sensitive: ✅ YES
Environments: Production, Preview
```

### JWT Secret
```
Name: JWT_SECRET
Value: [Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
Sensitive: ✅ YES
Environments: Production, Preview
```

### Token Encryption Key
```
Name: TOKEN_ENCRYPTION_KEY
Value: [Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
Sensitive: ✅ YES
Environments: Production, Preview
```

### Monero (Optional)
```
Name: MONERO_ADDRESS
Value: [Your Monero wallet address]
Sensitive: ✅ YES
Environments: Production, Preview
```

```
Name: MONERO_VIEW_KEY
Value: [Your Monero view key]
Sensitive: ✅ YES
Environments: Production, Preview
```

### GitHub Token (Optional)
```
Name: GITHUB_TOKEN
Value: [Your GitHub Personal Access Token]
Sensitive: ✅ YES
Environments: Production, Preview
```

### SMTP Password
```
Name: SMTP_PASSWORD
Value: [Your Gmail App Password or SMTP password]
Sensitive: ✅ YES
Environments: Production, Preview
```

### GeoIP API Key (Optional)
```
Name: GEOIP_API_KEY
Value: [Your MaxMind License Key]
Sensitive: ✅ YES
Environments: Production, Preview
```

---

## Public Variables (Already in .env.production)

These are already in `.env.production` and do NOT need to be added to Vercel:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_DEBUG`
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
- `DEPLOYMENT_TYPE`
- `DEBUG`
- `BCRYPT_COST_FACTOR`
- `SESSION_TIMEOUT`
- `VERIFICATION_TOKEN_EXPIRY`
- `CACHE_ENABLED`
- `CACHE_TTL`
- `CACHE_MAX_MEMORY`
- `USE_REDIS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_REDIRECT_URI`
- `GEOIP_SERVICE_URL`

---

## Step 3: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest failed deployment
3. Click **Redeploy**
4. Wait for deployment to complete

Or trigger a new deployment by pushing to your repository:

```bash
git add .
git commit -m "fix: move secrets to Vercel environment variables"
git push origin main
```

---

## Verification

After deployment, verify that:

1. ✅ Deployment completes without 403 errors
2. ✅ Application loads without errors
3. ✅ Login/authentication works
4. ✅ Email verification works
5. ✅ OAuth (Google, YouTube) works
6. ✅ Payments (Stripe) work
7. ✅ Discord notifications work

---

## Security Checklist

- ✅ `.env.production` contains only placeholders for secrets
- ✅ All sensitive variables are in Vercel (marked as Sensitive)
- ✅ `.vercelignore` prevents committing secrets
- ✅ `.gitignore` prevents committing `.env.production` with secrets
- ✅ No secrets are visible in git history
- ✅ Vercel deployment succeeds without 403 errors

---

## Troubleshooting

### Still getting 403 errors?

1. **Clear Vercel cache**:
   - Go to Settings > Git
   - Click "Disconnect Git"
   - Reconnect your repository
   - Trigger a new deployment

2. **Check environment variables**:
   - Verify all sensitive variables are set in Vercel
   - Check that variable names match exactly (case-sensitive)
   - Ensure values don't have extra spaces

3. **Check .vercelignore**:
   - Verify `.vercelignore` exists in root directory
   - Ensure `.env.production` is listed

4. **Check git history**:
   - Verify no secrets are in recent commits
   - If secrets were committed, use `git filter-branch` to remove them

### Application errors after deployment?

1. Check Vercel deployment logs for specific errors
2. Verify all required environment variables are set
3. Check that variable values are correct (not placeholders)
4. Test locally with `.env.local` to verify configuration

---

## References

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Security Best Practices](https://vercel.com/docs/security)

