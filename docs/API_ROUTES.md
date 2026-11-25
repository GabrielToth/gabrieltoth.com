# API Routes Documentation — gabrieltoth.com

This document describes all API routes available in the system, their authentication requirements, HTTP methods, and response models.

---

## 🔐 Authentication & Session APIs

### `POST /api/auth/login`
- **Auth:** Public
- **Description:** Authenticates user credentials with Rate Limiting and CSRF protection.
- **Request Body:** `{ email: string, password: string, csrfToken: string }`
- **Response:** `{ success: boolean, user?: object, error?: string }`

### `POST /api/auth/register`
- **Auth:** Public
- **Description:** Registers new account with password strength and email verification.

### `GET /api/auth/me`
- **Auth:** Session required
- **Description:** Returns current authenticated user session metadata.

### `PUT /api/user/profile`
- **Auth:** Session required (CSRF + Rate Limit)
- **Description:** Updates user profile name and/or profile photo.
- **Request Body:** `{ name?: string, profilePhoto?: string }`

---

## 📊 Analytics & Insights APIs

### `GET /api/platform/analytics`
- **Auth:** Session required
- **Parameters:** `period` (`7d` | `30d` | `90d`), `platform` (optional filter), `groupId` (optional channel group ID)
- **Description:** Returns normalized social network metrics in **Simple View** (Followers, Engagement, Reach, Impressions) and **Advanced View** (Viral Coefficient, Avg Watch Time, CTR), with per-platform breakdown. Filterable by platform and channel group.
- **Response:**
```json
{
  "success": true,
  "data": {
    "simpleMetrics": [ ... ],
    "advancedMetrics": [ { "id": "viral_coefficient", "category": "growth", "platformBreakdown": { "twitch": 85, "youtube": 92 }, ... } ],
    "graphData": [ ... ],
    "channelsCount": 3,
    "timePeriod": "7d",
    "appliedFilters": { "platform": "all", "groupId": "all" }
  }
}
```

### `GET /api/live/metrics`
- **Auth:** Session required
- **Description:** Returns real-time live streaming metrics including viewer count, peak viewers, retention rate, and chat velocity.

### `POST /api/live/metrics`
- **Auth:** Session required
- **Request Body:** `{ viewers: number, chatMessagesCount: number, platform: string }`
- **Description:** Records a real-time stream snapshot.

---

## 💬 Live Chat & Moderation APIs

### `POST /api/live/chat/send`
- **Auth:** Session required
- **Description:** Sends chat messages and executes moderation commands (`/slow`, `/timeout`, `/ban`, `/subscribers`).

### `GET /api/chat-commands`
- **Auth:** Session required
- **Description:** Returns active custom chatbot commands.

### `POST /api/chat-commands`
- **Auth:** Session required
- **Description:** Creates new custom chatbot command or executes message template matching.

---

## 🔔 Webhook Notification APIs

### `POST /api/webhooks/discord`
- **Auth:** Session required
- **Request Body:** `{ webhookUrl: string, event: NotificationEvent }`
- **Description:** Formats and dispatches Rich Embed notifications to Discord.

### `POST /api/webhooks/telegram`
- **Auth:** Session required
- **Request Body:** `{ botToken: string, chatId: string, event: NotificationEvent }`
- **Description:** Formats and dispatches Markdown notifications to Telegram Bot API.

### `GET /api/webhooks/tiktok`
- **Auth:** None. The `challenge` query parameter must be present.
- **Description:** TikTok webhook verification handshake. Echoes the `challenge` value with status 200, or returns 403 when it is missing.

### `POST /api/webhooks/tiktok`
- **Auth:** HMAC-SHA256 signature. The `X-Tiktok-Signature` header must equal `sha256=<hex>`, where the hex is the HMAC-SHA256 of the raw body computed with `TIKTOK_CLIENT_SECRET`. Missing or invalid signatures return 403 before the body is parsed. The comparison is timing-safe.
- **Request Body:** `{ event: string, create_time: number, content: string }` where `content` is a JSON string.
- **Events handled:** `video.publish.completed`, `video.upload.failed`, `authorization.removed`, `portability.download.ready`. Unknown events are acknowledged and logged.
- **Description:** Receives real-time events from TikTok. On `authorization.removed`, the stored OAuth token and the linked `social_networks` row for the event's open id are deleted.

---

## 🌐 OAuth & Social Network Connection APIs

- `GET /api/oauth/authorize/[platform]` — Initiates OAuth 2.0 PKCE flow for Twitch, Kick, YouTube, Facebook, Instagram, TikTok, LinkedIn, Twitter/X.
- `GET /api/oauth/callback/[platform]` — Handles OAuth code exchange, state HMAC verification, and token storage.
- `POST /api/networks/[platform]/disconnect` — Revokes and deletes stored access token credentials.
