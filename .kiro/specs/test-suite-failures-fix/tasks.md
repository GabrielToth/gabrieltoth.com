# Implementation Plan: Test Suite Failures Fix

## Overview

This task list implements the systematic fix for 286 failing tests across 79 test files. The approach is phased, addressing root causes first to maximize efficiency.

**Current Status**: 286 tests failing (5.9% failure rate)
**Target**: 0 tests failing (100% pass rate)

---

## Phase 1: Test Infrastructure (Foundation) 🏗️

### Task 1.1: Update vitest.setup.ts
- [ ] Add UTF-8 encoding configuration
  - Set `process.env.LANG = 'en_US.UTF-8'`
  - Set `process.env.LC_ALL = 'en_US.UTF-8'`
- [ ] Add comprehensive Next.js mocking
  - Mock `next/navigation` (useRouter, usePathname, useSearchParams, redirect)
  - Mock `next-intl` (useTranslations, useLocale)
- [ ] Add global mocks
  - Mock `window.matchMedia`
  - Mock `IntersectionObserver`
- [ ] Add cleanup configuration
  - Add `afterEach` cleanup
  - Add `vi.clearAllMocks()` after each test
- [ ] Add test environment variables
  - Set `NEXT_PUBLIC_SITE_URL`
  - Set `DATABASE_URL`
  - Set `NEXTAUTH_SECRET`
  - Set `NEXTAUTH_URL`
- **Verification**: Run `npm run test -- vitest.setup.ts`
- **Expected**: Setup file loads without errors

### Task 1.2: Create .env.test file
- [ ] Create `.env.test` in project root
- [ ] Add database configuration
  - `DATABASE_URL=postgresql://test:test@localhost:5432/test`
  - `DIRECT_URL=postgresql://test:test@localhost:5432/test`
- [ ] Add auth configuration
  - `NEXTAUTH_SECRET=test-secret-key-for-testing-only`
  - `NEXTAUTH_URL=http://localhost:3000`
- [ ] Add API keys (test values)
  - `GOOGLE_CLIENT_ID=test-google-client-id`
  - `GOOGLE_CLIENT_SECRET=test-google-client-secret`
  - `RESEND_API_KEY=test-resend-api-key`
- [ ] Add feature flags
  - `NEXT_PUBLIC_ENABLE_ANALYTICS=false`
  - `NEXT_PUBLIC_ENABLE_MONITORING=false`
- [ ] Add site configuration
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- **Verification**: Check file exists and has all variables
- **Expected**: File created with all required variables

### Task 1.3: Update vitest.config.ts
- [ ] Add UTF-8 encoding support in environmentOptions
  - Add `jsdom.resources = 'usable'`
  - Add `jsdom.url = 'http://localhost:3000'`
- [ ] Increase timeouts for property-based tests
  - Set `testTimeout: 10000`
  - Set `hookTimeout: 10000`
- [ ] Verify existing configuration
  - Confirm `environment: 'jsdom'`
  - Confirm `setupFiles: ['./vitest.setup.ts']`
- **Verification**: Run `npm run test -- --version`
- **Expected**: Vitest runs without configuration errors

### Task 1.4: Create test database helper
- [ ] Create `src/__tests__/helpers/database.ts`
- [ ] Implement `setupTestDatabase()` function
  - Create Supabase client with service role key
  - Clean up test data (users, sessions)
  - Return configured client
- [ ] Implement `createTestUser(email)` function
  - Use admin API to create user
  - Set email_confirm: true
  - Return user object
- [ ] Implement `cleanupTestData()` function
  - Delete all test users
  - Delete all test sessions
  - Reset sequences if needed
- **Verification**: Import and call functions in a test file
- **Expected**: Functions execute without errors

### Task 1.5: Verify Phase 1 completion
- [ ] Run infrastructure tests
  - `npm run test -- vitest.setup.ts`
  - `npm run test -- src/__tests__/helpers/database.ts`
- [ ] Check for configuration errors
- [ ] Verify UTF-8 encoding works
  - Test with Portuguese characters
- [ ] Verify mocks are loaded
- **Expected**: All infrastructure tests pass
- **Checkpoint**: Phase 1 complete, proceed to Phase 2

---

## Phase 2: Component Test Fixes 🧩

### Task 2.1: Fix unified-signin-form.test.tsx (4 failures)
- [ ] Fix character encoding for Portuguese text
  - Replace exact text matches with regex: `/política de privacidade/i`
  - Replace exact text matches with regex: `/criar conta/i`
- [ ] Fix "CRIAR CONTA" button tests
  - Update button text matcher to be case-insensitive
- [ ] Fix privacy policy text test
  - Use `getAllByText` and check length
  - Or use regex matcher
- [ ] Add proper translation mocks
  - Mock all required translation keys
  - Include signup button variants
- **Verification**: `npm run test -- src/components/auth/unified-signin-form.test.tsx`
- **Expected**: All 13 tests pass (currently 9 pass, 4 fail)

### Task 2.2: Fix google-login-button.test.tsx (8 failures)
- [ ] Add Next.js navigation mocks
  - Mock `useRouter` from `next/navigation`
- [ ] Fix OAuth redirect tests
  - Mock `window.location.href`
  - Verify redirect URL format
- [ ] Fix error handling tests
  - Mock error states
  - Verify error callbacks
- [ ] Fix sessionStorage mocks
  - Mock `sessionStorage.setItem`
  - Mock `sessionStorage.getItem`
- **Verification**: `npm run test -- src/components/auth/google-login-button.test.tsx`
- **Expected**: All 8 tests pass

### Task 2.3: Fix register-form.test.tsx (15 failures)
- [ ] Add form submission mocks
  - Mock `fetch` for API calls
  - Mock form validation
- [ ] Fix CSRF token tests
  - Mock CSRF token generation
  - Mock CSRF token validation
- [ ] Fix error display tests
  - Mock server error responses
  - Verify error message display
- [ ] Fix success flow tests
  - Mock successful registration
  - Verify redirect behavior
- **Verification**: `npm run test -- src/components/auth/register-form.test.tsx`
- **Expected**: All 15 tests pass

### Task 2.4: Fix PublishContainer.test.tsx (14 failures)
- [ ] Add data fetching mocks
  - Mock API calls for posts
  - Mock loading states
- [ ] Fix filter tests
  - Mock filtered data
  - Verify filter logic
- [ ] Fix error state tests
  - Mock error responses
  - Verify error display
- [ ] Fix empty state tests
  - Mock empty data
  - Verify empty message
- **Verification**: `npm run test -- src/components/publish/PublishContainer.test.tsx`
- **Expected**: All 16 tests pass (currently 2 pass, 14 fail)

### Task 2.5: Fix ContentCreator.test.tsx (15 failures)
- [ ] Add content creation mocks
  - Mock form submission
  - Mock file upload
- [ ] Fix validation tests
  - Mock validation logic
  - Verify error messages
- [ ] Fix success tests
  - Mock successful creation
  - Verify success message
- [ ] Fix draft tests
  - Mock draft save
  - Verify draft state
- **Verification**: `npm run test -- src/components/publish/ContentCreator.test.tsx`
- **Expected**: All 15 tests pass

### Task 2.6: Fix settings component tests (multiple files)
- [ ] Fix BillingSection.test.tsx (2 failures)
  - Mock billing API calls
  - Fix subscription state tests
- [ ] Fix ProfileSection.test.tsx (2 failures)
  - Mock profile update API
  - Fix success message tests
- [ ] Fix PreferencesSection.test.tsx (3 failures)
  - Mock preferences API
  - Fix toggle tests
- [ ] Fix SecuritySection.test.tsx (1 failure)
  - Mock security settings API
  - Fix password change tests
- [ ] Fix IntegrationsSection.test.tsx (10 failures)
  - Mock integration API calls
  - Fix connection tests
- [ ] Fix ChannelsSection.test.tsx (10 failures)
  - Mock channel API calls
  - Fix channel status tests
- **Verification**: `npm run test -- src/components/settings/*.test.tsx`
- **Expected**: All settings tests pass

### Task 2.7: Fix AuthenticationScreen.test.tsx (35 failures)
- [x] Add comprehensive mocks
  - Mock all authentication providers
  - Mock loading states
  - Mock error states
- [x] Fix button interaction tests
  - Mock button click handlers
  - Verify state changes
- [x] Fix accessibility tests
  - Verify ARIA attributes
  - Verify role attributes
- [x] Fix props handling tests
  - Mock callback props
  - Verify prop passing
- **Verification**: `npm run test -- src/__tests__/components/AuthenticationScreen.test.tsx`
- **Expected**: All 35 tests pass

### Task 2.8: Fix registration component tests
- [ ] Fix ProgressIndicator.test.tsx (1 failure)
  - Fix step display logic
- [ ] Fix ErrorDisplay.test.tsx (2 failures)
  - Fix error message display
- [ ] Fix PasswordSetup.test.tsx (4 failures)
  - Fix password validation
  - Fix strength indicator
- [ ] Fix SuccessMessage.test.tsx (10 failures)
  - Fix success display
  - Fix redirect logic
- **Verification**: `npm run test -- src/__tests__/components/registration/*.test.tsx`
- **Expected**: All registration component tests pass

### Task 2.9: Fix complete-account component tests
- [ ] Fix progress-indicator.test.tsx (4 failures)
  - Fix step progress display
- [ ] Fix password-strength.test.tsx (1 failure)
  - Fix strength calculation
- [ ] Fix step-3-verification.test.tsx (2 failures)
  - Fix verification display
- [ ] Fix step-2-new-fields.test.tsx (1 failure)
  - Fix field validation
- [ ] Fix step-1-prefilled.test.tsx (1 failure)
  - Fix prefilled data display
- [ ] Fix field-editor.test.tsx (3 failures)
  - Fix inline editing
- [ ] Fix data-summary.test.tsx (3 failures)
  - Fix data display
- **Verification**: `npm run test -- src/app/[locale]/auth/complete-account/**/*.test.tsx`
- **Expected**: All complete-account tests pass

### Task 2.10: Fix page coverage tests
- [ ] Fix editors-form-coverage.test.tsx (2 failures)
  - Fix form rendering
- [ ] Fix pc-optimization-terms-page-coverage.test.tsx (1 failure)
  - Fix async Server Component rendering
- [ ] Fix channel-management-section-coverage.test.tsx (1 failure)
  - Fix Portuguese content rendering
- [ ] Fix channel-management-metadata-coverage.test.ts (1 failure)
  - Fix metadata rendering
- [ ] Fix layout-header-coverage.test.tsx (1 failure)
  - Fix header rendering
- [ ] Fix app-not-found-coverage.test.tsx (1 failure)
  - Fix navigation mocking
- **Verification**: `npm run test -- src/__tests__/app/*.test.tsx`
- **Expected**: All page coverage tests pass

### Task 2.11: Verify Phase 2 completion
- [ ] Run all component tests
  - `npm run test -- src/components/**/*.test.tsx`
  - `npm run test -- src/__tests__/components/**/*.test.tsx`
  - `npm run test -- src/app/**/components/**/*.test.tsx`
- [ ] Verify no character encoding errors
- [ ] Verify all mocks working
- **Expected**: ~150 tests now passing
- **Checkpoint**: Phase 2 complete, proceed to Phase 3

---

## Phase 3: Property-Based Test Fixes ⚡

### Task 3.1: Fix useRegistration.test.ts (30 failures)
- [ ] Replace `.filter()` with efficient generators
  - Email validation: use `fc.emailAddress()` or `fc.stringMatching()`
  - Password validation: use `fc.stringMatching()` for patterns
  - Name validation: use `fc.stringMatching()` for alphanumeric
- [ ] Add edge case handling in validation logic
  - Handle whitespace-only strings
  - Handle minimal valid inputs (e.g., "a@a.aa")
  - Handle empty strings
- [ ] Fix session storage tests
  - Mock `sessionStorage` properly
  - Verify data persistence
- [ ] Fix step progression tests
  - Verify validation prevents invalid progression
  - Verify valid data allows progression
- **Verification**: `npm run test -- src/hooks/useRegistration.test.ts`
- **Expected**: All 30 tests pass

### Task 3.2: Fix validation property tests
- [ ] Fix validation-email-property.test.ts (already fixed)
  - Verify all tests still pass
- [ ] Fix registration-password-properties.test.ts (already fixed)
  - Verify all tests still pass
- [ ] Fix validation-password-property.test.ts
  - Replace any remaining `.filter()` usage
  - Add edge case handling
- [ ] Fix validation/registration-form.test.ts (1 failure)
  - Fix form validation logic
- **Verification**: `npm run test -- src/__tests__/lib/validation/*.test.ts`
- **Expected**: All validation tests pass

### Task 3.3: Fix auth property tests
- [ ] Fix user.property.test.ts (2 failures)
  - Fix user data persistence tests
  - Mock database properly
- [ ] Fix account-completion.property.test.ts (1 failure)
  - Fix field validation tests
- [ ] Fix unified-signin.test.ts (3 failures)
  - Fix signin/signup flow tests
- **Verification**: `npm run test -- src/__tests__/lib/auth/*.property.test.ts`
- **Expected**: All auth property tests pass

### Task 3.4: Fix YouTube property tests
- [ ] Fix channel-validation-property.test.ts (already fixed)
  - Verify test still passes
- **Verification**: `npm run test -- src/__tests__/lib/youtube/*.property.test.ts`
- **Expected**: All YouTube property tests pass

### Task 3.5: Verify Phase 3 completion
- [ ] Run all property-based tests
  - `npm run test -- **/*.property.test.ts`
  - `npm run test -- src/hooks/*.test.ts`
- [ ] Verify tests complete in reasonable time (<5 seconds each)
- [ ] Verify no `.filter()` causing hangs
- **Expected**: ~40 tests now passing
- **Checkpoint**: Phase 3 complete, proceed to Phase 4

---

## Phase 4: Database/API Test Fixes 🗄️

### Task 4.1: Fix token-store.test.ts (10 failures)
- [ ] Mock encryption/decryption
  - Mock `encrypt()` function
  - Mock `decrypt()` function
- [ ] Fix database connection
  - Use test database helper
  - Mock Supabase client
- [ ] Fix token storage tests
  - Mock token insertion
  - Mock token retrieval
- [ ] Fix token validation tests
  - Mock expiration checks
  - Mock token existence checks
- **Verification**: `npm run test -- src/lib/token-store/token-store.test.ts`
- **Expected**: All 14 tests pass (currently 4 pass, 10 fail)

### Task 4.2: Fix schema.test.ts (6 failures)
- [ ] Fix schema application
  - Mock schema migration
  - Handle "already exists" errors gracefully
- [ ] Fix constraint tests
  - Mock constraint validation
  - Verify constraint enforcement
- [ ] Fix type tests
  - Mock type validation
  - Verify type enforcement
- **Verification**: `npm run test -- src/lib/db/schema.test.ts`
- **Expected**: All 6 tests pass

### Task 4.3: Fix database constraint tests
- [ ] Fix database-constraints.test.ts
  - Fix user creation
  - Mock auth API properly
- [ ] Fix youtube-channel-linking-schema.test.ts
  - Fix user creation
  - Mock channel linking
- **Verification**: `npm run test -- src/__tests__/database-constraints.test.ts src/__tests__/integration/youtube-channel-linking-schema.test.ts`
- **Expected**: All database constraint tests pass

### Task 4.4: Fix auth API route tests
- [ ] Fix login/route.test.ts (9 failures)
  - Mock authentication logic
  - Mock session creation
  - Fix validation tests
- [ ] Fix register/route.test.ts (2 failures)
  - Mock user creation
  - Mock email verification
- [ ] Fix logout/route.test.ts (2 failures)
  - Mock session deletion
  - Fix error handling
- [ ] Fix me/route.test.ts (7 failures)
  - Mock session retrieval
  - Mock user data retrieval
- [ ] Fix check-email/route.test.ts (5 failures)
  - Mock email existence check
- [ ] Fix verify-email/[token]/route.test.ts (5 failures)
  - Mock token validation
  - Mock email verification
- [ ] Fix send-verification-email/route.test.ts (4 failures)
  - Mock email sending
- **Verification**: `npm run test -- src/app/api/auth/**/*.test.ts`
- **Expected**: All auth API tests pass

### Task 4.5: Fix OAuth callback tests
- [ ] Fix google/callback/route.test.ts (1 failure)
  - Mock Google OAuth flow
  - Mock token exchange
- [ ] Fix oauth/callback/route.test.ts (3 failures)
  - Mock generic OAuth flow
  - Mock session creation
- **Verification**: `npm run test -- src/app/api/auth/*/callback/route.test.ts`
- **Expected**: All OAuth callback tests pass

### Task 4.6: Fix other API route tests
- [ ] Fix health/route.test.ts (3 failures)
  - Mock health check logic
  - Fix uptime calculation
- [ ] Fix youtube/link/start/route.test.ts (3 failures)
  - Mock YouTube API
  - Mock channel linking
- [ ] Fix api-contact-route-branches.test.ts (1 failure)
  - Mock contact form submission
  - Mock email sending
- **Verification**: `npm run test -- src/app/api/**/*.test.ts`
- **Expected**: All API route tests pass

### Task 4.7: Verify Phase 4 completion
- [ ] Run all database tests
  - `npm run test -- src/lib/db/**/*.test.ts`
  - `npm run test -- src/lib/token-store/**/*.test.ts`
  - `npm run test -- src/__tests__/database*.test.ts`
- [ ] Run all API route tests
  - `npm run test -- src/app/api/**/*.test.ts`
- [ ] Verify database connections work
- [ ] Verify mocks are complete
- **Expected**: ~60 tests now passing
- **Checkpoint**: Phase 4 complete, proceed to Phase 5

---

## Phase 5: Security/Misc Test Fixes 🔒

### Task 5.1: Fix security tests
- [ ] Fix login-security.test.ts (2 failures)
  - Fix null byte test (update validation to reject null bytes)
  - Fix unicode test (update validation to handle unicode)
- [ ] Fix bug-condition-login-attempts-rls.test.ts (2 failures)
  - Mock RLS policies
  - Fix login attempt tracking
- [ ] Fix bug-condition-security-definer.test.ts (2 failures)
  - Mock security definer functions
  - Fix function existence checks
- [ ] Fix preservation-database-functions.test.ts (4 failures)
  - Mock database functions
  - Fix preservation checks
- **Verification**: `npm run test -- src/__tests__/security/*.test.ts`
- **Expected**: All security tests pass

### Task 5.2: Fix CSRF validator tests
- [ ] Fix csrf-validator.test.ts (4 failures)
  - Mock token storage
  - Fix invalid token tests
  - Fix non-string token tests
- **Verification**: `npm run test -- src/lib/auth/csrf-validator.test.ts`
- **Expected**: All 21 tests pass (currently 17 pass, 4 fail)

### Task 5.3: Fix environment/config tests
- [ ] Fix env.test.ts (7 failures)
  - Fix missing variable tests
  - Update validation logic to match test expectations
- [ ] Fix local-development-build-preservation.test.ts (2 failures)
  - Mock build process
  - Fix preservation checks
- **Verification**: `npm run test -- src/lib/config/env.test.ts src/__tests__/app/local-development-build-preservation.test.ts`
- **Expected**: All environment tests pass

### Task 5.4: Fix miscellaneous tests
- [ ] Fix rate-limit.test.ts (1 failure)
  - Fix fallback test
  - Mock rate limiter construction
- [ ] Fix observability.test.ts (1 failure)
  - Mock query execution
  - Fix error handling test
- **Verification**: `npm run test -- src/__tests__/lib/rate-limit.test.ts src/lib/observability/observability.test.ts`
- **Expected**: All misc tests pass

### Task 5.5: Fix performance tests
- [ ] Fix login-performance.test.ts (2 failures)
  - Fix response time test
  - Fix failed login test
- **Verification**: `npm run test -- src/__tests__/performance/login-performance.test.ts`
- **Expected**: All 38 tests pass (currently 36 pass, 2 fail)

### Task 5.6: Verify Phase 5 completion
- [ ] Run all security tests
  - `npm run test -- src/__tests__/security/*.test.ts`
- [ ] Run all config tests
  - `npm run test -- src/lib/config/*.test.ts`
- [ ] Run all misc tests
  - `npm run test -- src/__tests__/lib/*.test.ts`
- [ ] Verify all edge cases handled
- **Expected**: ~36 tests now passing
- **Checkpoint**: Phase 5 complete, proceed to final verification

---

## Final Verification & Cleanup 🎯

### Task 6.1: Run complete test suite
- [ ] Run all tests
  - `npm run test`
- [ ] Verify test count
  - Expected: 4,852 tests
  - Expected: 0 failures
  - Expected: 0 skipped
- [ ] Check test duration
  - Expected: <5 minutes total
- **Expected**: All tests pass

### Task 6.2: Verify by category
- [ ] Component tests: `npm run test -- src/components/**/*.test.tsx`
- [ ] Hook tests: `npm run test -- src/hooks/**/*.test.ts`
- [ ] Library tests: `npm run test -- src/lib/**/*.test.ts`
- [ ] API tests: `npm run test -- src/app/api/**/*.test.ts`
- [ ] Integration tests: `npm run test -- src/__tests__/**/*.test.ts`
- **Expected**: All categories pass

### Task 6.3: Clean up and document
- [ ] Remove any temporary test files
- [ ] Update test documentation
- [ ] Document any test patterns established
- [ ] Create test writing guidelines if needed
- **Expected**: Clean test suite with documentation

### Task 6.4: Create GitHub issue
- [ ] Create issue with title: "Fix Test Suite Failures (286 tests)"
- [ ] Add description with:
  - Current status (286 failures)
  - Root causes identified
  - Phased approach summary
  - Link to this spec
- [ ] Add labels: `bug`, `testing`, `high-priority`
- [ ] Assign to appropriate team member
- **Expected**: Issue created and tracked

### Task 6.5: Final checkpoint
- [ ] All 4,852 tests passing ✅
- [ ] 0 skipped tests ✅
- [ ] Test suite completes in <5 minutes ✅
- [ ] No character encoding errors ✅
- [ ] No database connection errors ✅
- [ ] No mocking errors ✅
- [ ] CI/CD pipeline passes ✅
- **Expected**: Test suite fully functional

---

## Notes

- **Estimated Time**: 4-6 hours total
- **Can be split**: Each phase can be done in a separate session
- **Incremental Progress**: Each task can be verified independently
- **Rollback Safe**: Each phase builds on previous, can rollback if needed
- **Documentation**: Update this file as tasks are completed

## Progress Tracking

- [ ] Phase 1: Test Infrastructure (0/5 tasks)
- [ ] Phase 2: Component Tests (0/11 tasks)
- [ ] Phase 3: Property-Based Tests (0/5 tasks)
- [ ] Phase 4: Database/API Tests (0/7 tasks)
- [ ] Phase 5: Security/Misc Tests (0/6 tasks)
- [ ] Final Verification (0/5 tasks)

**Total Progress**: 0/39 tasks completed (0%)

