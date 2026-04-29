# 🐳 Docker Quick Start

## ✅ All Set!

Your project is configured to run with Docker locally.

---

## 🚀 How to Use

### 1. Navigate to the docker directory

```bash
cd docker
```

### 2. Start all services

```bash
docker compose up -d
```

### 3. View logs

```bash
# View all logs
docker compose logs -f

# View app logs
docker compose logs -f app

# View backend logs
docker compose logs -f backend
```

### 4. Check status

```bash
docker compose ps
```

### 5. Access application

- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:4000/health
- **Backend API**: http://localhost:4000

---

## 🛠️ Useful Commands

### Stop everything

```bash
docker compose down
```

### Stop and remove volumes (WARNING: deletes data)

```bash
docker compose down -v
```

### Rebuild after changes

```bash
docker compose build --no-cache
docker compose up -d
```

### Restart a specific service

```bash
docker compose restart app
docker compose restart backend
```

### View logs for a service

```bash
docker compose logs -f app
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f redis
```

---

## 🔧 Troubleshooting

### ❌ Backend won't start

```bash
# View backend logs
docker compose logs backend

# Check if postgres is healthy
docker compose ps

# Restart backend
docker compose restart backend
```

### ❌ App can't connect to backend

```bash
# Check if backend is running
curl http://localhost:4000/health

# View app logs
docker compose logs -f app
```

### ❌ Postgres won't start

```bash
# View postgres logs
docker compose logs postgres

# Check if port 5432 is free
netstat -an | findstr 5432

# Remove volumes and recreate
docker compose down -v
docker compose up -d postgres
```

### ❌ Redis won't start

```bash
# View redis logs
docker compose logs redis

# Check if port 6379 is free
netstat -an | findstr 6379

# Remove volumes and recreate
docker compose down -v
docker compose up -d redis
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL PC                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Postgres   │ │    Redis    │ │   Backend API           ││
│  │  :5432      │ │    :6379    │ │   :4000                 ││
│  └─────────────┘ └─────────────┘ └──────────┬──────────────┘│
│                                              │               │
│  ┌──────────────────────────────────────────┴──────────────┐│
│  │   App (Next.js)                                          ││
│  │   :3000                                                  ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 4000 | http://localhost:4000 |
| Postgres | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

---

## 📝 Environment Variables

Edit `docker/.env` to configure:

```env
POSTGRES_PASSWORD=devpassword
DISCORD_WEBHOOK_URL=your_url_here
DEBUG=true
BASE_URL=http://localhost:3000
```

---

## 🔄 Development

### Development Mode (Hot Reload)

```bash
docker compose --profile dev up app-dev
```

### Production Mode

```bash
docker compose up -d app
```

---

## 📦 Volumes

Data is persisted in Docker volumes:

- `platform-postgres-data` - PostgreSQL data
- `platform-redis-data` - Redis data
- `platform-logs` - Application logs

To remove all volumes:

```bash
docker compose down -v
```

---

## 🎉 Ready!

Your Docker environment is configured and ready to use.

**Next steps:**

1. `cd docker`
2. `docker compose up -d`
3. Open http://localhost:3000

🚀 **Happy coding!**
