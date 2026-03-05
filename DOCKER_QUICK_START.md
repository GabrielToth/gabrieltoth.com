# 🐳 Docker Quick Start

## ✅ Tudo Pronto!

Seu projeto está configurado para rodar com Docker localmente.

---

## 🚀 Como Usar

### 1. Navegar até o diretório docker

```bash
cd docker
```

### 2. Iniciar todos os serviços

```bash
docker compose up -d
```

### 3. Ver logs

```bash
# Ver todos os logs
docker compose logs -f

# Ver logs do app
docker compose logs -f app

# Ver logs do backend
docker compose logs -f backend
```

### 4. Verificar status

```bash
docker compose ps
```

### 5. Acessar aplicação

- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:4000/health
- **Backend API**: http://localhost:4000

---

## 🛠️ Comandos Úteis

### Parar tudo

```bash
docker compose down
```

### Parar e remover volumes (CUIDADO: apaga dados)

```bash
docker compose down -v
```

### Rebuild após mudanças

```bash
docker compose build --no-cache
docker compose up -d
```

### Reiniciar um serviço específico

```bash
docker compose restart app
docker compose restart backend
```

### Ver logs de um serviço

```bash
docker compose logs -f app
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f redis
```

---

## 🔧 Troubleshooting

### ❌ Backend não inicia

```bash
# Ver logs do backend
docker compose logs backend

# Verificar se postgres está healthy
docker compose ps

# Reiniciar backend
docker compose restart backend
```

### ❌ App não conecta ao backend

```bash
# Verificar se backend está rodando
curl http://localhost:4000/health

# Ver logs do app
docker compose logs -f app
```

### ❌ Postgres não inicia

```bash
# Ver logs do postgres
docker compose logs postgres

# Verificar se a porta 5432 está livre
netstat -an | findstr 5432

# Remover volumes e recriar
docker compose down -v
docker compose up -d postgres
```

### ❌ Redis não inicia

```bash
# Ver logs do redis
docker compose logs redis

# Verificar se a porta 6379 está livre
netstat -an | findstr 6379

# Remover volumes e recriar
docker compose down -v
docker compose up -d redis
```

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    SEU PC LOCAL                             │
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

## 🎯 Serviços

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 4000 | http://localhost:4000 |
| Postgres | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

---

## 📝 Variáveis de Ambiente

Edite `docker/.env` para configurar:

```env
POSTGRES_PASSWORD=devpassword
DISCORD_WEBHOOK_URL=sua_url_aqui
DEBUG=true
BASE_URL=http://localhost:3000
```

---

## 🔄 Desenvolvimento

### Modo Desenvolvimento (Hot Reload)

```bash
docker compose --profile dev up app-dev
```

### Modo Produção

```bash
docker compose up -d app
```

---

## 📦 Volumes

Os dados são persistidos em volumes Docker:

- `platform-postgres-data` - Dados do PostgreSQL
- `platform-redis-data` - Dados do Redis
- `platform-logs` - Logs da aplicação

Para remover todos os volumes:

```bash
docker compose down -v
```

---

## 🎉 Pronto!

Seu ambiente Docker está configurado e pronto para uso.

**Próximos passos:**

1. `cd docker`
2. `docker compose up -d`
3. Abrir http://localhost:3000

🚀 **Divirta-se desenvolvendo!**
