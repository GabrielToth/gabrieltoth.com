-- Add Google OAuth columns to users table
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN google_email VARCHAR(255),
ADD COLUMN google_name VARCHAR(255),
ADD COLUMN google_picture VARCHAR(255);

-- Create indexes on google_id and google_email for fast lookups
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_google_email ON users(google_email);

-- Add comment to document the new columns
COMMENT ON COLUMN users.google_id IS 'Unique identifier from Google OAuth';
COMMENT ON COLUMN users.google_email IS 'Email address from Google OAuth';
COMMENT ON COLUMN users.google_name IS 'Display name from Google OAuth';
COMMENT ON COLUMN users.google_picture IS 'Profile picture URL from Google OAuth';
