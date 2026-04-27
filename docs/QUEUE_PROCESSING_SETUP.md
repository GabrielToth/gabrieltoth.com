# Publication Queue Processing Setup (Without Cron Jobs)

## Overview

Since we don't have access to cron jobs (Railway, Vercel Cron), we need alternative solutions to process scheduled publications. This document outlines three approaches.

## Solution 1: Client-Side Polling (Recommended for MVP)

### How It Works

When a user is logged in, the frontend automatically checks for due publications every minute and processes them.

### Pros
- ✅ No external dependencies
- ✅ Works immediately
- ✅ No additional costs
- ✅ Simple to implement

### Cons
- ❌ Requires at least one user to be logged in
- ❌ Publications only process when users are active
- ❌ Multiple users might trigger duplicate processing (mitigated with locks)

### Setup

1. **Add Provider to Layout**

```tsx
// src/app/layout.tsx
import { PublicationQueueProvider } from '@/components/providers/PublicationQueueProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <PublicationQueueProvider enabled={true} interval={60000}>
            {children}
          </PublicationQueueProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

2. **Configure Interval**

Adjust the polling interval based on your needs:
- `60000` (1 minute) - Default, good balance
- `30000` (30 seconds) - More responsive, more API calls
- `120000` (2 minutes) - Less API calls, less responsive

3. **Add Processing Lock**

To prevent duplicate processing when multiple users are online:

```typescript
// src/lib/queue/publication-queue.ts
export class PublicationQueue {
  async getDuePublications(userId: string) {
    // Use Redis lock or database transaction
    const lock = await this.acquireLock('queue-processing');
    
    if (!lock) {
      return []; // Another process is already processing
    }

    try {
      // Get and mark publications as processing
      const publications = await this.fetchDuePublications(userId);
      return publications;
    } finally {
      await this.releaseLock('queue-processing');
    }
  }
}
```

### Testing

```bash
# 1. Schedule a post for 1 minute from now
# 2. Stay logged in
# 3. Wait 1 minute
# 4. Check console for "Processed X publications"
# 5. Verify post was published
```

## Solution 2: External Webhook Trigger (Recommended for Production)

### How It Works

Use a free external monitoring service to ping your API endpoint every minute.

### Pros
- ✅ Works even when no users are logged in
- ✅ Reliable and consistent
- ✅ Free options available
- ✅ No code changes needed

### Cons
- ❌ Requires external service setup
- ❌ Depends on third-party reliability

### Setup with UptimeRobot (Free)

1. **Generate Secret Token**

```bash
# Generate a secure random token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Add to Environment Variables**

```bash
# .env.local
QUEUE_TRIGGER_SECRET=your_generated_token_here
```

3. **Create UptimeRobot Monitor**

- Go to https://uptimerobot.com (free account)
- Create new monitor:
  - **Type:** HTTP(s)
  - **URL:** `https://yourdomain.com/api/queue/trigger`
  - **Monitoring Interval:** 1 minute (free tier)
  - **Custom HTTP Headers:**
    ```
    Authorization: Bearer your_generated_token_here
    ```

4. **Verify Setup**

```bash
# Test manually
curl -H "Authorization: Bearer your_token" \
  https://yourdomain.com/api/queue/trigger
```

### Alternative Services

**Pingdom** (Free tier available)
- Similar to UptimeRobot
- 1-minute intervals on paid plans

**Cron-job.org** (Free)
- Dedicated cron job service
- 1-minute intervals available
- More reliable than monitoring services

**Easycron** (Free tier)
- 20 cron jobs free
- 1-minute intervals

## Solution 3: Background Processor (Node.js Long-Running Process)

### How It Works

If you're running Next.js in a long-running Node.js process (not serverless), you can use a background interval to process the queue.

### Pros
- ✅ No external dependencies
- ✅ Runs automatically when server starts
- ✅ Simple implementation
- ✅ No additional costs

### Cons
- ❌ Only works in long-running processes (not Vercel/serverless)
- ❌ Requires server restart to start processing
- ❌ Single point of failure

### Setup

1. **Start Background Processor on Server Startup**

```typescript
// src/app/api/init/route.ts or server startup file
import { startBackgroundProcessing } from '@/lib/queue/background-processor';

// Call this once when server starts
startBackgroundProcessing(60000); // 1 minute interval
```

2. **Or Use API Endpoint**

```bash
# Generate secret token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local
QUEUE_TRIGGER_SECRET=your_token_here

# Start processing via API
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  https://yourdomain.com/api/queue/start
```

3. **Verify It's Running**

Check server logs for:
```
Starting background processor (interval: 60000ms)
Processing X due publications
```

### When to Use

- ✅ Running on VPS (DigitalOcean, Linode, etc.)
- ✅ Running on dedicated server
- ✅ Running with Docker
- ✅ Running with PM2 or similar process manager
- ❌ NOT for Vercel (serverless)
- ❌ NOT for AWS Lambda (serverless)
- ❌ NOT for Netlify (serverless)

## Solution 4: Hybrid Approach (Recommended)

Combine multiple solutions for maximum reliability:

1. **Client-Side Polling** - Primary method, works immediately
2. **External Webhook** - Backup for when no users are online
3. **Manual Trigger** - Admin can manually trigger processing

### Implementation

```typescript
// src/app/admin/queue/page.tsx
'use client';

export default function QueueManagement() {
  const [processing, setProcessing] = useState(false);

  const handleManualTrigger = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/queue/process', {
        method: 'POST',
      });
      const result = await response.json();
      alert(`Processed ${result.processed} publications`);
    } catch (error) {
      alert('Failed to process queue');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <h1>Queue Management</h1>
      <button onClick={handleManualTrigger} disabled={processing}>
        {processing ? 'Processing...' : 'Process Queue Now'}
      </button>
    </div>
  );
}
```

## Monitoring and Debugging

### Check Queue Status

```typescript
// GET /api/queue/status
export async function GET() {
  const queue = new PublicationQueue();
  const stats = await queue.getStats();
  
  return NextResponse.json({
    pending: stats.pending,
    processing: stats.processing,
    completed: stats.completed,
    failed: stats.failed,
    nextDue: stats.nextDueTime,
  });
}
```

### View Logs

```typescript
// GET /api/queue/logs
export async function GET() {
  const logs = await getQueueLogs({
    limit: 100,
    orderBy: 'timestamp DESC',
  });
  
  return NextResponse.json({ logs });
}
```

### Alerts

Set up alerts for:
- Publications stuck in "processing" state > 5 minutes
- Failed publications > 3 attempts
- No processing activity > 10 minutes

## Best Practices

1. **Idempotency**
   - Ensure publications can be safely retried
   - Use unique IDs to prevent duplicates
   - Check if already published before processing

2. **Locking**
   - Use Redis or database locks
   - Prevent concurrent processing
   - Set lock expiration (5 minutes)

3. **Error Handling**
   - Retry failed publications with exponential backoff
   - Log all errors with context
   - Alert on repeated failures

4. **Performance**
   - Process in batches (10-20 at a time)
   - Use connection pooling
   - Cache network tokens

5. **Monitoring**
   - Track processing time
   - Monitor success/failure rates
   - Alert on anomalies

## Troubleshooting

### Publications Not Processing

**Check:**
1. Is client-side polling enabled?
2. Is a user logged in?
3. Are there any errors in console?
4. Is the API endpoint accessible?
5. Are there any database locks?

**Solution:**
```bash
# Check queue status
curl https://yourdomain.com/api/queue/status

# Manually trigger processing
curl -X POST https://yourdomain.com/api/queue/process
```

### Duplicate Processing

**Check:**
1. Are multiple users triggering processing?
2. Is locking implemented correctly?
3. Are there race conditions?

**Solution:**
- Implement Redis-based distributed locks
- Add database-level unique constraints
- Use optimistic locking with version numbers

### Slow Processing

**Check:**
1. How many publications are being processed?
2. Are network API calls timing out?
3. Is database query slow?

**Solution:**
- Process in smaller batches
- Add indexes to database queries
- Implement timeout handling
- Use connection pooling

## Cost Comparison

| Solution | Cost | Reliability | Setup Complexity |
|----------|------|-------------|------------------|
| Client Polling | Free | Medium | Low |
| UptimeRobot | Free | High | Low |
| Cron-job.org | Free | High | Low |
| Railway Cron | $5/mo | High | Low |

## Recommendation

**For MVP/Small Scale:**
- Use **Client-Side Polling** + **UptimeRobot**
- Cost: $0
- Reliability: Good
- Setup: 30 minutes

**For Production/Large Scale:**
- Use **Railway Cron** or dedicated queue service
- Cost: $5+/month
- Reliability: Excellent
- Setup: 1-2 hours

**For Enterprise:**
- Use dedicated queue service (AWS SQS, Google Cloud Tasks, BullMQ)
- Cost: Pay-per-use
- Reliability: Excellent
- Setup: 2-4 hours
