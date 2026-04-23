# Supabase Setup Walkthrough - Step by Step

## 🎯 Goal

Set up a Supabase project and push the YouTube Channel Linking database migrations.

**Time**: 15-20 minutes
**Difficulty**: Easy

---

## Step 1: Create Supabase Project

### 1.1 Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Sign in with your account (or create one)

### 1.2 Create New Project

1. Click "New Project"
2. Fill in the form:
   - **Organization**: Select your organization
   - **Project name**: `gabrieltoth-prod` (or similar)
   - **Database password**: Generate a strong password
     - Click "Generate a password"
     - Copy and save it somewhere safe
   - **Region**: Select the region closest to your users
     - Recommended: US East (us-east-1) or EU West (eu-west-1)
   - **Pricing plan**: Select "Free" for testing, "Pro" for production

3. Click "Create new project"

### 1.3 Wait for Project to Be Ready

- The project will take 1-2 minutes to initialize
- You'll see a loading screen
- Wait until you see the project dashboard

**Expected**: You should see the Supabase dashboard with your project name at the top

---

## Step 2: Get Project Reference

### 2.1 Navigate to Settings

1. In the Supabase dashboard, click "Settings" (bottom left)
2. Click "General"

### 2.2 Copy Project Reference

1. Look for "Project Reference" (format: `xxxxxxxxxxxxx`)
2. Click the copy icon next to it
3. Save it: `PROJECT_REF = _______________`

**Example**: `PROJECT_REF = abcdefghijklmnop`

---

## Step 3: Link Local Project to Supabase

### 3.1 Open Terminal

Open your terminal/command prompt in the project directory.

### 3.2 Run Link Command

```bash
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
```

**Replace** `YOUR_PROJECT_REFERENCE` with your actual project reference.

**Example**:
```bash
npx supabase link --project-ref abcdefghijklmnop
```

### 3.3 Enter Supabase Password

When prompted, enter the database password you created in Step 1.2.

**Expected output**:
```
Linked to project: gabrieltoth-prod (abcdefghijklmnop)
```

**Note**: This creates a `.supabase/config.json` file (don't commit this!)

---

## Step 4: Push Database Migrations

### 4.1 Run Push Command

```bash
npx supabase db push
```

### 4.2 Wait for Migrations to Apply

The command will apply all 6 migrations:

```
Applying migration 20250101000001_create_youtube_channels_table.sql
Applying migration 20250101000002_create_linking_activity_table.sql
Applying migration 20250101000003_create_recovery_tokens_table.sql
Applying migration 20250101000004_create_audit_logs_table.sql
Applying migration 20250101000005_create_unlink_revocation_window_table.sql
Applying migration 20250101000006_create_data_retention_policies.sql
```

**Expected**: All migrations apply successfully with no errors

---

## Step 5: Verify Tables Created

### 5.1 Go to Supabase Dashboard

1. Go back to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" (left sidebar)

### 5.2 Run Verification Query

Copy and paste this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'youtube_%'
ORDER BY table_name;
```

Click "Run" or press Ctrl+Enter.

### 5.3 Verify Results

You should see 5 tables:

```
youtube_channels
youtube_linking_activity
youtube_recovery_tokens
youtube_audit_logs
youtube_unlink_revocation_window
```

**If you see all 5 tables**: ✅ Success! Move to Step 6.

**If you see fewer tables**: ❌ Something went wrong. Check the error message and try again.

---

## Step 6: Enable Row Level Security (RLS)

### 6.1 Go to Authentication > Policies

1. In Supabase dashboard, click "Authentication" (left sidebar)
2. Click "Policies"

### 6.2 Enable RLS on Each Table

For each table, do the following:

1. Click on the table name
2. Toggle "Enable RLS" to ON
3. You should see a green checkmark

**Tables to enable RLS on**:
- [ ] `youtube_channels`
- [ ] `youtube_linking_activity`
- [ ] `youtube_recovery_tokens`
- [ ] `youtube_audit_logs`
- [ ] `youtube_unlink_revocation_window`

### 6.3 Verify RLS Enabled

After enabling RLS on all tables, you should see:
- All 5 tables listed
- Each with "RLS enabled" status

---

## Step 7: Add RLS Policies (Optional but Recommended)

### 7.1 Add Policies to youtube_channels

1. Click on `youtube_channels` table
2. Click "New Policy"
3. Select "For SELECT"
4. Paste this policy:

```sql
CREATE POLICY "Users can view their own channels"
ON youtube_channels FOR SELECT
USING (auth.uid() = user_id);
```

5. Click "Save"

### 7.2 Add More Policies

Repeat for INSERT, UPDATE, DELETE:

**INSERT Policy**:
```sql
CREATE POLICY "Users can insert their own channels"
ON youtube_channels FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**UPDATE Policy**:
```sql
CREATE POLICY "Users can update their own channels"
ON youtube_channels FOR UPDATE
USING (auth.uid() = user_id);
```

**DELETE Policy**:
```sql
CREATE POLICY "Users can delete their own channels"
ON youtube_channels FOR DELETE
USING (auth.uid() = user_id);
```

### 7.3 Add Policy to youtube_audit_logs

1. Click on `youtube_audit_logs` table
2. Click "New Policy"
3. Select "For SELECT"
4. Paste this policy:

```sql
CREATE POLICY "Users can view their own audit logs"
ON youtube_audit_logs FOR SELECT
USING (auth.uid() = user_id);
```

5. Click "Save"

---

## Step 8: Get API Credentials

### 8.1 Go to Settings > API

1. Click "Settings" (bottom left)
2. Click "API"

### 8.2 Copy Credentials

You'll need these for environment variables:

1. **Project URL**
   - Copy the URL (format: `https://your-project.supabase.co`)
   - Save as: `NEXT_PUBLIC_SUPABASE_URL`

2. **anon/public key**
   - Copy the "anon public" key
   - Save as: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

3. **service_role key**
   - Copy the "service_role" key
   - ⚠️ Keep this secret! Don't share it.
   - Save as: `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Supabase Setup Complete!

You've successfully:
- ✅ Created a Supabase project
- ✅ Linked your local project
- ✅ Pushed database migrations
- ✅ Verified all 5 tables created
- ✅ Enabled RLS on all tables
- ✅ Added RLS policies
- ✅ Got API credentials

---

## 🚀 Next Steps

1. **Get Other Credentials**
   - YouTube OAuth credentials
   - GeoIP API key
   - Token encryption key
   - See: `.agent/DEPLOYMENT_CHECKLIST.md` Phase 2

2. **Setup Environment Variables**
   - Update `.env.local` with all credentials
   - Set Vercel environment variables
   - See: `.agent/DEPLOYMENT_CHECKLIST.md` Phase 2

3. **Test Locally**
   - Start dev server: `npm run dev`
   - Test YouTube linking
   - Run tests: `npm run test`
   - See: `.agent/DEPLOYMENT_CHECKLIST.md` Phase 3

---

## 🆘 Troubleshooting

### Issue: "Cannot find project ref"

**Solution**:
1. Go to Supabase dashboard
2. Go to Settings > General
3. Copy the Project Reference
4. Run: `npx supabase link --project-ref YOUR_PROJECT_REFERENCE`

### Issue: "Authentication failed"

**Solution**:
1. Verify your Supabase password is correct
2. Try logging out and back in:
   ```bash
   npx supabase logout
   npx supabase link --project-ref YOUR_PROJECT_REFERENCE
   ```

### Issue: "Migration failed"

**Solution**:
1. Check Supabase dashboard for errors
2. Go to SQL Editor and check for syntax errors
3. Try pushing again: `npx supabase db push`

### Issue: "Tables not created"

**Solution**:
1. Verify migrations were applied:
   ```bash
   npx supabase migration list
   ```
2. Check Supabase dashboard > SQL Editor for tables
3. If missing, manually run migration SQL

### Issue: "RLS policies not working"

**Solution**:
1. Verify RLS is enabled on tables
2. Check policy conditions are correct
3. Test with Supabase Studio

---

## 📞 Need Help?

1. **Check Documentation**
   - `.agent/SUPABASE_DEPLOYMENT_GUIDE.md` - Full Supabase guide
   - `.agent/DEPLOYMENT_CHECKLIST.md` - Complete deployment checklist

2. **Check Logs**
   - Supabase dashboard > SQL Editor for database errors
   - Terminal output for command errors

3. **Common Issues**
   - See "Troubleshooting" section above

---

## 📋 Supabase Setup Checklist

- [ ] Supabase account created
- [ ] Project created
- [ ] Project reference copied
- [ ] Local project linked: `npx supabase link`
- [ ] Migrations pushed: `npx supabase db push`
- [ ] All 5 tables verified
- [ ] RLS enabled on all tables
- [ ] RLS policies added
- [ ] API credentials copied
- [ ] Credentials saved for next steps

---

**Status**: ✅ Ready for next phase
**Next**: Get credentials and setup environment variables
**Time**: 15-20 minutes
