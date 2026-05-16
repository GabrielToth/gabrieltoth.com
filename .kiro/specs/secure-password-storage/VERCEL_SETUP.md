# Vercel Environment Variables Setup Guide

## Overview

This guide explains how to set up environment variables in Vercel for the secure password storage system to work correctly in production.

**Location**: Vercel Dashboard → Project Settings → Environment Variables

**Note**: All SENSITIVE variables should be marked as "Sensitive" in Vercel to prevent exposure in build logs.

---

## Required Variables for Production

### 1. Argon2id Configuration (Performance-Tuned for Vercel Free)

```env
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2
```

**Why these values?**
- Memory: 64MB (reduced from standard 128-256MB to fit Vercel's 10s timeout)
- Time: 3 iterations (balances security with speed)
- Parallelism: 2 threads (fits within Free Plan CPU allocation)
- Expected hash time: 2-3 seconds per operation

**When to change:**
- Moving to paid Vercel plan: Increase to 128MB memory, 4 iterations
- Higher security requirement: Increase iterations (max 10)
- Performance issues: Decrease memory or iterations

---

### 2. Pepper Secret (CRITICAL - Mark as Sensitive)

```env
PEPPER_SECRET=<MUST_BE_32_CHARS_OR_LONGER>
```

**How to generate a secure pepper:**

```bash
# Generate secure random value (32+ characters)
openssl rand -hex 32
# Output example: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a

# Alternative (Python)
python3 -c "import secrets; print(secrets.token_hex(32))"

# Alternative (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Setup in Vercel:**
1. Go to: Project Settings → Environment Variables
2. Add new variable
   - Name: `PEPPER_SECRET`
   - Value: `<paste_generated_value>`
   - **CHECK "Sensitive"** (critical!)
   - Select: "Production" (or all environments if using same pepper)
3. Click "Save"

**Important:**
- Pepper MUST be at least 32 characters
- Store the value safely (don't commit to git)
- Same pepper must be used across all deployments (until rotation)
- Changing pepper requires rehashing all passwords (don't do lightly)

---

### 3. CAPTCHA Configuration (Zero-Cost via Cloudflare Turnstile)

#### Cloudflare Turnstile Setup (RECOMMENDED)

1. **Create Turnstile Site:**
   - Go to: https://dash.cloudflare.com/?to=/:account/turnstile
   - Click "Create Challenge"
   - Domain: `gabrieltoth.com`, `www.gabrieltoth.com`, `localhost:3000` (dev)
   - Mode: "Managed" (default)
   - Click "Create"

2. **Copy Keys:**
   - Site Key (public)
   - Secret Key (sensitive)

3. **Add to Vercel:**

```env
# Public key (safe to expose)
NEXT_PUBLIC_CAPTCHA_SITE_KEY=<YOUR_TURNSTILE_SITE_KEY>

# Secret key (MARK AS SENSITIVE)
CAPTCHA_SECRET_KEY=<YOUR_TURNSTILE_SECRET_KEY>

# Configuration
CAPTCHA_PROVIDER=cloudflare
```

**Cost**: FREE (0 requests) - Cloudflare provides unlimited free CAPTCHA requests

---

#### Google reCAPTCHA v3 Setup (ALTERNATIVE)

If you prefer Google reCAPTCHA instead:

1. **Create reCAPTCHA Site:**
   - Go to: https://www.google.com/recaptcha/admin
   - Click "Create" or "+"
   - Label: `gabrieltoth.com Production`
   - Type: "reCAPTCHA v3"
   - Domains: `gabrieltoth.com`, `www.gabrieltoth.com`
   - Click "Create"

2. **Copy Keys:**
   - Site Key (public)
   - Secret Key (sensitive)

3. **Add to Vercel:**

```env
# Public key (safe to expose)
NEXT_PUBLIC_CAPTCHA_SITE_KEY=<YOUR_RECAPTCHA_SITE_KEY>

# Secret key (MARK AS SENSITIVE)
CAPTCHA_SECRET_KEY=<YOUR_RECAPTCHA_SECRET_KEY>

# Configuration
CAPTCHA_PROVIDER=google
```

**Cost**: Free tier includes up to 1,000,000 requests per month (paid tier: $0.50 per 1k requests above free tier)

---

### 4. Rate Limiting Configuration

```env
RATE_LIMIT_FAILURE_THRESHOLD=5           # Failures before lockout
RATE_LIMIT_WINDOW_MINUTES=15             # Time window for counting
RATE_LIMIT_LOCKOUT_MINUTES=15            # Lockout duration
RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD=3 # Failures before harder CAPTCHA
```

These are defaults and match `.env.local`. Generally no need to change.

---

## Complete Environment Variables List

Add these to Vercel in this order:

| Variable | Value | Sensitive? | Notes |
|----------|-------|-----------|-------|
| `ARGON2_MEMORY_COST` | `64` | No | Must match local development |
| `ARGON2_TIME_COST` | `3` | No | Must match local development |
| `ARGON2_PARALLELISM` | `2` | No | Must match local development |
| `PEPPER_SECRET` | `<generated>` | **YES** | Use `openssl rand -hex 32` |
| `CAPTCHA_PROVIDER` | `cloudflare` | No | Or `google` if preferred |
| `NEXT_PUBLIC_CAPTCHA_SITE_KEY` | `<turnstile_key>` | No | Public key, safe to expose |
| `CAPTCHA_SECRET_KEY` | `<turnstile_secret>` | **YES** | Secret key, mark sensitive |
| `RATE_LIMIT_FAILURE_THRESHOLD` | `5` | No | Default threshold |
| `RATE_LIMIT_WINDOW_MINUTES` | `15` | No | Default window |
| `RATE_LIMIT_LOCKOUT_MINUTES` | `15` | No | Default lockout |
| `RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD` | `3` | No | Default escalation |

---

## Step-by-Step Setup in Vercel

### 1. Navigate to Environment Variables

```
Vercel Dashboard 
  → Select Project "gabrieltoth.com"
  → Settings (top right)
  → Environment Variables (left sidebar)
```

### 2. Add Each Variable

For each variable:

1. Click "+ Add New"
2. Select type: "Plain Text" (default)
3. Enter:
   - **Name**: Exact variable name from table above
   - **Value**: Corresponding value
   - **Environments**: 
     - For PEPPER_SECRET and CAPTCHA_SECRET_KEY: Production, Preview, Development
     - For others: All (or Production + Preview minimum)
4. If sensitive: Check "Sensitive" checkbox
5. Click "Save"

### 3. Mark Sensitive Variables

Variables to mark as "Sensitive":
- ✅ `PEPPER_SECRET`
- ✅ `CAPTCHA_SECRET_KEY`

Why? Sensitive variables:
- Won't be visible in logs
- Won't be exposed in build artifacts
- Won't be shown in Vercel UI

### 4. Verify Configuration

After adding all variables:

1. Go to Project Settings → Environment Variables
2. Verify all variables are listed (sensitive ones show as masked)
3. Click each one to confirm value is correct
4. For new environment variables: Need to **redeploy** to apply them

### 5. Trigger Redeploy

After adding variables, redeploy:

```bash
# Option 1: Via Vercel Dashboard
- Go to Deployments tab
- Click "Redeploy" on latest deployment

# Option 2: Via Git
- Push to main branch
- Vercel auto-deploys
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] All environment variables added to Vercel
- [ ] Sensitive variables marked as "Sensitive"
- [ ] Project redeployed after adding variables
- [ ] `/api/health` endpoint returns 200 with config info
- [ ] Registration page shows CAPTCHA widget
- [ ] Login page shows CAPTCHA widget
- [ ] Test registration: Should require CAPTCHA
- [ ] Test login: Should enforce rate limiting
- [ ] Check Supabase: Users table has data
- [ ] Check logs: No environment variable errors

---

## Troubleshooting

### Issue: "PEPPER_SECRET is not configured"

**Solution**: 
1. Verify `PEPPER_SECRET` is added to Vercel Environment Variables
2. Check it's marked as "Sensitive"
3. Redeploy the project
4. Check build logs for errors

### Issue: "CAPTCHA token verification failed"

**Solution**:
1. Verify `CAPTCHA_SECRET_KEY` is correct
2. Verify `CAPTCHA_PROVIDER` matches the provider (cloudflare or google)
3. Check domain is added to provider settings
4. Clear browser cache and try again
5. Check API logs for error details

### Issue: Hash generation times exceed 5 seconds

**Solution**:
1. Verify `ARGON2_MEMORY_COST` is 64 (not higher)
2. Verify `ARGON2_TIME_COST` is 3 (not higher)
3. Check Vercel function logs for other operations
4. Consider reducing memory cost to 32 MB if persistent

### Issue: Variables not taking effect after update

**Solution**:
1. Redeploy the project
2. Wait 5-10 minutes for CDN cache to clear
3. Hard refresh browser (Ctrl+Shift+R)
4. Check Vercel Build Logs for any errors

---

## Local Development

In local Docker development, use `.env.local`:

```bash
# Use same Argon2id parameters as production
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2

# Use a fixed pepper for testing (non-sensitive in local development)
PEPPER_SECRET=dev-pepper-test-very-long-string-32chars-minimum-required!

# Use Cloudflare test keys or local mock
CAPTCHA_PROVIDER=cloudflare
CAPTCHA_SECRET_KEY=1x00000000000000000000000000000000000000000
NEXT_PUBLIC_CAPTCHA_SITE_KEY=1x00000000000000000000000000000000000001
```

Start Docker with:
```bash
docker-compose up -d
```

---

## Security Best Practices

1. **Pepper Secret**
   - Never commit to git
   - Never share with team members via chat/email
   - Rotate periodically (at least annually)
   - Use strong random generation

2. **CAPTCHA Keys**
   - Secret key must be marked "Sensitive" in Vercel
   - Site key (public) can be in code or .env
   - Rotate keys if compromised

3. **Monitoring**
   - Monitor authentication failures in logs
   - Watch for CAPTCHA bypass attempts
   - Alert on rate limit triggers

4. **Backup & Recovery**
   - Store pepper value securely (password manager)
   - Document rotation procedure
   - Have emergency access procedure

---

## References

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [OWASP Password Storage Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

**Last updated**: May 15, 2026
**Status**: Complete - Ready for production deployment
