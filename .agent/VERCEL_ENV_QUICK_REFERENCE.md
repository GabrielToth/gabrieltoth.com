# Vercel Environment Variables - Quick Reference Card

## Task 1.4: Configure Vercel Environment Variables

### Generated Values for Vercel

Copy and paste these values into Vercel Settings > Environment Variables

#### SENSITIVE VARIABLES (Mark ✅ SENSITIVE in Vercel)

```
PEPPER_SECRET
78126032ea0388a663310da7224b05b1013af029ea63b10f5db0527ed0d421c6

JWT_SECRET
c0df2262c8f5a7799f2a56e06f6dfda6e544b5f2132891581bb33325e3992b6476e7774fa99e8ac89e309480c53209a1982fb538ab6f73962aa048c31a3c83ca

TOKEN_ENCRYPTION_KEY
aeb256b596245f798e12df25f8d7a9cac4065cc32e929db5a6f115ca5fbbc070

CAPTCHA_SECRET_KEY
<Get from https://dash.cloudflare.com/ → Turnstile → gabrieltoth.com → Secret Key>
```

#### NON-SENSITIVE VARIABLES (Mark ❌ NOT SENSITIVE)

```
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2

RATE_LIMIT_FAILURE_THRESHOLD=5
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_LOCKOUT_MINUTES=15
RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD=3

CAPTCHA_PROVIDER=cloudflare
NEXT_PUBLIC_CAPTCHA_SITE_KEY=<Get from https://dash.cloudflare.com/ → Turnstile → gabrieltoth.com → Site Key>
```

---

## 60-Second Setup

1. **Open Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select gabrieltoth.com
   - Click Settings > Environment Variables

2. **Add Each Variable**
   - Click "Add Environment Variable"
   - Enter Name and Value (copy from above)
   - Select "Production" and "Preview"
   - Check "Sensitive" checkbox for secrets only
   - Click "Save"

3. **Redeploy**
   - Go to Deployments
   - Click "Redeploy" on latest
   - Wait for completion

4. **Test**
   - Try registration with CAPTCHA
   - Try login with CAPTCHA
   - Verify rate limiting works

---

## Variable Checklist

### Sensitive (Mark ✅)
- [ ] PEPPER_SECRET
- [ ] JWT_SECRET
- [ ] TOKEN_ENCRYPTION_KEY
- [ ] CAPTCHA_SECRET_KEY

### Non-Sensitive (Mark ❌)
- [ ] ARGON2_MEMORY_COST = 64
- [ ] ARGON2_TIME_COST = 3
- [ ] ARGON2_PARALLELISM = 2
- [ ] RATE_LIMIT_FAILURE_THRESHOLD = 5
- [ ] RATE_LIMIT_WINDOW_MINUTES = 15
- [ ] RATE_LIMIT_LOCKOUT_MINUTES = 15
- [ ] RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD = 3
- [ ] CAPTCHA_PROVIDER = cloudflare
- [ ] NEXT_PUBLIC_CAPTCHA_SITE_KEY

**Total: 13 variables**

---

## Cloudflare Turnstile Keys

### How to Get Keys

1. Go to: https://dash.cloudflare.com/
2. Login to your account
3. Left sidebar → **Turnstile**
4. Find **gabrieltoth.com** domain
5. You'll see:
   - **Site Key** → Copy to `NEXT_PUBLIC_CAPTCHA_SITE_KEY`
   - **Secret Key** → Copy to `CAPTCHA_SECRET_KEY`

### If Domain Not Configured

1. Click **Create Challenge**
2. Domain: `gabrieltoth.com`
3. Add variants: `www.gabrieltoth.com` (optional)
4. Mode: **Managed** (default)
5. Click **Create**
6. Copy keys to Vercel

---

## Environment Variable Organization

### All Variables for Production Environment

```
✅ SENSITIVE:
- PEPPER_SECRET = 78126032ea0388a663310da7224b05b1013af029ea63b10f5db0527ed0d421c6
- JWT_SECRET = c0df2262c8f5a7799f2a56e06f6dfda6e544b5f2132891581bb33325e3992b6476e7774fa99e8ac89e309480c53209a1982fb538ab6f73962aa048c31a3c83ca
- TOKEN_ENCRYPTION_KEY = aeb256b596245f798e12df25f8d7a9cac4065cc32e929db5a6f115ca5fbbc070
- CAPTCHA_SECRET_KEY = <FROM CLOUDFLARE>

❌ NON-SENSITIVE:
- ARGON2_MEMORY_COST = 64
- ARGON2_TIME_COST = 3
- ARGON2_PARALLELISM = 2
- RATE_LIMIT_FAILURE_THRESHOLD = 5
- RATE_LIMIT_WINDOW_MINUTES = 15
- RATE_LIMIT_LOCKOUT_MINUTES = 15
- RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD = 3
- CAPTCHA_PROVIDER = cloudflare
- NEXT_PUBLIC_CAPTCHA_SITE_KEY = <FROM CLOUDFLARE>
```

---

## Docker Parity

These values MUST match `docker/docker-compose.yml`:

| Parameter | Docker | Vercel | Status |
|---|---|---|---|
| ARGON2_MEMORY_COST | 64 | 64 | ✅ Match |
| ARGON2_TIME_COST | 3 | 3 | ✅ Match |
| ARGON2_PARALLELISM | 2 | 2 | ✅ Match |
| RATE_LIMIT_FAILURE_THRESHOLD | 5 | 5 | ✅ Match |
| RATE_LIMIT_WINDOW_MINUTES | 15 | 15 | ✅ Match |
| RATE_LIMIT_LOCKOUT_MINUTES | 15 | 15 | ✅ Match |
| RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD | 3 | 3 | ✅ Match |
| CAPTCHA_PROVIDER | cloudflare | cloudflare | ✅ Match |

---

## Testing After Setup

### 1. Registration Test
```
1. Go to https://gabrieltoth.com/register
2. Complete CAPTCHA
3. Enter email and password
4. Submit
Expected: User created, no errors
```

### 2. Login Test
```
1. Go to https://gabrieltoth.com/login
2. Complete CAPTCHA
3. Enter email and password
4. Submit
Expected: User logged in successfully
```

### 3. Rate Limiting Test
```
1. Try login with wrong password 5 times
Expected: After 5th attempt, get 429 Too Many Requests
```

### 4. Hash Performance Test
```
1. Check Vercel function logs
2. Look for password hash generation time
Expected: 2-3 seconds per operation
```

---

## Troubleshooting Quick Fixes

| Problem | Solution |
|---|---|
| Variables not loading | Redeploy Vercel (deploy list → Redeploy) |
| PEPPER_SECRET too short | Must be 64 hex characters (32 bytes) |
| CAPTCHA not working | Get keys from Cloudflare Turnstile dashboard |
| Rate limiting broken | Check rate_limit_records table in Supabase |
| Errors in logs | Verify all variable names are correct |

---

## Documentation Files

- **Detailed Setup**: `.agent/VERCEL_ENV_SETUP.md`
- **Checklist**: `.agent/VERCEL_ENV_CHECKLIST.md`
- **This Guide**: `.agent/VERCEL_ENV_QUICK_REFERENCE.md`
- **Generator Script**: `scripts/generate-secrets.mjs`

---

## Security Reminders

⚠️ **CRITICAL:**
- Never commit secrets to git
- Never share PEPPER_SECRET
- Never expose CAPTCHA_SECRET_KEY
- Mark all secrets ✅ SENSITIVE in Vercel
- Rotate secrets if compromised

---

## Next Steps

1. ✅ Generate secrets (done with `generate-secrets.mjs`)
2. ⬜ Get Cloudflare keys (https://dash.cloudflare.com/)
3. ⬜ Set variables in Vercel
4. ⬜ Redeploy Vercel
5. ⬜ Test authentication flows
6. ⬜ Verify parity with Docker
7. ⬜ Complete Task 1.5

---

**Created**: 2024
**For**: gabrieltoth.com
**Task**: 1.4 Configure Vercel Environment Variables
**Status**: Ready for Implementation
