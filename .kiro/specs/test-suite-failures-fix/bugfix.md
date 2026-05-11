# Bugfix Requirements Document: Test Suite Failures

## Introduction

This document describes the systematic fix for 286 failing tests across 79 test files in the test suite. The failures fall into several categories that need to be addressed systematically.

**Impact**: Test suite failures prevent CI/CD from passing, reduce confidence in code changes, and hide real bugs.

**Test Suite Status**:
- **Total Test Files**: 372
- **Passing Test Files**: 293 (78.8%)
- **Failing Test Files**: 79 (21.2%)
- **Total Tests**: 4,852
- **Passing Tests**: 4,464 (92.0%)
- **Failing Tests**: 286 (5.9%)
- **Skipped Tests**: 102 (2.1%)

---

## Bug Analysis

### Current Behavior (Defect Categories)

#### Category 1: Component Test Failures (Highest Priority)
**Files Affected**: ~35 test files
**Common Issues**:
- Missing or incorrect mocks for Next.js components (next-intl, next/navigation)
- Character encoding issues with Portuguese text (UTF-8 encoding problems)
- Missing React Testing Library setup
- Async rendering issues with Server Components

**Example Files**:
- `src/components/auth/unified-signin-form.test.tsx` (4 failed)
- `src/components/auth/google-login-button.test.tsx` (8 failed)
- `src/components/auth/register-form.test.tsx` (15 failed)
- `src/components/publish/PublishContainer.test.tsx` (14 failed)
- `src/components/publish/ContentCreator.test.tsx` (15 failed)
- `src/components/settings/*.test.tsx` (multiple files)
- `src/__tests__/components/AuthenticationScreen.test.tsx` (35 failed)

#### Category 2: Property-Based Test Failures (High Priority)
**Files Affected**: ~10 test files
**Common Issues**:
- `.filter()` usage causing infinite loops or slow generation
- Edge cases not handled (whitespace-only strings, minimal valid inputs)
- Validation logic not matching test expectations

**Example Files**:
- `src/hooks/useRegistration.test.ts` (30 failed)
- `src/__tests__/lib/validation/registration-form.test.ts` (1 failed)
- `src/__tests__/components/registration/*.test.tsx` (multiple files)

#### Category 3: Database/Token Store Failures (High Priority)
**Files Affected**: ~8 test files
**Common Issues**:
- Database connection/setup issues
- Token encryption/decryption failures
- Missing test database schema
- User creation failures (AuthApiError: User not allowed)

**Example Files**:
- `src/lib/token-store/token-store.test.ts` (10 failed)
- `src/lib/db/schema.test.ts` (6 failed)
- `src/__tests__/database-constraints.test.ts` (failures)
- `src/__tests__/integration/youtube-channel-linking-schema.test.ts` (failures)

#### Category 4: API Route Test Failures (Medium Priority)
**Files Affected**: ~15 test files
**Common Issues**:
- Missing request/response mocks
- Authentication/session mocking issues
- CSRF token validation failures
- Missing environment variables in test environment

**Example Files**:
- `src/app/api/auth/login/route.test.ts` (9 failed)
- `src/app/api/auth/register/route.test.ts` (2 failed)
- `src/app/api/auth/logout/route.test.ts` (2 failed)
- `src/app/api/auth/me/route.test.ts` (7 failed)
- `src/app/api/auth/check-email/route.test.ts` (5 failed)
- `src/app/api/auth/verify-email/[token]/route.test.ts` (5 failed)
- `src/app/api/auth/send-verification-email/route.test.ts` (4 failed)
- `src/app/api/auth/google/callback/route.test.ts` (1 failed)
- `src/app/api/auth/oauth/callback/route.test.ts` (3 failed)
- `src/app/api/health/route.test.ts` (3 failed)
- `src/app/api/youtube/link/start/route.test.ts` (3 failed)

#### Category 5: Security Test Failures (Medium Priority)
**Files Affected**: ~5 test files
**Common Issues**:
- RLS (Row Level Security) policy test failures
- Security definer function test failures
- Login attempt tracking failures
- CSRF validation test failures

**Example Files**:
- `src/__tests__/security/login-security.test.ts` (2 failed)
- `src/__tests__/security/bug-condition-login-attempts-rls.test.ts` (2 failed)
- `src/__tests__/security/bug-condition-security-definer.test.ts` (2 failed)
- `src/__tests__/security/preservation-database-functions.test.ts` (4 failed)
- `src/lib/auth/csrf-validator.test.ts` (4 failed)

#### Category 6: Environment/Configuration Failures (Low Priority)
**Files Affected**: ~3 test files
**Common Issues**:
- Missing environment variables in test environment
- Configuration validation failures

**Example Files**:
- `src/lib/config/env.test.ts` (7 failed)
- `src/__tests__/app/local-development-build-preservation.test.ts` (2 failed)

#### Category 7: Miscellaneous Failures (Low Priority)
**Files Affected**: ~3 test files
**Common Issues**:
- Navigation mocking issues
- Rate limiting test failures
- Observability test failures

**Example Files**:
- `src/__tests__/app/app-not-found-coverage.test.tsx` (1 failed)
- `src/__tests__/lib/rate-limit.test.ts` (1 failed)
- `src/lib/observability/observability.test.ts` (1 failed)

---

## Expected Behavior (Correct)

### Category 1: Component Tests
**WHEN** component tests are run **THEN** they SHALL:
- Properly mock Next.js dependencies (next-intl, next/navigation)
- Handle Portuguese characters correctly (UTF-8 encoding)
- Render components without errors
- Handle async Server Components correctly
- Pass all assertions

### Category 2: Property-Based Tests
**WHEN** property-based tests are run **THEN** they SHALL:
- Use efficient generators (avoid `.filter()` chains)
- Handle edge cases (empty strings, whitespace, minimal valid inputs)
- Complete within reasonable time (<5 seconds per test)
- Generate valid test cases consistently

### Category 3: Database/Token Store Tests
**WHEN** database tests are run **THEN** they SHALL:
- Connect to test database successfully
- Create test users without errors
- Encrypt/decrypt tokens correctly
- Apply schema migrations successfully
- Clean up test data after each test

### Category 4: API Route Tests
**WHEN** API route tests are run **THEN** they SHALL:
- Mock HTTP requests/responses correctly
- Handle authentication/session mocking
- Validate CSRF tokens correctly
- Use test environment variables
- Return expected status codes and responses

### Category 5: Security Tests
**WHEN** security tests are run **THEN** they SHALL:
- Validate RLS policies correctly
- Test security definer functions
- Track login attempts accurately
- Validate CSRF tokens
- Prevent SQL injection and XSS attacks

### Category 6: Environment/Configuration Tests
**WHEN** configuration tests are run **THEN** they SHALL:
- Validate required environment variables
- Handle missing variables gracefully
- Provide clear error messages

### Category 7: Miscellaneous Tests
**WHEN** miscellaneous tests are run **THEN** they SHALL:
- Mock navigation correctly
- Test rate limiting accurately
- Monitor observability metrics

---

## Root Cause Analysis

### Primary Root Causes

1. **Incomplete Test Setup** (40% of failures)
   - Missing or incorrect mocks for Next.js 15 components
   - Incomplete vitest.setup.ts configuration
   - Missing test environment variables

2. **Character Encoding Issues** (15% of failures)
   - UTF-8 encoding not properly configured in test environment
   - Portuguese characters (á, é, í, ó, ú, ã, õ, ç) rendering incorrectly

3. **Property-Based Test Anti-Patterns** (15% of failures)
   - Overuse of `.filter()` causing slow/infinite generation
   - Edge cases not handled in validation logic

4. **Database Test Configuration** (15% of failures)
   - Test database not properly initialized
   - Missing schema migrations in test environment
   - User creation permissions issues

5. **API Mocking Issues** (10% of failures)
   - Incomplete request/response mocking
   - Missing authentication context in tests

6. **Async/Await Issues** (5% of failures)
   - Server Components not properly awaited in tests
   - Missing `act()` wrappers for state updates

---

## Fix Strategy

### Phase 1: Test Infrastructure (Foundation)
**Goal**: Fix test setup and configuration issues that affect multiple test files

**Tasks**:
1. Update `vitest.setup.ts` with proper mocks and configuration
2. Fix UTF-8 encoding in test environment
3. Add missing test environment variables
4. Configure test database properly
5. Update test utilities and helpers

**Expected Impact**: Fixes ~30-40% of failures

### Phase 2: Component Tests (Highest Volume)
**Goal**: Fix component test failures systematically

**Tasks**:
1. Fix Next.js mocking (next-intl, next/navigation)
2. Fix character encoding in component tests
3. Fix async rendering issues
4. Update component test patterns

**Expected Impact**: Fixes ~35 test files, ~150 tests

### Phase 3: Property-Based Tests
**Goal**: Fix property-based test failures

**Tasks**:
1. Replace `.filter()` with efficient generators
2. Add edge case handling in validation logic
3. Update property-based test patterns

**Expected Impact**: Fixes ~10 test files, ~40 tests

### Phase 4: Database/API Tests
**Goal**: Fix database and API route test failures

**Tasks**:
1. Fix database test setup
2. Fix token store tests
3. Fix API route mocking
4. Fix authentication mocking

**Expected Impact**: Fixes ~20 test files, ~60 tests

### Phase 5: Security/Misc Tests
**Goal**: Fix remaining test failures

**Tasks**:
1. Fix security test failures
2. Fix environment/configuration tests
3. Fix miscellaneous test failures

**Expected Impact**: Fixes ~14 test files, ~36 tests

---

## Success Criteria

**WHEN** all fixes are applied **THEN**:
- ✅ All 372 test files pass (100%)
- ✅ All 4,852 tests pass (100%)
- ✅ No skipped tests (0 skipped)
- ✅ Test suite completes in <5 minutes
- ✅ CI/CD pipeline passes
- ✅ No character encoding issues
- ✅ No database connection issues
- ✅ No mocking issues

---

## Testing Approach

### Chunk-Based Testing Strategy

**Phase 1 Verification**:
```bash
npm run test -- vitest.setup.ts
npm run test -- src/__tests__/lib/validation-email-property.test.ts
```

**Phase 2 Verification** (Component Tests - by category):
```bash
# Auth components
npm run test -- src/components/auth/*.test.tsx

# Settings components
npm run test -- src/components/settings/*.test.tsx

# Publish components
npm run test -- src/components/publish/*.test.tsx

# Registration components
npm run test -- src/__tests__/components/registration/*.test.tsx
```

**Phase 3 Verification** (Property-Based Tests):
```bash
npm run test -- src/hooks/useRegistration.test.ts
npm run test -- src/__tests__/lib/validation/*.test.ts
```

**Phase 4 Verification** (Database/API Tests):
```bash
npm run test -- src/lib/token-store/*.test.ts
npm run test -- src/lib/db/*.test.ts
npm run test -- src/app/api/**/*.test.ts
```

**Phase 5 Verification** (Security/Misc Tests):
```bash
npm run test -- src/__tests__/security/*.test.ts
npm run test -- src/lib/config/*.test.ts
```

**Final Verification**:
```bash
npm run test
```

---

## Notes

- This is a systematic fix approach that addresses root causes first
- Each phase builds on the previous phase
- Chunk-based testing allows for incremental progress verification
- Expected total time: 4-6 hours of focused work
- Can be split across multiple sessions

