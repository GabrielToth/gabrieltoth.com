# Module: Unified Chat

## Description

Chat aggregator from multiple platforms with cross-platform moderation system.

## Features

- View chats from live streamers (free)
- Unified chat for streamers (paid)
- Cross-platform moderation
- Persistent/renewable timeouts
- Sub/gift notifications

## Files

- `src/app/api/platform/chat/route.ts` - API and WebSocket
- `src/lib/platforms/` - Adapters for each platform

## Supported Platforms

- Twitch (IRC)
- YouTube Live
- Kick
- TikTok Live
- Facebook Gaming
- Trovo

## Cost

- Message received: 1 credit
- Timeout: 10 credits
- Ban: 25 credits

## Status: 🔴 NOT IMPLEMENTED

Next step: v0.5.0
