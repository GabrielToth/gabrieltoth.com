# Vercel Environment Variables Checklist

## Task 1.4 Completion Checklist

Use this checklist to verify that all required environment variables have been correctly configured in Vercel for the secure password storage system.

### Pre-Configuration

- [ ] Generated PEPPER_SECRET using `node scripts/generate-secrets.mjs`
- [ ] Obtained Cloudflare Turnstile keys from https://dash.cloudflare.com/
- [ ] Have access to Vercel project dashboard
- [ ] Read `.agent/VERCEL_ENV_SETUP.md` for detailed instructions

### Configuration Verification

#### Access Vercel Dashboard
- [ ] Logged into https://vercel.com/dashboard
- [ ] Selected gabrieltoth.com project
- [ ] Clicked Settings > Environment Variables
- [ ] Viewing list of environment variables

#### Sensitive Variables (Must be marked ✅ SENSITIVE)

Check each variable is present and correctly marked:

| Variable | Value Format | Sensitive | Production | Preview |
|---|---|---|---|---|
| [ ] PEPPER_SECRET | 64 hex chars | ✅ | ✅ | ✅ |
| [ ] JWT_SECRET | 128 hex chars | ✅ | ✅ | ✅ |
| [ ] TOKEN_ENCRYPTION_KEY | 64 hex chars | ✅ | ✅ | ✅ |
| [ ] CAPTCHA_SECRET_KEY | Cloudflare secret | ✅ | ✅ | ✅ |

#### Non-Sensitive Variables (Mark ❌ NOT SENSITIVE)

Check each variable is present and NOT marked as sensitive:

| Variable | Value | Sensitive | Production | Preview |
|---|---|---|---|---|
| [ ] ARGON2_MEMORY_COST | 64 | ❌ | ✅ | ✅ |
| [ ] ARGON2_TIME_COST | 3 | ❌ | ✅ | ✅ |
| [ ] ARGON2_PARALLELISM | 2 | ❌ | ✅ | ✅ |
| [ ] RATE_LIMIT_FAILURE_THRESHOLD | 5 | ❌ | ✅ | ✅ |
| [ ] RATE_LIMIT_WINDOW_MINUTES | 15 | ❌ | ✅ | ✅ |
| [ ] RATE_LIMIT_LOCKOUT_MINUTES | 15 | ❌ | ✅ | ✅ |
| [ ] RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD | 3 | ❌ | ✅ | ✅ |
| [ ] CAPTCHA_PROVIDER | cloudflare | ❌ | ✅ | ✅ |
| [ ] NEXT_PUBLIC_CAPTCHA_SITE_KEY | Cloudflare site key | ❌ | ✅ | ✅ |

### Value Verification

#### Argon2id Parameters (Match Docker)

From `docker/docker-compose.yml`:
```
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2
```

In Vercel:
- [ ] ARGON2_MEMORY_COST = 64
- [ ] ARGON2_TIME_COST = 3
- [ ] ARGON2_PARALLELISM = 2

#### Rate Limiting Parameters (Match Docker)

From `docker/docker-compose.yml`:
```
RATE_LIMIT_FAILURE_THRESHOLD=5
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_LOCKOUT_MINUTES=15
RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD=3
```

In Vercel:
- [ ] RATE_LIMIT_FAILURE_THRESHOLD = 5
- [ ] RATE_LIMIT_WINDOW_MINUTES = 15
- [ ] RATE_LIMIT_LOCKOUT_MINUTES = 15
- [ ] RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD = 3

#### CAPTCHA Configuration (Match Docker)

From `docker/docker-compose.yml`:
```
CAPTCHA_PROVIDER=cloudflare
```

In Vercel:
- [ ] CAPTCHA_PROVIDER = cloudflare
- [ ] CAPTCHA_SECRET_KEY is set (value hidden for security)
- [ ] NEXT_PUBLIC_CAPTCHA_SITE_KEY is set and visible

#### PEPPER_SECRET

- [ ] PEPPER_SECRET is at least 64 characters long
- [ ] PEPPER_SECRET is marked ✅ SENSITIVE
- [ ] PEPPER_SECRET is NOT displayed in logs
- [ ] PEPPER_SECRET is NOT committed to git

### Environment Coverage

Verify all variables are set for both Production and Preview:

- [ ] All SENSITIVE variables set for Production
- [ ] All SENSITIVE variables set for Preview
- [ ] All non-sensitive variables set for Production
- [ ] All non-sensitive variables set for Preview
- [ ] No variables set for Development environment
- [ ] Total of 13 variables configured

### Post-Configuration Steps

After verifying all variables are set:

1. **Redeploy Vercel**
   - [ ] Go to Deployments
   - [ ] Click "Redeploy" on latest deployment
   - [ ] Wait for deployment to complete
   - [ ] Verify deployment was successful

2. **Test Configuration Loading**
   - [ ] Deploy changes to Vercel
   - [ ] Check deployment logs for environment variable loading
   - [ ] Verify no "undefined environment variable" errors
   - [ ] Confirm configuration values are present

3. **Test Password Storage System**
   - [ ] Test user registration with CAPTCHA
   - [ ] Test user login with CAPTCHA
   - [ ] Test rate limiting (5 failed attempts)
   - [ ] Test Argon2id hash generation time (<3 seconds)
   - [ ] Verify hash includes pepper

4. **Verify Environment Parity**
   - [ ] Verify production behavior matches Docker
   - [ ] Verify security levels are identical
   - [ ] Verify CAPTCHA validation works
   - [ ] Verify rate limiting works

### Troubleshooting

If any issues occur, reference this section:

#### Variables Not Loading
- [ ] Check if variables are set for both Production and Preview
- [ ] Check if latest deployment includes new variables
- [ ] Redeploy if variables were added after deployment
- [ ] Check Vercel deployment logs for errors

#### PEPPER_SECRET Error
- [ ] Verify PEPPER_SECRET is at least 32 characters (64 hex chars)
- [ ] Verify PEPPER_SECRET is marked ✅ SENSITIVE
- [ ] Verify PEPPER_SECRET contains only hex characters (0-9, a-f)
- [ ] Regenerate if corrupted: `node scripts/generate-secrets.mjs`

#### CAPTCHA Not Working
- [ ] Verify CAPTCHA_SECRET_KEY is set and marked ✅ SENSITIVE
- [ ] Verify NEXT_PUBLIC_CAPTCHA_SITE_KEY is set and correct
- [ ] Verify Cloudflare Turnstile is enabled
- [ ] Verify gabrieltoth.com is added to Turnstile domains
- [ ] Check CAPTCHA_PROVIDER = cloudflare

#### Rate Limiting Not Working
- [ ] Verify all RATE_LIMIT_* variables are set
- [ ] Verify rate_limit_records table exists in Supabase
- [ ] Verify database connection is working
- [ ] Test with 5+ consecutive failed login attempts

### Security Verification

- [ ] PEPPER_SECRET is unique to production
- [ ] PEPPER_SECRET is different from development
- [ ] CAPTCHA_SECRET_KEY is marked ✅ SENSITIVE
- [ ] JWT_SECRET is marked ✅ SENSITIVE
- [ ] TOKEN_ENCRYPTION_KEY is marked ✅ SENSITIVE
- [ ] No secrets are logged or exposed
- [ ] All sensitive variables are hidden in UI
- [ ] Configuration matches between Docker and Vercel

### Final Verification

- [ ] All 13 variables are configured
- [ ] All sensitive variables are marked ✅ SENSITIVE
- [ ] All non-sensitive variables are NOT marked sensitive
- [ ] All variables set for both Production and Preview
- [ ] No "undefined" errors in deployment logs
- [ ] Vercel deployment successful
- [ ] Password storage system works end-to-end
- [ ] Environment parity verified

### Sign-Off

- [ ] Task 1.4 is complete
- [ ] All variables are properly configured
- [ ] Ready to proceed to Task 1.5: Test environment parity

### Documentation

- [ ] Setup guide saved: `.agent/VERCEL_ENV_SETUP.md`
- [ ] Secret generation script: `scripts/generate-secrets.mjs`
- [ ] This checklist: `.agent/VERCEL_ENV_CHECKLIST.md`
- [ ] All documentation committed to git

---

## Configuration Summary

**Total Variables: 13**

**Sensitive (5):**
1. PEPPER_SECRET
2. JWT_SECRET  
3. TOKEN_ENCRYPTION_KEY
4. CAPTCHA_SECRET_KEY
5. (Supabase keys from existing config)

**Non-Sensitive (8):**
1. ARGON2_MEMORY_COST
2. ARGON2_TIME_COST
3. ARGON2_PARALLELISM
4. RATE_LIMIT_FAILURE_THRESHOLD
5. RATE_LIMIT_WINDOW_MINUTES
6. RATE_LIMIT_LOCKOUT_MINUTES
7. RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD
8. CAPTCHA_PROVIDER
9. NEXT_PUBLIC_CAPTCHA_SITE_KEY

**Requirements Satisfied:**
- ✅ Requirement 16.4: Vercel environment variables configured
- ✅ Requirement 16.6: All required variables present
- ✅ Requirement 3.2: PEPPER_SECRET set securely (32+ chars)
- ✅ Requirement 16.2: Identical behavior to Docker
- ✅ Requirement 16.5: Configuration parity verified

