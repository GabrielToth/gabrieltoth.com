# Universal Posting Scheduler API Documentation

## Overview

The Universal Posting Scheduler API enables authenticated users to create, schedule, and publish content across multiple social media networks from a single interface.

## Base URL

```
Production: https://api.gabrieltoth.com
Development: http://localhost:3000
```

## Authentication

All endpoints require authentication via session cookie or JWT token.

```http
Authorization: Bearer <token>
```

## Endpoints

### Posts

#### Create Post

Create a new post for scheduling or immediate publication.

```http
POST /api/posts
```

**Request Body:**

```json
{
  "content": "Your post content here",
  "networks": ["youtube", "facebook", "instagram"],
  "scheduledTime": "2026-05-01T10:00:00Z",
  "images": ["image1.jpg", "image2.jpg"],
  "urls": ["https://example.com"],
  "metadata": {
    "youtube": {
      "title": "Video Title",
      "description": "Video description",
      "tags": ["tag1", "tag2"],
      "visibility": "public"
    }
  }
}
```

**Response:**

```json
{
  "id": "post_123",
  "status": "scheduled",
  "scheduledTime": "2026-05-01T10:00:00Z",
  "networks": ["youtube", "facebook", "instagram"],
  "createdAt": "2026-04-27T12:00:00Z"
}
```

#### Schedule Post

Schedule an existing post for future publication.

```http
POST /api/posts/:postId/schedule
```

**Request Body:**

```json
{
  "scheduledTime": "2026-05-01T10:00:00Z",
  "timezone": "America/New_York",
  "recurrence": "daily"
}
```

**Response:**

```json
{
  "id": "post_123",
  "status": "scheduled",
  "scheduledTime": "2026-05-01T10:00:00Z",
  "timezone": "America/New_York"
}
```

#### Publish Immediately

Publish a post immediately to all selected networks.

```http
POST /api/posts/:postId/publish
```

**Response:**

```json
{
  "id": "post_123",
  "status": "publishing",
  "networks": [
    {
      "platform": "youtube",
      "status": "success",
      "externalId": "yt_video_123",
      "externalUrl": "https://youtube.com/watch?v=..."
    },
    {
      "platform": "facebook",
      "status": "pending"
    }
  ]
}
```

#### Update Post

Update a scheduled post before publication.

```http
PUT /api/posts/:postId
```

**Request Body:**

```json
{
  "content": "Updated content",
  "networks": ["youtube", "facebook"],
  "scheduledTime": "2026-05-02T10:00:00Z"
}
```

#### Delete Post

Delete a scheduled post.

```http
DELETE /api/posts/:postId
```

**Response:**

```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

#### Validate Content

Validate content against selected networks before posting.

```http
POST /api/posts/validate
```

**Request Body:**

```json
{
  "content": "Your post content",
  "networks": ["youtube", "facebook"],
  "images": ["image1.jpg"]
}
```

**Response:**

```json
{
  "valid": true,
  "warnings": [
    {
      "network": "twitter",
      "message": "Content exceeds 280 character limit",
      "severity": "warning"
    }
  ],
  "conflicts": []
}
```

### Networks

#### List Networks

Get all linked social networks for the authenticated user.

```http
GET /api/networks
```

**Response:**

```json
{
  "networks": [
    {
      "id": "net_123",
      "platform": "youtube",
      "status": "connected",
      "metadata": {
        "channelName": "My Channel",
        "subscriberCount": 1000
      }
    }
  ]
}
```

#### Connect Network

Initiate OAuth connection for a social network.

```http
POST /api/networks/:platform/connect
```

**Response:**

```json
{
  "authUrl": "https://oauth.platform.com/authorize?..."
}
```

#### Disconnect Network

Disconnect a social network and revoke access.

```http
DELETE /api/networks/:platform/disconnect
```

**Response:**

```json
{
  "success": true,
  "message": "Network disconnected successfully"
}
```

#### Network Status

Check authentication status for all networks.

```http
GET /api/networks/status
```

**Response:**

```json
{
  "networks": [
    {
      "platform": "youtube",
      "status": "connected",
      "expiresAt": "2026-05-01T00:00:00Z"
    },
    {
      "platform": "facebook",
      "status": "expired"
    }
  ]
}
```

### Groups

#### List Groups

Get all network groups for the authenticated user.

```http
GET /api/groups
```

**Response:**

```json
{
  "groups": [
    {
      "id": "grp_123",
      "name": "Social Media",
      "networkIds": ["net_1", "net_2", "net_3"],
      "createdAt": "2026-04-01T00:00:00Z"
    }
  ]
}
```

#### Create Group

Create a new network group.

```http
POST /api/groups
```

**Request Body:**

```json
{
  "name": "Professional Networks",
  "networkIds": ["net_4", "net_5"]
}
```

#### Update Group

Update an existing network group.

```http
PUT /api/groups/:groupId
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "networkIds": ["net_1", "net_2"]
}
```

#### Delete Group

Delete a network group.

```http
DELETE /api/groups/:groupId
```

#### Add Networks to Group

Add networks to an existing group.

```http
POST /api/groups/:groupId/networks
```

**Request Body:**

```json
{
  "networkIds": ["net_6", "net_7"]
}
```

#### Remove Network from Group

Remove a network from a group.

```http
DELETE /api/groups/:groupId/networks/:networkId
```

### Preferences

#### Get Preferences

Get user preferences for posting.

```http
GET /api/preferences
```

**Response:**

```json
{
  "timezone": "America/New_York",
  "defaultNetworks": ["youtube", "facebook"],
  "notificationsEnabled": true,
  "retryAttempts": 3,
  "privacySettings": {
    "youtube": "public",
    "facebook": "friends"
  }
}
```

#### Update Preferences

Update user preferences.

```http
PUT /api/preferences
```

**Request Body:**

```json
{
  "timezone": "Europe/London",
  "defaultNetworks": ["youtube"],
  "notificationsEnabled": false
}
```

#### Export Preferences

Export user preferences as JSON.

```http
POST /api/preferences/export
```

**Response:**

```json
{
  "preferences": { ... },
  "exportedAt": "2026-04-27T12:00:00Z"
}
```

#### Import Preferences

Import user preferences from JSON.

```http
POST /api/preferences/import
```

**Request Body:**

```json
{
  "preferences": { ... }
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Content exceeds platform limits",
    "details": {
      "platform": "twitter",
      "limit": 280,
      "actual": 350
    }
  }
}
```

### Error Codes

- `INVALID_REQUEST` - Invalid request parameters
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `NETWORK_ERROR` - External network error
- `VALIDATION_ERROR` - Content validation failed
- `CONFLICT` - Scheduling conflict detected

## Rate Limiting

- API endpoints: 100 requests/minute per user
- OAuth endpoints: 10 requests/minute per IP
- Publication queue: Platform-specific limits

Rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1714233600
```

## Webhooks

Subscribe to events for real-time updates:

- `post.scheduled` - Post scheduled successfully
- `post.published` - Post published to network
- `post.failed` - Publication failed
- `network.connected` - Network connected
- `network.disconnected` - Network disconnected
- `network.expired` - Network authentication expired

## Best Practices

1. **Validate content** before scheduling using `/api/posts/validate`
2. **Check network status** before posting to avoid authentication errors
3. **Handle rate limits** gracefully with exponential backoff
4. **Use webhooks** for real-time updates instead of polling
5. **Cache network status** to reduce API calls
6. **Implement retry logic** for failed publications

## Support

For API support, contact: api-support@gabrieltoth.com
