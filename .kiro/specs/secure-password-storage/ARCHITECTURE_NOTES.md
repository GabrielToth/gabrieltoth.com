# Architectural Decisions - Secure Password Storage

## Environment & Infrastructure

### Development Environment
- **Docker-based local development**: All local development uses Docker containers (via `docker-compose`)
- **Environment Variables via Docker**: Environment variables are passed through `docker-compose.yml`, NOT read from `.env.local` files
- **Database**: Supabase (self-hosted or cloud) accessible from both local and production environments
- **No .env file direct consumption**: The frontend/application NEVER reads `.env.local` directly - Docker handles all ENV setup

### Production Environment
- **Hosting**: Vercel Free Plan (Next.js)
- **Database**: Supabase (cloud)
- **Environment Variables**: Set through Vercel project settings → Environment Variables
- **Serverless Constraints**: 
  - Limited execution time per function (10 seconds on Free Plan)
  - Limited memory per function (~1GB)
  - Argon2id parameters must be tuned to fit within these constraints

### Compatibility Matrix
```
Development:     docker-compose ENV → Backend → Supabase
Production:      Vercel ENV      → Backend → Supabase
Test:            Docker test ENV → Backend → Local/Cloud Supabase
```

## Security Implementation

### Password Hashing
- **Primary**: Argon2id (memory-hard, OWASP recommended)
- **Legacy Support**: Bcrypt (for backward compatibility)
- **Tuning for Vercel Free Plan**: 
  - Memory cost: 64-128 MB (reduced from typical 256MB to fit Vercel timeout constraints)
  - Time cost: 3 iterations
  - Parallelism: 2 threads

### CAPTCHA Strategy
- **Recommended**: Cloudflare Turnstile (ZERO COST)
- **Alternative**: Google reCAPTCHA v3 (free tier for non-commercial)
- **Cost Impact**: Zero cost approach via Cloudflare preferred
- **Implementation**: Required for registration AND login to prevent:
  - Bot registration attacks
  - Brute force bypass
  - Account enumeration

### Data Cleanup
- **Initial State**: All test users and data will be deleted from Supabase
- **Fresh Start**: System deployed with clean database
- **Admin Reset Function**: Available for developers to clear data during testing

## Vercel Free Plan Considerations

### Execution Time Constraints
- ❌ Cannot use Argon2id with default high parameters (takes too long)
- ✅ Must reduce memory/iteration counts to complete within 10 seconds
- ✅ Password hashing should target 2-4 seconds, leaving buffer for API overhead

### Recommended Argon2id Params for Vercel Free
```
Memory Cost: 64 MB (not 256MB)
Time Cost: 3 iterations (not 4+)
Parallelism: 2 threads (not 4+)
Estimated time: 2-3 seconds per hash
```

### Rate Limiting on Vercel
- Cannot rely on persistent in-memory state (functions are ephemeral)
- Must use external storage (Supabase table or Redis equivalent)
- Fallback to Supabase for rate limit tracking

## Database Schema Changes

### Cleanup Strategy
1. Delete all existing users
2. Delete all auth sessions
3. Reset sequences/auto-increment counters
4. Implement fresh migration with correct schema

### User Table Structure
```sql
-- Users table with Argon2id-ready fields
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Argon2id or Bcrypt format
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rate limiting tracking (ephemeral, can be cleared)
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL, -- email or username
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  last_attempt TIMESTAMP DEFAULT NOW()
);

-- Audit logging
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'login_attempt', 'registration', 'migration', etc.
  success BOOLEAN NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Implementation Phases

### Phase 1: Core Authentication (Tasks)
- Implement Argon2id password hashing
- Implement salt generation
- Implement pepper from environment
- Clean Supabase database
- Set up CAPTCHA validation

### Phase 2: Legacy Support
- Implement Bcrypt detection and validation
- Implement automatic migration on login
- Set up audit logging for migrations

### Phase 3: Rate Limiting & Protection
- Implement rate limiting (5 failures = 15 min lockout)
- Integrate with CAPTCHA threshold (harder CAPTCHA after 3 failures)
- Implement audit logging

### Phase 4: Configuration & Deployment
- Set up docker-compose for local development
- Configure Vercel environment variables
- Test both environments
- Document setup process

## Testing Strategy

### Local Development (Docker)
```bash
docker-compose up -d
npm run test:auth
# Tests verify Argon2id, salt uniqueness, pepper, rate limiting, CAPTCHA
```

### Environment Parity
- Same test suite runs in both Docker and production environments
- Environment-specific variables loaded correctly
- Database operations identical across environments

## Cost Analysis

### Completely Free Services
- ✅ Vercel Free Plan (Next.js hosting)
- ✅ Supabase Free Tier (PostgreSQL 500MB, Auth)
- ✅ Cloudflare Turnstile (CAPTCHA - zero cost)
- ✅ Argon2id (open source, zero cost)
- ✅ Docker (open source, zero cost)

### Total Cost
**$0/month** ✅

## Notes for Implementation

1. **Vercel Timeout**: Monitor actual hash generation time - if exceeds 8 seconds, further reduce parameters
2. **Supabase Connection**: Use connection pooling to avoid cold start issues
3. **CAPTCHA Fallback**: Have graceful degradation if CAPTCHA service is unavailable
4. **Rate Limiting**: Consider using Supabase as backing store instead of in-memory
5. **Logging**: Use Vercel's built-in logging, not external services (keep costs at zero)
6. **Database Cleanup**: Implement safe reset function with confirmation prompts

---
Last updated: May 15, 2026
