# Secure Login Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Secure Login implementation to both cloud and local environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Cloud Deployment (Vercel/AWS)](#cloud-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: v2.30.0 or higher
- **Docker**: v20.10.0 or higher (for local development)
- **Docker Compose**: v1.29.0 or higher (for local development)

### Required Accounts

- **Supabase**: Database and authentication
- **Redis**: Cache and session storage (cloud)
- **Vercel** or **AWS**: Hosting platform
- **Sentry**: Error tracking (optional)

### Required Permissions

- Git repository access
- Supabase project access
- Cloud platform access (Vercel/AWS)
- Environment variable management

## Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/gabrieltoth/gabrieltoth.com.git
cd gabrieltoth.com
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Docker Containers

```bash
# Start PostgreSQL, Redis, and other services
docker-compose up -d

# Verify containers are running
docker-compose ps
```

**Expected Output**:
```
NAME                COMMAND                  SERVICE             STATUS
gabrieltoth-postgres-1   "docker-entrypoint.s…"   postgres            Up 2 minutes
gabrieltoth-redis-1      "redis-server"           redis               Up 2 minutes
```

### Step 4: Set Up Environment Variables

Create `.env.local` file:

```bash
# Copy example file
cp .env.local.example .env.local

# Edit with your local values
nano .env.local
```

**Local Environment Variables**:
```
# Database
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_local_jwt_secret
CSRF_SECRET=your_local_csrf_secret

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Initialize Database

```bash
# Run migrations
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --local > src/types/supabase.ts

# Verify schema
npm run db:check
```

### Step 6: Start Development Server

```bash
npm run dev
```

**Expected Output**:
```
> gabrieltoth.com@1.12.0 dev
> next dev

  ▲ Next.js 16.2.4
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

### Step 7: Verify Local Setup

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "csrfToken": "test_token"
  }'

# Run tests
npm run test

# Check TypeScript types
npm run type-check
```

## Cloud Deployment

### Step 1: Prepare for Deployment

```bash
# Ensure all tests pass
npm run test

# Build the application
npm run build

# Check for TypeScript errors
npm run type-check

# Verify linting
npm run lint
```

### Step 2: Set Up Cloud Database (Supabase)

#### Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter project name: `gabrieltoth-production`
4. Select region closest to users
5. Set strong database password
6. Click "Create new project"

#### Apply Database Schema

```bash
# Get Supabase project reference
export SUPABASE_PROJECT_REF=your_project_ref

# Apply migrations
npx supabase db push --project-ref $SUPABASE_PROJECT_REF

# Generate TypeScript types
npx supabase gen types typescript --project-ref $SUPABASE_PROJECT_REF > src/types/supabase.ts
```

#### Set Up RLS Policies

```bash
# Apply RLS policies for audit logs
npx supabase db push --project-ref $SUPABASE_PROJECT_REF
```

### Step 3: Set Up Redis Cache (Cloud)

#### Option A: Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com)
2. Click "Create Database"
3. Select region and plan
4. Copy connection string
5. Add to environment variables

#### Option B: AWS ElastiCache

1. Go to AWS Console
2. Navigate to ElastiCache
3. Click "Create Cluster"
4. Select Redis engine
5. Configure cluster settings
6. Copy endpoint URL
7. Add to environment variables

### Step 4: Deploy to Vercel

#### Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select GitHub repository
4. Click "Import"

#### Configure Environment Variables

1. Go to Project Settings → Environment Variables
2. Add production environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=redis://your-redis-url
JWT_SECRET=your_production_jwt_secret
CSRF_SECRET=your_production_csrf_secret
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://gabrieltoth.com
```

#### Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Verify deployment at https://gabrieltoth.com

### Step 5: Deploy to AWS (Alternative)

#### Create Lambda Function

```bash
# Build backend
npm run build:backend

# Create deployment package
zip -r lambda-deployment.zip dist/

# Upload to AWS Lambda
aws lambda create-function \
  --function-name gabrieltoth-login \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-role \
  --handler dist/backend/lambda.handler \
  --zip-file fileb://lambda-deployment.zip
```

#### Configure API Gateway

1. Go to AWS API Gateway
2. Create new REST API
3. Create POST /api/auth/login resource
4. Integrate with Lambda function
5. Deploy to production stage

#### Set Up Environment Variables

```bash
# Set Lambda environment variables
aws lambda update-function-configuration \
  --function-name gabrieltoth-login \
  --environment Variables={
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co,
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key,
    REDIS_URL=redis://your-redis-url,
    JWT_SECRET=your_production_jwt_secret,
    CSRF_SECRET=your_production_csrf_secret,
    NODE_ENV=production
  }
```

## Database Setup

### Create Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Remember Me tokens table
CREATE TABLE remember_me_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rate limit attempts table
CREATE TABLE rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL,
  attempt_count INT DEFAULT 1,
  first_attempt_at TIMESTAMP DEFAULT NOW(),
  last_attempt_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ip_address)
);
```

### Create Indexes

```sql
-- Users indexes
CREATE INDEX idx_users_email ON users(email);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Remember Me tokens indexes
CREATE INDEX idx_remember_me_tokens_user_id ON remember_me_tokens(user_id);
CREATE INDEX idx_remember_me_tokens_expires_at ON remember_me_tokens(expires_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);

-- Rate limit indexes
CREATE INDEX idx_rate_limit_attempts_ip ON rate_limit_attempts(ip_address);
```

### Set Up RLS Policies

```sql
-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create append-only policy
CREATE POLICY audit_logs_append_only ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes
CREATE POLICY audit_logs_no_update ON audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY audit_logs_no_delete ON audit_logs
  FOR DELETE
  USING (false);
```

## Environment Configuration

### Local Environment (.env.local)

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_local_jwt_secret_min_32_chars
CSRF_SECRET=your_local_csrf_secret_min_32_chars

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Production Environment

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://user:password@redis.upstash.io:6379

# Authentication
JWT_SECRET=your_production_jwt_secret_min_32_chars
CSRF_SECRET=your_production_csrf_secret_min_32_chars

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://gabrieltoth.com

# Logging
LOG_LEVEL=info

# Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Monitoring
DATADOG_API_KEY=your_datadog_api_key
```

### Staging Environment

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis
REDIS_URL=redis://user:password@staging-redis.upstash.io:6379

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.gabrieltoth.com

# Logging
LOG_LEVEL=debug
```

## Verification

### Local Verification

```bash
# 1. Check database connection
npm run db:check

# 2. Check Redis connection
npm run redis:check

# 3. Run tests
npm run test

# 4. Run security tests
npm run test -- src/__tests__/security/

# 5. Check TypeScript types
npm run type-check

# 6. Run linting
npm run lint

# 7. Build application
npm run build

# 8. Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "csrfToken": "test_token"
  }'
```

### Cloud Verification

```bash
# 1. Verify deployment
curl https://gabrieltoth.com/api/health

# 2. Test login endpoint
curl -X POST https://gabrieltoth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "csrfToken": "test_token"
  }'

# 3. Check security headers
curl -I https://gabrieltoth.com/api/auth/login

# 4. Verify HTTPS
curl -v https://gabrieltoth.com/api/auth/login 2>&1 | grep "SSL"

# 5. Check database connectivity
# Via Supabase dashboard: https://app.supabase.com

# 6. Check Redis connectivity
# Via Upstash dashboard: https://console.upstash.com
```

### Smoke Tests

```bash
# Run smoke tests on staging
npm run test:e2e -- --project=staging

# Run smoke tests on production
npm run test:e2e -- --project=production
```

## Troubleshooting

### Database Connection Issues

**Problem**: "Cannot connect to database"

**Solution**:
```bash
# Check database URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check Supabase status
curl https://status.supabase.com/api/v2/status.json
```

### Redis Connection Issues

**Problem**: "Cannot connect to Redis"

**Solution**:
```bash
# Check Redis URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping

# Check Upstash status
curl https://status.upstash.com/api/v2/status.json
```

### Environment Variable Issues

**Problem**: "Environment variable not found"

**Solution**:
```bash
# Check environment variables
env | grep NEXT_PUBLIC

# Verify .env.local file
cat .env.local

# Reload environment
source .env.local
```

### Build Failures

**Problem**: "Build failed"

**Solution**:
```bash
# Clean build
npm run clean
npm install
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

### Deployment Failures

**Problem**: "Deployment failed"

**Solution**:
```bash
# Check deployment logs
vercel logs --tail

# Verify environment variables
vercel env ls

# Redeploy
vercel deploy --prod
```

### Performance Issues

**Problem**: "Slow login response"

**Solution**:
```bash
# Check database performance
npm run perf

# Check bundle size
npm run analyze

# Run Lighthouse audit
npm run lighthouse

# Optimize database queries
# Review src/lib/auth/session.ts
```

## Rollback Procedures

### Rollback Vercel Deployment

```bash
# View deployment history
vercel deployments

# Rollback to previous deployment
vercel rollback

# Verify rollback
curl https://gabrieltoth.com/api/health
```

### Rollback Database Changes

```bash
# View migration history
npx supabase migration list

# Rollback to previous migration
npx supabase db reset

# Reapply migrations
npx supabase db push
```

## Monitoring and Maintenance

### Daily Tasks

- [ ] Check error logs (Sentry)
- [ ] Monitor authentication metrics
- [ ] Review rate limiting events
- [ ] Check database performance

### Weekly Tasks

- [ ] Review audit logs
- [ ] Check security alerts
- [ ] Update dependencies
- [ ] Run security tests

### Monthly Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Backup verification
- [ ] Disaster recovery drill

## Support

For deployment support:
- **Documentation**: https://gabrieltoth.com/docs
- **Issues**: https://github.com/gabrieltoth/gabrieltoth.com/issues
- **Email**: support@gabrieltoth.com

