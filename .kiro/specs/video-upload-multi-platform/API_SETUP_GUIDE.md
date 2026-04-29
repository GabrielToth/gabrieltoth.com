# Complete API Configuration Guide

This guide provides detailed step-by-step instructions to enable and configure the necessary APIs for the multi-platform video upload module.

## Table of Contents

1. [YouTube API (Google Cloud)](#1-youtube-api-google-cloud)
2. [Facebook API (Meta for Developers)](#2-facebook-api-meta-for-developers)
3. [Instagram API (Meta for Developers)](#3-instagram-api-meta-for-developers)
4. [TikTok API (TikTok for Developers)](#4-tiktok-api-tiktok-for-developers)
5. [Environment Variables Configuration](#5-environment-variables-configuration)
6. [Testing the Configuration](#6-testing-the-configuration)

---

## 1. YouTube API (Google Cloud)

### Step 1.1: Create Project in Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. At the top of the page, click **"Select a project"**
4. Click **"NEW PROJECT"**
5. Fill in:
   - **Project name**: `video-upload-platform` (or your preferred name)
   - **Organization**: Leave as is (optional)
6. Click **"CREATE"**
7. Wait a few seconds for the project to be created

### Step 1.2: Enable YouTube Data API v3

1. With the project selected, go to the left sidebar menu
2. Click **"APIs & Services"** > **"Library"**
3. In the search bar, type: `YouTube Data API v3`
4. Click on the **"YouTube Data API v3"** result
5. Click the blue **"ENABLE"** button
6. Wait for activation (a few seconds)

### Step 1.3: Configure OAuth Consent Screen

1. In the left sidebar, click **"OAuth consent screen"**
2. Select **"External"** (to allow any user with a Google account)
3. Click **"CREATE"**
4. Fill in the required information:
   - **App name**: `Video Upload Platform`
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"SAVE AND CONTINUE"**

### Step 1.4: Add Scopes (Permissions)

1. In the **"Scopes"** section, click **"ADD OR REMOVE SCOPES"**
2. In the list, search for and check the following scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
3. Click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

### Step 1.5: Add Test Users (Test Mode)

1. In the **"Test users"** section, click **"ADD USERS"**
2. Add the emails of Google accounts you'll use for testing
3. Click **"SAVE"**
4. Click **"SAVE AND CONTINUE"**
5. Review the information and click **"BACK TO DASHBOARD"**

### Step 1.6: Create OAuth 2.0 Credentials

1. In the left sidebar, click **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth client ID"**
4. In **"Application type"**, select **"Web application"**
5. Fill in:
   - **Name**: `Video Upload Web Client`
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/oauth/callback?platform=youtube`
     - `https://your-domain.com/api/oauth/callback?platform=youtube`
6. Click **"CREATE"**
7. **IMPORTANT**: Copy and save:
   - **Client ID** (something like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (something like: `GOCSPX-abc123xyz`)

### YouTube Summary

✅ **Required scopes**:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`

✅ **Credentials obtained**:
- Client ID
- Client Secret

✅ **Redirect URI**:
- `http://localhost:3000/api/oauth/callback?platform=youtube`

---

## 2. Facebook API (Meta for Developers)

### Step 2.1: Create Account on Meta for Developers

1. Visit [Meta for Developers](https://developers.facebook.com/)
2. Click **"Get Started"** in the top right corner
3. Sign in with your Facebook account
4. Complete developer registration (accept terms)

### Step 2.2: Create an App

1. In the dashboard, click **"My Apps"** at the top
2. Click **"Create App"**
3. Select type: **"Business"**
4. Click **"Next"**
5. Fill in:
   - **App name**: `Video Upload Platform`
   - **App contact email**: Your email
6. Click **"Create app"**
7. Complete the security verification (CAPTCHA)

### Step 2.3: Configure Facebook Login

1. In the app dashboard, look for **"Facebook Login"** in the products
2. Click **"Set Up"**
3. Select **"Web"** as the platform
4. In **"Site URL"**, add:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
5. Click **"Save"**

### Step 2.4: Configure OAuth Redirect URIs

1. In the left sidebar, go to **"Facebook Login"** > **"Settings"**
2. In **"Valid OAuth Redirect URIs"**, add:
   - `http://localhost:3000/api/oauth/callback?platform=facebook`
   - `https://your-domain.com/api/oauth/callback?platform=facebook`
3. Click **"Save Changes"**

### Step 2.5: Add Permissions

1. In the left sidebar, go to **"App Review"** > **"Permissions and Features"**
2. Search for and request the following permissions:
   - `pages_manage_posts` - To post videos on pages
   - `pages_read_engagement` - To read engagement
   - `pages_show_list` - To list user pages
3. For each permission, click **"Request"**
4. **NOTE**: Some permissions require Facebook review (may take days)

### Step 2.6: Get Credentials

1. In the left sidebar, go to **"Settings"** > **"Basic"**
2. **IMPORTANT**: Copy and save:
   - **App ID** (something like: `123456789012345`)
   - **App Secret** (click "Show" to see, something like: `abc123def456ghi789`)

### Step 2.7: Switch to Development Mode

1. At the top of the dashboard, you'll see the app status
2. If it's in **"Development"**, that's correct
3. For testing, keep it in development mode
4. For production, you'll need to submit the app for review

### Facebook Summary

✅ **Required permissions**:
- `pages_manage_posts`
- `pages_read_engagement`
- `pages_show_list`

✅ **Credentials obtained**:
- App ID
- App Secret

✅ **Redirect URI**:
- `http://localhost:3000/api/oauth/callback?platform=facebook`

---

## 3. Instagram API (Meta for Developers)

**IMPORTANT**: Instagram API uses the same app as Facebook. You do NOT need to create a new app.

### Step 3.1: Add Instagram to Existing App

1. In the same app created for Facebook, go to the dashboard
2. Look for **"Instagram"** in the available products
3. Click **"Set Up"** on the **"Instagram Graph API"** product

### Step 3.2: Configure Instagram Basic Display

1. In the left sidebar, go to **"Instagram"** > **"Basic Display"**
2. Click **"Create New App"**
3. Fill in:
   - **Display Name**: `Video Upload Platform`
4. In **"Valid OAuth Redirect URIs"**, add:
   - `http://localhost:3000/api/oauth/callback?platform=instagram`
   - `https://your-domain.com/api/oauth/callback?platform=instagram`
5. In **"Deauthorize Callback URL"**, add:
   - `http://localhost:3000/api/oauth/deauthorize`
6. In **"Data Deletion Request URL"**, add:
   - `http://localhost:3000/api/oauth/data-deletion`
7. Click **"Save Changes"**

### Step 3.3: Add Instagram Permissions

1. Go to **"App Review"** > **"Permissions and Features"**
2. Search for and request:
   - `instagram_basic` - Basic profile access
   - `instagram_content_publish` - To publish content
3. Click **"Request"** for each permission

### Step 3.4: Connect Instagram Business Account

**IMPORTANT**: To post videos, you need an Instagram Business account connected to a Facebook page.

1. Convert your Instagram account to Business:
   - Open the Instagram app on your phone
   - Go to **Settings** > **Account**
   - Tap **Switch to professional account**
   - Select **Business**
   - Connect to a Facebook page
2. Note the **Instagram Business Account ID** (you'll need it)

### Step 3.5: Get Instagram App ID and Secret

1. In the left sidebar, go to **"Instagram"** > **"Basic Display"**
2. **IMPORTANT**: Copy and save:
   - **Instagram App ID**
   - **Instagram App Secret** (click "Show")

### Instagram Summary

✅ **Required permissions**:
- `instagram_basic`
- `instagram_content_publish`

✅ **Credentials obtained**:
- Instagram App ID (same as Facebook App ID)
- Instagram App Secret (same as Facebook App Secret)

✅ **Redirect URI**:
- `http://localhost:3000/api/oauth/callback?platform=instagram`

✅ **Additional requirements**:
- Instagram Business account
- Connected Facebook page

---

## 4. TikTok API (TikTok for Developers)

### Step 4.1: Create Account on TikTok for Developers

1. Visit [TikTok for Developers](https://developers.tiktok.com/)
2. Click **"Register"** in the top right corner
3. Sign in with your TikTok account (or create one)
4. Complete developer registration

### Step 4.2: Create an App

1. In the dashboard, click **"Manage apps"**
2. Click **"Connect an app"**
3. Select **"Create a new app"**
4. Fill in:
   - **App name**: `Video Upload Platform`
   - **App description**: `Platform for uploading videos to multiple social media`
5. Click **"Submit"**

### Step 4.3: Configure App Settings

1. After creating the app, click on it to open settings
2. Go to **"Basic information"**
3. In **"Redirect domain"**, add:
   - `localhost:3000` (development)
   - `your-domain.com` (production)
4. Click **"Save"**

### Step 4.4: Add Scopes (Permissions)

1. Go to the **"Add products"** tab
2. Search for **"Login Kit"** and click **"Apply"**
3. Search for **"Content Posting API"** and click **"Apply"**
4. Select the following scopes:
   - `user.info.basic` - Basic user information
   - `video.upload` - Video upload
   - `video.publish` - Video publishing
5. Fill out the request form explaining the use
6. Click **"Submit"**
7. **NOTE**: Approval may take 1-7 business days

### Step 4.5: Configure Redirect URIs

1. Go to **"Login Kit"** > **"Settings"**
2. In **"Redirect URI"**, add:
   - `http://localhost:3000/api/oauth/callback?platform=tiktok`
   - `https://your-domain.com/api/oauth/callback?platform=tiktok`
3. Click **"Save"**

### Step 4.6: Get Credentials

1. Go to **"Basic information"**
2. **IMPORTANT**: Copy and save:
   - **Client Key** (something like: `aw123abc456def`)
   - **Client Secret** (click "Show", something like: `xyz789ghi012jkl`)

### Step 4.7: Wait for Approval

1. After requesting scopes, wait for TikTok approval
2. You'll receive an email when approved
3. While waiting, you can develop using mocked data

### TikTok Summary

✅ **Required scopes**:
- `user.info.basic`
- `video.upload`
- `video.publish`

✅ **Credentials obtained**:
- Client Key
- Client Secret

✅ **Redirect URI**:
- `http://localhost:3000/api/oauth/callback?platform=tiktok`

⚠️ **IMPORTANT**: Requires approval (1-7 business days)

---

## 5. Environment Variables Configuration

After obtaining all credentials, configure the `.env.local` file in the project root:

```bash
# App Configuration
APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/video_upload_db

# Redis (for queue and rate limiting)
REDIS_URL=redis://localhost:6379

# Encryption Key (generate a random 32-byte key)
ENCRYPTION_KEY=your-32-byte-encryption-key-here-change-this

# YouTube API (Google Cloud)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz

# Facebook API (Meta for Developers)
META_APP_ID=123456789012345
META_APP_SECRET=abc123def456ghi789

# Instagram API (uses same credentials as Facebook)
INSTAGRAM_APP_ID=123456789012345
INSTAGRAM_APP_SECRET=abc123def456ghi789

# TikTok API (TikTok for Developers)
TIKTOK_CLIENT_KEY=aw123abc456def
TIKTOK_CLIENT_SECRET=xyz789ghi012jkl

# File Storage (optional, for production)
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AWS_S3_BUCKET=your-bucket-name
# AWS_REGION=us-east-1
```

### How to Generate ENCRYPTION_KEY

Run in terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the result and paste it in `ENCRYPTION_KEY`.

---

## 6. Testing the Configuration

### Step 6.1: Verify Environment Variables

Create a test script `scripts/test-env.ts`:

```typescript
// Checks if all variables are configured
const requiredEnvVars = [
  'APP_URL',
  'DATABASE_URL',
  'REDIS_URL',
  'ENCRYPTION_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'META_APP_ID',
  'META_APP_SECRET',
  'INSTAGRAM_APP_ID',
  'INSTAGRAM_APP_SECRET',
  'TIKTOK_CLIENT_KEY',
  'TIKTOK_CLIENT_SECRET',
];

const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
} else {
  console.log('✅ All environment variables are configured!');
}
```

Run:

```bash
npx tsx scripts/test-env.ts
```

### Step 6.2: Test Database Connection

```bash
# Install PostgreSQL locally or use Docker
docker run --name postgres-video-upload -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Test the connection
psql postgresql://user:password@localhost:5432/video_upload_db
```

### Step 6.3: Test Redis Connection

```bash
# Install Redis locally or use Docker
docker run --name redis-video-upload -p 6379:6379 -d redis

# Test the connection
redis-cli ping
# Should return: PONG
```

### Step 6.4: Test OAuth Flow

1. Start the development server:
```bash
npm run dev
```

2. Access in your browser:
```
http://localhost:3000/api/oauth/authorize?platform=youtube
```

3. You should be redirected to Google's consent screen
4. After authorizing, you should be redirected back to your application

5. Repeat for other platforms:
```
http://localhost:3000/api/oauth/authorize?platform=facebook
http://localhost:3000/api/oauth/authorize?platform=instagram
http://localhost:3000/api/oauth/authorize?platform=tiktok
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI is not configured correctly.

**Solution**:
1. Verify that the URI in the code matches EXACTLY the one configured in the platform console
2. Include the protocol (`http://` or `https://`)
3. Include the port if in development (`localhost:3000`)
4. Don't add a trailing slash (`/`)

### Error: "invalid_client"

**Cause**: Incorrect Client ID or Client Secret.

**Solution**:
1. Verify that you copied the credentials correctly
2. Check that there are no extra spaces in `.env.local`
3. Restart the server after changing `.env.local`

### Error: "insufficient_permissions"

**Cause**: Scopes/permissions have not been approved.

**Solution**:
1. Verify that you requested all necessary permissions
2. For Facebook/Instagram, wait for review approval
3. For TikTok, wait for app approval (1-7 days)

### Error: "access_denied"

**Cause**: User denied permissions or app is not in test mode.

**Solution**:
1. For Google: Add the user as a "Test user" in the OAuth consent screen
2. For Facebook: Keep the app in "Development" mode during testing
3. For TikTok: Wait for app approval

---

## Next Steps

After configuring all APIs:

1. ✅ Run database migrations
2. ✅ Start the development server
3. ✅ Test the OAuth flow for each platform
4. ✅ Test uploading a test video
5. ✅ Check audit logs in the database

## Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [TikTok API Documentation](https://developers.tiktok.com/doc)

---

**Last updated**: 2026-03-05
