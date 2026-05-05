# Environment Configuration Guide

This guide explains how to configure the Secure Login Implementation for both cloud and local deployment environments.

## Overview

The application supports two deployment types:

- **Cloud**: Production deployment on Vercel/AWS with Supabase PostgreSQL and Redis
- **Local**: Development deployment on local machine with local PostgreSQL and optional Redis

## Environment Variables

### General Settings

```env
# Node environment
NODE_ENV=development|production|test

# Deployment type
DEPLOYMENT_TYPE=local|cloud

# Debug mode
DEBUG=true|false
NEXT_PUBLIC_DEBUG=true|false

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000 (local) or https://gabrieltoth.com (production)
NEXT_PUBLIC_API_URL=http://localhost:3000/api (local) or https://gabrieltoth.com/api (production)
```

### Database Configuration

#### Cloud (Supabase)

```env
# Supabase PostgreSQL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)
```

#### Local (PostgreSQL)

```env
# Local PostgreSQL
DATABASE_URL=postgres://user:password@localhost:5432/database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=database
```

### Cache Configuration

#### Cloud (Redis)

```env
# Redis (Upstash or similar)
REDIS_URL=redis://default:password@host:port
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_MEMORY=512mb
USE_REDIS=true
```

#### Local (In-Memory or Local Redis)

```env
# Local Redis or in-memory cache
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_MEMORY=256mb
USE_REDIS=true
```

### Authentication Configuration

```env
# Bcrypt cost factor (10 for dev, 12 for production)
BCRYPT_COST_FACTOR=10|12

# Session timeout (milliseconds)
SESSION_TIMEOUT=1800000

# Email verification token expiry (milliseconds)
VERIFICATION_TOKEN_EXPIRY=86400000

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback (local) or https://gabrieltoth.com/api/auth/google/callback (production)
```

### Security Configuration

#### HTTPS Enforcement

- **Production**: HTTPS enforced, HTTP redirects to HTTPS
- **Development**: HTTPS optional, HTTP allowed

#### Secure Cookies

- **Production**: `Secure` flag enabled, `SameSite=Strict`
- **Development**: `Secure` flag optional, `SameSite=Strict`

#### CORS Settings

**Production (Strict)**:
```
Allowed Origins:
- https://gabrieltoth.com
- https://www.gabrieltoth.com
```

**Development (Flexible)**:
```
Allowed Origins:
- http://localhost:3000
- http://localhost:3001
- http://127.0.0.1:3000
- http://127.0.0.1:3001
```

#### Security Headers

All responses include:
- `Content-Security-Policy`: Prevents XSS attacks
- `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing
- `X-Frame-Options: DENY`: Prevents clickjacking
- `Strict-Transport-Security`: Enforces HTTPS (production only)
- `X-XSS-Protection`: Legacy browser support
- `Referrer-Policy`: Controls referrer information
- `Cache-Control`: Prevents caching of sensitive responses

### Rate Limiting Configuration

```env
# Rate limiting (5 attempts per hour per IP)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=3600000 (1 hour)
RATE_LIMIT_MAX_ATTEMPTS=5
```

## Setup Instructions

### Local Development Setup

1. **Copy environment template**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure database**:
   ```bash
   # Option 1: Use Docker
   docker-compose up -d postgres
   
   # Option 2: Use local PostgreSQL
   createdb platform
   createuser -P platform
   ```

3. **Configure Redis** (optional):
   ```bash
   # Option 1: Use Docker
   docker-compose up -d redis
   
   # Option 2: Use local Redis
   redis-server
   ```

4. **Fill in required variables**:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. **Start development server**:
   ```bash
   npm run dev
   ```

### Cloud Deployment Setup (Vercel)

1. **Copy environment template**:
   ```bash
   cp .env.production.example .env.production
   ```

2. **Set environment variables in Vercel**:
   - Go to Project Settings > Environment Variables
   - Add each variable from `.env.production`
   - Mark sensitive variables as "Sensitive"

3. **Configure Supabase**:
   - Create production Supabase project
   - Copy credentials to environment variables
   - Enable Row Level Security (RLS) on all tables

4. **Configure Redis**:
   - Set up Upstash Redis or similar
   - Add `REDIS_URL` to environment variables

5. **Deploy**:
   ```bash
   git push origin main
   ```

## Environment Configuration Module

The `src/config/environment.ts` module provides:

```typescript
import { getConfig } from '@/config/environment'

const config = getConfig()

// Access configuration
console.log(config.environment) // 'development' | 'production' | 'test'
console.log(config.deploymentType) // 'cloud' | 'local'
console.log(config.isProduction) // boolean
console.log(config.isCloud) // boolean

// Database configuration
console.log(config.database.url)
console.log(config.database.ssl)

// Cache configuration
console.log(config.cache.enabled)
console.log(config.cache.url)

// Security configuration
console.log(config.security.httpsEnforced)
console.log(config.security.corsOrigins)
console.log(config.security.rateLimitEnabled)

// Session configuration
console.log(config.session.tokenExpiration)
console.log(config.session.rememberMeExpiration)
```

## Security Headers Middleware

The `src/middleware/security-headers.ts` module provides:

```typescript
import { withSecurityHeaders, getSecurityHeadersObject } from '@/middleware/security-headers'

// Use with API route handlers
export const POST = withSecurityHeaders(async (req) => {
    // Your handler code
})

// Get headers as object
const headers = getSecurityHeadersObject()
```

## CORS Middleware

The `src/middleware/cors.ts` module provides:

```typescript
import { withCors, getCorsConfiguration } from '@/middleware/cors'

// Use with API route handlers
export const POST = withCors(async (req) => {
    // Your handler code
})

// Get CORS configuration
const corsConfig = getCorsConfiguration()
```

## HTTPS Enforcement Middleware

The `src/middleware/https-enforcement.ts` module provides:

```typescript
import { withHttpsEnforcement, isHttpsRequest } from '@/middleware/https-enforcement'

// Use with API route handlers
export const POST = withHttpsEnforcement(async (req) => {
    // Your handler code
})

// Check if request is HTTPS
if (isHttpsRequest(req)) {
    // Handle HTTPS request
}
```

## Verification Checklist

### Local Development

- [ ] `NODE_ENV=development`
- [ ] `DEPLOYMENT_TYPE=local`
- [ ] Database URL configured and accessible
- [ ] Redis URL configured (optional)
- [ ] Google OAuth credentials configured
- [ ] Supabase credentials configured
- [ ] Application starts without errors
- [ ] Login endpoint accessible at `http://localhost:3000/api/auth/login`
- [ ] Security headers present in responses
- [ ] CORS allows localhost origins

### Cloud Production

- [ ] `NODE_ENV=production`
- [ ] `DEPLOYMENT_TYPE=cloud`
- [ ] Supabase production project configured
- [ ] Redis production instance configured
- [ ] Google OAuth production credentials configured
- [ ] HTTPS enforced
- [ ] Secure cookies enabled
- [ ] CORS restricted to production domains
- [ ] Security headers present in responses
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Monitoring and alerting configured

## Troubleshooting

### Database Connection Issues

**Error**: `ECONNREFUSED 127.0.0.1:5432`

**Solution**:
1. Verify PostgreSQL is running: `psql -U postgres`
2. Check DATABASE_URL format
3. Verify database exists: `psql -l`
4. Check credentials in .env.local

### Redis Connection Issues

**Error**: `ECONNREFUSED 127.0.0.1:6379`

**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL format
3. Verify Redis port is correct
4. Set `CACHE_ENABLED=false` to disable caching

### CORS Issues

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Verify origin is in `CORS_ORIGINS`
2. Check `DEPLOYMENT_TYPE` is correct
3. Verify request includes `Origin` header
4. Check browser console for specific error

### HTTPS Issues

**Error**: `HTTPS required` or `Mixed Content`

**Solution**:
1. Verify `HTTPS_ENFORCED=true` in production
2. Check `x-forwarded-proto` header is set correctly
3. Verify all resources use HTTPS URLs
4. Check certificate is valid

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [CORS Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [HTTPS Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
