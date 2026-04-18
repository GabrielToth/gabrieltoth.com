-- Verification script for database constraints and foreign keys
-- This script verifies that all required constraints are properly configured

-- 1. Verify foreign key constraints exist
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('sessions', 'password_reset_tokens', 'email_verification_tokens', 'login_attempts', 'audit_logs')
  AND column_name = 'user_id'
ORDER BY table_name;

-- 2. Verify ON DELETE CASCADE is configured
SELECT 
  constraint_name,
  table_name,
  delete_rule
FROM information_schema.referential_constraints
WHERE table_name IN ('sessions', 'password_reset_tokens', 'email_verification_tokens', 'login_attempts')
ORDER BY table_name;

-- 3. Verify CHECK constraints exist
SELECT 
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('users', 'sessions', 'password_reset_tokens', 'email_verification_tokens')
  AND constraint_type = 'CHECK'
ORDER BY table_name;

-- 4. Verify email format constraint works
-- This should succeed
INSERT INTO users (email, name, password_hash) 
VALUES ('test@example.com', 'Test User', 'hashed_password');

-- This should fail (invalid email format)
-- INSERT INTO users (email, name, password_hash) 
-- VALUES ('invalid-email', 'Test User', 'hashed_password');

-- 5. Verify token non-empty constraint works
-- This should succeed
INSERT INTO sessions (user_id, token, expires_at)
VALUES ((SELECT id FROM users LIMIT 1), 'valid_token_123', CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- This should fail (empty token)
-- INSERT INTO sessions (user_id, token, expires_at)
-- VALUES ((SELECT id FROM users LIMIT 1), '', CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- 6. Verify ON DELETE CASCADE works
-- When a user is deleted, all related sessions should be deleted
-- DELETE FROM users WHERE email = 'test@example.com';
-- SELECT COUNT(*) FROM sessions WHERE user_id NOT IN (SELECT id FROM users);

-- 7. Verify indexes exist for performance
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('users', 'sessions', 'password_reset_tokens', 'email_verification_tokens', 'login_attempts', 'audit_logs')
ORDER BY tablename, indexname;
