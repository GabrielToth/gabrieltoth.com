# Supabase Deployment Guide for YouTube Channel Linking

This guide explains how to deploy the YouTube Channel Linking database schema to Supabase.

## Prerequisites

Before deploying to Supabase, you need:

1. **Supabase Account** - https://supabase.com/
2. **Supabase Project** - Created and ready
3. **Supabase CLI** - Already installed (`npm install -g supabase` or via `npx`)
4. **Project Reference** - Your Supabase project ID

## Step 1: Get Your Supabase Project Reference

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Settings" > "General"
4. Copy the "Project Reference" (format: `xxxxxxxxxxxxx`)

## Step 2: Link Your Local Project to Supabase

```bash
# Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REFERENCE

# You'll be prompted to enter your Supabase password
# This creates a .supabase/config.json file (don't commit this!)
```

**Example:**
```bash
npx supabase link --project-ref abcdefghijklmnop
```

## Step 3: Push Database Migrations

```bash
# Push all migrations to Supabase
npx supabase db push

# You'll see output like:
# Applying migration 20250101000001_create_youtube_channels_table.sql
# Applying migration 20250101000002_create_linking_activity_table.sql
# ... (6 migrations total)
```

## Step 4: Verify Migrations Were Applied

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor"
4. Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'youtube_%'
ORDER BY table_name;
```

You should see:
- `youtube_channels`
- `youtube_linking_activity`
- `youtube_recovery_tokens`
- `youtube_audit_logs`
- `youtube_unlink_revocation_window`

## Step 5: Enable Row Level Security (RLS)

1. Go to "Authentication" > "Policies"
2. For each table, enable RLS:
   - Click on the table
   - Toggle "Enable RLS"
   - Add policies as needed

**Recommended Policies:**

For `youtube_channels`:
```sql
-- Users can only see their own channels
CREATE POLICY "Users can view their own channels"
ON youtube_channels FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own channels
CREATE POLICY "Users can insert their own channels"
ON youtube_channels FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own channels
CREATE POLICY "Users can update their own channels"
ON youtube_channels FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own channels
CREATE POLICY "Users can delete their own channels"
ON youtube_channels FOR DELETE
USING (auth.uid() = user_id);
```

For `youtube_audit_logs`:
```sql
-- Users can only see their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON youtube_audit_logs FOR SELECT
USING (auth.uid() = user_id);
```

## Step 6: Set Up Environment Variables

### Local Development

1. Copy environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Get credentials from Supabase:
   - Go to "Settings" > "API"
   - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon/public key" → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Copy "service_role key" → `SUPABASE_SERVICE_ROLE_KEY`

### Production (Vercel)

1. Go to Vercel Project Settings > Environment Variables
2. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` (not sensitive)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not sensitive)
   - `SUPABASE_SERVICE_ROLE_KEY` (mark as Sensitive)

## Step 7: Test the Connection

```bash
# Start development server
npm run dev

# Visit http://localhost:3000
# Check browser console for any errors
# Test YouTube channel linking flow
```

## Step 8: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "feat: deploy YouTube channel linking to Supabase"

# Push to GitHub
git push origin main

# Vercel will automatically deploy
# Check deployment at https://vercel.com/dashboard
```

## Troubleshooting

### "Cannot find project ref. Have you run supabase link?"

**Solution:**
```bash
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
```

### "Authentication failed"

**Solution:**
1. Verify your Supabase password is correct
2. Try logging out and back in:
   ```bash
   npx supabase logout
   npx supabase link --project-ref YOUR_PROJECT_REFERENCE
   ```

### "Migration failed"

**Solution:**
1. Check Supabase dashboard for errors
2. Go to "SQL Editor" and check for syntax errors
3. Try pushing again:
   ```bash
   npx supabase db push
   ```

### "Tables not created"

**Solution:**
1. Verify migrations were applied:
   ```bash
   npx supabase migration list
   ```
2. Check Supabase dashboard > "SQL Editor" for tables
3. If missing, manually run migration SQL:
   - Go to "SQL Editor"
   - Copy SQL from `supabase/migrations/` files
   - Run each migration

### "RLS policies not working"

**Solution:**
1. Verify RLS is enabled on tables
2. Check policy conditions are correct
3. Test with Supabase Studio:
   - Go to "Table Editor"
   - Try querying as different users
   - Check policy results

## Database Schema Overview

### youtube_channels
Stores linked YouTube channels for each user.

**Columns:**
- `id` - UUID primary key
- `user_id` - Supabase auth user ID
- `channel_id` - YouTube channel ID
- `channel_name` - YouTube channel name
- `channel_url` - YouTube channel URL
- `profile_image_url` - Channel profile image
- `subscriber_count` - Current subscriber count
- `access_token` - Encrypted OAuth access token
- `refresh_token` - Encrypted OAuth refresh token
- `token_expires_at` - Token expiration timestamp
- `linked_at` - When channel was linked
- `last_verified_at` - Last verification timestamp
- `is_active` - Whether link is active
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

### youtube_linking_activity
Tracks all linking/unlinking activities for audit purposes.

**Columns:**
- `id` - UUID primary key
- `user_id` - User who performed action
- `channel_id` - YouTube channel ID
- `action_type` - 'link', 'unlink', 'verify', 'refresh'
- `status` - 'success', 'failed', 'pending'
- `error_message` - Error details if failed
- `ip_address` - IP address of request
- `user_agent` - Browser user agent
- `created_at` - Action timestamp

### youtube_recovery_tokens
Stores recovery tokens for account recovery.

**Columns:**
- `id` - UUID primary key
- `user_id` - User ID
- `token` - Recovery token
- `expires_at` - Token expiration
- `used_at` - When token was used
- `created_at` - Token creation timestamp

### youtube_audit_logs
Comprehensive audit trail for compliance.

**Columns:**
- `id` - UUID primary key
- `user_id` - User ID
- `action` - Action performed
- `resource_type` - Type of resource
- `resource_id` - ID of resource
- `changes` - JSON of changes made
- `ip_address` - IP address
- `user_agent` - Browser info
- `created_at` - Timestamp

### youtube_unlink_revocation_window
Tracks unlink revocation windows for recovery.

**Columns:**
- `id` - UUID primary key
- `user_id` - User ID
- `channel_id` - YouTube channel ID
- `unlinked_at` - When unlink occurred
- `revocation_window_expires_at` - When recovery expires
- `is_revoked` - Whether revocation was used
- `revoked_at` - When revocation occurred
- `created_at` - Record creation timestamp

## Data Retention Policies

The following data retention policies are automatically applied:

- **Linking Activity**: Retained for 90 days
- **Audit Logs**: Retained for 1 year
- **Recovery Tokens**: Deleted after use or 7 days expiration
- **Unlink Revocation**: Retained for 30 days after unlink

## Next Steps

1. ✅ Deploy migrations to Supabase
2. ✅ Enable RLS policies
3. ✅ Set environment variables
4. ✅ Test YouTube linking flow
5. ✅ Deploy to Vercel
6. ✅ Monitor error logs
7. ✅ Set up backups

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review error logs in Supabase dashboard
- Check application logs in Vercel dashboard
- Review `.agent/ENVIRONMENT_VARIABLES.md` for configuration help

