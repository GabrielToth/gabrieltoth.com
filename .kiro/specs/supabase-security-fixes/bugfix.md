# Bugfix Requirements Document

## Introduction

This document addresses critical security issues identified by the Supabase database linter. The issues include:

1. **SECURITY DEFINER Function Exposure**: The function `public.rls_auto_enable()` is executable by both `anon` (unauthenticated) and `authenticated` roles, creating a security risk as it's accessible via the REST API endpoint `/rest/v1/rpc/rls_auto_enable`.

2. **RLS Enabled Without Policies**: Multiple tables have Row Level Security (RLS) enabled but no policies defined, which effectively blocks all access even to authorized users. The affected tables are:
   - `public.audit_logs`
   - `public.email_verification_tokens`
   - `public.login_attempts`
   - `public.password_reset_tokens`
   - `public.registration_sessions`
   - `public.sessions`
   - `public.users`

These security warnings pose risks including unauthorized access to privileged functions, data access issues for legitimate users, and non-compliance with security best practices.

## Bug Analysis

### Current Behavior (Defect)

#### 1. SECURITY DEFINER Function Exposure

1.1 WHEN the function `public.rls_auto_enable()` exists in the database THEN the system allows both `anon` and `authenticated` roles to execute it via `/rest/v1/rpc/rls_auto_enable`

1.2 WHEN unauthenticated users access the REST API THEN the system permits execution of SECURITY DEFINER functions that should be restricted

#### 2. RLS Without Policies

1.3 WHEN tables `email_verification_tokens`, `password_reset_tokens`, `registration_sessions` have RLS enabled THEN the system blocks all access because no policies are defined

1.4 WHEN the `audit_logs` table has RLS enabled without proper policies THEN the system may block legitimate audit log operations

1.5 WHEN the `login_attempts` table has RLS enabled without proper policies THEN the system may block rate limiting functionality

1.6 WHEN the `sessions` table has RLS enabled without proper policies THEN the system may block session management operations

1.7 WHEN migration files reference tables not present in the main `schema.sql` THEN the system creates inconsistency between migration history and actual database state

### Expected Behavior (Correct)

#### 1. SECURITY DEFINER Function Security

2.1 WHEN the function `public.rls_auto_enable()` exists THEN the system SHALL revoke EXECUTE permissions from `anon` and `authenticated` roles

2.2 WHEN the function `public.rls_auto_enable()` is not needed THEN the system SHALL remove it entirely from the database schema

2.3 WHEN SECURITY DEFINER functions exist in the public schema THEN the system SHALL ensure they are not accessible via REST API unless explicitly required

#### 2. RLS Policies Implementation

2.4 WHEN the `email_verification_tokens` table has RLS enabled THEN the system SHALL define policies allowing users to view and manage their own tokens

2.5 WHEN the `password_reset_tokens` table has RLS enabled THEN the system SHALL define policies allowing users to view and manage their own reset tokens

2.6 WHEN the `registration_sessions` table has RLS enabled THEN the system SHALL define policies allowing users to manage their own registration sessions

2.7 WHEN the `audit_logs` table has RLS enabled THEN the system SHALL define append-only policies allowing users to view their own logs and admins to view all logs

2.8 WHEN the `login_attempts` table has RLS enabled THEN the system SHALL define policies allowing insertion by all and viewing by users/admins

2.9 WHEN the `sessions` table has RLS enabled THEN the system SHALL define policies allowing users to manage their own sessions

#### 3. Schema Consistency

2.10 WHEN migration files create tables THEN the system SHALL ensure those tables are reflected in the main `schema.sql` file

2.11 WHEN the database schema is dumped THEN the system SHALL include all tables, functions, and RLS policies in a single authoritative `schema.sql` file

### Unchanged Behavior (Regression Prevention)

#### 1. Existing RLS Policies

3.1 WHEN tables with properly configured RLS policies exist (e.g., `youtube_channels`, `oauth_tokens`, `scheduled_posts`) THEN the system SHALL CONTINUE TO enforce those policies correctly

3.2 WHEN users access their own data through existing RLS policies THEN the system SHALL CONTINUE TO allow access as currently configured

#### 2. Authentication and Authorization

3.3 WHEN authenticated users access protected resources THEN the system SHALL CONTINUE TO verify their identity using `auth.uid()`

3.4 WHEN admin users access audit logs THEN the system SHALL CONTINUE TO allow access based on their role

#### 3. Database Functions

3.5 WHEN legitimate database functions (e.g., `archive_old_audit_logs`, `cleanup_expired_recovery_tokens`) are called THEN the system SHALL CONTINUE TO execute them with appropriate permissions

3.6 WHEN triggers update timestamps or activity tracking THEN the system SHALL CONTINUE TO function as designed

#### 4. Foreign Key Relationships

3.7 WHEN foreign key constraints exist between tables THEN the system SHALL CONTINUE TO enforce referential integrity

3.8 WHEN cascade deletes are configured THEN the system SHALL CONTINUE TO propagate deletions correctly

#### 5. Indexes and Performance

3.9 WHEN queries use existing indexes THEN the system SHALL CONTINUE TO benefit from index performance

3.10 WHEN complex queries join multiple tables THEN the system SHALL CONTINUE TO execute efficiently
