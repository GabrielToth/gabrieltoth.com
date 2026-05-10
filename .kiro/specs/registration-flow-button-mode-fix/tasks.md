# Implementation Plan

## Overview

This task list implements the fix for the registration flow button mode bug where clicking "CRIAR CONTA" incorrectly navigates to email input instead of staying on button selection screen with updated button texts.

**Affected Component**: `src/components/auth/unified-signin-form.tsx`

---

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Create Account Button Navigation and Button Text Display
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design:
    - When "CRIAR CONTA" is clicked (step="buttons", mode="signin"), verify step remains "buttons" and mode changes to "signup"
    - When rendering button selection screen in signup mode (step="buttons", mode="signup"), verify button texts show registration variants: "Registre-se com Google", "Registre-se com SSO", "Registre-se com E-mail"
    - When rendering button selection screen in signup mode, verify privacy policy appears exactly once
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Clicking "CRIAR CONTA" sets step to "email" instead of keeping it as "buttons"
    - Button texts show "Entrar com..." instead of "Registre-se com..."
    - Privacy policy text appears twice instead of once
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Create-Account Interactions
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Email button click navigates to email step (step="email")
    - Google button click initiates Google OAuth flow
    - SSO button click initiates SSO authentication flow
    - Password step functionality works correctly
    - Mode toggling on email input step works correctly
    - "Já tem uma conta?" link switches to signin mode and button selection screen
    - Privacy policy link navigation works correctly
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test cases:
    - Email button click preservation: verify navigation to email step continues to work
    - Google OAuth preservation: verify Google button initiates OAuth flow
    - SSO flow preservation: verify SSO button initiates SSO flow
    - Password step preservation: verify password step functionality continues to work
    - Mode toggle preservation: verify toggling between signin/signup on email step continues to work
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix for registration flow button mode bug

  - [x] 3.1 Implement the fix in unified-signin-form.tsx
    - Fix "CRIAR CONTA" button handler: Remove `setStep("email")` call to keep user on button selection screen
      - Current code: `onClick={() => { setMode("signup"); setStep("email"); setError(null); }}`
      - Fixed code: `onClick={() => { setMode("signup"); setError(null); }}`
    - Add conditional button text rendering based on mode state:
      - Google button: `{mode === "signin" ? t("signin.googleButton") : t("signin.googleSignUpButton")}`
      - SSO button: `{mode === "signin" ? t("signin.sso") : t("signin.ssoSignUp")}`
      - Email button: `{mode === "signin" ? t("signin.emailButton") : t("signin.emailSignUpButton")}`
    - Remove duplicate privacy policy section:
      - Remove the privacy policy section that appears in the "Create Account Link" div
      - Keep the separate "Privacy Policy" section at the bottom
      - Ensure it renders in both signin and signup modes
    - Verify translation keys exist in `src/i18n/pt-BR/auth.json`:
      - `signin.googleSignUpButton` (should be "Cadastrar com Google")
      - `signin.ssoSignUp` (should be "Cadastrar com SSO")
      - `signin.emailSignUpButton` (should be "Cadastrar com E-mail")
    - _Bug_Condition: isBugCondition(input) where (input.action = "click_criar_conta" AND input.currentStep = "buttons" AND input.currentMode = "signin") OR (input.action = "render_buttons" AND input.currentStep = "buttons" AND input.currentMode = "signup")_
    - _Expected_Behavior: When "CRIAR CONTA" is clicked, step remains "buttons" AND mode changes to "signup". When rendering in signup mode, button texts show registration variants and privacy policy appears exactly once._
    - _Preservation: Email button clicks, Google/SSO flows, password steps, mode toggling, and all other authentication flows must remain unchanged._
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Create Account Button Navigation and Button Text Display
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify:
      - Clicking "CRIAR CONTA" keeps step as "buttons" and changes mode to "signup"
      - Button texts show registration variants in signup mode
      - Privacy policy appears exactly once in signup mode
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Create-Account Interactions
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions):
      - Email button click navigation works
      - Google OAuth flow works
      - SSO authentication flow works
      - Password step functionality works
      - Mode toggling works
      - "Já tem uma conta?" link works
      - Privacy policy link navigation works

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all tests: `npm run test`
  - Verify bug condition exploration test passes (task 3.2)
  - Verify preservation tests pass (task 3.3)
  - Verify no regressions in other authentication flows
  - Ensure all tests pass, ask the user if questions arise

---

## Notes

- This bugfix follows the bug condition methodology
- Exploration test (task 1) MUST fail on unfixed code to confirm bug exists
- Preservation tests (task 2) MUST pass on unfixed code to establish baseline
- After fix (task 3), exploration test should pass and preservation tests should still pass
- All tests use property-based testing for stronger guarantees
