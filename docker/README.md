# Docker Setup Guide - Distributed Architecture

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    SEU PC LOCAL                             │
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

## Pré-requisitos

- Docker Desktop instalado no seu PC local
- Projeto clonado localmente

## Quick Start

### 1. Navegar até o diretório do projeto

```bash
cd /caminho/para/gabrieltoth.com
```

### 2. Configurar variáveis de ambiente

```bash
cd docker
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Iniciar apenas bancos (recomendado primeiro)

```bash
docker-compose up -d postgres redis
```

### 4. Verificar saúde dos bancos

```bash
docker-compose ps
# Ambos devem mostrar (healthy)
```

### 5. Aplicar schema do banco

```bash
docker exec -i platform-postgres psql -U platform -d platform < ../src/lib/db/schema.sql
```

### 6. Iniciar aplicação

```bash
# Produção
docker-compose up -d app

# Desenvolvimento (hot reload)
docker-compose --profile dev up app-dev
```

## Comandos Úteis

```bash
# Ver logs
docker-compose logs -f app

# Reiniciar app
docker-compose restart app

# Parar tudo
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v

# Rebuild após mudanças
docker-compose build --no-cache app
docker-compose up -d app
```

## Acessar

- **App**: http://localhost:3000
- **Health**: http://localhost:3000/api/health
- **Postgres**: localhost:5432 (user: platform)
- **Redis**: localhost:6379
