# Cache Module

Redis-based caching layer for the Universal Posting Scheduler feature. Provides high-level caching operations with key patterns and TTL policies for network status, user preferences, and publication queue data.

## Overview

The cache module provides:

- **Redis Client**: Connection management with retry logic and error handling
- **Cache Manager**: High-level API for get, set, delete, and pattern-based operations
- **Cache Invalidation**: Utilities for invalidating cache by user, network, preferences, or queue
- **Key Patterns**: Standardized cache key generation for different data types
- **TTL Policies**: Configurable time-to-live for different cache types

## Installation

The cache module uses Upstash Redis (REST API) for cloud deployments and supports local Redis for development.

### Environment Variables

```bash
# Upstash Redis (Cloud)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Local Redis (Development)
REDIS_URL=redis://localhost:6379
```

## Usage

### Basic Operations

```typescript
import { CacheManager, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"

// Get value from cache
const networkStatus = await CacheManager.get(
    CACHE_KEYS.NETWORK_STATUS("user123")
)

// Set value in cache with default TTL (30 minutes)
await CacheManager.set(
    CACHE_KEYS.NETWORK_STATUS("user123"),
    { youtube: "connected", facebook: "expired" }
)

// Set value with custom TTL (1 hour)
await CacheManager.set(
    CACHE_KEYS.USER_PREFERENCES("user123"),
    { timezone: "UTC", defaultNetworks: ["youtube", "facebook"] },
    CACHE_TTL.LONG
)

// Check if key exists
const exists = await CacheManager.exists(CACHE_KEYS.NETWORK_STATUS("user123"))

// Delete key
await CacheManager.delete(CACHE_KEYS.NETWORK_STATUS("user123"))

// Get TTL of key
const ttl = await CacheManager.getTTL(CACHE_KEYS.NETWORK_STATUS("user123"))

// Extend TTL of key
await CacheManager.extendTTL(CACHE_KEYS.NETWORK_STATUS("user123"), 3600)
```

### Cache Invalidation

```typescript
import { CacheInvalidation } from "@/lib/cache"

// Invalidate all cache for a user
await CacheInvalidation.invalidateUserCache("user123")

// Invalidate network cache for a user
await CacheInvalidation.invalidateNetworkCache("user123")

// Invalidate preferences cache for a user
await CacheInvalidation.invalidatePreferencesCache("user123")

// Invalidate publication queue cache for a user
await CacheInvalidation.invalidateQueueCache("user123")

// Invalidate specific network group cache
await CacheInvalidation.invalidateGroupCache("user123", "group456")

// Invalidate all group cache for a user
await CacheInvalidation.invalidateGroupCache("user123")
```

## Cache Keys

The module provides standardized cache key patterns for different data types:

### Network Cache Keys

```typescript
CACHE_KEYS.NETWORK_STATUS(userId)           // network:status:{userId}
CACHE_KEYS.NETWORK_LIST(userId)             // network:list:{userId}
CACHE_KEYS.NETWORK_GROUPS(userId)           // network:groups:{userId}
CACHE_KEYS.NETWORK_GROUP_DETAIL(userId, groupId)  // network:group:{userId}:{groupId}
```

### User Preferences Cache Keys

```typescript
CACHE_KEYS.USER_PREFERENCES(userId)         // preferences:{userId}
CACHE_KEYS.USER_TIMEZONE(userId)            // preferences:timezone:{userId}
CACHE_KEYS.USER_DEFAULT_NETWORKS(userId)    // preferences:default_networks:{userId}
```

### Publication Queue Cache Keys

```typescript
CACHE_KEYS.PUBLICATION_QUEUE(userId)        // queue:{userId}
CACHE_KEYS.SCHEDULED_POST(postId)           // post:scheduled:{postId}
CACHE_KEYS.PUBLICATION_HISTORY(userId)      // history:{userId}
```

### OAuth Cache Keys

```typescript
CACHE_KEYS.OAUTH_TOKEN(userId, platform)    // oauth:token:{userId}:{platform}
CACHE_KEYS.OAUTH_STATUS(userId)             // oauth:status:{userId}
```

### General Cache Keys

```typescript
CACHE_KEYS.GENERAL(key)                     // cache:{key}
```

## TTL Policies

The module provides predefined TTL (Time To Live) values for different cache types:

### Standard TTLs

- `CACHE_TTL.SHORT` = 5 minutes (300 seconds)
- `CACHE_TTL.MEDIUM` = 30 minutes (1800 seconds) - Default
- `CACHE_TTL.LONG` = 1 hour (3600 seconds)
- `CACHE_TTL.VERY_LONG` = 24 hours (86400 seconds)

### Specific TTLs

- `CACHE_TTL.NETWORK_STATUS` = 15 minutes (900 seconds)
  - Network status changes frequently, refresh often
- `CACHE_TTL.USER_PREFERENCES` = 1 hour (3600 seconds)
  - User preferences are stable, cache longer
- `CACHE_TTL.PUBLICATION_QUEUE` = 5 minutes (300 seconds)
  - Queue is frequently updated, refresh often
- `CACHE_TTL.OAUTH_TOKEN` = 1 hour (3600 seconds)
  - Tokens should be refreshed before expiry
- `CACHE_TTL.PUBLICATION_HISTORY` = 30 minutes (1800 seconds)
  - History is semi-stable, moderate cache time

## Examples

### Caching Network Status

```typescript
import { CacheManager, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"

async function getNetworkStatus(userId: string) {
    const cacheKey = CACHE_KEYS.NETWORK_STATUS(userId)

    // Try to get from cache
    let status = await CacheManager.get(cacheKey)
    if (status) {
        return status
    }

    // Fetch from database if not in cache
    status = await fetchNetworkStatusFromDB(userId)

    // Store in cache with 15-minute TTL
    await CacheManager.set(cacheKey, status, CACHE_TTL.NETWORK_STATUS)

    return status
}
```

### Caching User Preferences

```typescript
async function getUserPreferences(userId: string) {
    const cacheKey = CACHE_KEYS.USER_PREFERENCES(userId)

    // Try to get from cache
    let preferences = await CacheManager.get(cacheKey)
    if (preferences) {
        return preferences
    }

    // Fetch from database if not in cache
    preferences = await fetchUserPreferencesFromDB(userId)

    // Store in cache with 1-hour TTL
    await CacheManager.set(
        cacheKey,
        preferences,
        CACHE_TTL.USER_PREFERENCES
    )

    return preferences
}
```

### Invalidating Cache on Update

```typescript
async function updateUserPreferences(userId: string, preferences: any) {
    // Update in database
    await updateUserPreferencesInDB(userId, preferences)

    // Invalidate cache
    await CacheInvalidation.invalidatePreferencesCache(userId)
}
```

### Caching Publication Queue

```typescript
async function getPublicationQueue(userId: string) {
    const cacheKey = CACHE_KEYS.PUBLICATION_QUEUE(userId)

    // Try to get from cache
    let queue = await CacheManager.get(cacheKey)
    if (queue) {
        return queue
    }

    // Fetch from database if not in cache
    queue = await fetchPublicationQueueFromDB(userId)

    // Store in cache with 5-minute TTL (frequently updated)
    await CacheManager.set(cacheKey, queue, CACHE_TTL.PUBLICATION_QUEUE)

    return queue
}
```

## Error Handling

The cache module gracefully handles errors:

- If Redis is not connected, operations return `null` or `false`
- Errors are logged but don't crash the application
- The system continues to work without caching if Redis is unavailable

```typescript
import { isRedisConnected, getConnectionError } from "@/lib/cache"

// Check if Redis is connected
if (!isRedisConnected()) {
    console.log("Redis is not connected, caching disabled")
}

// Get last connection error
const error = getConnectionError()
if (error) {
    console.error("Redis connection error:", error.message)
}
```

## Testing

The cache module includes comprehensive tests:

```bash
npm run test -- src/__tests__/lib/cache/cache-manager.test.ts
```

Tests cover:

- Cache key generation
- TTL policies
- Cache operations (get, set, delete, exists)
- Cache invalidation
- Error handling

## Performance Considerations

### Cache Hit Rates

Monitor cache hit rates to optimize TTL values:

- Network status: Should have high hit rate (15-minute TTL)
- User preferences: Should have high hit rate (1-hour TTL)
- Publication queue: Should have moderate hit rate (5-minute TTL)

### Memory Usage

Redis memory usage depends on:

- Number of cached items
- Size of cached values
- TTL values (longer TTL = more memory)

Monitor Redis memory usage and adjust TTL values if needed.

### Latency

Cache operations should be fast:

- Get: < 10ms
- Set: < 10ms
- Delete: < 10ms

If latency is high, check Redis connection and network latency.

## Troubleshooting

### Redis Connection Failed

```
Error: Failed to connect to Redis
```

**Solution:**

1. Check environment variables are set correctly
2. Verify Redis server is running (for local development)
3. Check network connectivity to Upstash (for cloud)
4. Verify credentials are correct

### Cache Not Working

```
Redis is not connected. Caching will be disabled.
```

**Solution:**

1. Check Redis connection status: `isRedisConnected()`
2. Check connection error: `getConnectionError()`
3. Verify environment variables
4. Check Redis server logs

### High Memory Usage

**Solution:**

1. Reduce TTL values to evict items faster
2. Reduce cache key patterns to cache less data
3. Monitor cache hit rates and adjust accordingly
4. Consider using Redis eviction policies (LRU, LFU)

## Architecture

```
┌─────────────────────────────────────────┐
│         Application Code                │
├─────────────────────────────────────────┤
│         CacheManager                    │
│  (get, set, delete, exists, etc.)       │
├─────────────────────────────────────────┤
│      CacheInvalidation                  │
│  (invalidate by user, network, etc.)    │
├─────────────────────────────────────────┤
│      Redis Client                       │
│  (connection management)                │
├─────────────────────────────────────────┤
│    Upstash Redis / Local Redis          │
│  (actual data storage)                  │
└─────────────────────────────────────────┘
```

## Future Enhancements

- [ ] Cache warming strategies
- [ ] Cache statistics and monitoring
- [ ] Distributed cache invalidation
- [ ] Cache compression for large values
- [ ] Cache versioning for schema changes
- [ ] Cache encryption for sensitive data

## References

- [Upstash Redis Documentation](https://upstash.com/docs/redis/overview)
- [Redis Commands](https://redis.io/commands/)
- [Cache Invalidation Strategies](https://en.wikipedia.org/wiki/Cache_invalidation)
