# Docker Setup Guide - Distributed Architecture

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL PC                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Postgres   │ │    Redis    │ │   App (Next.js)         ││
│  │  :5432      │ │    :6379    │ │   :3000                 ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│                         ▲                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │ Build from
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Local Project Directory                        │
│              ./src (App & Backend)                          │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker Desktop installed on your local PC
- Project cloned locally

## Quick Start

### 1. Navigate to the project directory

```bash
cd /path/to/gabrieltoth.com
```

### 2. Configure environment variables

```bash
cd docker
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start only databases (recommended first)

```bash
docker-compose up -d postgres redis
```

### 4. Check database health

```bash
docker-compose ps
# Both should show (healthy)
```

### 5. Apply database schema

```bash
docker exec -i platform-postgres psql -U platform -d platform < ../src/lib/db/schema.sql
```

### 6. Start application

```bash
# Production
docker-compose up -d app

# Development (hot reload)
docker-compose --profile dev up app-dev
```

## Useful Commands

```bash
# View logs
docker-compose logs -f app

# Restart app
docker-compose restart app

# Stop everything
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild after changes
docker-compose build --no-cache app
docker-compose up -d app
```

## Access

- **App**: http://localhost:3000
- **Health**: http://localhost:3000/api/health
- **Postgres**: localhost:5432 (user: platform)
- **Redis**: localhost:6379
