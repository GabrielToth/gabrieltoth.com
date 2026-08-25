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

---

## 🌐 OAuth & Social Network Connection APIs

- `GET /api/oauth/authorize/[platform]` — Initiates OAuth 2.0 PKCE flow for Twitch, Kick, YouTube, Facebook, Instagram, TikTok, LinkedIn, Twitter/X.
- `GET /api/oauth/callback/[platform]` — Handles OAuth code exchange, state HMAC verification, and token storage.
- `POST /api/networks/[platform]/disconnect` — Revokes and deletes stored access token credentials.
