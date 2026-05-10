# Bugfix Requirements Document

## Introduction

This document describes the bug fix for the unified signin form component's registration flow. Currently, when users click the "CRIAR CONTA" (Create Account) button on the initial authentication screen, the application incorrectly navigates them to the email input step instead of staying on the button selection screen with updated button texts for registration mode.

Additionally, there is a duplicate privacy policy text that appears twice on the button selection screen - one right after the "CRIAR CONTA" button and one at the bottom of the screen. Only the bottom instance should be kept.

**Impact**: This bug disrupts the user experience by skipping the button selection screen in registration mode, preventing users from choosing their preferred registration method (Google, SSO, or Email) before proceeding.

**Affected Component**: `src/components/auth/unified-signin-form.tsx`

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user clicks the "CRIAR CONTA" button on the initial button selection screen (step === "buttons" AND mode === "signin") THEN the system sets step to "email" and mode to "signup", navigating away from the button selection screen

1.2 WHEN the user is on the button selection screen in signup mode (step === "buttons" AND mode === "signup") THEN the system displays duplicate privacy policy text (one after "CRIAR CONTA" button and one at the bottom)

1.3 WHEN the user clicks "CRIAR CONTA" THEN the system does not update the button texts to registration variants ("Registre-se com Google", "Registre-se com SSO", "Registre-se com E-mail")

### Expected Behavior (Correct)

2.1 WHEN the user clicks the "CRIAR CONTA" button on the initial button selection screen (step === "buttons" AND mode === "signin") THEN the system SHALL set mode to "signup" and keep step as "buttons", remaining on the button selection screen

2.2 WHEN the user is on the button selection screen in signup mode (step === "buttons" AND mode === "signup") THEN the system SHALL display the privacy policy text only once at the bottom of the screen

2.3 WHEN the user is on the button selection screen in signup mode (step === "buttons" AND mode === "signup") THEN the system SHALL display registration-specific button texts: "Registre-se com Google", "Registre-se com SSO", and "Registre-se com E-mail"

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user clicks the "Email" button on the button selection screen THEN the system SHALL CONTINUE TO navigate to the email input step (step === "email")

3.2 WHEN the user clicks the "Google" button on the button selection screen THEN the system SHALL CONTINUE TO initiate Google OAuth flow

3.3 WHEN the user clicks the "SSO" button on the button selection screen THEN the system SHALL CONTINUE TO initiate SSO authentication flow

3.4 WHEN the user is on the email input step or password step THEN the system SHALL CONTINUE TO function as currently implemented

3.5 WHEN the user toggles between "signin" and "signup" modes on the email input step THEN the system SHALL CONTINUE TO function as currently implemented

3.6 WHEN the user completes the email/password flow THEN the system SHALL CONTINUE TO authenticate or register as appropriate based on the mode

3.7 WHEN the user clicks "Já tem uma conta?" (Have account?) link in signup mode THEN the system SHALL CONTINUE TO switch to signin mode

3.8 WHEN the privacy policy link is clicked THEN the system SHALL CONTINUE TO navigate to the privacy policy page

## Bug Condition Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type UserInteraction {
    action: string,           // "click_criar_conta" | "render_buttons"
    currentStep: string,      // "buttons" | "email" | "password"
    currentMode: string       // "signin" | "signup"
  }
  OUTPUT: boolean
  
  // Returns true when the bug condition is met
  RETURN (
    (X.action = "click_criar_conta" AND X.currentStep = "buttons" AND X.currentMode = "signin") OR
    (X.action = "render_buttons" AND X.currentStep = "buttons" AND X.currentMode = "signup")
  )
END FUNCTION
```

### Property Specification

```pascal
// Property 1: Fix Checking - Create Account Button Behavior
FOR ALL X WHERE isBugCondition(X) AND X.action = "click_criar_conta" DO
  result ← handleCreateAccountClick'(X)
  ASSERT result.step = "buttons" AND result.mode = "signup"
END FOR

// Property 2: Fix Checking - Button Text Display
FOR ALL X WHERE isBugCondition(X) AND X.action = "render_buttons" DO
  result ← renderButtons'(X)
  ASSERT (
    result.googleButtonText = "Registre-se com Google" AND
    result.ssoButtonText = "Registre-se com SSO" AND
    result.emailButtonText = "Registre-se com E-mail"
  )
END FOR

// Property 3: Fix Checking - Privacy Policy Display
FOR ALL X WHERE isBugCondition(X) AND X.action = "render_buttons" DO
  result ← renderButtons'(X)
  ASSERT result.privacyPolicyCount = 1
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

Where:
- **F**: The original (unfixed) function - current code behavior
- **F'**: The fixed function - code after applying the fix
- **isBugCondition(X)**: Returns true only for the specific buggy scenarios described above

This ensures that for all non-buggy interactions (email button clicks, Google/SSO flows, password steps, etc.), the fixed code behaves identically to the original code.

## Concrete Examples

### Example 1: Buggy Input (Create Account Click)
```typescript
Input: {
  action: "click_criar_conta",
  currentStep: "buttons",
  currentMode: "signin"
}

Current Output (Defect):
{
  step: "email",      // ❌ Wrong - navigates away
  mode: "signup"
}

Expected Output (Correct):
{
  step: "buttons",    // ✅ Correct - stays on button selection
  mode: "signup"
}
```

### Example 2: Buggy Input (Button Rendering in Signup Mode)
```typescript
Input: {
  action: "render_buttons",
  currentStep: "buttons",
  currentMode: "signup"
}

Current Output (Defect):
{
  googleButtonText: "Entrar com Google",     // ❌ Wrong - signin text
  ssoButtonText: "Entrar com SSO",           // ❌ Wrong - signin text
  emailButtonText: "Entrar com E-mail",      // ❌ Wrong - signin text
  privacyPolicyCount: 2                      // ❌ Wrong - duplicate
}

Expected Output (Correct):
{
  googleButtonText: "Registre-se com Google",  // ✅ Correct - signup text
  ssoButtonText: "Registre-se com SSO",        // ✅ Correct - signup text
  emailButtonText: "Registre-se com E-mail",   // ✅ Correct - signup text
  privacyPolicyCount: 1                        // ✅ Correct - single instance
}
```

### Example 3: Non-Buggy Input (Email Button Click)
```typescript
Input: {
  action: "click_email_button",
  currentStep: "buttons",
  currentMode: "signin"
}

Output (Should Remain Unchanged):
{
  step: "email",      // ✅ Correct - navigates to email step
  mode: "signin"      // ✅ Correct - maintains signin mode
}
```
