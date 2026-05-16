# Vercel Environment Variables Setup Guide

## Overview
This guide provides step-by-step instructions to configure Vercel environment variables for the secure password storage system. All values must be identical to docker-compose for parity.

## Task 1.4: Configure Vercel Environment Variables

### Prerequisites
- Vercel project already deployed
- Access to Vercel project dashboard
- Access to production credentials (CAPTCHA keys, Supabase, etc.)

### Required Values

The following values MUST be configured in Vercel for secure password storage to work:

#### Secure Password Storage Parameters (Identical to Docker)

```
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2
RATE_LIMIT_FAILURE_THRESHOLD=5
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_LOCKOUT_MINUTES=15
RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD=3
```

#### Sensitive Variables (Mark as "Sensitive" in Vercel)

Generate these values:

##### 1. PEPPER_SECRET (32+ character secure random string)
Generate using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Store as: **PEPPER_SECRET**
Mark in Vercel: ✅ SENSITIVE

##### 2. CAPTCHA_SECRET_KEY (Production Cloudflare Turnstile key)
Get from: https://dash.cloudflare.com/?to=/:account/turnstile
Store as: **CAPTCHA_SECRET_KEY**
Mark in Vercel: ✅ SENSITIVE

##### 3. Public CAPTCHA Key
Get from: https://dash.cloudflare.com/?to=/:account/turnstile
Store as: **NEXT_PUBLIC_CAPTCHA_SITE_KEY**
Mark in Vercel: ❌ NOT SENSITIVE (public)

Store as: **CAPTCHA_PROVIDER=cloudflare**
Mark in Vercel: ❌ NOT SENSITIVE

### Step-by-Step Setup Instructions

#### Step 1: Access Vercel Project Settings
1. Go to https://vercel.com/dashboard
2. Select your project (gabrieltoth.com)
3. Click **Settings**
4. Click **Environment Variables**

#### Step 2: Add Non-Sensitive Variables (Public)
These can be viewed without the "Sensitive" flag:

| Variable Name | Value | Environments | Sensitive |
|---|---|---|---|
| ARGON2_MEMORY_COST | 64 | Production, Preview | ❌ |
| ARGON2_TIME_COST | 3 | Production, Preview | ❌ |
| ARGON2_PARALLELISM | 2 | Production, Preview | ❌ |
| RATE_LIMIT_FAILURE_THRESHOLD | 5 | Production, Preview | ❌ |
| RATE_LIMIT_WINDOW_MINUTES | 15 | Production, Preview | ❌ |
| RATE_LIMIT_LOCKOUT_MINUTES | 15 | Production, Preview | ❌ |
| RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD | 3 | Production, Preview | ❌ |
| CAPTCHA_PROVIDER | cloudflare | Production, Preview | ❌ |
| NEXT_PUBLIC_CAPTCHA_SITE_KEY | [FROM CLOUDFLARE] | Production, Preview | ❌ |

**Procedure:**
1. Click "Add Environment Variable"
2. Enter Variable Name
3. Enter Value
4. Select "Production" and "Preview"
5. DO NOT mark as Sensitive
6. Click "Save"

#### Step 3: Add Sensitive Variables (Secrets)
These require "Sensitive" flag and are never exposed:

| Variable Name | Value | Environments | Sensitive |
|---|---|---|---|
| PEPPER_SECRET | [GENERATE BELOW] | Production, Preview | ✅ |
| CAPTCHA_SECRET_KEY | [FROM CLOUDFLARE] | Production, Preview | ✅ |

**Procedure:**
1. Click "Add Environment Variable"
2. Enter Variable Name
3. Enter Value (secret key)
4. Select "Production" and "Preview"
5. CHECK the "Sensitive" checkbox
6. Click "Save"

### Generating Required Values

#### Generate PEPPER_SECRET (Secure Random String)

The pepper must be at least 32 characters of cryptographically secure random data.

**Option 1: Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Python**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Example output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

⚠️ **CRITICAL**: 
- Generate a NEW pepper for production (don't use test pepper)
- This pepper is used to hash all passwords - changing it breaks all existing passwords
- Store it safely - never commit to git
- Keep backup in secure password manager

#### Get Cloudflare Turnstile Keys

1. Go to https://dash.cloudflare.com/
2. Login to your Cloudflare account
3. Navigate to **Turnstile** (left sidebar)
4. Find your production domain (gabrieltoth.com)
5. Under the domain card:
   - **Site Key** → Copy to NEXT_PUBLIC_CAPTCHA_SITE_KEY
   - **Secret Key** → Copy to CAPTCHA_SECRET_KEY

If domain not set up:
1. Click **Create Challenge**
2. Domain: gabrieltoth.com
3. Add variants: www.gabrieltoth.com
4. Mode: Managed (default)
5. Type: JavaScript (default)
6. Copy the Site Key and Secret Key

### Verification Checklist

After setting all environment variables, verify the configuration:

- [ ] ARGON2_MEMORY_COST = 64
- [ ] ARGON2_TIME_COST = 3
- [ ] ARGON2_PARALLELISM = 2
- [ ] RATE_LIMIT_FAILURE_THRESHOLD = 5
- [ ] RATE_LIMIT_WINDOW_MINUTES = 15
- [ ] RATE_LIMIT_LOCKOUT_MINUTES = 15
- [ ] RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD = 3
- [ ] CAPTCHA_PROVIDER = cloudflare
- [ ] PEPPER_SECRET is set and marked ✅ Sensitive
- [ ] CAPTCHA_SECRET_KEY is set and marked ✅ Sensitive
- [ ] NEXT_PUBLIC_CAPTCHA_SITE_KEY is set (public, not sensitive)
- [ ] All variables are set for both "Production" and "Preview" environments

### Environment Parity Verification

To verify that Vercel and Docker have identical configuration:

**Local Docker** (from docker-compose.yml):
```
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2
RATE_LIMIT_FAILURE_THRESHOLD=5
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_LOCKOUT_MINUTES=15
RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD=3
CAPTCHA_PROVIDER=cloudflare
```

**Vercel Production** (from Settings > Environment Variables):
Should have identical values for the above variables.

### Testing Environment Configuration

After deployment, test that Vercel is reading the environment variables correctly:

1. Add a debug endpoint (development only):
   ```typescript
   // pages/api/debug/config.ts
   export default function handler(req: Request, res: Response) {
     if (process.env.NODE_ENV !== 'development') {
       return res.status(403).json({ error: 'Not available in production' })
     }
     
     return res.status(200).json({
       argon2Memory: process.env.ARGON2_MEMORY_COST,
       argon2Time: process.env.ARGON2_TIME_COST,
       argon2Parallelism: process.env.ARGON2_PARALLELISM,
       pepperLoaded: !!process.env.PEPPER_SECRET,
       captchaProvider: process.env.CAPTCHA_PROVIDER,
       captchaSecretLoaded: !!process.env.CAPTCHA_SECRET_KEY,
       captchaSiteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY
     })
   }
   ```

2. Deploy and access: `https://gabrieltoth.com/api/debug/config`
3. Verify all values are present and correct

### Troubleshooting

#### Variables not loading in Vercel
- Confirm all variables are set in Settings > Environment Variables
- Ensure you selected both "Production" and "Preview" environments
- Redeploy after adding variables (new deployments pick up fresh env vars)
- Check Vercel deployment logs for environment variable loading

#### PEPPER_SECRET too short error
- Pepper must be at least 32 characters
- Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- This generates 64 hex characters (32 bytes)

#### Rate limiting not working
- Verify RATE_LIMIT_FAILURE_THRESHOLD=5 is set
- Verify RATE_LIMIT_WINDOW_MINUTES=15 is set
- Verify RATE_LIMIT_LOCKOUT_MINUTES=15 is set
- Check that rate_limit_records table exists in Supabase

#### CAPTCHA validation failing
- Verify CAPTCHA_SECRET_KEY is set and marked as Sensitive
- Verify NEXT_PUBLIC_CAPTCHA_SITE_KEY is correct
- Confirm Turnstile is enabled in Cloudflare dashboard
- Check that domain is added to Cloudflare Turnstile settings

### Security Notes

⚠️ **CRITICAL SECURITY GUIDELINES:**

1. **PEPPER_SECRET**
   - Store only in Vercel as Sensitive variable
   - Never commit to git
   - Never share or expose
   - Changing it breaks all existing passwords
   - Generate new one for each environment

2. **CAPTCHA_SECRET_KEY**
   - Mark as Sensitive in Vercel
   - Regenerate if compromised
   - Different from preview/staging keys

3. **Environment Variables**
   - All sensitive variables must be marked ✅ Sensitive
   - Never log secret values
   - Never expose in error messages
   - Rotate secrets periodically

4. **Docker vs Vercel**
   - Keep configuration identical
   - Both should have same PEPPER_SECRET
   - Both should have same CAPTCHA keys
   - Both should have same rate limiting thresholds

### Docker Configuration Reference

The docker-compose.yml already has these values set. To verify local configuration:

```bash
grep -A 10 "# Secure Password Storage" docker/docker-compose.yml
```

Should show:
```
- ARGON2_MEMORY_COST=64
- ARGON2_TIME_COST=3
- ARGON2_PARALLELISM=2
- PEPPER_SECRET=${PEPPER_SECRET:-test-pepper-key-must-be-at-least-32-characters-long}
- CAPTCHA_PROVIDER=cloudflare
```

### Requirements Satisfied

This configuration satisfies the following requirements:

- **Requirement 16.4**: Vercel environment variables are set
- **Requirement 16.6**: All required variables are present
- **Requirement 3.2**: PEPPER_SECRET is 32+ characters
- **Requirement 16.2**: Vercel behavior identical to Docker
- **Requirement 16.5**: Configuration parity between environments

### Next Steps

1. Generate PEPPER_SECRET using Node.js command above
2. Get Cloudflare Turnstile keys from dashboard
3. Follow Step-by-Step Setup Instructions
4. Verify all variables are set correctly
5. Redeploy Vercel to pick up new environment variables
6. Test authentication flow with CAPTCHA and rate limiting
7. Proceed to Task 1.5: Test environment parity

