# Cloud Deployment Guide with Minimal Cost

## Executive Summary

For an application with **low user volume** (practically none), we recommend:

- **Frontend**: Vercel (free with Free plan)
- **Backend**: Railway or Render (free tier with automatic sleep)
- **Database**: Managed PostgreSQL (Railway/Render free tier)
- **Cache**: Redis (optional, only if necessary)
- **Estimated Monthly Cost**: **$0 - $5 USD**

---

## Option 1: Vercel + Railway (RECOMMENDED)

### Why this stack?

- **Vercel**: Best for Next.js, automatic Git deployment, generous free tier
- **Railway**: Free database, simple backend, pay-as-you-go
- **Cost**: Practically zero with free tier

### Step 1: Deploy Frontend on Vercel

```bash
# 1. Create account at https://vercel.com
# 2. Connect GitHub repository
# 3. Configure environment variables
```

**Environment Variables on Vercel:**

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_ANALYTICS_ID=your_id
```

**File `vercel.json` (create at root):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  }
}
```

### Step 2: Deploy Backend on Railway

```bash
# 1. Create account at https://railway.app
# 2. Connect GitHub repository
# 3. Create new project
# 4. Select "Deploy from GitHub"
```

**File `railway.json` (create at root):**

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyMaxRetries": 5
  }
}
```

**File `Dockerfile` (if necessary):**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

### Step 3: PostgreSQL Database on Railway

```bash
# 1. In Railway dashboard, create new service
# 2. Select "PostgreSQL"
# 3. Railway automatically generates DATABASE_URL
```

**Environment Variables on Railway:**

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
NODE_ENV=production
PORT=3001
```

### Step 4: Configure Environment Variables

**On Vercel:**
```
NEXT_PUBLIC_API_URL=https://your-backend-railway.railway.app
```

**On Railway (Backend):**
```
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.vercel.app
```

---

## Option 2: Render + Render (Alternative)

### Why Render?

- Supports Node.js, Python, Go
- Free tier with 750 hours/month
- Free PostgreSQL database
- Better for more complex applications

### Step 1: Deploy Frontend on Render

```bash
# 1. Create account at https://render.com
# 2. Connect GitHub
# 3. Create new "Static Site"
# 4. Build command: npm run build
# 5. Publish directory: .next
```

### Step 2: Deploy Backend on Render

```bash
# 1. Create new "Web Service"
# 2. Connect repository
# 3. Runtime: Node
# 4. Build command: npm install
# 5. Start command: npm run start:prod
```

**File `render.yaml` (create at root):**

```yaml
services:
  - type: web
    name: api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: postgres
          property: connectionString

databases:
  - name: postgres
    plan: free
```

---

## Option 3: Netlify + Supabase (Simplest)

### Why this combination?

- **Netlify**: Excellent for Next.js, automatic deployment
- **Supabase**: PostgreSQL + Auth + Realtime (free tier)
- **Cost**: Completely free

### Step 1: Deploy Frontend on Netlify

```bash
# 1. Create account at https://netlify.com
# 2. Connect GitHub
# 3. Build command: npm run build
# 4. Publish directory: .next
```

**File `netlify.toml` (create at root):**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend.railway.app/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Database on Supabase

```bash
# 1. Create account at https://supabase.com
# 2. Create new project
# 3. Copy DATABASE_URL
# 4. Use Supabase Auth for login/register
```

**Environment Variables:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

---

## Custom Domain Configuration

### Vercel

```bash
# 1. Go to Settings > Domains
# 2. Add domain
# 3. Follow DNS instructions
# 4. Point CNAME to vercel.com
```

### Railway/Render

```bash
# 1. Generate automatic public URL
# 2. Or configure custom domain
# 3. Point CNAME to the service
```

---

## Monitoring and Logs

### Vercel

```bash
# Real-time logs
vercel logs --follow

# Or via dashboard
# https://vercel.com/dashboard
```

### Railway

```bash
# Logs via CLI
railway logs

# Or via dashboard
# https://railway.app/dashboard
```

### Render

```bash
# Logs via dashboard
# https://dashboard.render.com
```

---

## Future Scalability

If the application grows:

### Upgrade Vercel
- Pro plan: $20/month
- Supports more builds and bandwidth

### Upgrade Railway
- Pay-as-you-go: $5-50/month
- Scales automatically

### Upgrade Render
- Starter plan: $7/month
- More CPU/RAM resources

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] CORS configured correctly
- [ ] Domain pointing to server
- [ ] SSL/TLS enabled (automatic on all)
- [ ] Database backups configured
- [ ] Error monitoring enabled
- [ ] Rate limiting configured
- [ ] Centralized logs

---

## Troubleshooting

### Error: "Cannot find module"

```bash
# Solution
npm ci --only=production
npm run build
```

### Error: "Connection refused"

```bash
# Check if DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Error: "CORS error"

```bash
# Add to backend
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))
```

### Application very slow

```bash
# Check logs
railway logs
# or
render logs

# Increase resources if necessary
```

---

## Cost Estimate

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | Unlimited | $20/month |
| Railway | $5 credit/month | Pay-as-you-go |
| Render | 750h/month | $7/month |
| Supabase | 500MB DB | $25/month |
| Netlify | Unlimited | $19/month |

**Total Estimated (Free)**: $0 USD
**Total Estimated (Paid)**: $5-50 USD/month

---

## Next Steps

1. Choose stack (recommended: Vercel + Railway)
2. Create accounts on services
3. Connect GitHub repository
4. Configure environment variables
5. Make first deployment
6. Test complete flow
7. Configure custom domain
8. Enable monitoring

