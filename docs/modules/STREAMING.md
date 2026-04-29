# Module: Streaming

## Description

Restream system with quality validation and billing based on actual usage.

## Features

- RTMP ingest
- Restream to multiple platforms
- Specs validation (resolution, bitrate, fps)
- Billing per minute of stream

## Files

- `src/app/api/platform/stream/route.ts` - API endpoints

## Base Cost

- 1080p30: 1,000 credits/minute

## Multipliers

| Quality | Multiplier |
| ------- | ---------- |
| 720p30  | 0.5x       |
| 1080p30 | 1.0x       |
| 1080p60 | 1.5x       |
| 1440p60 | 2.5x       |
| 4K60    | 5.0x       |

## Specs Validation

If user sends higher quality than configured:

- Stream is cancelled
- 20% penalty applied

## Suggested Backend

- Cloudflare Stream or AWS IVS

## Status: 🔴 NOT IMPLEMENTED

Next step: v0.7.0
