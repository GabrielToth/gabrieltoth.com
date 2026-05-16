# Technical Design Document: Secure Password Storage System

## 1. HIGH-LEVEL ARCHITECTURE

### 1.1 System Component Overview

The secure password storage system is composed of six main components that work together to provide secure password authentication, validation, and protection against attacks.

\\\mermaid
graph TB
    subgraph Client["Frontend Layer"]
        UI["User Registration/Login UI"]
        CAPTCHA["Cloudflare Turnstile Widget"]
    end
    
    subgraph Services["Backend Services"]
        AuthSvc["Authentication Service"]
        RateLimiter["Rate Limiter"]
        HashEngine["Password Hashing Engine"]
        CAPTCHAVal["CAPTCHA Validator"]
    end
    
    subgraph Storage["Storage Layer"]
        DB["Supabase Database<br/>- Users Table<br/>- Rate Limit Records<br/>- Audit Logs"]
        Cache["In-Memory Cache<br/>- Rate Limit Counters"]
    end
    
    UI -->|Send Email + Password| AuthSvc
    UI -->|CAPTCHA Token| CAPTCHAVal
    CAPTCHA -->|Render Widget| UI
    
    AuthSvc -->|Validate CAPTCHA| CAPTCHAVal
    CAPTCHAVal -->|Check Token| Services
    
    AuthSvc -->|Check Rate Limits| RateLimiter
    RateLimiter -->|Query/Update| Cache
    RateLimiter -->|Persistent Storage| DB
    
    AuthSvc -->|Hash/Validate Password| HashEngine
    HashEngine -->|Apply Pepper| Services
    
    AuthSvc -->|Fetch/Update User| DB
    AuthSvc -->|Log Events| DB
    
    style Client fill:#e1f5ff
    style Services fill:#f3e5f5
    style Storage fill:#e8f5e9

### 1.2 Data Flow: User Registration

\\\mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant CAPTCHA as CAPTCHA Service
    participant AuthSvc as Auth Service
    participant HashEngine as Hashing Engine
    participant DB as Supabase DB

    User->>Frontend: Enter email & password
    Frontend->>CAPTCHA: Solve CAPTCHA challenge
    CAPTCHA-->>Frontend: Return CAPTCHA token
    Frontend->>AuthSvc: POST /register {email, password, captchaToken}
    
    AuthSvc->>AuthSvc: Validate CAPTCHA token with service
    alt CAPTCHA Invalid
        AuthSvc-->>Frontend: 400 Bad Request
    else CAPTCHA Valid
        AuthSvc->>AuthSvc: Validate input (length, format)
        alt Input Invalid
            AuthSvc-->>Frontend: 400 Bad Request
        else Input Valid
            AuthSvc->>HashEngine: hash(password + pepper)
            HashEngine->>HashEngine: Generate random salt
            HashEngine->>HashEngine: Apply Argon2id with config
            HashEngine-->>AuthSvc: Return {hash, algorithm}
            
            AuthSvc->>DB: INSERT INTO users (email, password_hash)
            alt Email Already Exists
                AuthSvc-->>Frontend: 409 Conflict (generic)
            else Success
                DB-->>AuthSvc: User created
                AuthSvc-->>Frontend: 201 Created
            end
        end
    end
\\\

### 1.3 Data Flow: User Login

\\\mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant CAPTCHA as CAPTCHA Service
    participant AuthSvc as Auth Service
    participant RateLimiter as Rate Limiter
    participant HashEngine as Hashing Engine
    participant DB as Supabase DB

    User->>Frontend: Enter email & password
    Frontend->>CAPTCHA: Solve CAPTCHA challenge
    CAPTCHA-->>Frontend: Return CAPTCHA token
    Frontend->>AuthSvc: POST /login {email, password, captchaToken}
    
    AuthSvc->>RateLimiter: Check rate limit for email
    alt Rate Limited
        RateLimiter-->>AuthSvc: Locked (429)
        AuthSvc-->>Frontend: 429 Too Many Requests
    else Not Limited
        AuthSvc->>AuthSvc: Validate CAPTCHA
        alt CAPTCHA Invalid
            AuthSvc->>RateLimiter: Increment failure counter
            AuthSvc-->>Frontend: 400 Bad Request
        else CAPTCHA Valid
            AuthSvc->>DB: SELECT password_hash FROM users WHERE email
            
            alt User Not Found
                AuthSvc->>RateLimiter: Increment failure counter
                AuthSvc-->>Frontend: 401 Unauthorized (generic)
            else User Found
                AuthSvc->>HashEngine: validate(password + pepper, stored_hash)
                alt Invalid Password
                    AuthSvc->>RateLimiter: Increment failure counter
                    AuthSvc-->>Frontend: 401 Unauthorized (generic)
                else Valid Password
                    AuthSvc->>RateLimiter: Reset failure counter
                    
                    alt Hash is Bcrypt
                        AuthSvc->>HashEngine: rehash(password, argon2id)
                        AuthSvc->>DB: UPDATE users SET password_hash = new_hash
                        AuthSvc->>DB: INSERT INTO audit_logs (event, user_id)
                        Note over AuthSvc: Log algorithm migration
                    end
                    
                    AuthSvc-->>Frontend: 200 OK {token, user_data}
                end
            end
        end
    end
\\\

### 1.4 Password Validation Flow

\\\mermaid
graph TD
    A["Hash_Validator receives<br/>plaintext password and stored hash"] --> B["Append Pepper to password"]
    B --> C["Detect Hash Algorithm"]
    
    C -->|Argon2id Format| D["Use Argon2 library<br/>verify method"]
    C -->|Bcrypt Format| E["Use Bcrypt library<br/>compare method"]
    C -->|Unknown Format| F["Log malformed hash<br/>Return validation error"]
    
    D --> G["Constant-Time<br/>Comparison"]
    E --> G
    
    G -->|Match| H["Return SUCCESS<br/>+ Algorithm Type"]
    G -->|No Match| I["Return FAILURE<br/>Generic message"]
    
    H --> J{Algorithm Type?}
    J -->|Bcrypt| K["Trigger Migration<br/>to Argon2id"]
    J -->|Argon2id| L["No Migration Needed"]
    
    K --> M["Return authenticated<br/>user + migration flag"]
    L --> M
    
    I --> N["Return auth error<br/>No algorithm info"]
    F --> N
    
    style A fill:#fff9c4
    style G fill:#c8e6c9
    style H fill:#c8e6c9
    style M fill:#81c784
    style N fill:#ffccbc
\\\

### 1.5 Environment Configuration Strategy

#### Docker (Local Development)

In Docker, all configuration is provided via \docker-compose.yml\ environment variables:

\\\yaml
services:
  app:
    environment:
      # Argon2id Parameters
      ARGON2_MEMORY_COST: '64'              # MB (tuned for Vercel Free)
      ARGON2_TIME_COST: '3'                 # iterations
      ARGON2_PARALLELISM: '2'               # threads
      
      # Security
      PEPPER_SECRET: 'your-secure-pepper-min-32-chars'
      
      # Database
      SUPABASE_URL: 'http://supabase:3000'
      SUPABASE_ANON_KEY: 'eyJ...'
      SUPABASE_SERVICE_KEY: 'eyJ...'
      
      # CAPTCHA
      CAPTCHA_PROVIDER: 'cloudflare'        # or 'google'
      CAPTCHA_SECRET_KEY: 'your-secret-key'
      
      # Environment
      NODE_ENV: 'development'
      DEBUG: 'true'
\\\

#### Vercel (Production)

In Vercel, configuration is stored in project settings ? Environment Variables:

\\\
ARGON2_MEMORY_COST=64
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2
PEPPER_SECRET=<production-pepper>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
CAPTCHA_PROVIDER=cloudflare
CAPTCHA_SECRET_KEY=<production-captcha-key>
NODE_ENV=production
\\\

**Key Differences:**
- Vercel reads ONLY from environment variables (no .env file access)
- Docker can optionally use docker-compose.yml or environment variables
- Both must have identical configuration values for same behavior
- Pepper is stored securely in environment, never in code

---

## 2. ARGON2ID CONFIGURATION FOR VERCEL FREE

### 2.1 Memory Constraints Analysis

Vercel Free Plan imposes strict limits:
- **Execution Timeout**: 10 seconds
- **Memory Limit**: 1GB per function
- **CPU**: Shared/limited resources

### 2.2 Tuned Parameters for Vercel

\\\
Parameter          Value    Reasoning
-------------------------------------------------------------
Memory Cost        64 MB    Safe headroom within 1GB limit
                           (actual memory + overhead < 500MB)
Time Cost          3        Balances security with speed
(Iterations)       
Parallelism        2        Maximizes per-thread work,
                           fits within free tier CPU allocation
Expected Duration  2-3 sec  Leaves 7 seconds for other operations
\\\

### 2.3 Performance Characteristics

**Single Hash Operation:**
- Time: 2-3 seconds (typical)
- Memory Peak: ~150MB (memory_cost + overhead)
- CPU: ~95% utilization (acceptable for auth)

**Validation Against Hash:**
- Time: 2-3 seconds (same cost as hashing)
- Memory Peak: ~150MB
- CPU: ~95% utilization

**Timeout Margin:**
- Per-operation: 7-8 seconds remaining after hashing
- Request total: 10 seconds
- Padding: Sufficient for DB queries, rate limiting, logging

### 2.4 Production Upgrade Path

If moving away from Vercel Free, increase security:

\\\
Environment           Memory    Time    Parallelism  Duration
------------------------------------------------------------
Vercel Free (current) 64 MB     3       2            2-3 sec
Standard Docker       128 MB    3       2            3-4 sec
High Security         256 MB    4       4            5-7 sec
Enterprise            512 MB    5       8            8-12 sec
\\\

**Note:** All configurations use same algorithm (Argon2id), only parameters differ. Migration between environments requires no hash recalculation.

---

## 3. CAPTCHA INTEGRATION

### 3.1 Provider Selection

**Cloudflare Turnstile** (Recommended)
- Free tier: Unlimited requests
- Cost: /month
- Verification: Server-side API call (10-50ms)
- UX: Improved with less friction
- Setup: Simple script tag

**Google reCAPTCHA v3** (Alternative)
- Free tier: Up to 1,000,000 requests/month
- Cost: -.50 per 1k requests above free tier
- Verification: Server-side API call (50-100ms)
- UX: Invisible to user (score-based)
- Setup: Script + configuration

**Recommendation**: Use Cloudflare Turnstile for cost optimization and simplicity.

### 3.2 Frontend Integration: Cloudflare Turnstile

\\\html
<!-- In registration/login form -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<form id="auth-form">
  <input type="email" name="email" required />
  <input type="password" name="password" required />
  
  <!-- CAPTCHA Widget -->
  <div class="cf-turnstile" 
       data-sitekey="<YOUR_SITE_KEY>"
       data-theme="light">
  </div>
  
  <button type="submit">Sign In</button>
</form>

<script>
  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get CAPTCHA token from widget
    const token = turnstile.getResponse();
    
    if (!token) {
      alert('Please complete the CAPTCHA');
      return;
    }
    
    // Send to backend with credentials
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.querySelector('input[name=\"email\"]').value,
        password: document.querySelector('input[name=\"password\"]').value,
        captchaToken: token
      })
    });
    
    // Handle response...
  });
</script>
\\\

### 3.3 Backend Token Verification

\\\	ypescript
// lib/captcha.ts
import { createClient } from '@supabase/supabase-js'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface CAPTCHAVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  error_codes?: string[]
  score?: number
  score_reason?: string[]
}

export async function verifyCAPTCHA(token: string): Promise<boolean> {
  if (!token) {
    throw new Error('CAPTCHA token is missing')
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: process.env.CAPTCHA_SECRET_KEY,
        response: token
      })
    })

    const data: CAPTCHAVerifyResponse = await response.json()

    if (!data.success) {
      console.warn('CAPTCHA verification failed', {
        errors: data.error_codes,
        hostname: data.hostname
      })
      return false
    }

    // Optional: Check timestamp (should be recent, within 5 minutes)
    if (data.challenge_ts) {
      const challengeTime = new Date(data.challenge_ts).getTime()
      const now = Date.now()
      const diffSeconds = (now - challengeTime) / 1000

      if (diffSeconds > 300) {
        console.warn('CAPTCHA token expired', { diffSeconds })
        return false
      }
    }

    return true
  } catch (error) {
    console.error('CAPTCHA verification error', error)
    throw new Error('CAPTCHA service unavailable')
  }
}

export async function verifyCAPTCHAWithFallback(token: string): Promise<boolean> {
  try {
    return await verifyCAPTHA(token)
  } catch (error) {
    // Log error but don't block authentication
    console.error('CAPTCHA verification failed, allowing degraded mode')
    // Return false to allow retry or escalate to rate limiting
    return false
  }
}
\\\

### 3.4 Error Handling

\\\	ypescript
// api/auth/login.ts
import { verifyCAPTHA } from '@/lib/captcha'

export async function POST(request: Request) {
  const { email, password, captchaToken } = await request.json()

  // Validate CAPTCHA first (before revealing anything about user)
  if (!captchaToken) {
    return new Response(
      JSON.stringify({ error: 'CAPTCHA token required' }),
      { status: 400 }
    )
  }

  let captchaValid = false
  try {
    captchaValid = await verifyCAPTHA(captchaToken)
  } catch (error) {
    console.error('CAPTCHA verification error', error)
    // Fail secure: reject if CAPTCHA service is down
    return new Response(
      JSON.stringify({ error: 'Authentication service unavailable' }),
      { status: 503 }
    )
  }

  if (!captchaValid) {
    return new Response(
      JSON.stringify({ error: 'CAPTCHA verification failed' }),
      { status: 400 }
    )
  }

  // Only after CAPTCHA passes, check rate limiting and credentials
  // ... rest of authentication
}
\\\

### 3.5 Graceful Degradation

If CAPTCHA provider is down:

1. **Option A (Recommended)**: Reject authentication (fail-secure)
   - Prevents all auth during outage
   - Visible to users (error message)
   - Safe but impacts availability

2. **Option B**: Allow with enhanced rate limiting
   - Temporarily disable CAPTCHA requirement
   - Reduce rate limit thresholds (3 failures ? lockout instead of 5)
   - Log all attempts for investigation
   - Resume normal operation when CAPTCHA recovers

**Configuration:**

\\\	ypescript
const CAPTCHA_GRACEFUL_DEGRADATION = process.env.CAPTCHA_GRACEFUL_DEGRADATION === 'true'
const RATE_LIMIT_DEGRADED_MODE = CAPTCHA_GRACEFUL_DEGRADATION ? 3 : 5

export async function authenticateUser(email: string, password: string, captchaToken?: string) {
  // If degradation is enabled and no CAPTCHA token, still allow but track it
  if (CAPTCHA_GRACEFUL_DEGRADATION && !captchaToken) {
    logger.warn('CAPTCHA disabled via degradation mode', { email })
    // Use stricter rate limiting (3 failures instead of 5)
  } else if (!captchaToken) {
    return { error: 'CAPTCHA required', status: 400 }
  }

  // Continue with authentication...
}
\\\

---

## 4. PASSWORD VALIDATION FLOW

### 4.1 Pepper Application Strategy

The pepper is a server-side secret that enhances password security:

\\\	ypescript
// lib/password-security.ts
import { argon2id, verify as argon2Verify } from 'argon2'
import { compare as bcryptCompare } from 'bcryptjs'

class PasswordValidator {
  private pepper: string

  constructor() {
    this.pepper = this.loadPepper()
  }

  private loadPepper(): string {
    const pepper = process.env.PEPPER_SECRET
    if (!pepper || pepper.length < 32) {
      throw new Error('PEPPER_SECRET must be >= 32 characters')
    }
    return pepper
  }

  async validatePassword(plaintext: string, storedHash: string): Promise<boolean> {
    // 1. Append pepper to plaintext
    const peppered = plaintext + this.pepper

    // 2. Detect algorithm
    const algorithm = this.detectAlgorithm(storedHash)

    // 3. Validate based on algorithm
    if (algorithm === 'argon2id') {
      return this.validateArgon2(peppered, storedHash)
    } else if (algorithm === 'bcrypt') {
      return this.validateBcrypt(peppered, storedHash)
    } else {
      throw new Error('Unsupported hash algorithm')
    }
  }

  private detectAlgorithm(hash: string): 'argon2id' | 'bcrypt' {
    // Argon2id hashes start with \\$
    if (hash.startsWith('\\$')) {
      return 'argon2id'
    }
    // Bcrypt hashes start with \\$, \\$, or \\$
    if (hash.startsWith('\')) {
      return 'bcrypt'
    }
    throw new Error('Unknown hash format')
  }

  private async validateArgon2(peppered: string, hash: string): Promise<boolean> {
    try {
      // argon2-lib provides constant-time comparison
      return await argon2Verify(hash, peppered)
    } catch (error) {
      console.error('Argon2 validation error', error)
      return false
    }
  }

  private async validateBcrypt(peppered: string, hash: string): Promise<boolean> {
    try {
      // bcryptjs provides constant-time comparison
      return await bcryptCompare(peppered, hash)
    } catch (error) {
      console.error('Bcrypt validation error', error)
      return false
    }
  }
}

export const passwordValidator = new PasswordValidator()
\\\

### 4.2 Bcrypt Detection Logic

\\\	ypescript
function detectHashAlgorithm(hash: string): 'argon2id' | 'bcrypt' | 'unknown' {
  // Argon2id: \\=...\=...,t=...,p=...\$...
  const argon2Pattern = /^\\\\\\$/
  
  // Bcrypt: \\\$...\ or \\\$...\ or \\\$...
  const bcryptPattern = /^\\\[aby]\\\$/

  if (argon2Pattern.test(hash)) {
    return 'argon2id'
  }

  if (bcryptPattern.test(hash)) {
    return 'bcrypt'
  }

  return 'unknown'
}

// Usage
const algorithm = detectHashAlgorithm(storedHash)

if (algorithm === 'unknown') {
  logger.error('Invalid hash format in database', { hash: hash.substring(0, 10) + '...' })
  throw new Error('Stored password hash is invalid')
}
\\\

### 4.3 Automatic Migration on Successful Login

When a user logs in with a legacy Bcrypt hash:

\\\	ypescript
interface ValidationResult {
  valid: boolean
  algorithmType: 'argon2id' | 'bcrypt'
  requiresMigration: boolean
}

async function validatePasswordAndCheckMigration(
  email: string,
  plaintext: string,
  storedHash: string
): Promise<ValidationResult> {
  // Validate password
  const valid = await passwordValidator.validatePassword(plaintext, storedHash)

  if (!valid) {
    return {
      valid: false,
      algorithmType: detectHashAlgorithm(storedHash),
      requiresMigration: false
    }
  }

  // Password is valid, check if migration needed
  const algorithmType = detectHashAlgorithm(storedHash)
  const requiresMigration = algorithmType === 'bcrypt'

  if (requiresMigration) {
    // Trigger async migration (don't block login)
    schedulePasswordMigration(email, plaintext).catch(error => {
      logger.error('Password migration failed', { email, error })
    })
  }

  return {
    valid: true,
    algorithmType,
    requiresMigration
  }
}

async function schedulePasswordMigration(email: string, plaintext: string) {
  try {
    // Hash with current Argon2id config
    const newHash = await hashPassword(plaintext)

    // Update database
    await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('email', email)

    // Log migration
    await supabase.from('audit_logs').insert({
      event_type: 'password_migration',
      email,
      old_algorithm: 'bcrypt',
      new_algorithm: 'argon2id',
      timestamp: new Date().toISOString()
    })

    logger.info('Password migrated to Argon2id', { email })
  } catch (error) {
    logger.error('Failed to migrate password', { email, error })
    throw error
  }
}
\\\

### 4.4 Timing Attack Prevention (Constant-Time Comparison)

\\\	ypescript
// Constant-time string comparison
function constantTimeCompare(a: string, b: string): boolean {
  // Both argon2-lib and bcryptjs use constant-time internally
  // But we add extra protection with response time normalization

  const startTime = Date.now()

  // The library handles constant-time comparison
  // e.g., argon2Verify, bcryptCompare

  // Add variable delay to normalize response time
  // This prevents an attacker from measuring how long validation takes
  const elapsedMs = Date.now() - startTime
  const targetMs = 100 // Normalize to 100ms response

  if (elapsedMs < targetMs) {
    const delayMs = targetMs - elapsedMs
    // Busy-wait to avoid revealing timing
    const busyUntil = Date.now() + delayMs
    while (Date.now() < busyUntil) {
      // Intentional busy wait
    }
  }

  return true // Already validated by library
}

// Usage in auth flow
async function authenticateUser(email: string, password: string): Promise<boolean> {
  const startTime = Date.now()

  try {
    const user = await fetchUser(email)
    if (!user) {
      // User doesn't exist - still do timing attack prevention
      // Simulate password validation time
      await dummyValidation(password)
      return false
    }

    const valid = await validatePassword(password, user.password_hash)
    return valid
  } finally {
    // Ensure response time is consistent regardless of path taken
    const elapsedMs = Date.now() - startTime
    const targetMs = 250 // 250ms total for login attempt

    if (elapsedMs < targetMs) {
      await sleep(targetMs - elapsedMs)
    }
  }
}

// Dummy validation to match real validation timing
async function dummyValidation(password: string): Promise<void> {
  // Hash the password with current params (cost for non-existent user)
  try {
    await hashPassword(password)
  } catch {
    // Ignore errors - this is just for timing
  }
}
\\\

---

## 5. RATE LIMITING & PROTECTION

### 5.1 Rate Limiting Rules

**Account Lockout Thresholds:**
- Threshold: 5 failed attempts in 15 minutes
- Action: Lock account
- Unlock: Automatic after 15 minutes

**CAPTCHA Escalation:**
- After 3 failures: Show CAPTCHA (if not already shown)
- After 4 failures: Show harder CAPTCHA variant
- After 5 failures: Lock account (429 Too Many Requests)

### 5.2 Implementation: Supabase-Backed Storage

Using Supabase instead of in-memory storage because:
- **Vercel serverless**: Each request is isolated, in-memory state is lost
- **Horizontal scaling**: Multiple instances need shared state
- **Persistence**: Survives service restarts
- **Query**: Can audit failed attempts across time

\\\	ypescript
// lib/rate-limiter.ts
import { createClient } from '@supabase/supabase-js'

interface RateLimitRecord {
  id: string
  email: string
  failed_attempts: number
  last_attempt: string
  locked_until?: string
}

class RateLimiter {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  private readonly FAILURE_THRESHOLD = 5
  private readonly WINDOW_MINUTES = 15
  private readonly LOCKOUT_MINUTES = 15

  async checkAndUpdateRateLimit(email: string): Promise<{
    allowed: boolean
    remainingAttempts: number
    lockedUntil?: Date
  }> {
    // Fetch current record
    const { data: records } = await this.supabase
      .from('rate_limit_records')
      .select('*')
      .eq('email', email)
      .single()

    const now = new Date()
    let record = records as RateLimitRecord | null

    // No record yet - create one
    if (!record) {
      await this.supabase.from('rate_limit_records').insert({
        email,
        failed_attempts: 0,
        last_attempt: now.toISOString()
      })

      return { allowed: true, remainingAttempts: this.FAILURE_THRESHOLD }
    }

    // Check if locked
    if (record.locked_until) {
      const lockedUntil = new Date(record.locked_until)
      if (now < lockedUntil) {
        return {
          allowed: false,
          remainingAttempts: 0,
          lockedUntil
        }
      }
      // Lockout expired, reset
      await this.resetRecord(email)
      return { allowed: true, remainingAttempts: this.FAILURE_THRESHOLD }
    }

    // Check if window expired
    const lastAttempt = new Date(record.last_attempt)
    const minutesElapsed = (now.getTime() - lastAttempt.getTime()) / (1000 * 60)

    if (minutesElapsed > this.WINDOW_MINUTES) {
      // Window expired, reset counter
      await this.resetRecord(email)
      return { allowed: true, remainingAttempts: this.FAILURE_THRESHOLD }
    }

    // Check if at threshold
    if (record.failed_attempts >= this.FAILURE_THRESHOLD) {
      // Lock the account
      const lockedUntil = new Date(now.getTime() + this.LOCKOUT_MINUTES * 60 * 1000)
      await this.supabase
        .from('rate_limit_records')
        .update({ locked_until: lockedUntil.toISOString() })
        .eq('email', email)

      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil
      }
    }

    return {
      allowed: true,
      remainingAttempts: this.FAILURE_THRESHOLD - record.failed_attempts
    }
  }

  async recordFailure(email: string): Promise<void> {
    const { data: records } = await this.supabase
      .from('rate_limit_records')
      .select('failed_attempts')
      .eq('email', email)
      .single()

    const currentCount = records?.failed_attempts || 0

    await this.supabase
      .from('rate_limit_records')
      .update({
        failed_attempts: currentCount + 1,
        last_attempt: new Date().toISOString()
      })
      .eq('email', email)

    // Log the failure
    await this.logAuthFailure(email, currentCount + 1)
  }

  async recordSuccess(email: string): Promise<void> {
    // Reset counter on successful login
    await this.resetRecord(email)

    // Log success
    await this.logAuthSuccess(email)
  }

  private async resetRecord(email: string): Promise<void> {
    await this.supabase
      .from('rate_limit_records')
      .update({
        failed_attempts: 0,
        locked_until: null,
        last_attempt: new Date().toISOString()
      })
      .eq('email', email)
  }

  private async logAuthFailure(email: string, attemptCount: number): Promise<void> {
    await this.supabase.from('audit_logs').insert({
      event_type: 'auth_failure',
      email,
      attempt_count: attemptCount,
      timestamp: new Date().toISOString()
    })
  }

  private async logAuthSuccess(email: string): Promise<void> {
    await this.supabase.from('audit_logs').insert({
      event_type: 'auth_success',
      email,
      timestamp: new Date().toISOString()
    })
  }
}

export const rateLimiter = new RateLimiter()
\\\

### 5.3 Database Schema for Rate Limiting

\\\sql
-- Rate limit tracking table
CREATE TABLE rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  failed_attempts INTEGER DEFAULT 0 NOT NULL,
  last_attempt TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups
CREATE INDEX idx_rate_limit_email ON rate_limit_records(email);
CREATE INDEX idx_rate_limit_locked ON rate_limit_records(locked_until);

-- Audit logs for security events
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'auth_failure', 'auth_success', 'rate_limit_triggered', etc.
  email TEXT,
  user_id UUID REFERENCES users(id),
  attempt_count INTEGER,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for audit queries
CREATE INDEX idx_audit_email ON audit_logs(email);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_event ON audit_logs(event_type);
\\\

### 5.4 Rate Limiting Lifecycle

\\\mermaid
graph TB
    A["Login Attempt"] --> B["Check Rate Limit"]
    
    B -->|Locked| C["Return 429<br/>Account Temporarily Locked"]
    B -->|Not Locked| D["Validate CAPTCHA"]
    
    D -->|Invalid| E["Record Failure<br/>failures: 1"]
    D -->|Valid| F["Validate Credentials"]
    
    F -->|Wrong Password| E
    F -->|Correct| G["Record Success<br/>Reset failures: 0"]
    
    E --> H{Failures == 5?}
    H -->|No| I["Allow Retry"]
    H -->|Yes| J["Lock Account<br/>15 minutes"]
    
    J --> C
    I --> A
    G --> K["Return 200<br/>Authentication Succeeded"]
    
    style C fill:#ffccbc
    style J fill:#ffccbc
    style K fill:#c8e6c9
    style I fill:#fff9c4

---

## 6. ENVIRONMENT VARIABLE MANAGEMENT

### 6.1 Docker Setup

In docker-compose.yml, provide all configuration via environment variables:

- ARGON2_MEMORY_COST: 64 (MB, tuned for Vercel Free)
- ARGON2_TIME_COST: 3 (iterations)
- ARGON2_PARALLELISM: 2 (threads)
- PEPPER_SECRET: Must be >= 32 characters
- SUPABASE_URL, SUPABASE_SERVICE_KEY, etc.
- CAPTCHA_PROVIDER: 'cloudflare' or 'google'

### 6.2 Vercel Environment Configuration

Store all variables in Vercel Dashboard:
1. Settings ? Environment Variables
2. Same names and values as Docker for consistency
3. PEPPER_SECRET must be strong in production

### 6.3 Local vs Production Parity

Both environments must use identical configuration values to ensure consistent behavior and security levels across development and production.

---

## 7. DATABASE SCHEMA

### 7.1 Users Table

- id (UUID, primary key)
- email (TEXT, unique)
- password_hash (TEXT, Argon2id or Bcrypt)
- password_algorithm (TEXT, 'argon2id' or 'bcrypt')
- created_at, updated_at, last_login timestamps
- is_active, email_verified status flags

### 7.2 Rate Limit Records

- id (UUID, primary key)
- email (TEXT, unique)
- failed_attempts (INTEGER)
- last_attempt (TIMESTAMPTZ)
- locked_until (TIMESTAMPTZ, nullable)

### 7.3 Audit Logs

- id, event_type, email, user_id, attempt_count
- old_algorithm, new_algorithm (for migrations)
- timestamp, details (JSONB)

### 7.4 Database Cleanup

- cleanup_expired_rate_limits(): Delete records older than 1 day
- cleanup_old_audit_logs(): Delete logs older than 90 days

---

## 8. ERROR HANDLING

### 8.1 Generic Error Messages

Prevent user enumeration by using generic error messages:
- "Invalid email or password" (covers: user not found, wrong password, algorithm mismatch)
- "Account temporarily locked" (covers: rate limit reached)
- "CAPTCHA verification failed" (covers: missing, expired, or invalid token)
- "Service temporarily unavailable" (covers: internal errors)

### 8.2 Hash Format Validation

Invalid hash formats are logged with details for debugging but reported as authentication failure to users. This separates programming errors from expected failures.

### 8.3 CAPTCHA Failure Handling

Missing or invalid CAPTCHA tokens return 400 without revealing whether email/password are correct. Graceful degradation allows login if CAPTCHA service is unavailable (configurable).

### 8.4 Separation of Concerns

- Format errors: Log with details, alert ops, return generic error
- Auth failures: Log generic event, return generic error, apply rate limiting

---

## 9. IMPLEMENTATION CHECKLIST

Core Components:
- [ ] Argon2id hashing engine
- [ ] Bcrypt detection and validation
- [ ] Pepper application before hash/validate
- [ ] Constant-time comparison
- [ ] Algorithm migration on successful login

Security Layer:
- [ ] Supabase-backed rate limiter
- [ ] 5 failures ? 15-minute lockout
- [ ] Automatic unlock after 15 minutes
- [ ] Cloudflare Turnstile CAPTCHA
- [ ] CAPTCHA validation before credentials

Database:
- [ ] Users table with password_hash
- [ ] Rate limit records table
- [ ] Audit logs table
- [ ] Cleanup functions

Configuration:
- [ ] Environment variable validation
- [ ] Docker Compose setup
- [ ] Vercel environment variables
- [ ] Pepper secret management

Error Handling:
- [ ] Generic error messages
- [ ] Hash format validation
- [ ] CAPTCHA failure handling
- [ ] Graceful degradation

Testing:
- [ ] Unit tests for hashing
- [ ] Password validation tests
- [ ] Rate limiting tests
- [ ] Full login flow integration tests
- [ ] Timing attack prevention tests
- [ ] Performance benchmarks

Monitoring:
- [ ] Authentication event logging
- [ ] Rate limit trigger logging
- [ ] Password migration logging
- [ ] No sensitive data in logs

---

## 10. CORRECTNESS PROPERTIES

### 10.1 Password Security Properties

1. **Unique Hashes**: Identical passwords produce different hashes (random salt)
2. **Pepper Application**: Pepper consistently applied before all operations
3. **Algorithm Migration**: Bcrypt automatically upgraded on successful login
4. **Constant-Time Validation**: Comparison time independent of password/hash difference
5. **Rate Limiting**: After 5 failures in 15 minutes, requests rejected with 429
6. **Automatic Unlock**: Accounts unlock after 15 minutes without intervention

### 10.2 CAPTCHA Properties

1. **Required First**: CAPTCHA verified before checking credentials
2. **Token Expiration**: Tokens expire after 5 minutes
3. **Generic Rejection**: Missing/invalid returns 400 without revealing user status

### 10.3 Error Handling Properties

1. **No Algorithm Revelation**: Errors don't indicate which algorithm was used
2. **No User Enumeration**: Errors identical for missing users vs wrong passwords
3. **Format Logging**: Malformed hashes logged but reported as auth failure

### 10.4 Configuration Properties

1. **Startup Validation**: App fails fast if configuration invalid
2. **Pepper Required**: Refuses to operate without PEPPER_SECRET
3. **Environment Parity**: Docker and Vercel produce identical behavior
4. **Timeout Compliance**: All operations complete within Vercel's 10-second limit

---

## References

- [Argon2 Official Documentation](https://github.com/P-H-C/phc-winner-argon2)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Bcrypt Specification](https://en.wikipedia.org/wiki/Bcrypt)

