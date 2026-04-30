# Module: Analytics

## Description

Aggregated metrics dashboard from all linked platforms.

## Features

- Unified view of all platforms
- Daily charts (last 30 days)
- Filters by platform/channel
- Credit/infrastructure consumption view

## Files

- `src/app/api/platform/analytics/route.ts` - API endpoints

## Collected Metrics

| Platform | Metrics                  |
| -------- | ------------------------ |
| YouTube  | Views, subs, watch time  |
| Twitch   | Viewers, followers, subs |
| TikTok   | Views, likes, shares     |

## Cost

- Daily dashboard access: 1,000 credits

## Views

1. **Creator**: Sees their own consumption and metrics
2. **Admin**: Sees profit/cost per user

## Status: 🟡 PARTIALLY IMPLEMENTED

Basic endpoint created. Missing: external metrics collection.
