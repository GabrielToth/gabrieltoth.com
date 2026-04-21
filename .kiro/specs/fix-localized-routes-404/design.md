# Fix Localized Routes 404 Errors - Design Document

## Overview

The application is experiencing 404 errors when users attempt to access localized routes with translated path segments (e.g., `/pt-BR/registrar/`, `/es/iniciar-sesion/`). The `next.config.ts` file contains rewrite rules that should map these translated URLs to their English equivalents, but the rewrites are not being applied before route resolution occurs. This causes Next.js to attempt to match the translated paths against the actual file system routes (which only exist in English), resulting in 404 errors.

The fix involves ensuring that rewrites are processed at the correct stage of request handling and that the rewrite patterns correctly match incoming requests with trailing slashes.

## Glossary

- **Bug_Condition (C)**: A request arrives for a localized route with a translated path segment (e.g., `/pt-BR/registrar/`) that should be rewritten to an English equivalent (e.g., `/pt-BR/register/`)
- **Property (P)**: The rewrite is successfully applied before route resolution, and the request is served from the correct English-named route
- **Preservation**: All existing functionality for English routes, non-localized routes, and static files continues to work without modification
- **Rewrite**: A Next.js feature that internally maps one URL path to another without changing the browser's address bar
- **Route Resolution**: The process by which Next.js matches an incoming request path to a file system route or dynamic route handler
- **Trailing Slash**: The forward slash at the end of a URL path (e.g., `/pt-BR/register/`)
- **Locale Segment**: The first path segment that identifies the language/region (e.g., `pt-BR`, `es`, `de`, `en`)

## Bug Details

### Bug Condition

The bug manifests when a user visits a localized route with a translated path segment. The `rewrites()` function in `next.config.ts` contains patterns that should match these requests, but the rewrites are either not being applied or are being applied too late in the request pipeline, after route resolution has already failed.

**Formal Specification:**
```
FUNCTION isBugCondition(request)
  INPUT: request of type IncomingRequest
  OUTPUT: boolean
  
  RETURN request.pathname MATCHES /^\/[a-z]{2}(-[A-Z]{2})?\/[a-z-]+\// 
         AND request.pathname NOT MATCHES /^\/[a-z]{2}(-[A-Z]{2})?\/[a-z-]+\/page\.tsx$/
         AND correspondingEnglishRouteExists(request.pathname)
         AND rewriteRuleExists(request.pathname)
         AND NOT rewriteAppliedBeforeRouteResolution(request.pathname)
END FUNCTION
```

In simpler terms: The bug occurs when:
1. A request comes in for a localized route with a translated path (e.g., `/pt-BR/registrar/`)
2. A rewrite rule exists in `next.config.ts` that should map it to the English equivalent (e.g., `/pt-BR/register/`)
3. The rewrite is not applied before Next.js attempts to resolve the route
4. Next.js cannot find a route matching the translated path and returns 404

### Examples

**Example 1: Portuguese Login Rewrite Failure**
- User visits: `/pt-BR/entrar/`
- Expected: Request is rewritten to `/pt-BR/login/` and login page loads
- Actual: 404 error returned
- Root cause: Rewrite rule exists but is not applied before route resolution

**Example 2: Spanish Register Rewrite Failure**
- User visits: `/es/registrarse/`
- Expected: Request is rewritten to `/es/register/` and register page loads
- Actual: 404 error returned
- Root cause: Rewrite rule exists but is not applied before route resolution

**Example 3: German PC Optimization Rewrite Failure**
- User visits: `/de/pc-optimierung/`
- Expected: Request is rewritten to `/de/pc-optimization/` and pc-optimization page loads
- Actual: 404 error returned
- Root cause: Rewrite rule exists but is not applied before route resolution

**Example 4: English Route Works (No Bug)**
- User visits: `/pt-BR/login/`
- Expected: Login page loads without rewriting
- Actual: Login page loads successfully
- Status: Working correctly - no rewrite needed

**Example 5: Static File Works (No Bug)**
- User visits: `/robots.txt`
- Expected: robots.txt file served without rewriting
- Actual: robots.txt file served successfully
- Status: Working correctly - no rewrite needed

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- English routes like `/pt-BR/login/`, `/es/register/`, `/de/editors/` must continue to load without rewriting
- Root path `/` must continue to redirect to `/pt-BR/` as configured
- Non-localized routes like `/robots.txt`, `/sitemap.xml`, and static assets must continue to be served without rewriting
- The build process must continue to succeed without errors
- Static page generation for all locales must continue to work
- Locale validation in `[locale]/layout.tsx` must continue to work correctly

**Scope:**
All requests that do NOT involve translated path segments should be completely unaffected by this fix. This includes:
- Direct requests to English-named routes (e.g., `/pt-BR/login/`)
- Requests to non-localized routes (e.g., `/robots.txt`, `/sitemap.xml`)
- Requests to static assets (e.g., `/images/logo.png`)
- Root path redirects
- API routes and other non-page routes

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Rewrite Timing Issue**: The rewrites in `next.config.ts` may not be applied before Next.js attempts to resolve the route against the file system. In Next.js, rewrites should be applied during the request pipeline, but if there's a configuration issue, they might be skipped or applied too late.

2. **Trailing Slash Mismatch**: The rewrite patterns in `next.config.ts` use `:path*` which should match any remaining path segments. However, if the incoming request has a trailing slash and the pattern doesn't account for it, the match may fail. The `trailingSlash: true` setting in `next.config.ts` should normalize this, but there may be an edge case.

3. **Dynamic Route Conflict**: The `[locale]` dynamic route segment may be matching the request before rewrites are applied. If the locale validation in `[locale]/layout.tsx` is too strict or if the route resolution order is incorrect, the rewrite may never be reached.

4. **Rewrite Pattern Specificity**: The rewrite patterns may not be specific enough to match all variations of the incoming request (with/without trailing slashes, with/without query parameters, etc.).

5. **Build-Time vs Runtime Issue**: The rewrites might not be properly compiled into the build output, or there might be an issue with how they're being served in the production environment (especially in Docker with `output: "standalone"`).

## Correctness Properties

Property 1: Bug Condition - Localized Route Rewrite

_For any_ request where a translated path segment is used (isBugCondition returns true), the fixed Next.js configuration SHALL apply the rewrite rule before route resolution, causing the request to be served from the correct English-named route without returning a 404 error.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - English Routes and Static Files

_For any_ request that does NOT use a translated path segment (isBugCondition returns false), the fixed configuration SHALL produce exactly the same behavior as the original configuration, preserving all existing functionality for English routes, non-localized routes, and static files.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the issue is likely related to how rewrites are being applied in the request pipeline. The fix involves ensuring that:

1. Rewrites are properly configured and applied before route resolution
2. The rewrite patterns correctly match requests with trailing slashes
3. The rewrite destination paths are correctly formatted

**File**: `next.config.ts`

**Function**: `rewrites()` configuration

**Specific Changes**:

1. **Verify Rewrite Pattern Matching**: Ensure all rewrite source patterns correctly match the incoming request format. The patterns should account for:
   - Locale prefix (e.g., `/pt-BR/`, `/es/`, `/de/`)
   - Translated path segment (e.g., `entrar`, `registrar`, `otimizacao-de-pc`)
   - Trailing slash (should be included in the pattern)
   - Optional path parameters after the main segment (handled by `:path*`)

2. **Ensure Destination Paths Are Correct**: Verify that all rewrite destination paths:
   - Use the correct English folder names
   - Include the locale prefix
   - Include trailing slashes to match the `trailingSlash: true` setting
   - Preserve any path parameters using `:path*`

3. **Check for Pattern Conflicts**: Ensure that no rewrite patterns conflict with each other or with the dynamic `[locale]` route. Patterns should be ordered from most specific to least specific.

4. **Verify Build Configuration**: Ensure that:
   - The `trailingSlash: true` setting is working correctly
   - The `output: "standalone"` setting doesn't interfere with rewrites
   - The build process includes all rewrite rules in the output

5. **Test Rewrite Application**: Create tests that verify:
   - Rewrites are applied for all translated path segments
   - Rewrites are NOT applied for English paths
   - Rewrites work correctly with and without trailing slashes
   - Rewrites work correctly with query parameters

### Implementation Steps

1. Review the current rewrite patterns in `next.config.ts` to ensure they're correctly formatted
2. Verify that all rewrite source patterns include trailing slashes (e.g., `/pt-BR/entrar/` not `/pt-BR/entrar`)
3. Verify that all rewrite destination patterns include trailing slashes
4. Ensure the rewrite patterns are ordered correctly (most specific first)
5. Test the rewrites locally using `npm run build` and `npm run start`
6. Verify that translated routes now load correctly
7. Verify that English routes still work without rewriting
8. Verify that static files and non-localized routes still work

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate requests to translated path segments and verify that the rewrite is applied and the correct page loads. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Portuguese Login Rewrite Test**: Request `/pt-BR/entrar/` and verify it's rewritten to `/pt-BR/login/` (will fail on unfixed code)
2. **Spanish Register Rewrite Test**: Request `/es/registrarse/` and verify it's rewritten to `/es/register/` (will fail on unfixed code)
3. **German PC Optimization Rewrite Test**: Request `/de/pc-optimierung/` and verify it's rewritten to `/de/pc-optimization/` (will fail on unfixed code)
4. **Portuguese Channel Management Rewrite Test**: Request `/pt-BR/gerenciamento-de-canais/` and verify it's rewritten to `/pt-BR/channel-management/` (will fail on unfixed code)
5. **Edge Case - Query Parameters**: Request `/pt-BR/entrar/?redirect=/dashboard` and verify rewrite is applied with query parameters preserved (may fail on unfixed code)

**Expected Counterexamples**:
- Requests to translated paths return 404 errors instead of being rewritten
- The rewrite rules in `next.config.ts` are not being applied during request processing
- Possible causes: rewrite timing issue, trailing slash mismatch, pattern specificity issue, or build configuration issue

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed configuration produces the expected behavior.

**Pseudocode:**
```
FOR ALL request WHERE isBugCondition(request) DO
  response := handleRequest_fixed(request)
  ASSERT response.statusCode == 200
  ASSERT response.content CONTAINS expectedPageContent(request)
  ASSERT response.rewriteApplied == true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed configuration produces the same result as the original configuration.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) DO
  ASSERT handleRequest_original(request) == handleRequest_fixed(request)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for English routes and static files, then write property-based tests capturing that behavior.

**Test Cases**:
1. **English Route Preservation**: Verify that `/pt-BR/login/`, `/es/register/`, `/de/editors/` continue to load without rewriting
2. **Static File Preservation**: Verify that `/robots.txt`, `/sitemap.xml`, and static assets continue to be served correctly
3. **Root Path Preservation**: Verify that `/` continues to redirect to `/pt-BR/`
4. **Query Parameter Preservation**: Verify that query parameters are preserved when rewrites are applied
5. **Non-Localized Route Preservation**: Verify that routes without locale prefixes continue to work correctly

### Unit Tests

- Test that rewrite patterns correctly match translated path segments
- Test that rewrite patterns do NOT match English path segments
- Test that rewrite patterns correctly handle trailing slashes
- Test that rewrite patterns correctly handle query parameters
- Test that rewrite destination paths are correctly formatted

### Property-Based Tests

- Generate random locale values and verify rewrites work for all supported locales
- Generate random translated path segments and verify rewrites are applied correctly
- Generate random query parameters and verify they're preserved during rewrites
- Generate random English paths and verify NO rewrites are applied

### Integration Tests

- Test full request flow with translated paths in each locale
- Test that pages load correctly after rewrite is applied
- Test that browser DevTools shows no failed requests with `_rsc` parameters
- Test that switching between locales works correctly
- Test that static page generation works for all locales

