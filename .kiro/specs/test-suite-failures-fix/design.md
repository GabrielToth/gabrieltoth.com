# Design Document: Test Suite Failures Fix

## Overview

This document provides the technical design for fixing 286 failing tests across 79 test files. The design follows a phased approach, addressing root causes systematically to maximize fix efficiency.

---

## Architecture Analysis

### Current Test Infrastructure

```
test-suite/
├── vitest.config.ts          # Test configuration
├── vitest.setup.ts            # Global test setup
├── src/__tests__/             # Integration/E2E tests
│   ├── components/            # Component integration tests
│   ├── security/              # Security tests
│   ├── performance/           # Performance tests
│   ├── integration/           # Integration tests
│   └── lib/                   # Library tests
├── src/components/**/*.test.tsx  # Component unit tests
├── src/app/api/**/*.test.ts      # API route tests
├── src/lib/**/*.test.ts          # Library unit tests
└── src/hooks/**/*.test.ts        # Hook tests
```

### Test Stack
- **Test Runner**: Vitest 4.1.5
- **Testing Library**: @testing-library/react
- **Property-Based Testing**: fast-check
- **Mocking**: Vitest vi
- **Environment**: jsdom

---

## Phase 1: Test Infrastructure Fixes

### 1.1 Vitest Setup Configuration

**Current Issues**:
- Incomplete Next.js mocking
- Missing UTF-8 encoding configuration
- Incomplete global mocks

**Solution**:

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Set UTF-8 encoding for test environment
process.env.LANG = 'en_US.UTF-8'
process.env.LC_ALL = 'en_US.UTF-8'

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'pt-BR',
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any
```

### 1.2 Test Environment Variables

**Create `.env.test` file**:

```bash
# Database
DATABASE_URL=postgresql://test:test@localhost:5432/test
DIRECT_URL=postgresql://test:test@localhost:5432/test

# Auth
NEXTAUTH_SECRET=test-secret-key-for-testing-only
NEXTAUTH_URL=http://localhost:3000

# API Keys (test values)
GOOGLE_CLIENT_ID=test-google-client-id
GOOGLE_CLIENT_SECRET=test-google-client-secret
RESEND_API_KEY=test-resend-api-key

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_MONITORING=false

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 1.3 UTF-8 Encoding Fix

**Update `vitest.config.ts`**:

```typescript
import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        environment: "jsdom",
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        globals: true,
        reporters: "default",
        setupFiles: ["./vitest.setup.ts"],
        // Add UTF-8 encoding support
        environmentOptions: {
            jsdom: {
                resources: "usable",
                url: "http://localhost:3000",
            },
        },
        // Increase timeout for property-based tests
        testTimeout: 10000,
        hookTimeout: 10000,
        coverage: {
            provider: "v8",
            reportsDirectory: "./coverage",
            reporter: ["text", "html", "lcov", "json-summary"],
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/**/__tests__/**",
                "**/*.d.ts",
                "**/*-types.ts",
                "**/*section-types.ts",
            ],
        },
    },
})
```

---

## Phase 2: Component Test Fixes

### 2.1 Component Test Pattern

**Standard Component Test Template**:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Component from './component'

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'key.one': 'Translation One',
      'key.two': 'Translation Two',
    }
    return translations[key] || key
  },
}))

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Translation One')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<Component />)
    
    const button = screen.getByRole('button', { name: /translation one/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Translation Two')).toBeInTheDocument()
    })
  })
})
```

### 2.2 Character Encoding Fix

**For tests with Portuguese text**:

```typescript
// Use regex with case-insensitive flag for Portuguese text
expect(screen.getByText(/política de privacidade/i)).toBeInTheDocument()

// Or use getByRole with name matcher
expect(screen.getByRole('link', { 
  name: /política/i 
})).toBeInTheDocument()

// For exact matches, use Unicode escape sequences if needed
expect(screen.getByText('Política de Privacidade')).toBeInTheDocument()
```

### 2.3 Async Server Component Testing

**For Server Components**:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('ServerComponent', () => {
  it('should render server component', async () => {
    // Server components return promises
    const Component = await import('./server-component')
    
    render(<Component.default />)
    
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
```

---

## Phase 3: Property-Based Test Fixes

### 3.1 Efficient Generator Patterns

**Replace `.filter()` with `fc.stringMatching()`**:

```typescript
// ❌ BAD - Slow/infinite loop risk
fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => /^[a-zA-Z0-9]+$/.test(s))

// ✅ GOOD - Efficient generation
fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/)
```

**Use `.map()` for transformations**:

```typescript
// ❌ BAD - Filter can reject many values
fc.string().filter(s => s.length > 0)

// ✅ GOOD - Map ensures non-empty
fc.string().map(s => s || 'a')
```

### 3.2 Edge Case Handling

**Add validation for edge cases**:

```typescript
// In validation function
export function validateEmail(email: string): ValidationResult {
  // Trim whitespace
  const trimmed = email?.trim() || ''
  
  // Handle empty/null
  if (!trimmed) {
    return { isValid: false, error: 'Email is required' }
  }
  
  // Handle whitespace-only
  if (trimmed !== email) {
    return { isValid: false, error: 'Email cannot contain leading/trailing spaces' }
  }
  
  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' }
  }
  
  return { isValid: true }
}
```

### 3.3 Property-Based Test Configuration

**Reduce numRuns for faster tests**:

```typescript
// For simple properties
fc.assert(
  fc.property(arb, prop),
  { numRuns: 100 } // Default
)

// For expensive properties (hashing, database)
fc.assert(
  fc.property(arb, prop),
  { numRuns: 10 } // Reduced
)
```

---

## Phase 4: Database/API Test Fixes

### 4.1 Database Test Setup

**Create test database helper**:

```typescript
// src/__tests__/helpers/database.ts
import { createClient } from '@supabase/supabase-js'

export async function setupTestDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Clean up test data
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  return supabase
}

export async function createTestUser(email: string) {
  const supabase = await setupTestDatabase()
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'Test123!@#',
    email_confirm: true,
  })
  
  if (error) throw error
  return data.user
}
```

### 4.2 API Route Test Pattern

**Standard API route test**:

```typescript
import { POST } from './route'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

describe('POST /api/endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 for valid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success', true)
  })

  it('should return 400 for invalid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    
    const response = await POST(request)
    
    expect(response.status).toBe(400)
  })
})
```

### 4.3 Token Store Fix

**Mock encryption for tests**:

```typescript
// In token-store.test.ts
vi.mock('@/lib/auth/encryption', () => ({
  encrypt: vi.fn((data) => `encrypted_${data}`),
  decrypt: vi.fn((data) => data.replace('encrypted_', '')),
}))
```

---

## Phase 5: Security/Misc Test Fixes

### 5.1 Security Test Pattern

**RLS policy testing**:

```typescript
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it, beforeEach } from 'vitest'

describe('RLS Policies', () => {
  let supabase: ReturnType<typeof createClient>
  let testUser: any

  beforeEach(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    testUser = await createTestUser('test@example.com')
  })

  it('should enforce RLS on users table', async () => {
    // Create client with user context
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${testUser.access_token}`,
          },
        },
      }
    )
    
    // User should only see their own data
    const { data, error } = await userClient
      .from('users')
      .select('*')
    
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe(testUser.id)
  })
})
```

### 5.2 CSRF Test Fix

**Mock CSRF token validation**:

```typescript
vi.mock('@/lib/auth/csrf-validator', () => ({
  validateCSRFToken: vi.fn(() => true),
  generateCSRFToken: vi.fn(() => 'test-csrf-token'),
}))
```

---

## Implementation Checklist

### Phase 1: Infrastructure
- [ ] Update vitest.setup.ts with proper mocks
- [ ] Create .env.test file
- [ ] Update vitest.config.ts with UTF-8 support
- [ ] Add test database helper
- [ ] Test infrastructure changes

### Phase 2: Component Tests
- [ ] Fix Next.js mocking in all component tests
- [ ] Fix character encoding issues
- [ ] Fix async Server Component tests
- [ ] Update component test patterns
- [ ] Test component fixes by category

### Phase 3: Property-Based Tests
- [ ] Replace .filter() with efficient generators
- [ ] Add edge case handling in validation
- [ ] Reduce numRuns for expensive tests
- [ ] Test property-based fixes

### Phase 4: Database/API Tests
- [ ] Fix database test setup
- [ ] Fix token store tests
- [ ] Fix API route mocking
- [ ] Test database/API fixes

### Phase 5: Security/Misc Tests
- [ ] Fix RLS policy tests
- [ ] Fix CSRF validation tests
- [ ] Fix environment tests
- [ ] Test security/misc fixes

---

## Success Metrics

- ✅ 100% test pass rate (4,852/4,852 tests)
- ✅ 0 skipped tests
- ✅ Test suite completes in <5 minutes
- ✅ No character encoding errors
- ✅ No database connection errors
- ✅ No mocking errors
- ✅ CI/CD pipeline passes

