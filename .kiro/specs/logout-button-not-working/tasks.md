# Implementation Plan - Logout Button Not Working

## Overview

This implementation plan follows the bugfix requirements-first workflow using the bug condition methodology. The tasks are ordered to:
1. Write exploratory tests to confirm the bug exists (Property 1: Bug Condition)
2. Write preservation tests to capture existing behavior (Property 2: Preservation)
3. Implement the fix with understanding from steps 1-2
4. Verify the fix works and doesn't break anything

---

## Phase 1: Exploratory Testing (Bug Condition)

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Logout Button Click Does Not Trigger Logout Flow
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to the concrete failing case: clicking logout button in dashboard sidebar
  - Test implementation details from Bug Condition in design:
    - Render DashboardLayout component
    - Locate logout button in Sidebar (both desktop and mobile)
    - Simulate click event on logout button
    - Assert that POST request is sent to `/api/auth/logout`
    - Assert that redirect to login page occurs
  - The test assertions should match the Expected Behavior Properties from design (Requirements 2.1, 2.2, 2.3, 2.4)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Logout button click does not trigger any network request
    - No redirect to login page occurs
    - User remains on dashboard page
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

---

## Phase 2: Preservation Testing (Non-Buggy Behavior)

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Logout Dashboard Interactions Continue to Work
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-logout interactions:
    - Clicking Publish/Insights/Settings navigation buttons works correctly
    - Mobile sidebar open/close functionality works correctly
    - Organization information displays correctly
    - Channel connection buttons are clickable
    - GoogleLogoutButton component works independently
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Navigation between tabs changes active tab correctly
    - Sidebar toggle on mobile opens/closes sidebar
    - Organization info displays with correct name and plan
    - All sidebar elements render without errors
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

---

## Phase 3: Implementation

- [x] 3. Fix for logout button not working in dashboard sidebar

  - [x] 3.1 Implement the logout handler in DashboardLayout
    - Import `useRouter` from `next/navigation` for redirect functionality
    - Import `useState` for managing loading/error state during logout
    - Import `logger` from `@/lib/logger` for logging (following GoogleLogoutButton pattern)
    - Create `handleLogout` async function that:
      - Sets loading state to true
      - Sends POST request to `/api/auth/logout` with proper headers
      - Checks response status and throws error if not ok
      - Logs success message using logger.info
      - Redirects to `/login` page on success using router.push
      - Catches and logs errors using logger.error
      - Sets loading state to false in finally block
    - Pass `onLogout={handleLogout}` prop to Sidebar component (both desktop and mobile instances)
    - Ensure logout handler follows the same pattern as GoogleLogoutButton for consistency
    - _Bug_Condition: isBugCondition(input) where input is click on logout button in dashboard sidebar_
    - _Expected_Behavior: POST to /api/auth/logout, clear cookies, redirect to /login_
    - _Preservation: Navigation, sidebar toggle, organization display, channel buttons continue to work_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Logout Button Click Triggers Logout Flow
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that:
      - POST request is sent to `/api/auth/logout`
      - Redirect to login page occurs
      - Session is cleared
      - Cookies are removed
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Logout Dashboard Interactions Continue to Work
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify that:
      - Navigation between tabs still works
      - Mobile sidebar toggle still works
      - Organization info still displays
      - Channel buttons still work
      - All sidebar elements render correctly
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

---

## Phase 4: Validation

- [x] 4. Checkpoint - Ensure all tests pass
  - Run complete test suite: `npm run test`
  - Verify bug condition exploration test passes
  - Verify preservation tests pass
  - Verify no other tests were broken by the changes
  - Verify build passes: `npm run build`
  - Verify TypeScript types are correct: `npm run type-check`
  - Verify code formatting: `npm run format`
  - Verify linting: `npm run lint:fix`
  - Document any issues or questions that arose during implementation
  - Mark complete when all tests pass and build succeeds

---

## Test File Locations

- **Exploration Test**: `src/__tests__/bugfix/logout-button-exploration.test.tsx`
- **Preservation Tests**: `src/__tests__/bugfix/logout-button-preservation.test.tsx`
- **Implementation**: `src/components/dashboard/DashboardLayout.tsx`

---

## Key References

- **Bug Condition Specification**: `.kiro/specs/logout-button-not-working/bugfix.md` - Requirements 1.1, 1.2, 1.3
- **Expected Behavior**: `.kiro/specs/logout-button-not-working/bugfix.md` - Requirements 2.1, 2.2, 2.3, 2.4
- **Preservation Requirements**: `.kiro/specs/logout-button-not-working/bugfix.md` - Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
- **Design Document**: `.kiro/specs/logout-button-not-working/design.md`
- **Reference Implementation**: `src/components/auth/google-logout-button.tsx`
- **Component to Modify**: `src/components/dashboard/DashboardLayout.tsx`
- **Sidebar Component**: `src/components/dashboard/Sidebar.tsx`

---

## Implementation Notes

### Bug Condition (C)
User clicks logout button in dashboard sidebar while authenticated, but `DashboardLayout` does not pass `onLogout` prop to `Sidebar`, resulting in no action.

### Expected Behavior (P)
POST request sent to `/api/auth/logout`, session cleared, cookies removed, user redirected to login page.

### Preservation (¬C)
All other dashboard interactions (navigation, sidebar toggle, organization display, channel buttons) continue to work exactly as before.

### Root Cause
Missing prop connection: `DashboardLayout` renders `Sidebar` without passing the required `onLogout` prop.

### Fix Pattern
Implement `handleLogout` function in `DashboardLayout` following `GoogleLogoutButton` pattern and pass it as `onLogout` prop to `Sidebar`.
