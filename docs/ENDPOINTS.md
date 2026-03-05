# Endpoints da Plataforma

## Saúde e Status

| Método | Endpoint      | Descrição    | Auth |
| ------ | ------------- | ------------ | ---- |
| GET    | `/api/health` | Health check | ❌   |

## Créditos (`/api/platform/credits`)

| Método | Endpoint   | Descrição                  | Auth     |
| ------ | ---------- | -------------------------- | -------- |
| GET    | `/balance` | Saldo atual                | ✅       |
| POST   | `/deduct`  | Deduzir créditos           | ✅       |
| POST   | `/add`     | Adicionar créditos (admin) | ✅ Admin |

## Analytics (`/api/platform/analytics`)

| Método | Endpoint | Descrição            | Auth     |
| ------ | -------- | -------------------- | -------- |
| GET    | `/`      | Dashboard de consumo | ✅       |
| GET    | `/admin` | Visão geral (admin)  | ✅ Admin |

## YouTube (`/api/platform/youtube`)

| Método | Endpoint         | Descrição          | Auth |
| ------ | ---------------- | ------------------ | ---- |
| POST   | `/download`      | Iniciar download   | ✅   |
| GET    | `/status/:jobId` | Status do download | ✅   |
| POST   | `/schedule`      | Agendar publicação | ✅   |

## Chat (`/api/platform/chat`)

| Método | Endpoint   | Descrição                | Auth   |
| ------ | ---------- | ------------------------ | ------ |
| WS     | `/unified` | WebSocket chat unificado | ✅     |
| POST   | `/timeout` | Aplicar timeout          | ✅ Mod |
| POST   | `/ban`     | Aplicar ban              | ✅ Mod |

## Stream (`/api/platform/stream`)

| Método | Endpoint | Descrição      | Auth |
| ------ | -------- | -------------- | ---- |
| POST   | `/start` | Iniciar stream | ✅   |
| POST   | `/stop`  | Parar stream   | ✅   |
| GET    | `/usage` | Consumo atual  | ✅   |

## Webhooks (`/api/platform/webhooks`)

| Método | Endpoint  | Descrição      | Auth      |
| ------ | --------- | -------------- | --------- |
| POST   | `/stripe` | Eventos Stripe | Signature |
| POST   | `/twitch` | Eventos Twitch | Secret    |

---

**Legenda Auth:**

- ❌ = Público
- ✅ = Usuário autenticado
- ✅ Mod = Moderador
- ✅ Admin = Administrador
- Signature/Secret = Validação de webhook
