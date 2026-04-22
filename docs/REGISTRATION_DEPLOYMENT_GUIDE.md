# Enhanced Authentication Registration - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the enhanced authentication registration system to both cloud and local environments. The registration flow supports email verification, password setup, personal data collection, and account creation with full security and accessibility compliance.

## Table of Contents

1. [Cloud Deployment](#cloud-deployment)
2. [Local Deployment](#local-deployment)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Email Service Configuration](#email-service-configuration)
6. [HTTPS Enforcement](#https-enforcement)
7. [Security Headers](#security-headers)
8. [Verification Checklist](#verification-checklist)

---

## Cloud Deployment

### Vercel Deployment (Recommended)

Vercel is the recommended platform for deploying the Next.js frontend with automatic deployments from Git.

#### Prerequisites

- GitHub account with repository access
- Vercel account (free tier available)
- Backend API deployed (see Backend Deployment section)

#### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

#### Step 2: Configure Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

**Public Variables (Client-side):**
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_REGISTRATION_TIMEOUT=1800000
```

**Server Variables:**
```
BCRYPT_COST_FACTOR=10
SESSION_TIMEOUT=1800000
VERIFICATION_TOKEN_EXPIRY=86400000
```

**Mark as Sensitive:**
- Any API keys or secrets
- Database connection strings
- JWT secrets

#### Step 3: Configure Build Settings

1. Build Command: `npm run build`
2. Output Directory: `.next`
3. Install Command: `npm ci`

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Verify deployment in Vercel dashboard

### AWS Deployment

For more complex deployments, AWS provides scalable infrastructure.

#### Prerequisites

- AWS account
- AWS CLI installed and configured
- Docker installed (for containerization)

#### Step 1: Create RDS Database

```bash
# Create PostgreSQL RDS instance
aws rds create-db-instance \
  --db-instance-identifier registration-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --publicly-accessible false
```

#### Step 2: Create Elastic Beanstalk Application

```bash
# Initialize Elastic Beanstalk
eb init -p node.js-20 registration-app

# Create environment
eb create registration-env

# Deploy application
eb deploy
```

#### Step 3: Configure Environment Variables

```bash
# Set environment variables in Elastic Beanstalk
eb setenv \
  DATABASE_URL=postgresql://user:password@rds-endpoint:5432/registration \
  BCRYPT_COST_FACTOR=10 \
  SESSION_TIMEOUT=1800000 \
  VERIFICATION_TOKEN_EXPIRY=86400000
```

#### Step 4: Set Up CloudFront CDN

```bash
# Create CloudFront distribution for static assets
aws cloudfront create-distribution \
  --origin-domain-name your-app.elasticbeanstalk.com \
  --default-root-object index.html
```

### Railway Deployment

Railway provides a simpler alternative to AWS with automatic scaling.

#### Step 1: Connect Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your repository

#### Step 2: Add PostgreSQL Database

1. Click "Add Service"
2. Select "PostgreSQL"
3. Railway automatically creates `DATABASE_URL`

#### Step 3: Configure Environment Variables

In Railway dashboard, add:

```
BCRYPT_COST_FACTOR=10
SESSION_TIMEOUT=1800000
VERIFICATION_TOKEN_EXPIRY=86400000
NODE_ENV=production
```

#### Step 4: Deploy

1. Railway automatically deploys on Git push
2. Monitor deployment in dashboard
3. View logs in real-time

---

## Local Deployment

### Development Setup

#### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed locally
- npm or yarn package manager

#### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/registration-app.git
cd registration-app
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Set Up Environment Variables

```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit with your local settings
nano .env.local
```

**Minimal `.env.local` for local development:**

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/registration_dev

# Session
SESSION_TIMEOUT=1800000
VERIFICATION_TOKEN_EXPIRY=86400000

# Password hashing
BCRYPT_COST_FACTOR=10

# Email (use test service like Mailtrap)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password
SMTP_FROM=noreply@registration.local

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Step 4: Set Up Database

```bash
# Create database
createdb registration_dev

# Run migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed
```

#### Step 5: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Docker Deployment (Local)

For containerized local development:

#### Step 1: Create Docker Compose File

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: registration_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/registration_dev
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
```

#### Step 2: Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Run migrations
docker-compose exec app npm run db:migrate

# Stop services
docker-compose down
```

---

## Environment Variables

### Complete Environment Variable Reference

#### Database Configuration

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `DATABASE_URL` | Server | Yes | `postgresql://user:pass@localhost:5432/db` | PostgreSQL connection string |
| `POSTGRES_USER` | Server | Yes (Docker) | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | Server | Yes (Docker) | `secure-password` | PostgreSQL password |
| `POSTGRES_DB` | Server | Yes (Docker) | `registration_dev` | PostgreSQL database name |

#### Session Configuration

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `SESSION_TIMEOUT` | Server | Yes | `1800000` | Session timeout in milliseconds (30 min) |
| `VERIFICATION_TOKEN_EXPIRY` | Server | Yes | `86400000` | Email verification token expiry (24 hours) |
| `SESSION_SECRET` | Server | Yes | `random-secret-key` | Secret key for session encryption |

#### Password Security

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `BCRYPT_COST_FACTOR` | Server | Yes | `10` | Bcrypt cost factor (10-12 recommended) |

#### Email Service

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `SMTP_HOST` | Server | Yes | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | Server | Yes | `587` | SMTP server port |
| `SMTP_USER` | Server | Yes | `your-email@gmail.com` | SMTP username |
| `SMTP_PASS` | Server | Yes | `app-password` | SMTP password or app-specific password |
| `SMTP_FROM` | Server | Yes | `noreply@app.com` | From email address |
| `SMTP_TLS` | Server | No | `true` | Use TLS encryption |

#### API Configuration

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Public | Yes | `https://api.example.com` | Backend API URL |
| `NEXT_PUBLIC_REGISTRATION_TIMEOUT` | Public | No | `1800000` | Registration timeout in milliseconds |

#### Security

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `CORS_ORIGIN` | Server | Yes | `https://example.com` | CORS allowed origin |
| `RATE_LIMIT_WINDOW` | Server | No | `3600000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | Server | No | `100` | Max requests per window |

#### Logging

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `LOG_LEVEL` | Server | No | `info` | Logging level (debug, info, warn, error) |
| `LOG_FORMAT` | Server | No | `json` | Log format (json, text) |

### Setting Environment Variables

#### Local Development

Create `.env.local` in project root:

```bash
cp .env.local.example .env.local
# Edit with your values
nano .env.local
```

#### Production (Vercel)

1. Go to Vercel Dashboard
2. Select Project → Settings → Environment Variables
3. Add each variable
4. Select environments (Production, Preview, Development)
5. Mark sensitive variables as "Sensitive"

#### Production (AWS)

```bash
# Using AWS Systems Manager Parameter Store
aws ssm put-parameter \
  --name /registration/DATABASE_URL \
  --value "postgresql://..." \
  --type SecureString

# Using Elastic Beanstalk
eb setenv DATABASE_URL=postgresql://...
```

#### Docker

Create `.env.docker`:

```bash
cp .env.docker.example .env.docker
# Edit with Docker-specific values
nano .env.docker
```

---

## Database Setup

### PostgreSQL Schema

The registration system requires the following database tables:

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Email Verification Tokens Table

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP
);

CREATE INDEX idx_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_tokens_expires_at ON email_verification_tokens(expires_at);
```

#### Registration Sessions Table

```sql
CREATE TABLE registration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_session_id ON registration_sessions(session_id);
CREATE INDEX idx_sessions_expires_at ON registration_sessions(expires_at);
```

### Running Migrations

#### Using Prisma

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

#### Using Raw SQL

```bash
# Connect to database
psql $DATABASE_URL

# Run schema file
\i schema.sql

# Verify tables
\dt
```

### Database Backups

#### Local PostgreSQL

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

#### AWS RDS

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier registration-db \
  --db-snapshot-identifier registration-backup-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots
```

---

## Email Service Configuration

### Gmail SMTP

#### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

#### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer"
3. Copy the generated password

#### Step 3: Configure Environment Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_TLS=true
```

### SendGrid

#### Step 1: Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com)
2. Create account and verify email

#### Step 2: Generate API Key

1. Go to Settings → API Keys
2. Create new API key
3. Copy the key

#### Step 3: Configure Environment Variables

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
SMTP_TLS=true
```

### Mailtrap (Development)

#### Step 1: Create Mailtrap Account

1. Go to [Mailtrap](https://mailtrap.io)
2. Create account

#### Step 2: Get SMTP Credentials

1. Go to Email Testing → Inboxes
2. Select inbox
3. Copy SMTP credentials

#### Step 3: Configure Environment Variables

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password
SMTP_FROM=noreply@registration.local
SMTP_TLS=true
```

### Email Template Configuration

Create email templates for verification emails:

```typescript
// lib/email-templates.ts
export const verificationEmailTemplate = (
  userName: string,
  verificationLink: string
) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
      .button { 
        background-color: #0070F3; 
        color: white; 
        padding: 12px 24px; 
        text-decoration: none; 
        border-radius: 4px; 
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Verify Your Email</h1>
      <p>Hi ${userName},</p>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <a href="${verificationLink}" class="button">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    </div>
  </body>
</html>
`;
```

---

## HTTPS Enforcement

### Vercel

HTTPS is automatically enabled on Vercel. To enforce HTTPS:

1. Go to Project Settings → Domains
2. Enable "Redirect to HTTPS"

### AWS

#### Using CloudFront

```bash
# Create CloudFront distribution with HTTPS
aws cloudfront create-distribution \
  --origin-domain-name your-app.elasticbeanstalk.com \
  --viewer-protocol-policy redirect-to-https
```

#### Using Elastic Beanstalk

Add to `.ebextensions/https.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    HTTPS_REDIRECT: true
  aws:elbv2:listener:443:
    Protocol: HTTPS
    SSLPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
```

### Local Development

For local HTTPS testing:

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Start server with HTTPS
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev -- --experimental-https
```

---

## Security Headers

### Configure Security Headers

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ];
  }
};
```

### Verify Headers

```bash
# Check security headers
curl -I https://your-domain.com

# Should include:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
```

---

## Verification Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Email service tested
- [ ] HTTPS certificate installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Backups configured

### Post-Deployment

- [ ] Application loads without errors
- [ ] Registration flow works end-to-end
- [ ] Email verification emails sent
- [ ] Password hashing working
- [ ] Session management working
- [ ] Error handling working
- [ ] Security headers present
- [ ] HTTPS enforced
- [ ] Rate limiting working
- [ ] Logs being collected

### Performance Verification

- [ ] Initial page load < 2 seconds
- [ ] Email check response < 500ms
- [ ] Account creation < 3 seconds
- [ ] Bundle size optimized
- [ ] Code splitting working

### Security Verification

- [ ] Passwords hashed with bcrypt
- [ ] Sessions expire after 30 minutes
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] Rate limiting working
- [ ] No sensitive data in logs
- [ ] Email verification working

---

## Troubleshooting

### Database Connection Issues

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### Email Not Sending

**Problem:** Verification emails not received

**Solution:**
1. Check SMTP credentials in `.env.local`
2. Verify email service is not blocking
3. Check spam folder
4. Review application logs for errors

### HTTPS Certificate Issues

**Problem:** `ERR_CERT_AUTHORITY_INVALID`

**Solution:**
1. Verify certificate is valid
2. Check certificate expiration date
3. Renew certificate if expired
4. Clear browser cache

### Session Timeout Issues

**Problem:** Users logged out unexpectedly

**Solution:**
1. Check `SESSION_TIMEOUT` value
2. Verify session storage working
3. Check for clock skew between servers
4. Review application logs

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS Elastic Beanstalk Guide](https://docs.aws.amazon.com/elasticbeanstalk/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)

---

**Last Updated:** 2024
**Version:** 1.0.0
