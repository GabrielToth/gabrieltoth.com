-- Seed data for YouTube Channel Linking feature testing
-- This file is executed during `supabase db reset` to populate test data

-- Note: In a real application, you would use proper test user IDs from auth.users
-- For local testing, we'll create test data with placeholder UUIDs

-- Insert test YouTube channels (these would normally be linked to real users)
-- Example: INSERT INTO youtube_channels (user_id, youtube_channel_id, channel_name, ...)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'UCddiUEpYJcSF67VIGxT6kIw', 'Test Channel 1', ...);

-- Insert test linking activity records
-- Example: INSERT INTO linking_activity (user_id, youtube_channel_id, activity_type, ...)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'UCddiUEpYJcSF67VIGxT6kIw', 'link', ...);

-- Insert test recovery tokens
-- Example: INSERT INTO recovery_tokens (youtube_channel_id, token_hash, user_email, ...)
-- VALUES ('UCddiUEpYJcSF67VIGxT6kIw', '$2b$10$...', 'test@example.com', ...);

-- Insert test audit logs
-- Example: INSERT INTO audit_logs (user_id, youtube_channel_id, action, ...)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'UCddiUEpYJcSF67VIGxT6kIw', 'channel_linked', ...);

-- Note: Actual seed data should be added after the application is deployed
-- and real user IDs are available from the auth.users table.
-- For now, this file serves as a template for future seed data.
