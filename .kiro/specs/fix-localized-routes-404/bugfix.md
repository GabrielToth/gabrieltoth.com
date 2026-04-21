# Bugfix Requirements Document

## Introduction

The application is returning 404 errors on localized routes that should exist and be accessible. Users attempting to visit translated route paths (e.g., `/pt-BR/registrar/`, `/pt-BR/entrar/`) receive 404 responses instead of being rewritten to their English equivalents and loading the correct pages. This affects multiple locales (pt-BR, es, de) and multiple routes (login, register, channel management, pc optimization, etc.), preventing users from accessing core application features through localized URLs.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user visits a localized route like `/pt-BR/registrar/` THEN the system returns a 404 error instead of rewriting to `/pt-BR/register/`

1.2 WHEN a user visits a localized route like `/pt-BR/entrar/` THEN the system returns a 404 error instead of rewriting to `/pt-BR/login/`

1.3 WHEN a user visits a localized route like `/pt-BR/otimizacao-de-pc/` THEN the system returns a 404 error instead of rewriting to `/pt-BR/pc-optimization/`

1.4 WHEN a user visits a localized route like `/pt-BR/gerenciamento-de-canais/` THEN the system returns a 404 error instead of rewriting to `/pt-BR/channel-management/`

1.5 WHEN a user visits localized routes in other supported locales (es, de) with translated paths THEN the system returns 404 errors instead of rewriting to English equivalents

1.6 WHEN the browser DevTools are open THEN many failed requests with `_rsc` parameters are visible, indicating route resolution failures

### Expected Behavior (Correct)

2.1 WHEN a user visits `/pt-BR/registrar/` THEN the system SHALL rewrite the request to `/pt-BR/register/` and load the register page successfully

2.2 WHEN a user visits `/pt-BR/entrar/` THEN the system SHALL rewrite the request to `/pt-BR/login/` and load the login page successfully

2.3 WHEN a user visits `/pt-BR/otimizacao-de-pc/` THEN the system SHALL rewrite the request to `/pt-BR/pc-optimization/` and load the pc-optimization page successfully

2.4 WHEN a user visits `/pt-BR/gerenciamento-de-canais/` THEN the system SHALL rewrite the request to `/pt-BR/channel-management/` and load the channel-management page successfully

2.5 WHEN a user visits localized routes in other supported locales (es, de) with translated paths THEN the system SHALL rewrite the request to the English equivalent and load the correct page successfully

2.6 WHEN the browser DevTools are open THEN no failed requests with `_rsc` parameters SHALL be visible for localized routes

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user visits English routes like `/en/login/` or `/pt-BR/login/` directly THEN the system SHALL CONTINUE TO load the login page without rewriting

3.2 WHEN a user visits the root path `/` THEN the system SHALL CONTINUE TO redirect to `/pt-BR/` as configured

3.3 WHEN a user visits English-language routes in other locales like `/es/login/` or `/de/login/` THEN the system SHALL CONTINUE TO load the login page without rewriting

3.4 WHEN a user visits non-localized routes like `/robots.txt` or `/sitemap.xml` THEN the system SHALL CONTINUE TO serve these files without attempting locale-based rewrites

3.5 WHEN the application is built and deployed THEN the build process SHALL CONTINUE TO succeed without errors
