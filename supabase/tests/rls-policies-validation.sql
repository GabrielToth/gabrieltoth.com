-- RLS Policies Validation Script
-- This script validates that all RLS policies are correctly configured
-- and that users can only access their own data.
--
-- Requirements: 20.1, 20.2, 20.4

-- ============================================================================
-- 1. Verify RLS is enabled on all tables
-- ============================================================================

-- Check if RLS is enabled on social_networks
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'social_networks',
  'network_groups',
  'scheduled_posts',
  'publication_history',
  'oauth_tokens',
  'user_preferences'
)
AND schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. Verify RLS policies exist for each table
-- ============================================================================

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as policy_condition,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'social_networks',
  'network_groups',
  'scheduled_posts',
  'publication_history',
  'oauth_tokens',
  'user_preferences'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- 3. Verify policy count for each table (should have 4 policies per table)
-- ============================================================================

SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 4 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'social_networks',
  'network_groups',
  'scheduled_posts',
  'publication_history',
  'oauth_tokens',
  'user_preferences'
)
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 4. Verify specific policies for social_networks table
-- ============================================================================

SELECT 
  policyname,
  CASE 
    WHEN policyname = 'Users can view their own social networks' THEN 'SELECT'
    WHEN policyname = 'Users can insert their own social networks' THEN 'INSERT'
    WHEN policyname = 'Users can update their own social networks' THEN 'UPDATE'
    WHEN policyname = 'Users can delete their own social networks' THEN 'DELETE'
  END as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as has_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'social_networks'
ORDER BY policyname;

-- ============================================================================
-- 5. Verify specific policies for network_groups table
-- ============================================================================

SELECT 
  policyname,
  CASE 
    WHEN policyname = 'Users can view their own network groups' THEN 'SELECT'
    WHEN policyname = 'Users can insert their own network groups' THEN 'INSERT'
    WHEN policyname = 'Users can update their own network groups' THEN 'UPDATE'
    WHEN policyname = 'Users can delete their own network groups' THEN 'DELETE'
  END as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as has_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'network_groups'
ORDER BY policyname;

-- ============================================================================
-- 6. Verify specific policies for scheduled_posts table
-- ============================================================================

SELECT 
  policyname,
  CASE 
    WHEN policyname = 'Users can view their own scheduled posts' THEN 'SELECT'
    WHEN policyname = 'Users can insert their own scheduled posts' THEN 'INSERT'
    WHEN policyname = 'Users can update their own scheduled posts' THEN 'UPDATE'
    WHEN policyname = 'Users can delete their own scheduled posts' THEN 'DELETE'
  END as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as has_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'scheduled_posts'
ORDER BY policyname;

-- ============================================================================
-- 7. Verify specific policies for publication_history table
-- ============================================================================

SELECT 
  policyname,
  CASE 
    WHEN policyname = 'Users can view their own publication history' THEN 'SELECT'
    WHEN policyname = 'Users can insert their own publication history' THEN 'INSERT'
    WHEN policyname = 'Users can update their own publication history' THEN 'UPDATE'
    WHEN policyname = 'Users can delete their own publication history' THEN 'DELETE'
  END as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as has_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'publication_history'
ORDER BY policyname;

-- ============================================================================
-- 8. Verify specific policies for oauth_tokens table
-- ============================================================================

SELECT 
  policyname,
  CASE 
    WHEN policyname = 'Users can view their own OAuth tokens' THEN 'SELECT'
    WHEN policyname = 'Users can insert their own OAuth tokens' THEN 'INSERT'
    WHEN policyname = 'Users can update their own OAuth tokens' THEN 'UPDATE'
    WHEN policyname = 'Users can delete their own OAuth tokens' THEN 'DELETE'
  END as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as has_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'oauth_tokens'
ORDER BY policyname;

-- ============================================================================
-- 9. Verify specific policies for user_preferences table
-- ============================================================================

SELECT 
  policyname,
  CASE 
    WHEN policyname = 'Users can view their own preferences' THEN 'SELECT'
    WHEN policyname = 'Users can insert their own preferences' THEN 'INSERT'
    WHEN policyname = 'Users can update their own preferences' THEN 'UPDATE'
    WHEN policyname = 'Users can delete their own preferences' THEN 'DELETE'
  END as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as has_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_preferences'
ORDER BY policyname;

-- ============================================================================
-- 10. Summary Report
-- ============================================================================

WITH policy_summary AS (
  SELECT 
    tablename,
    COUNT(*) as policy_count,
    COUNT(CASE WHEN qual IS NOT NULL THEN 1 END) as policies_with_conditions
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN (
    'social_networks',
    'network_groups',
    'scheduled_posts',
    'publication_history',
    'oauth_tokens',
    'user_preferences'
  )
  GROUP BY tablename
)
SELECT 
  tablename,
  policy_count,
  policies_with_conditions,
  CASE 
    WHEN policy_count = 4 AND policies_with_conditions = 4 THEN 'PASS'
    ELSE 'FAIL'
  END as rls_status
FROM policy_summary
ORDER BY tablename;
