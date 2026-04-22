-- Add registration-specific fields to users table
-- This migration adds birth_date and auth_method fields required for the registration flow redesign
-- Supports Requirements 1.1, 14.1, 23.1

-- Add birth_date column (nullable for existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add auth_method column to track authentication method (email or oauth)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(50) CHECK (auth_method IN ('email', 'google', 'facebook', 'tiktok'));

-- Add full_name column as an alias for name (for consistency with requirements)
-- Note: 'name' column already exists, so we'll use it as full_name
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Create index on birth_date for age-based queries
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date);

-- Create index on auth_method for filtering by authentication method
CREATE INDEX IF NOT EXISTS idx_users_auth_method ON users(auth_method);

-- Create composite index for email + auth_method queries
CREATE INDEX IF NOT EXISTS idx_users_email_auth_method ON users(email, auth_method);

-- Add comments to document the new columns
COMMENT ON COLUMN users.birth_date IS 'User birth date (DD/MM/YYYY format stored as DATE). Used for age verification (minimum 13 years old).';
COMMENT ON COLUMN users.auth_method IS 'Authentication method used for registration (email, google, facebook, tiktok). Tracks which authentication path was used.';

-- Add constraint to ensure birth_date is not in the future
ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS birth_date_not_future CHECK (birth_date <= CURRENT_DATE);

-- Add constraint to ensure user is at least 13 years old
ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS minimum_age_13 CHECK (
  birth_date IS NULL OR 
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) >= 13
);

-- Update existing users to have auth_method = 'email' if they have a password_hash
UPDATE users
SET auth_method = 'email'
WHERE auth_method IS NULL
  AND password_hash IS NOT NULL
  AND password_hash != '';

-- Update existing Google OAuth users to have auth_method = 'google'
UPDATE users
SET auth_method = 'google'
WHERE auth_method IS NULL
  AND oauth_provider = 'google';

-- Add comment to document the migration
COMMENT ON TABLE users IS 'Users table with registration flow support. Includes birth_date for age verification and auth_method to track authentication method.';
