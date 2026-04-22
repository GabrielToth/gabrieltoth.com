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
- Contact: support@gabrieltoth.com

---

## Changelog

### v1.0.0 (2026-04-20)
- Initial API documentation
- Authentication endpoints
- OAuth integration
- Payment endpoints (Monero, PIX)
- Contact form
- Analytics
- Health check

---

**Last Updated**: April 20, 2026
