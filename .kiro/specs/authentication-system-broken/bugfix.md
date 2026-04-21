# Bugfix Requirements Document

## Introduction

The authentication system is completely broken, preventing users from registering or logging in through both form-based authentication and Google OAuth. Form requests return 404 errors with `?_rsc=` query parameters, and Google OAuth callback returns 401 Unauthorized with "invalid_client" error. This blocks all user access to the application.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user attempts to access `/pt-BR/entrar/` (login page) THEN the system returns 404 Not Found with `?_rsc=` query parameters appended to the URL

1.2 WHEN a user attempts to access `/pt-BR/registrar/` (register page) THEN the system returns 404 Not Found with `?_rsc=` query parameters appended to the URL

1.3 WHEN a user completes Google OAuth flow and is redirected to `/api/auth/google/callback/` THEN the system returns 401 Unauthorized with error "Failed to exchange authorization code: invalid_client"

### Expected Behavior (Correct)

2.1 WHEN a user attempts to access `/pt-BR/entrar/` THEN the system SHALL successfully rewrite the request to `/pt-BR/login/` and display the login page without 404 errors

2.2 WHEN a user attempts to access `/pt-BR/registrar/` THEN the system SHALL successfully rewrite the request to `/pt-BR/register/` and display the register page without 404 errors

2.3 WHEN a user completes Google OAuth flow and is redirected to `/api/auth/google/callback/` with valid authorization code THEN the system SHALL successfully exchange the code for tokens and authenticate the user without 401 errors

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user accesses `/pt-BR/login/` directly (without locale-specific path) THEN the system SHALL CONTINUE TO display the login page correctly

3.2 WHEN a user accesses `/pt-BR/register/` directly (without locale-specific path) THEN the system SHALL CONTINUE TO display the register page correctly

3.3 WHEN a user accesses other authenticated routes after successful login THEN the system SHALL CONTINUE TO maintain session and authorization correctly
