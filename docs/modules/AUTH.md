# Module: Authentication

## Description

Authentication system using Auth.js (NextAuth) with PostgreSQL as session database.

## Features

- Login via Google OAuth
- Multiple platform linking (Twitch, YouTube, Kick, TikTok, etc.)
- Cross-platform unique identifier

## Files

- `src/lib/auth/` - Auth.js configuration
- `src/app/api/auth/[...nextauth]/route.ts` - Auth routes

## Flow

1. User clicks "Login with Google"
2. Redirects to Google OAuth
3. Callback creates/updates profile in database
4. Session created in Redis/DB

## Platform Linking

After login, user can link:

- Twitch, YouTube, Kick, TikTok, Facebook, Trovo, Kwai

Each link stores:

- `platform_user_id`
- `platform_username`
- `access_token` / `refresh_token`

## Status: 🔴 NOT IMPLEMENTED

Next step: v0.2.0
