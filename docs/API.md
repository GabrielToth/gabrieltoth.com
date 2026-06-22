# API Documentation

Complete API reference for gabrieltoth.com platform.

## 📚 Table of Contents

### Authentication

- **[Authentication API](API_AUTH.md)** - User login, password reset, session management
- **[Registration API](API_REGISTRATION.md)** - Enhanced multi-step registration with email verification
- **[OAuth API](API_OAUTH.md)** - Google OAuth authentication

### Platform

- **[Health Check API](#health-check-api)** - System health monitoring
- **[Contact API](#contact-api)** - Contact form submissions
- **[Analytics API](#analytics-api)** - User analytics and consumption
- **[Credits API](#credits-api)** - Credit balance, transactions, and admin grants
- **[YouTube Upload API](#youtube-upload-api)** - Video upload to YouTube
- **[YouTube Download API](#youtube-download-api)** - Video download from cloud storage
- **[Instagram API](#instagram-api)** - Instagram Business Account linking, publishing, and analytics

### Payments

- **[Monero API](#monero-api)** - Cryptocurrency payments
- **[PIX API](#pix-api)** - Brazilian payment method

### Webhooks

- **[WhatsApp Webhook](#whatsapp-webhook)** - WhatsApp Business API integration

---

## Base URL

```
Production: https://www.gabrieltoth.com/api
Development: http://localhost:3000/api
```

---

## Common Response Format

All API endpoints follow a consistent response format:

### Success Response (2xx)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Endpoint-specific data
  }
}
```

### Error Response (4xx, 5xx)

```json
{
  "success": false,
  "error": "User-friendly error message",
  "field": "field_name" // Optional: for validation errors
}
```

---

## Authentication

Most endpoints require authentication via session cookies or API keys. See [Authentication API](API_AUTH.md) for details.

---

## Health Check API

### GET /health

Check system health and status.

**Request:**

```http
GET /api/health HTTP/1.1
```

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2026-04-20T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**Use Cases:**

- Monitoring system availability
- Load balancer health checks
- Uptime monitoring services

---

## Contact API

### POST /contact

Submit a contact form message.

**Request:**

```http
POST /api/contact HTTP/1.1
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "General Inquiry",
  "message": "Hello, I have a question...",
  "csrfToken": "token_value"
}
```

**Validation Rules:**

- Name: 2-100 characters, alphanumeric with spaces
- Email: Valid RFC 5322 format
- Subject: 5-200 characters
- Message: 10-5000 characters

**Response (200):**

```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

**Error Responses:**

- 400: Invalid input or validation failed
- 403: Invalid CSRF token
- 429: Rate limit exceeded (max 3 messages per hour per IP)

**Security Features:**

- Rate limiting per IP address
- CSRF token validation
- Input sanitization
- Spam detection
- Email validation

---

## Analytics API

### GET /platform/analytics

Get user consumption and credit history.

**Request:**

```http
GET /api/platform/analytics?userId=user-uuid HTTP/1.1
Cookie: session=session_token
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User UUID |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "totalCredits": 1000,
    "usedCredits": 250,
    "remainingCredits": 750,
    "history": [
      {
        "date": "2026-04-20",
        "action": "video_upload",
        "credits": -50,
        "balance": 750
      }
    ]
  }
}
```

**Error Responses:**

- 401: Unauthorized (no session)
- 404: User not found

---

## Credits API

Credit-based billing system for resource metering. All credit endpoints that require authentication use the `session` cookie (not `auth_session`).

### GET /credits/balance

Get the current user's credit balance.

**Request:**

```http
GET /api/credits/balance HTTP/1.1
Cookie: session=session_token
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "balance": 1000,
    "userId": "user-uuid",
    "isAdmin": false
  }
}
```

**Error Responses:**

- 401: No valid session

---

### GET /credits/transactions

Get the current user's transaction history.

**Request:**

```http
GET /api/credits/transactions?limit=50 HTTP/1.1
Cookie: session=session_token
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Max results (default 50, max 100) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx-uuid",
        "amount": -50,
        "type": "debit",
        "reason": "video_upload",
        "balanceBefore": 1000,
        "balanceAfter": 950,
        "createdAt": "2026-04-20T12:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- 401: No valid session

---

### GET /credits/costs

Get the credit cost table for all billable actions. Public endpoint, no auth required.

**Request:**

```http
GET /api/credits/costs HTTP/1.1
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "costs": {
      "video_upload": 50,
      "video_process": 30,
      "email_send": 1,
      "search": 5,
      "analytics_query": 10,
      "ai_chat": 20,
      "ai_image": 50
    }
  }
}
```

---

### POST /credits/grant

Admin-only: Grant free credits to the current user's account. Requires the user's UUID to be in the `CREDIT_ADMIN_IDS` environment variable.

**Request:**

```http
POST /api/credits/grant HTTP/1.1
Content-Type: application/json
Cookie: session=session_token

{
  "amount": 100,
  "reason": "Test grant"
}
```

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | number | Yes | Positive integer of credits to add |
| reason | string | No | Reason for the grant (default "Admin grant") |

**Response (200):**

```json
{
  "success": true,
  "message": "100 credits granted",
  "data": {
    "transactionId": "tx-uuid",
    "newBalance": 1100
  }
}
```

**Error Responses:**

- 400: Invalid amount (must be a positive number)
- 401: No valid session or not an admin

---

### GET /credits/whoami

Get the current user's UUID, email, name, and admin status. Useful for debugging and discovering your UUID for `CREDIT_ADMIN_IDS` configuration.

**Request:**

```http
GET /api/credits/whoami HTTP/1.1
Cookie: session=session_token
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "isAdmin": false,
    "instructions": "Copy your 'id' value and add it to CREDIT_ADMIN_IDS in .env.local"
  }
}
```

**Error Responses:**

- 401: No valid session

---

## YouTube Upload API

### POST /api/youtube/upload

Upload a video file to YouTube using the authenticated user's YouTube channel.

**Authentication:** Requires `x-user-id` header (user UUID) and CSRF token.

**Request:**

```http
POST /api/youtube/upload HTTP/1.1
Content-Type: multipart/form-data
x-user-id: user-uuid
x-csrf-token: csrf-token-value
```

**Multipart Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Video file (MP4, WebM, MOV). Max 500MB. |
| `title` | string | Yes | Video title. Max 100 characters. |
| `description` | string | Yes | Video description. Max 5000 characters. |
| `privacyStatus` | string | Yes | One of: `public`, `unlisted`, `private` |
| `tags` | string | No | Comma-separated tags. Max 500 chars total, 30 tags max, 100 chars each. |
| `categoryId` | string | No | YouTube category ID (e.g., `22` for Entertainment). Max 3 chars. |
| `csrfToken` | string | Yes | CSRF protection token (in form data or header). |

**Response (200):**

```json
{
  "success": true,
  "videoId": "youtube-video-id",
  "url": "https://youtube.com/watch?v=youtube-video-id"
}
```

**Error Responses:**

- 400: Missing/invalid fields, extra fields detected, empty file
- 401: No valid session or YouTube not linked
- 403: Invalid CSRF token
- 413: File exceeds 500MB limit
- 500: Internal server error or YouTube API failure

**Security:**

- CSRF token required (from form data or `x-csrf-token` header)
- Extra field rejection (whitelist: only `csrfToken`, `file`, `title`, `description`, `privacyStatus`, `tags`, `categoryId`)
- Type validation on all fields
- Length limits enforced (title: 100, description: 5000, tags: 500 total)
- No stack traces or internal paths in error responses
- Large files (>4.5MB) logged as warning (Vercel Hobby limitation)

**Notes:**

- For files >4.5MB, use the Express backend (port 4000) instead of Vercel
- YouTube OAuth token must be linked via the OAuth flow at `/api/youtube/link/start`
- Token refresh is handled automatically (lazy refresh on each upload)

---

## Instagram API

### POST /api/oauth/authorize/instagram

Initiate Instagram Business Account linking. Generates an OAuth authorization URL and stores a CSRF state parameter in Redis.

**Request:**

```http
POST /api/oauth/authorize/instagram HTTP/1.1
x-user-id: user-uuid
```

**Response (200):**

```json
{
  "success": true,
  "authorizationUrl": "https://www.facebook.com/v22.0/dialog/oauth?...",
  "state": "random_state_string"
}
```

**Error Responses:**

- 400: Missing `x-user-id` header
- 500: Redis not configured or linking initiation failed

---

### GET /api/oauth/callback/instagram

OAuth callback from Facebook after user authorizes Instagram Business Account linking. Exchanges the authorization code for tokens, retrieves Business Account info, and stores encrypted tokens.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Authorization code from Facebook |
| state | string | Yes | State parameter for CSRF validation |
| error | string | No | OAuth error from Facebook |

**Redirects to:**

| Redirect | Description |
|----------|-------------|
| `/dashboard?instagram=success` | Successfully linked |
| `/dashboard?instagram=partial` | Token stored but social_networks record failed |
| `/dashboard?instagram=error&reason=x` | Error with specific reason |

**Error reasons:**

- `denied` — User denied authorization
- `missing_params` — Required OAuth params missing
- `invalid_state` — State not found or expired in Redis
- `no_business_account` — No Instagram Business Account linked to the Facebook Page
- `server_error` — Internal server error

---

### POST /api/oauth/disconnect/instagram

Revoke Instagram Business Account linking. Revokes the OAuth token on Facebook's side and removes stored credentials.

**Request:**

```http
POST /api/oauth/disconnect/instagram HTTP/1.1
x-user-id: user-uuid
```

**Response (200):**

```json
{
  "success": true,
  "message": "Instagram account unlinked successfully"
}
```

**Error Responses:**

- 400: Missing `x-user-id` header
- 404: Instagram not linked for this user

---

### POST /api/platform/instagram/publish

Publish content to the authenticated user's Instagram Business Account. Supports single images, single videos, and carousels.

**Request:**

```http
POST /api/platform/instagram/publish HTTP/1.1
Content-Type: application/json
x-user-id: user-uuid

{
  "caption": "My awesome Instagram post!",
  "imageUrl": "https://example.com/photo.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "carouselItems": [
    { "type": "image", "url": "https://example.com/photo1.jpg" },
    { "type": "image", "url": "https://example.com/photo2.jpg" }
  ]
}
```

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| caption | string | Yes | Post caption. Max 2200 characters. |
| imageUrl | string | No* | Public URL of an image to post |
| videoUrl | string | No* | Public URL of a video to post (max 60s, 100MB) |
| carouselItems | array | No* | Array of {type, url} objects for carousel posts |

\* At least one of `imageUrl`, `videoUrl`, or `carouselItems` is required.

**Response (201):**

```json
{
  "success": true,
  "postId": "instagram-media-id",
  "url": "https://www.instagram.com/p/instagram-media-id/"
}
```

**Error Responses:**

- 400: Missing caption, no media provided, or validation error
- 404: Instagram not linked for this user

**Security:**

- Extra field rejection (whitelist: `caption`, `imageUrl`, `videoUrl`, `carouselItems`)
- Caption length limit enforced (2200 characters)
- Instagram Graph API media container flow (create → publish)

---

### GET /api/platform/instagram/analytics

Get Instagram Business Account analytics (basic insights).

**Request:**

```http
GET /api/platform/instagram/analytics?metric=impressions,reach,profile_views&period=day HTTP/1.1
x-user-id: user-uuid
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| metric | string | No | Comma-separated metrics (default: `impressions,reach,profile_views`). Supported: `impressions`, `reach`, `profile_views`, `follower_count` |
| period | string | No | Time period: `day`, `week`, `days_28` (default: `day`) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "businessAccount": {
      "id": "ig-user-id",
      "username": "myaccount",
      "name": "My Account"
    },
    "insights": {
      "impressions": 1500,
      "reach": 1200,
      "profile_views": 45
    }
  }
}
```

**Error Responses:**

- 400: Missing `x-user-id` header
- 401: Token expired, re-link required
- 404: Instagram not linked or no Business Account found

---

## YouTube Download API

### GET /api/youtube/download/[mediaId]

Download a video file from cloud storage. Redirects to a signed Supabase Storage URL valid for 5 minutes.

**Authentication:** Requires `auth_session` cookie and CSRF token. Environment-gated (only works in `NODE_ENV !== 'production'`). Email-gated (only `gabrieltothgoncalves@gmail.com` may download).

**Request:**

```http
GET /api/youtube/download/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Cookie: auth_session=session_token
x-csrf-token: csrf-token-value
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mediaId | UUID | Yes | UUID of the scheduled_post_media record |

**Response:**

- 302: Redirect to signed Supabase Storage URL

**Error Responses:**

- 400: Invalid media ID format
- 401: No valid session
- 403: Access denied (wrong user or production environment)
- 404: Media not found or file not available
- 500: Storage not configured or download failed

**Security:**

- Session cookie validated against DB
- Email-gated to `gabrieltothgoncalves@gmail.com` only
- Environment-gated (production returns 403)
- Media ownership verified via `user_id` match
- UUID format validation prevents injection
- Redirect to signed URL (no direct data streaming)
- Signed URL expires in 5 minutes

**Notes:**

- Not available in production — development/Docker only
- Signed URLs are limited to 5 minute expiry
- The record must exist in `scheduled_post_media` with `storage_status = 'stored'`

---

## Monero API

### POST /payments/monero/create

Create a new Monero payment request.

**Request:**

```http
POST /api/payments/monero/create HTTP/1.1
Content-Type: application/json

{
  "serviceType": "premium_subscription",
  "amount": 0.05,
  "whatsappNumber": "+5511999999999"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| serviceType | string | Yes | Type of service being purchased |
| amount | number | Yes | Amount in XMR |
| whatsappNumber | string | No | WhatsApp for notifications |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "address": "monero-address",
    "amount": 0.05,
    "trackingCode": "ABC123",
    "qrCode": "data:image/png;base64,...",
    "expiresAt": "2026-04-20T13:00:00.000Z"
  }
}
```

**Error Responses:**

- 400: Invalid amount or service type
- 500: Payment creation failed

---

### POST /payments/monero/verify

Verify a Monero payment transaction.

**Request:**

```http
POST /api/payments/monero/verify HTTP/1.1
Content-Type: application/json

{
  "txHash": "transaction-hash",
  "trackingCode": "ABC123",
  "whatsappNumber": "+5511999999999"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "verified": true,
    "confirmations": 10,
    "amount": 0.05,
    "status": "confirmed"
  }
}
```

**Error Responses:**

- 400: Invalid transaction hash or tracking code
- 404: Payment not found
- 402: Payment not confirmed yet

---

### GET /payments/monero/verify

Check payment status by tracking code.

**Request:**

```http
GET /api/payments/monero/verify?trackingCode=ABC123 HTTP/1.1
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "pending",
    "amount": 0.05,
    "confirmations": 5,
    "requiredConfirmations": 10
  }
}
```

---

## PIX API

### POST /payments/pix/create

Create a new PIX payment request (Brazilian payment method).

**Request:**

```http
POST /api/payments/pix/create HTTP/1.1
Content-Type: application/json

{
  "serviceType": "premium_subscription",
  "amount": 50.00,
  "whatsappNumber": "+5511999999999"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "pixKey": "pix-key",
    "amount": 50.00,
    "qrCode": "data:image/png;base64,...",
    "pixCopyPaste": "00020126...",
    "expiresAt": "2026-04-20T13:00:00.000Z"
  }
}
```

---

### GET /payments/pix/create

Retrieve PIX payment information.

**Request:**

```http
GET /api/payments/pix/create?paymentId=payment-uuid HTTP/1.1
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "status": "pending",
    "amount": 50.00,
    "pixKey": "pix-key"
  }
}
```

---

## WhatsApp Webhook

### GET /whatsapp/webhook

Verify WhatsApp webhook (required by WhatsApp Business API).

**Request:**

```http
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=challenge_string&hub.verify_token=verify_token HTTP/1.1
```

**Response (200):**

```
challenge_string
```

**Error Responses:**

- 403: Invalid verify token

---

### POST /whatsapp/webhook

Receive WhatsApp messages and events.

**Request:**

```http
POST /api/whatsapp/webhook HTTP/1.1
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "5511999999999",
                "text": {
                  "body": "Hello"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response (200):**

```json
{
  "success": true
}
```

---

## Rate Limiting

Different endpoints have different rate limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| /contact | 3 requests | 1 hour |
| /auth/login | 5 attempts | 15 minutes |
| /auth/register | 3 requests | 1 hour |
| /payments/* | 10 requests | 1 minute |
| /credits/grant | 10 requests | 1 minute |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1619712000
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation failed |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Invalid CSRF token or insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected error |
| 502 | Bad Gateway - Upstream service error |
| 503 | Service Unavailable - Service temporarily unavailable |

---

## Security

### HTTPS

All API requests must use HTTPS in production. HTTP requests are automatically redirected to HTTPS.

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) require a valid CSRF token. Get a token from `/auth/csrf`.

### Authentication

Most endpoints require authentication via HTTP-only session cookies. See [Authentication API](API_AUTH.md).

### Rate Limiting

Rate limits are enforced per IP address and per user. Exceeding limits results in 429 errors.

### Input Validation

All input is validated and sanitized to prevent XSS and SQL injection attacks.

### Security Headers

All responses include security headers:

- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy

---

## Testing with Postman

Import the Postman collection to test all endpoints:

1. Open Postman
2. Click "Import"
3. Select "Link" tab
4. Enter: `https://www.gabrieltoth.com/api/postman-collection.json`
5. Click "Continue"

Or use the Postman MCP integration (if available).

---

## Support

For API issues or questions:

- Open an issue on [GitHub](https://github.com/gabrieltoth/gabrieltoth.com/issues)
- Contact: <support@gabrieltoth.com>

---

## Changelog

### v1.2.0 (2026-06-22)

- Instagram API: OAuth authorize/callback/disconnect
- Instagram API: Publish and analytics endpoints
- Instagram Posting Adapter: Real Graph API integration (was stub)
- Env vars: Added INSTAGRAM/TIKTOK/FACEBOOK OAuth configs

### v1.1.1 (2026-06-21)

- YouTube Download API: GET /api/youtube/download/[mediaId]
- OAuth scopes: Added youtube.upload and youtube (full access)

### v1.1.0 (2026-06-21)

- Credits API: balance, transactions, costs, admin grant, whoami
- Rate limit added to /credits/grant

### v1.0.0 (2026-04-20)

- Initial API documentation
- Authentication endpoints
- OAuth integration
- Payment endpoints (Monero, PIX)
- Contact form
- Analytics
- Health check

---

**Last Updated**: June 21, 2026
