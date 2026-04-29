# Module: YouTube Tools

## Description

Tools for downloading, extracting metadata, and scheduling content from YouTube.

## Features

- Video download (multiple qualities)
- Playlist/channel complete download
- Metadata extraction (thumb, description, tags)
- Multi-platform publication scheduling
- AI rewriting

## Files

- `src/app/api/platform/youtube/route.ts` - API endpoints
- `src/lib/youtube/` - Download logic (yt-dlp wrapper)

## Cost

- Download: 100 credits/minute of video
- Metadata: Free (with download)
- Schedule post: 50 credits
- AI rewrite: 500 credits/1k tokens

## Limitations

- Downloads processed via queue (Cloudflare Workers or QStash)
- Temporary storage in R2/S3

## Status: 🔴 NOT IMPLEMENTED

Next step: v0.4.0
