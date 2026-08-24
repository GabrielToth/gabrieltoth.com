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

---

## 📊 Analytics & Insights APIs

### `GET /api/platform/analytics`
- **Auth:** Session required
- **Parameters:** `period` (optional: `7d` | `30d` | `90d`)
- **Description:** Returns aggregated, standardized social network metrics (`followers`, `engagement`, `reach`, `impressions`) and graph historical data across connected accounts.
- **Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      { "id": "followers", "name": "Followers", "value": 1250, "change": 50, "changePercent": 4.17, "icon": "users" }
    ],
    "graphData": [
      { "date": "2026-07-26", "followers": 1200, "engagement": 300, "reach": 4000, "impressions": 10000, "channel": "all" }
    ],
    "channelsCount": 2,
    "timePeriod": "7d"
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

---

## 🌐 OAuth & Social Network Connection APIs

- `GET /api/oauth/authorize/[platform]` — Initiates OAuth 2.0 PKCE flow for Twitch, Kick, YouTube, Facebook, Instagram, TikTok, LinkedIn, Twitter/X.
- `GET /api/oauth/callback/[platform]` — Handles OAuth code exchange, state HMAC verification, and token storage.
- `POST /api/networks/[platform]/disconnect` — Revokes and deletes stored access token credentials.
