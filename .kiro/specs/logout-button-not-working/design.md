# Logout Button Not Working - Bugfix Design

## Overview

The logout button in the dashboard sidebar is non-functional because the `DashboardLayout` component does not pass the required `onLogout` prop to the `Sidebar` component. When users click the logout button, the `onClick` handler receives `undefined`, resulting in no action. This fix will implement a logout handler in `DashboardLayout` that follows the existing pattern from `GoogleLogoutButton`: sending a POST request to `/api/auth/logout` and redirecting to the login page on success.

The fix is minimal and targeted - it only adds the missing prop connection without modifying the logout API, sidebar UI, or any other functionality. The implementation will reuse the proven logout flow that already works in `GoogleLogoutButton`.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user clicks the logout button in the dashboard sidebar
- **Property (P)**: The desired behavior when logout button is clicked - session cleared, cookies removed, redirect to login page
- **Preservation**: Existing logout functionality in `GoogleLogoutButton` and `/api/auth/logout` API that must remain unchanged
- **DashboardLayout**: The component in `src/components/dashboard/DashboardLayout.tsx` that wraps the dashboard and renders the Sidebar
- **Sidebar**: The component in `src/components/dashboard/Sidebar.tsx` that displays navigation and the logout button
- **onLogout prop**: Optional callback prop on Sidebar that is invoked when the logout button is clicked
- **GoogleLogoutButton**: Working logout implementation in `src/components/auth/google-logout-button.tsx` that serves as reference
- **logout API**: The endpoint at `/api/auth/logout` that clears sessions and cookies

## Bug Details

### Bug Condition

The bug manifests when a logged-in user clicks the logout button in the dashboard sidebar. The `DashboardLayout` component renders the `Sidebar` but does not provide the `onLogout` prop, resulting in the logout button having an `onClick` handler that calls `undefined`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type MouseEvent (click on logout button)
  OUTPUT: boolean
  
  RETURN input.target IS logout_button
         AND user.isAuthenticated IS true
         AND Sidebar.props.onLogout IS undefined
         AND logout_button.onClick() calls undefined
END FUNCTION
```

### Examples

- **Desktop Sidebar**: User clicks "🚪 Logout" button in desktop sidebar → No action occurs, user remains logged in
- **Mobile Sidebar**: User opens mobile sidebar, clicks "🚪 Logout" button → No action occurs, user remains logged in
- **After Navigation**: User navigates to Settings tab, clicks logout button → No action occurs, user remains logged in
- **Expected Behavior**: User clicks logout button → POST to `/api/auth/logout` → Cookies cleared → Redirect to login page

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The `GoogleLogoutButton` component must continue to work exactly as before (POST to `/api/auth/logout`, redirect to login)
- The `/api/auth/logout` API endpoint must continue to clear sessions and cookies correctly
- Mouse clicks on navigation buttons (Publish, Insights, Settings) must continue to work
- Sidebar open/close functionality on mobile must continue to work
- Organization information display must continue to work
- Channel connection buttons must continue to work
- All visual styling and layout must remain unchanged

**Scope:**
All inputs that do NOT involve clicking the logout button in the dashboard sidebar should be completely unaffected by this fix. This includes:
- Navigation between dashboard tabs
- Opening/closing the mobile sidebar
- Clicking channel connection buttons
- Using the `GoogleLogoutButton` component elsewhere in the app
- Direct API calls to `/api/auth/logout`

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **Missing Prop Connection**: The `DashboardLayout` component renders `<Sidebar />` without passing the `onLogout` prop
   - `Sidebar` component defines `onLogout?: () => void` as an optional prop
   - When undefined, the logout button's `onClick={onLogout}` calls undefined
   - No error is thrown because the prop is optional

2. **No Logout Handler Implementation**: The `DashboardLayout` component does not implement a logout handler function
   - No function exists to send POST request to `/api/auth/logout`
   - No redirect logic after successful logout
   - The component only handles tab changes and sidebar open/close

3. **Working Reference Implementation Exists**: The `GoogleLogoutButton` component demonstrates the correct pattern
   - Sends POST to `/api/auth/logout`
   - Handles loading state
   - Handles errors
   - Redirects to login page on success

4. **API is Fully Functional**: The `/api/auth/logout` endpoint works correctly
   - Clears session from database
   - Clears authentication cookies
   - Returns success response
   - Logs audit events

## Correctness Properties

Property 1: Bug Condition - Logout Button Triggers Logout Flow

_For any_ click event on the logout button in the dashboard sidebar where the user is authenticated, the fixed DashboardLayout component SHALL send a POST request to `/api/auth/logout`, clear the session and cookies, and redirect the user to the login page.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Existing Logout Functionality

_For any_ logout action that does NOT use the dashboard sidebar logout button (such as GoogleLogoutButton or direct API calls), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing logout functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct (missing prop connection):

**File**: `src/components/dashboard/DashboardLayout.tsx`

**Function**: `DashboardLayout` component

**Specific Changes**:

1. **Import Dependencies**: Add necessary imports for logout functionality
   - Import `useRouter` from `next/navigation` for redirect
   - Import `useState` for loading/error state management
   - Import `logger` from `@/lib/logger` for logging (following GoogleLogoutButton pattern)

2. **Create Logout Handler**: Implement `handleLogout` function following GoogleLogoutButton pattern
   - Add loading state: `const [isLoggingOut, setIsLoggingOut] = useState(false)`
   - Create async function that sends POST to `/api/auth/logout`
   - Handle response and errors
   - Log success/failure
   - Redirect to login page on success using `router.push('/login')`

3. **Pass Prop to Sidebar**: Connect the logout handler to Sidebar component
   - Add `onLogout={handleLogout}` to both desktop and mobile Sidebar instances
   - Ensure the prop is passed in both places (desktop and mobile render the same component)

4. **Error Handling**: Add error handling following GoogleLogoutButton pattern
   - Catch fetch errors
   - Log errors using logger
   - Optionally display error to user (can use toast or console for now)

5. **Loading State**: Optionally disable logout button during logout process
   - Pass loading state to Sidebar if needed
   - Or handle loading state within the handler

### Implementation Pattern

The implementation will follow this pattern from `GoogleLogoutButton`:

```typescript
const router = useRouter()
const [isLoggingOut, setIsLoggingOut] = useState(false)

const handleLogout = async () => {
    try {
        setIsLoggingOut(true)
        
        const response = await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || "Logout failed")
        }

        logger.info("User logged out successfully", {
            context: "Dashboard",
        })

        router.push("/login")
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        logger.error("Logout error", {
            context: "Dashboard",
            error,
        })
        // Optionally show error to user
    } finally {
        setIsLoggingOut(false)
    }
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that clicking the logout button does nothing on unfixed code.

**Test Plan**: Write tests that simulate clicking the logout button in the dashboard sidebar and assert that the logout flow is triggered. Run these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **Desktop Logout Button Click**: Render DashboardLayout, find logout button in desktop sidebar, click it (will fail on unfixed code - no action occurs)
2. **Mobile Logout Button Click**: Render DashboardLayout with mobile sidebar open, find logout button, click it (will fail on unfixed code - no action occurs)
3. **Logout API Not Called**: Click logout button and verify `/api/auth/logout` is NOT called (will pass on unfixed code, confirming the bug)
4. **No Redirect Occurs**: Click logout button and verify user stays on dashboard page (will pass on unfixed code, confirming the bug)

**Expected Counterexamples**:
- Logout button click does not trigger any network request
- No redirect to login page occurs
- User remains authenticated after clicking logout button
- Console shows no errors (because undefined is called silently)

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (clicking logout button), the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleLogout_fixed(input)
  ASSERT POST_request_sent_to("/api/auth/logout")
  ASSERT cookies_cleared()
  ASSERT redirect_to("/login")
END FOR
```

**Test Cases**:
1. **Desktop Logout Success**: Click logout button in desktop sidebar → POST sent → Redirect to login
2. **Mobile Logout Success**: Click logout button in mobile sidebar → POST sent → Redirect to login
3. **Logout After Tab Change**: Navigate to Settings, click logout → POST sent → Redirect to login
4. **Logout API Error Handling**: Mock API error → Error logged → User informed
5. **Loading State**: Click logout → Button disabled during request → Re-enabled after completion

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (other interactions), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT DashboardLayout_original(input) = DashboardLayout_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-logout interactions

**Test Plan**: Observe behavior on UNFIXED code first for navigation and other interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Navigation Preservation**: Verify clicking Publish/Insights/Settings tabs continues to work correctly
2. **Mobile Sidebar Preservation**: Verify opening/closing mobile sidebar continues to work
3. **Organization Display Preservation**: Verify organization info displays correctly
4. **Channel Buttons Preservation**: Verify channel connection buttons continue to work
5. **GoogleLogoutButton Preservation**: Verify GoogleLogoutButton component continues to work independently
6. **Direct API Preservation**: Verify direct calls to `/api/auth/logout` continue to work

### Unit Tests

- Test logout button click triggers POST to `/api/auth/logout`
- Test successful logout redirects to `/login`
- Test logout API error is handled gracefully
- Test loading state during logout process
- Test logout works in both desktop and mobile sidebar
- Test logout works after navigating between tabs

### Property-Based Tests

- Generate random user interactions (tab changes, sidebar toggles) and verify logout still works
- Generate random authentication states and verify logout only works when authenticated
- Generate random API responses and verify error handling is robust
- Test that all non-logout interactions produce identical results before and after fix

### Integration Tests

- Test full logout flow: authenticated user → click logout → session cleared → redirect to login
- Test logout from different dashboard tabs (Publish, Insights, Settings)
- Test logout on mobile and desktop viewports
- Test logout with network errors and retries
- Test that after logout, accessing dashboard redirects to login (session validation)
