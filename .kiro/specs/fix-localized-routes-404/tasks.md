# Implementation Plan - Fix Localized Routes 404 Errors

## Overview

This implementation plan follows the bugfix workflow using the bug condition methodology. Tasks are ordered to:
1. Explore and confirm the bug exists (Property 1: Bug Condition)
2. Establish preservation baseline (Property 2: Preservation)
3. Implement the fix with validation
4. Verify all tests pass

---

## Phase 1: Exploratory Bug Condition Testing

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Localized Route Rewrite Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to concrete failing cases to ensure reproducibility
  - Test implementation details from Bug Condition in design (section: Bug Details > Bug Condition)
  - The test assertions should match the Expected Behavior Properties from design (section: Correctness Properties > Property 1)
  - Test cases to cover:
    - Portuguese login rewrite: `/pt-BR/entrar/` should rewrite to `/pt-BR/login/`
    - Portuguese register rewrite: `/pt-BR/registrar/` should rewrite to `/pt-BR/register/`
    - Portuguese PC optimization rewrite: `/pt-BR/otimizacao-de-pc/` should rewrite to `/pt-BR/pc-optimization/`
    - Portuguese channel management rewrite: `/pt-BR/gerenciamento-de-canais/` should rewrite to `/pt-BR/channel-management/`
    - Spanish login rewrite: `/es/iniciar-sesion/` should rewrite to `/es/login/`
    - German register rewrite: `/de/registrieren/` should rewrite to `/de/register/`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Request to `/pt-BR/entrar/` returns 404 instead of being rewritten to `/pt-BR/login/`")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

---

## Phase 2: Preservation Property Testing

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - English Routes and Static Files Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (where isBugCondition returns false)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements (section: Expected Behavior > Preservation Requirements)
  - Property-based testing generates many test cases for stronger guarantees
  - Test cases to cover:
    - English routes continue to load: `/pt-BR/login/`, `/es/register/`, `/de/editors/`
    - Root path continues to redirect: `/` redirects to `/pt-BR/`
    - Static files continue to be served: `/robots.txt`, `/sitemap.xml`, static assets
    - Non-localized routes continue to work: `/api/*`, `/images/*`
    - Query parameters are preserved: `/pt-BR/login/?redirect=/dashboard`
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

---

## Phase 3: Fix Implementation

- [-] 3. Fix localized route rewrites in next.config.ts

  - [x] 3.1 Review and verify rewrite patterns
    - Review current rewrite patterns in `next.config.ts` (lines 95-180)
    - Verify all rewrite source patterns include trailing slashes (e.g., `/pt-BR/entrar/` not `/pt-BR/entrar`)
    - Verify all rewrite destination patterns include trailing slashes
    - Verify patterns are ordered from most specific to least specific
    - Check for any pattern conflicts or duplicates
    - Document findings and any issues discovered
    - _Bug_Condition: isBugCondition(request) where request.pathname matches translated path pattern_
    - _Expected_Behavior: Rewrites applied before route resolution, request served from correct English-named route_
    - _Preservation: English routes, static files, and non-localized routes continue to work_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify rewrite patterns match incoming requests correctly
    - Ensure all rewrite source patterns correctly match the incoming request format
    - Patterns should account for:
      - Locale prefix (e.g., `/pt-BR/`, `/es/`, `/de/`)
      - Translated path segment (e.g., `entrar`, `registrar`, `otimizacao-de-pc`)
      - Trailing slash (should be included in the pattern)
      - Optional path parameters after the main segment (handled by `:path*`)
    - Test pattern matching with concrete examples
    - Document any pattern issues found
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Ensure destination paths are correctly formatted
    - Verify all rewrite destination paths:
      - Use the correct English folder names
      - Include the locale prefix
      - Include trailing slashes to match the `trailingSlash: true` setting
      - Preserve any path parameters using `:path*`
    - Test destination path formatting with concrete examples
    - Document any destination path issues found
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Verify build configuration supports rewrites
    - Ensure the `trailingSlash: true` setting is working correctly
    - Ensure the `output: "standalone"` setting doesn't interfere with rewrites
    - Run `npm run build` to verify build process includes all rewrite rules
    - Check build output for any warnings or errors related to rewrites
    - Document build verification results
    - _Requirements: 3.5_

  - [x] 3.5 Apply necessary fixes to next.config.ts
    - Based on findings from 3.1-3.4, apply fixes to rewrite patterns or configuration
    - Ensure all rewrite patterns are correctly formatted with trailing slashes
    - Ensure all destination paths are correctly formatted
    - Ensure patterns are ordered correctly
    - Run `npm run build` to verify build succeeds
    - Document all changes made
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

---

## Phase 4: Fix Validation

- [x] 4. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Localized Route Rewrite Success
  - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
  - The test from task 1 encodes the expected behavior
  - When this test passes, it confirms the expected behavior is satisfied
  - Run bug condition exploration test from step 1
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
  - Verify all translated path rewrites work correctly:
    - `/pt-BR/entrar/` rewrites to `/pt-BR/login/`
    - `/pt-BR/registrar/` rewrites to `/pt-BR/register/`
    - `/pt-BR/otimizacao-de-pc/` rewrites to `/pt-BR/pc-optimization/`
    - `/pt-BR/gerenciamento-de-canais/` rewrites to `/pt-BR/channel-management/`
    - `/es/iniciar-sesion/` rewrites to `/es/login/`
    - `/de/registrieren/` rewrites to `/de/register/`
  - Document test results
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Verify preservation tests still pass
  - **Property 2: Preservation** - English Routes and Static Files Behavior
  - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
  - Run preservation property tests from step 2
  - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
  - Verify all non-buggy inputs continue to work:
    - English routes load without rewriting: `/pt-BR/login/`, `/es/register/`, `/de/editors/`
    - Root path redirects correctly: `/` redirects to `/pt-BR/`
    - Static files are served correctly: `/robots.txt`, `/sitemap.xml`
    - Non-localized routes work: `/api/*`, `/images/*`
    - Query parameters are preserved
  - Confirm all tests still pass after fix (no regressions)
  - Document test results
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

---

## Phase 5: Checkpoint

- [x] 6. Checkpoint - Ensure all tests pass and build succeeds
  - Run full test suite to ensure all tests pass
  - Run `npm run build` to ensure build succeeds without errors
  - Verify no failed requests with `_rsc` parameters in browser DevTools
  - Verify translated routes load correctly in browser
  - Verify English routes still work correctly in browser
  - Verify static files are served correctly
  - Document final verification results
  - If any issues arise, document them and ask for guidance
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

