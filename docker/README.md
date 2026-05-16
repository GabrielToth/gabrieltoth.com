# Docker Setup Guide - Distributed Architecture

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL PC                            │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Postgres │ │  Supabase  │ │  Redis   │ │ App (Next.js)│ │
│  │ :5432    │ │   :5432    │ │ :6379    │ │   :3000      │ │
│  └──────────┘ └────────────┘ └──────────┘ └──────────────┘ │
│       ▲            ▲              ▲              ▲          │
└───────┼────────────┼──────────────┼──────────────┼──────────┘
        │            │              │              │
        └────────────┴──────────────┴──────────────┘
                   Docker Network
```

## Prerequisites

- Docker Desktop installed on your local PC
- Project cloned locally
- For secure password storage: Generated PEPPER_SECRET (minimum 32 characters)

## Quick Start

### 1. Navigate to the project directory

```bash
cd /path/to/gabrieltoth.com
cd docker
```

### 2. Create .env file with configuration

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your values:
# Required for secure password storage:
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2
PEPPER_SECRET=your-secure-pepper-min-32-chars-generates-randomly
CAPTCHA_PROVIDER=cloudflare
CAPTCHA_SECRET_KEY=your-cloudflare-turnstile-secret-key
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your-cloudflare-turnstile-site-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### 3. Start all required services

```bash
# Start all services (Postgres, Supabase, Redis, Backend, App)
docker-compose up -d

# Or start specific services only
docker-compose up -d postgres redis supabase
docker-compose up -d backend
docker-compose up -d app
```

### 4. Check service health

```bash
docker-compose ps
# All services should show (healthy) status
```

### 5. Initialize Supabase schema (first time only)

```bash
# Apply Supabase schema
docker exec -i platform-supabase psql -U supabase_admin -d postgres < ../supabase/schema.sql
```

### 6. Verify secure password storage configuration

```bash
# Check that all environment variables are loaded correctly
docker-compose logs backend | grep -i "pepper\|argon2\|captcha"
```

## Environment Variables for Secure Password Storage

### Argon2id Configuration

These parameters control the Argon2id password hashing algorithm. Tuned for Vercel Free Plan:

- **ARGON2_MEMORY_COST**: `64` (MB) - Memory cost for hashing, 16-256 range
- **ARGON2_TIME_COST**: `3` (iterations) - Iteration count, 2-10 range
- **ARGON2_PARALLELISM**: `2` (threads) - Parallelism factor, 1-4 range

**Local development**: Use development-safe values (above)
**Production (Vercel)**: Set same values for parity

### Pepper Configuration

- **PEPPER_SECRET**: Server-side secret appended to passwords before hashing
  - Minimum 32 characters
  - Must be unique and strong (use `openssl rand -hex 16` to generate)
  - **NEVER store in git** - use environment variables only
  - **NEVER share** - this is a server secret
  - Used in both Docker and Vercel

### CAPTCHA Configuration

Cloudflare Turnstile (recommended, free):

- **CAPTCHA_PROVIDER**: `cloudflare`
- **CAPTCHA_SECRET_KEY**: Backend secret for token verification (keep secure)
- **NEXT_PUBLIC_CAPTCHA_SITE_KEY**: Frontend site key (can be public)

To get keys:
1. Go to https://dash.cloudflare.com/
2. Navigate to Turnstile
3. Create a new site for localhost
4. Copy the Site Key and Secret Key

### Supabase Configuration

- **SUPABASE_URL**: Connection URL for Supabase backend
  - Docker: `http://supabase:5432` (internal container network)
  - Production: `https://<project>.supabase.co`
- **SUPABASE_SERVICE_KEY**: Backend service role key for RLS bypass
  - Docker: Development JWT token (default provided)
  - Production: Sensitive - store in Vercel only
- **SUPABASE_ANON_KEY**: Anonymous client key for public access
  - Docker: Development JWT token (default provided)
  - Production: Public key, safe to expose
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**: Frontend anon key
  - Docker: Same as SUPABASE_ANON_KEY
  - Production: Same as SUPABASE_ANON_KEY

## Useful Commands

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f backend
docker-compose logs -f supabase

# Restart a service
docker-compose restart app
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove all data (WARNING: deletes databases)
docker-compose down -v

# Rebuild after code changes
docker-compose build --no-cache app
docker-compose build --no-cache backend

# Execute command in running container
docker exec -it platform-app npm run build
docker exec -it platform-backend npm run test

# Connect to databases directly
# Postgres
docker exec -it platform-postgres psql -U platform -d platform

# Supabase
docker exec -it platform-supabase psql -U supabase_admin -d postgres

# Redis
docker exec -it platform-redis redis-cli
```

## Access Points

- **App (Frontend)**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Postgres**: localhost:5432 (user: platform, password: devpassword)
- **Supabase**: localhost:5432 (user: supabase_admin, password: supabasepassword)
- **Redis**: localhost:6379

## Development Mode with Hot Reload

For active development with code watching:

```bash
# Start in development profile (hot reload enabled)
docker-compose --profile dev up -d app-dev

# View logs with hot reload output
docker-compose logs -f app-dev

# Stop dev mode
docker-compose --profile dev down
```

## Testing Secure Password Storage

### 1. Test password hashing endpoint

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePassword123",
    "captchaToken": "test-token"
  }'
```

### 2. Test password validation

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePassword123",
    "captchaToken": "test-token"
  }'
```

### 3. Check rate limiting (5 failures = lockout)

```bash
# Run 6 failed login attempts
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrongPassword",
      "captchaToken": "test-token"
    }'
  echo "\n"
done
# 6th attempt should return 429 (Too Many Requests)
```

## Troubleshooting

### Services won't start

```bash
# Check Docker daemon is running
docker ps

# Try removing old containers
docker-compose down -v
docker-compose build --no-cache

# Start again
docker-compose up -d
```

### Database connection errors

```bash
# Check Supabase container is healthy
docker-compose ps supabase

# View Supabase logs
docker-compose logs supabase

# Manually connect and verify
docker exec -it platform-supabase psql -U supabase_admin -d postgres -c "SELECT NOW();"
```

### CAPTCHA verification fails

```bash
# Verify CAPTCHA environment variables are set
docker-compose config | grep CAPTCHA

# Check backend logs for CAPTCHA errors
docker-compose logs backend | grep -i captcha

# For development, use test credentials:
# Site Key: 1x00000000000000000000AA
# Secret Key: 0x4AAAAAAAHjFXaZ_J_EhZ4uHc
```

### Pepper not configured

```bash
# Check if PEPPER_SECRET is set
docker-compose config | grep PEPPER_SECRET

# If missing, app will fail to start with error:
# "PEPPER_SECRET must be >= 32 characters"

# Generate a secure pepper
openssl rand -hex 16  # Generates 32-character hex string

# Add to .env
echo "PEPPER_SECRET=<generated-value>" >> .env

# Restart backend
docker-compose restart backend
```

## Environment Variable Examples

### Minimum Configuration for Testing

```env
# Required for secure password storage
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2
PEPPER_SECRET=test-pepper-key-must-be-at-least-32-characters-long
CAPTCHA_PROVIDER=cloudflare
CAPTCHA_SECRET_KEY=0x4AAAAAAAHjFXaZ_J_EhZ4uHc
NEXT_PUBLIC_CAPTCHA_SITE_KEY=1x00000000000000000000AA

# Optional (has defaults)
POSTGRES_PASSWORD=devpassword
SUPABASE_DB_PASSWORD=supabasepassword
DEBUG=true
```

### Production Configuration (Vercel)

Same variables should be set in Vercel Project Settings > Environment Variables:

```
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2
PEPPER_SECRET=<your-secure-production-pepper>
CAPTCHA_PROVIDER=cloudflare
CAPTCHA_SECRET_KEY=<your-production-cloudflare-secret>
NEXT_PUBLIC_CAPTCHA_SITE_KEY=<your-production-cloudflare-site-key>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<your-production-service-key>
```

## Database Schema Management

The docker-compose configuration automatically:
1. Creates Postgres and Supabase containers
2. Initializes databases on first startup
3. Applies init-schema.sql if present

To manually initialize schema:

```bash
# Apply schema from supabase/schema.sql
docker exec -i platform-supabase psql -U supabase_admin -d postgres < ../supabase/schema.sql

# Or use Supabase CLI (if installed)
supabase db reset --local
```

## Performance Notes

### Hashing Performance (with current config)

- **Single hash operation**: 2-3 seconds
- **Memory usage**: ~150MB peak (1GB limit in Vercel)
- **CPU usage**: ~95% during hashing

### Rate Limiting

- **Threshold**: 5 failed attempts
- **Window**: 15 minutes
- **Automatic unlock**: After 15 minutes
- **Storage**: Supabase database (persistent across restarts)

## Summary

This docker-compose configuration provides:

✅ Complete secure password storage system with Argon2id  
✅ CAPTCHA protection (Cloudflare Turnstile)  
✅ Rate limiting with database persistence  
✅ Pepper-based additional security layer  
✅ Pepper rotation support via environment variables  
✅ Compatible configuration between Docker and Vercel  
✅ Hot reload development mode  
✅ Production-ready parameter tuning for Vercel Free Plan
