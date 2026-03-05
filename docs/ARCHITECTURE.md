# Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│                     gabrieltoth.com                     │
├─────────────────────────────────────────────────────────┤
│                      API ROUTES                         │
│   /api/platform/*  │  /api/health  │  /api/webhooks    │
├─────────────────────────────────────────────────────────┤
│                   BUSINESS LOGIC                        │
│  Credits  │  Metering  │  Auth  │  Platform Adapters   │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                           │
│      PostgreSQL     │     Redis     │     S3/R2        │
└─────────────────────────────────────────────────────────┘
```

## Stack

| Camada   | Tecnologia                         |
| -------- | ---------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS |
| API      | Next.js API Routes                 |
| Auth     | Auth.js (NextAuth)                 |
| Database | PostgreSQL (node-postgres)         |
| Cache    | Redis                              |
| Storage  | S3-compatible (MinIO/R2)           |
| Payments | Stripe                             |

## Princípios

1. **Metrificação Total**: Todo recurso (banda, disco, cache) é medido e cobrado
2. **Self-Hosted First**: Docker Compose funcional para produção
3. **Transparência**: Usuários veem exatamente onde gastam créditos
4. **Modularidade**: Cada módulo é independente

## Fluxo de Dados Típico

```
Usuário → API Route → Validação → Lógica de Negócio
                                        ↓
                               Verificar Créditos
                                        ↓
                               Executar Ação
                                        ↓
                               Logar Metering
                                        ↓
                               Deduzir Créditos
                                        ↓
                               Retornar Resposta
```
