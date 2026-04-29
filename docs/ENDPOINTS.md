# Platform Endpoints

## Health and Status

| Method | Endpoint      | Description | Auth |
| ------ | ------------- | ----------- | ---- |
| GET    | `/api/health` | Health check | ❌   |

## Credits (`/api/platform/credits`)

| Method | Endpoint   | Description              | Auth     |
| ------ | ---------- | ------------------------ | -------- |
| GET    | `/balance` | Current balance          | ✅       |
| POST   | `/deduct`  | Deduct credits           | ✅       |
| POST   | `/add`     | Add credits (admin)      | ✅ Admin |

## Analytics (`/api/platform/analytics`)

| Method | Endpoint | Description          | Auth     |
| ------ | -------- | -------------------- | -------- |
| GET    | `/`      | Consumption dashboard | ✅       |
| GET    | `/admin` | Overview (admin)     | ✅ Admin |

## YouTube (`/api/platform/youtube`)

| Method | Endpoint         | Description       | Auth |
| ------ | ---------------- | ----------------- | ---- |
| POST   | `/download`      | Start download    | ✅   |
| GET    | `/status/:jobId` | Download status   | ✅   |
| POST   | `/schedule`      | Schedule publish  | ✅   |

## Chat (`/api/platform/chat`)

| Method | Endpoint   | Description           | Auth   |
| ------ | ---------- | --------------------- | ------ |
| WS     | `/unified` | Unified chat WebSocket | ✅     |
| POST   | `/timeout` | Apply timeout         | ✅ Mod |
| POST   | `/ban`     | Apply ban             | ✅ Mod |

## Stream (`/api/platform/stream`)

| Method | Endpoint | Description    | Auth |
| ------ | -------- | --------------- | ---- |
| POST   | `/start` | Start stream    | ✅   |
| POST   | `/stop`  | Stop stream     | ✅   |
| GET    | `/usage` | Current usage   | ✅   |

## Webhooks (`/api/platform/webhooks`)

| Method | Endpoint  | Description    | Auth      |
| ------ | --------- | --------------- | --------- |
| POST   | `/stripe` | Stripe events   | Signature |
| POST   | `/twitch` | Twitch events   | Secret    |

---

**Auth Legend:**

- ❌ = Public
- ✅ = Authenticated user
- ✅ Mod = Moderator
- ✅ Admin = Administrator
- Signature/Secret = Webhook validation
