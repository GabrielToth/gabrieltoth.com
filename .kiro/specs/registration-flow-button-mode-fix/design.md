# Registration Flow Button Mode Fix - Bugfix Design

## Overview

This design document addresses a bug in the unified signin form component where clicking "CRIAR CONTA" (Create Account) incorrectly navigates users to the email input step instead of keeping them on the button selection screen with updated registration-specific button texts. Additionally, duplicate privacy policy text appears on the button selection screen in signup mode.

The fix ensures users remain on the button selection screen when switching to registration mode, with button texts updated to show registration variants ("Registre-se com Google", "Registre-se com SSO", "Registre-se com E-mail"), and removes the duplicate privacy policy text.

**Impact**: This fix improves the user experience by allowing users to choose their preferred registration method (Google, SSO, or Email) before proceeding, matching the expected flow for the signin mode.

**Affected Component**: `src/components/auth/unified-signin-form.tsx`

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when "CRIAR CONTA" is clicked or when rendering buttons in signup mode
- **Property (P)**: The desired behavior - staying on button selection screen with updated mode and registration-specific button texts
- **Preservation**: Existing button click behaviors (Google, SSO, Email navigation) and all other authentication flows that must remain unchanged
- **UnifiedSignInForm**: The React component in `src/components/auth/unified-signin-form.tsx` that handles unified authentication
- **step**: State variable determining current UI step ("buttons" | "email" | "password" | "register")
- **mode**: State variable determining authentication mode ("signin" | "signup")

## Bug Details

### Bug Condition

The bug manifests when a user clicks the "CRIAR CONTA" button on the initial button selection screen, or when the component renders the button selection screen in signup mode. The component either navigates away from the button selection screen when it should stay, displays incorrect button texts, or shows duplicate privacy policy text.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserInteraction {
    action: string,           // "click_criar_conta" | "render_buttons"
    currentStep: string,      // "buttons" | "email" | "password"
    currentMode: string       // "signin" | "signup"
  }
  OUTPUT: boolean
  
  RETURN (
    (input.action = "click_criar_conta" AND input.currentStep = "buttons" AND input.currentMode = "signin") OR
    (input.action = "render_buttons" AND input.currentStep = "buttons" AND input.currentMode = "signup")
  )
END FUNCTION
```

### Examples

**Example 1: Create Account Click Navigation Bug**
- **Input**: User clicks "CRIAR CONTA" button (step="buttons", mode="signin")
- **Current Behavior**: Navigates to email input (step="email", mode="signup") ❌
- **Expected Behavior**: Stays on button selection (step="buttons", mode="signup") ✅

**Example 2: Button Text Display Bug**
- **Input**: Rendering button selection screen in signup mode (step="buttons", mode="signup")
- **Current Behavior**: Shows "Entrar com Google", "Entrar com SSO", "Entrar com E-mail" ❌
- **Expected Behavior**: Shows "Registre-se com Google", "Registre-se com SSO", "Registre-se com E-mail" ✅

**Example 3: Duplicate Privacy Policy Bug**
- **Input**: Rendering button selection screen in signup mode (step="buttons", mode="signup")
- **Current Behavior**: Privacy policy text appears twice (after "CRIAR CONTA" button and at bottom) ❌
- **Expected Behavior**: Privacy policy text appears once (only at bottom) ✅

**Example 4: Non-Buggy Input (Email Button Click)**
- **Input**: User clicks "Email" button (step="buttons", mode="signin")
- **Current Behavior**: Navigates to email input (step="email", mode="signin") ✅
- **Expected Behavior**: Same - no change needed ✅

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Email button clicks must continue to navigate to email input step (step="email")
- Google button clicks must continue to initiate Google OAuth flow
- SSO button clicks must continue to initiate SSO authentication flow
- All email input step functionality must remain unchanged
- All password step functionality must remain unchanged
- Mode toggling on email input step must remain unchanged
- Authentication and registration completion flows must remain unchanged
- "Já tem uma conta?" (Have account?) link behavior must remain unchanged
- Privacy policy link navigation must remain unchanged

**Scope:**
All inputs that do NOT involve clicking "CRIAR CONTA" on the button selection screen or rendering the button selection screen in signup mode should be completely unaffected by this fix. This includes:
- Email button clicks and email input flow
- Google OAuth flow
- SSO authentication flow
- Password entry and validation
- Registration form submission
- All navigation between steps (except the buggy "CRIAR CONTA" click)

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Incorrect State Update in "CRIAR CONTA" Handler**: The button click handler sets both `setMode("signup")` and `setStep("email")`, when it should only set `setMode("signup")` and keep `setStep("buttons")`
   - Located in the "Create Account Link" section of the buttons step
   - The handler incorrectly navigates to email step instead of staying on buttons

2. **Missing Conditional Button Text Rendering**: The button texts are hardcoded to signin variants and don't check the `mode` state to conditionally render registration variants
   - Google button always shows `t("signin.googleButton")` instead of checking mode
   - SSO button always shows `t("signin.sso")` instead of checking mode
   - Email button always shows `t("signin.emailButton")` instead of checking mode

3. **Duplicate Privacy Policy Section**: The privacy policy text appears in two places in the JSX structure
   - One instance in the "Create Account Link" section
   - Another instance as a separate "Privacy Policy" section
   - Both render when mode="signup", causing duplication

4. **Missing Translation Keys**: The i18n file may be missing registration-specific button text keys
   - Need to verify `signin.googleSignUpButton`, `signin.ssoSignUp`, `signin.emailSignUpButton` exist
   - These keys are referenced in the code but may not be defined

## Correctness Properties

Property 1: Bug Condition - Create Account Button Stays on Button Selection

_For any_ user interaction where the "CRIAR CONTA" button is clicked on the button selection screen (step="buttons", mode="signin"), the fixed component SHALL update mode to "signup" and keep step as "buttons", allowing users to choose their preferred registration method.

**Validates: Requirements 2.1**

Property 2: Preservation - Non-Create-Account Interactions

_For any_ user interaction that is NOT clicking "CRIAR CONTA" on the button selection screen in signin mode (email button clicks, Google/SSO flows, password steps, etc.), the fixed component SHALL produce exactly the same behavior as the original component, preserving all existing authentication and registration flows.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/auth/unified-signin-form.tsx`

**Function**: `UnifiedSignInForm` component

**Specific Changes**:

1. **Fix "CRIAR CONTA" Button Handler**: Update the onClick handler to only change mode, not step
   - Current code: `onClick={() => { setMode("signup"); setStep("email"); setError(null); }}`
   - Fixed code: `onClick={() => { setMode("signup"); setError(null); }}`
   - Remove `setStep("email")` call to keep user on button selection screen

2. **Add Conditional Button Text Rendering**: Update button text to check mode state
   - Google button: `{mode === "signin" ? t("signin.googleButton") : t("signin.googleSignUpButton")}`
   - SSO button: `{mode === "signin" ? t("signin.sso") : t("signin.ssoSignUp")}`
   - Email button: `{mode === "signin" ? t("signin.emailButton") : t("signin.emailSignUpButton")}`

3. **Remove Duplicate Privacy Policy Section**: Keep only one privacy policy section
   - Remove the privacy policy section that appears in the "Create Account Link" div
   - Keep the separate "Privacy Policy" section at the bottom
   - Ensure it renders in both signin and signup modes

4. **Verify Translation Keys**: Ensure all required translation keys exist in `src/i18n/pt-BR/auth.json`
   - Verify `signin.googleSignUpButton` exists (already exists: "Cadastrar com Google")
   - Verify `signin.ssoSignUp` exists (already exists: "Cadastrar com SSO")
   - Verify `signin.emailSignUpButton` exists (already exists: "Cadastrar com E-mail")

5. **Update "Já tem uma conta?" Link Handler**: Ensure it resets to button selection screen
   - Current code: `onClick={() => { setMode("signin"); setStep("buttons"); setError(null); }}`
   - This is already correct - no change needed

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate clicking "CRIAR CONTA" and rendering the button selection screen in signup mode. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Create Account Click Navigation Test**: Simulate clicking "CRIAR CONTA" button (will fail on unfixed code - navigates to email instead of staying on buttons)
2. **Button Text Display Test**: Render button selection screen in signup mode and verify button texts (will fail on unfixed code - shows signin texts instead of signup texts)
3. **Privacy Policy Duplication Test**: Render button selection screen in signup mode and count privacy policy instances (will fail on unfixed code - shows 2 instead of 1)
4. **Email Button Click Test**: Simulate clicking email button and verify navigation (should pass on unfixed code - this behavior is correct)

**Expected Counterexamples**:
- Clicking "CRIAR CONTA" sets step to "email" instead of keeping it as "buttons"
- Button texts show "Entrar com..." instead of "Registre-se com..."
- Privacy policy text appears twice instead of once
- Possible causes: incorrect state update, missing conditional rendering, duplicate JSX sections

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := UnifiedSignInForm_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Expected Behavior:**
- When "CRIAR CONTA" is clicked: step remains "buttons" AND mode changes to "signup"
- When rendering in signup mode: button texts show registration variants
- When rendering in signup mode: privacy policy appears exactly once

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT UnifiedSignInForm_original(input) = UnifiedSignInForm_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for email button clicks, Google/SSO flows, and other interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Email Button Click Preservation**: Observe that clicking email button navigates to email step on unfixed code, then write test to verify this continues after fix
2. **Google OAuth Preservation**: Observe that clicking Google button initiates OAuth flow on unfixed code, then write test to verify this continues after fix
3. **SSO Flow Preservation**: Observe that clicking SSO button initiates SSO flow on unfixed code, then write test to verify this continues after fix
4. **Password Step Preservation**: Observe that password step functionality works on unfixed code, then write test to verify this continues after fix
5. **Mode Toggle Preservation**: Observe that toggling between signin/signup on email step works on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test "CRIAR CONTA" button click updates mode to "signup" and keeps step as "buttons"
- Test button texts display correctly based on mode (signin vs signup)
- Test privacy policy appears exactly once in signup mode
- Test email button click navigates to email step
- Test Google button click initiates OAuth flow
- Test SSO button click initiates SSO flow
- Test "Já tem uma conta?" link switches to signin mode and button selection screen

### Property-Based Tests

- Generate random user interaction sequences and verify button selection screen behavior
- Generate random mode/step combinations and verify button text rendering
- Test that all non-"CRIAR CONTA" interactions continue to work across many scenarios
- Verify privacy policy count is always 1 regardless of mode

### Integration Tests

- Test full registration flow: button selection → choose method → complete registration
- Test switching between signin and signup modes multiple times
- Test that visual feedback (button texts, privacy policy) updates correctly when mode changes
- Test that all authentication methods (Google, SSO, Email) work in both signin and signup modes
