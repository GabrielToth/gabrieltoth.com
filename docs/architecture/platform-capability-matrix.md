# Platform capability matrix (LOCAL vs CLOUD)

## Why

Publishing to a social platform is only possible within what that platform
officially allows. Some formats do not exist through the public API (for
example, YouTube Community text posts), and some integrations require
confidential secrets or webhooks that cannot safely run in a browser.

Before this change, each page and API route had its own implicit assumptions,
so the UI could offer an action that the backend would reject later — and
LOCAL and CLOUD could drift apart silently.

## Single source of truth

All rules live in one file:

```
src/lib/posting/platform-capabilities.data.json
```

Both runtimes compile the same file:

- TypeScript: `src/lib/posting/platform-capabilities.ts` imports the JSON.
- Rust: `rust-core/src/capabilities.rs` embeds it with `include_str!` and
  deserializes it into `PlatformRegistry`.

Because there is exactly one data file, a rule can never exist in LOCAL but
not in CLOUD (or the reverse). The Rust tests and the TypeScript tests both
assert that every platform exposes all four content formats.

## Dimensions

Each platform defines:

- `liveChat`: protocol, whether it is official, and whether it is allowed in
  LOCAL and/or CLOUD.
- `capabilities` per content type (`text_only`, `image_text`, `short_video`,
  `long_video`): support, LOCAL/CLOUD permission, character limit, file size,
  min/max duration, and a human-readable note used as the rejection reason.

## Enforcement points

1. **Publish UI** (`src/components/publish/PostingInterface.tsx`)
   - The user chooses CLOUD or LOCAL.
   - `CrossPlatformCompatibilityBadge` shows, per selected network, what is
     compatible and why.
   - Publishing is blocked before any request when the matrix rejects the
     combination.
2. **Browser (LOCAL)** (`src/lib/local-projects/publish.ts`)
   - Validates with `environment: "local"`.
   - Calls the platform API directly with the user's own credentials.
   - Never calls our own `/api/*` routes; when a browser adapter is missing it
     fails closed with `LOCAL_ADAPTER_REQUIRED` instead of using the backend.
3. **Backend (CLOUD)**
   - `src/lib/posting/publish-guard.ts` runs the same validation.
   - `POST /api/posts` rejects `mode: "local"` with `LOCAL_MODE_NOT_ALLOWED`,
     so a LOCAL action can never be charged, stored, or executed server-side.
   - `POST /api/posts/validate` returns the matrix result alongside existing
     content conflict checks.

## Rules of thumb

- `allowedInLocal: false` means the platform requires secrets, webhooks, or
  lacks CORS support. The UI tells the user to switch to CLOUD.
- `supported: false` means the format does not exist in the official API and is
  unavailable in both modes.
- Adding a platform or changing a limit is a one-file change; update the JSON,
  then run both `npx vitest run src/lib/posting src/lib/local-projects` and
  `cargo test` inside `rust-core/`.
