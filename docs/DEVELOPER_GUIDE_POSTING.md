# Universal Posting Scheduler - Developer Guide

## Architecture Overview

The Universal Posting Scheduler follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         Frontend Components             │
│  (React, Next.js, Tailwind CSS)        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           API Layer                     │
│  (Next.js API Routes, REST)            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (Business Logic, Validation)          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  (Supabase PostgreSQL, Redis Cache)    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      External Services                  │
│  (YouTube, Facebook, Instagram, etc.)  │
└─────────────────────────────────────────┘
```

## Project Structure

```
src/
├── components/
│   ├── publish/
│   │   ├── UniversalPostingButton.tsx
│   │   ├── NetworkSelector.tsx
│   │   ├── PostingScheduler.tsx
│   │   ├── ContentCreator.tsx
│   │   └── PostingInterface.tsx
│   ├── settings/
│   │   ├── NetworkGroupManager.tsx
│   │   └── UserPreferences.tsx
│   ├── history/
│   │   └── PublicationHistory.tsx
│   └── notifications/
│       ├── ErrorNotification.tsx
│       └── SuccessNotification.tsx
├── lib/
│   ├── oauth/
│   │   └── oauth-manager.ts
│   ├── token-store/
│   │   └── token-store.ts
│   ├── networks/
│   │   └── network-manager.ts
│   ├── groups/
│   │   └── network-group-manager.ts
│   ├── posting/
│   │   ├── content-adapter.ts
│   │   └── conflict-detector.ts
│   ├── queue/
│   │   └── publication-queue.ts
│   └── preferences/
│       └── user-preferences.ts
└── app/
    └── api/
        ├── posts/
        ├── networks/
        ├── groups/
        ├── preferences/
        └── oauth/
```

## Adding a New Platform

To add support for a new social media platform:

### 1. Update Platform Configuration

```typescript
// src/lib/platforms/config.ts
export const PLATFORMS = {
  // ... existing platforms
  tiktok: {
    name: 'TikTok',
    characterLimit: 2200,
    imageFormats: ['jpg', 'png'],
    videoFormats: ['mp4', 'mov'],
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxVideoSize: 500 * 1024 * 1024, // 500MB
    oauth: {
      authUrl: 'https://www.tiktok.com/auth/authorize',
      tokenUrl: 'https://open-api.tiktok.com/oauth/access_token',
      scopes: ['user.info.basic', 'video.upload'],
    },
  },
};
```

### 2. Implement OAuth Flow

```typescript
// src/lib/oauth/platforms/tiktok.ts
import { OAuthPlatform } from '../types';

export class TikTokOAuth implements OAuthPlatform {
  async getAuthorizationUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      scope: 'user.info.basic,video.upload',
      response_type: 'code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      state,
    });
    return `https://www.tiktok.com/auth/authorize?${params}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response = await fetch('https://open-api.tiktok.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });
    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Implement token refresh logic
  }

  async revokeToken(accessToken: string): Promise<void> {
    // Implement token revocation logic
  }
}
```

### 3. Implement Content Adapter

```typescript
// src/lib/posting/adapters/tiktok.ts
import { ContentAdapter } from '../types';

export class TikTokAdapter implements ContentAdapter {
  async adaptContent(content: PostContent): Promise<AdaptedContent> {
    return {
      text: this.truncateText(content.text, 2200),
      media: await this.processMedia(content.media),
      metadata: {
        privacy_level: content.privacy || 'public',
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
    };
  }

  async validateContent(content: PostContent): Promise<ValidationResult> {
    const errors: string[] = [];
    
    if (content.text.length > 2200) {
      errors.push('Text exceeds 2200 character limit');
    }

    if (!content.media || content.media.length === 0) {
      errors.push('TikTok requires at least one video');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  private truncateText(text: string, limit: number): string {
    if (text.length <= limit) return text;
    return text.substring(0, limit - 3) + '...';
  }

  private async processMedia(media: File[]): Promise<ProcessedMedia[]> {
    // Implement media processing logic
  }
}
```

### 4. Register Platform

```typescript
// src/lib/oauth/oauth-manager.ts
import { TikTokOAuth } from './platforms/tiktok';

export class OAuthManager {
  private platforms: Map<string, OAuthPlatform> = new Map([
    // ... existing platforms
    ['tiktok', new TikTokOAuth()],
  ]);
}
```

### 5. Add Platform Icon

```typescript
// src/components/publish/NetworkSelector.tsx
import { TikTok } from 'lucide-react'; // or custom icon

const platformIcons: Record<string, React.ReactNode> = {
  // ... existing icons
  tiktok: <TikTok className="h-4 w-4" />,
};
```

### 6. Update Environment Variables

```bash
# .env.local
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/oauth/callback/tiktok
```

## Token Encryption

All OAuth tokens are encrypted using AES-256 before storage:

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex');

export function encryptToken(token: string): EncryptedToken {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptToken(encryptedToken: EncryptedToken): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedToken.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedToken.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedToken.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

## Publication Queue Processing

The publication queue uses a cron job to process scheduled posts:

```typescript
// src/lib/queue/processor.ts
import { PublicationQueue } from './publication-queue';

export async function processQueue() {
  const queue = new PublicationQueue();
  const duePublications = await queue.getDuePublications();
  
  for (const publication of duePublications) {
    try {
      await publishToNetworks(publication);
      await queue.markAsPublished(publication.id);
    } catch (error) {
      await queue.handleFailure(publication.id, error);
    }
  }
}

// Cron job configuration (vercel.json or similar)
{
  "crons": [
    {
      "path": "/api/cron/process-queue",
      "schedule": "* * * * *" // Every minute
    }
  ]
}
```

## Error Handling Patterns

### Retry with Exponential Backoff

```typescript
async function publishWithRetry(
  publication: Publication,
  maxAttempts: number = 3
): Promise<PublicationResult> {
  let attempt = 0;
  let delay = 2000; // Start with 2 seconds
  
  while (attempt < maxAttempts) {
    try {
      return await publish(publication);
    } catch (error) {
      attempt++;
      
      if (attempt >= maxAttempts) {
        throw error;
      }
      
      if (isRetryableError(error)) {
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Don't retry non-retryable errors
      }
    }
  }
}

function isRetryableError(error: any): boolean {
  const retryableCodes = [408, 429, 500, 502, 503, 504];
  return retryableCodes.includes(error.statusCode);
}
```

## Testing Patterns

### Unit Tests

```typescript
// tests/unit/content-adapter.test.ts
import { describe, it, expect } from 'vitest';
import { ContentAdapter } from '@/lib/posting/content-adapter';

describe('ContentAdapter', () => {
  it('truncates content exceeding platform limits', () => {
    const adapter = new ContentAdapter();
    const result = adapter.adaptForPlatform('twitter', {
      text: 'a'.repeat(300),
    });
    expect(result.text.length).toBeLessThanOrEqual(280);
  });
});
```

### Integration Tests

```typescript
// tests/integration/posting-flow.test.ts
import { describe, it, expect } from 'vitest';

describe('Complete Posting Flow', () => {
  it('creates, schedules, and publishes a post', async () => {
    // Create post
    const post = await createPost({
      content: 'Test post',
      networks: ['youtube'],
    });
    
    // Schedule post
    await schedulePost(post.id, new Date(Date.now() + 3600000));
    
    // Verify scheduled
    const scheduled = await getScheduledPosts();
    expect(scheduled).toContainEqual(expect.objectContaining({ id: post.id }));
  });
});
```

## Performance Optimization

### Caching Strategy

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// Cache network status
export async function getNetworkStatus(userId: string, platform: string) {
  const cacheKey = `network:${userId}:${platform}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // Fetch from database
  const status = await fetchNetworkStatus(userId, platform);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, status);
  
  return status;
}
```

### Database Query Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_user_scheduled_time ON scheduled_posts(user_id, scheduled_time);
CREATE INDEX idx_status ON scheduled_posts(status) WHERE status = 'pending';
CREATE INDEX idx_user_published_at ON publication_history(user_id, published_at DESC);
```

## Security Best Practices

1. **Always encrypt tokens** before storing in database
2. **Use CSRF protection** on all OAuth endpoints
3. **Implement rate limiting** to prevent abuse
4. **Validate all user input** before processing
5. **Use parameterized queries** to prevent SQL injection
6. **Implement RLS policies** in Supabase for data isolation
7. **Log all security events** for audit trail

## Monitoring and Alerts

Set up monitoring for:

- Publication queue processing latency
- OAuth token refresh failures
- Publication failure rates
- API error rates
- Database query performance

## Troubleshooting

### Common Issues

**Issue: OAuth tokens expiring unexpectedly**
- Check token refresh logic
- Verify refresh token is being stored
- Ensure refresh happens before expiration

**Issue: Publications failing silently**
- Check publication queue logs
- Verify network authentication status
- Review error handling in publication logic

**Issue: Slow API responses**
- Check database query performance
- Verify caching is working
- Review API rate limiting

## Contributing

When contributing to the Universal Posting Scheduler:

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Run full test suite before committing
5. Use conventional commits with issue references

## Resources

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Redis Documentation](https://redis.io/docs)
