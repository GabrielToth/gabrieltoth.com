# Roadmap — gabrieltoth.com

> This document tracks completed work and planned future work for the project.

## ✅ Completed — July 2026 Cycle (Phase 3: Live Chat, Refactoring, Testing & CI)

| Item | Issue | PR | Status |
|------|-------|----|--------|
| YouTube, Facebook, Instagram live chat adapters | [#228](https://github.com/GabrielToth/gabrieltoth.com/issues/228) | [#241](https://github.com/GabrielToth/gabrieltoth.com/pull/241) | ✅ **Built** |
| SSE backend for real-time unified chat | [#229](https://github.com/GabrielToth/gabrieltoth.com/issues/229) | [#242](https://github.com/GabrielToth/gabrieltoth.com/pull/242) | ✅ **Built (DRAFT)** |
| Stream key management UI (Twitch + Kick) | [#230](https://github.com/GabrielToth/gabrieltoth.com/issues/230) | [#243](https://github.com/GabrielToth/gabrieltoth.com/pull/243) | ✅ **Built** |
| Scheduled streams & Discord/Telegram notifications | [#231](https://github.com/GabrielToth/gabrieltoth.com/issues/231) | [#244](https://github.com/GabrielToth/gabrieltoth.com/pull/244) | ✅ **Built (DRAFT)** |
| Test coverage for Twitch/Kick live streaming (139 tests) | [#232](https://github.com/GabrielToth/gabrieltoth.com/issues/232) | [#245](https://github.com/GabrielToth/gabrieltoth.com/pull/245) | ✅ **Built** |
| README documentation for live streaming modules | [#233](https://github.com/GabrielToth/gabrieltoth.com/issues/233) | [#246](https://github.com/GabrielToth/gabrieltoth.com/pull/246) | ✅ **Built** |
| Update npm deps (TypeScript 7 + ESLint 10 + 17 minor bumps) | [#234](https://github.com/GabrielToth/gabrieltoth.com/issues/234) | [#247](https://github.com/GabrielToth/gabrieltoth.com/pull/247) | ✅ **Built (DRAFT)** |
| Refactor `session.ts` (815→3 modules) | [#235](https://github.com/GabrielToth/gabrieltoth.com/issues/235) | [#248](https://github.com/GabrielToth/gabrieltoth.com/pull/248) | ✅ **Built (DRAFT)** |
| Refactor `PublishWizard.tsx` (847→modular hooks) | [#236](https://github.com/GabrielToth/gabrieltoth.com/issues/236) | [#249](https://github.com/GabrielToth/gabrieltoth.com/pull/249) | ✅ **Built** |
| Refactor `YouTubeMetadataForm.tsx` (766→7 components) | [#237](https://github.com/GabrielToth/gabrieltoth.com/issues/237) | [#250](https://github.com/GabrielToth/gabrieltoth.com/pull/250) | ✅ **Built** |
| OAuth token unit tests (TikTok, authorize routes, Posts API) | [#238](https://github.com/GabrielToth/gabrieltoth.com/issues/238) | [#251](https://github.com/GabrielToth/gabrieltoth.com/pull/251) | ✅ **Built** |
| CI blocking tests — remove `continue-on-error` | [#239](https://github.com/GabrielToth/gabrieltoth.com/issues/239) | [#252](https://github.com/GabrielToth/gabrieltoth.com/pull/252) | ✅ **Built** |
| OAuth flow architecture documentation | [#240](https://github.com/GabrielToth/gabrieltoth.com/issues/240) | [#253](https://github.com/GabrielToth/gabrieltoth.com/pull/253) | ✅ **Built** |

## ✅ Completed — July 2026 Cycle (Phase 1)

| Item | Issue | PR | Status |
|------|-------|----|--------|
| Twitter/X OAuth 2.0 PKCE Integration | [#221](https://github.com/GabrielToth/gabrieltoth.com/issues/221) | [#223](https://github.com/GabrielToth/gabrieltoth.com/pull/223) | ✅ **MERGED & DEPLOYED** |
| LinkedIn OAuth 2.0 Integration | [#222](https://github.com/GabrielToth/gabrieltoth.com/issues/222) | [#224](https://github.com/GabrielToth/gabrieltoth.com/pull/224) | ✅ **MERGED & DEPLOYED** |
| Fix TikTok OAuth token response format — nested `data.data` wrapping | [#215](https://github.com/GabrielToth/gabrieltoth.com/issues/215) | [#218](https://github.com/GabrielToth/gabrieltoth.com/pull/218) | ✅ **MERGED** — Added `normalizeTokenResponse()` helper |
| Document Facebook redirect URI whitelist requirement | [#216](https://github.com/GabrielToth/gabrieltoth.com/issues/216) | — | 📋 **Config-only** — User must add URIs in Meta Developer Portal |
| Document Instagram OAuth bypass (CNPJ limitation) | [#217](https://github.com/GabrielToth/gabrieltoth.com/issues/217) | — | 📋 **Config-only** — Bypass via `INSTAGRAM_PAGE_ACCESS_TOKEN` env var |

## ✅ Completed — July 2026 Cycle (Phase 2: Twitch + Kick Live Streaming)

| Item | Issue | PR | Status |
|------|-------|----|--------|
| Remove Trovo references from platform types and configs | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Add Twitch + Kick to `SocialPlatform` type union | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Add Twitch + Kick to `OAuthPlatform` type union | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Add Twitch to scope versions | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Add Kick + Twitch to OAuth manager config | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Create Twitch platform configuration | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Create Twitch OAuth service (authorize, callback, disconnect routes) | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Add Kick to channels valid platforms | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Add Twitch+Kick env vars to `.env.ts` and examples | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Create Twitch chat adapter (IRC-based) | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Create Kick chat adapter (WebSocket-based) | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Create chat barrel export | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Create live dashboard page | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Create unified chat component (Twitch + Kick) | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Create stream management components | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Update dashboard navigation with live link + OAuth callback | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |
| Mark Facebook/Instagram as `localOnly` | [#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225) | [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226) | ✅ **MERGED** |

## ✅ Completed — June 2026 Cycle

| Item | Issue | PR | Status |
|------|-------|----|--------|
| Fix "Conectar Canais" OAuth buttons not working — replace `x-user-id` header with `getServerSession()` | [#100](https://github.com/GabrielToth/gabrieltoth.com/issues/100) | [#102](https://github.com/GabrielToth/gabrieltoth.com/pull/102) | ✅ **MERGED** |
| Fix GET `/api/posts/` 500 error — create missing `scheduled_posts` table | [#101](https://github.com/GabrielToth/gabrieltoth.com/issues/101) | [#103](https://github.com/GabrielToth/gabrieltoth.com/pull/103) | ✅ **MERGED** |
| Update CHANGELOG with production fixes | — | [#104](https://github.com/GabrielToth/gabrieltoth.com/pull/104) | ✅ **MERGED** |
| Superseded: OAuth inconsistent error responses | — | — | ⏭️ Superseded by session-cookie approach |
| Superseded: Middleware `x-user-id` header injection | — | — | ⏭️ Superseded by session-cookie approach |

## 🔜 Next Up

### Manual Config (User Action Required)

- [ ] **Add redirect URIs** to Meta Developer Portal > Facebook Login > Settings (Issue [#216](https://github.com/GabrielToth/gabrieltoth.com/issues/216))
- [ ] **Set up Instagram Business Account** or use `INSTAGRAM_PAGE_ACCESS_TOKEN` env var bypass (Issue [#217](https://github.com/GabrielToth/gabrieltoth.com/issues/217))
- [ ] **Configure Facebook/Instagram live chat** — The adapters are built but cannot connect in production until redirect URIs are whitelisted

### Pending PRs (Awaiting Merge)

- [ ] **Review & merge** PR [#241](https://github.com/GabrielToth/gabrieltoth.com/pull/241) — YouTube/Facebook/Instagram live chat adapters
- [ ] **Review & promote** PR [#242](https://github.com/GabrielToth/gabrieltoth.com/pull/242) — SSE backend (DRAFT → ready)
- [ ] **Review & merge** PR [#243](https://github.com/GabrielToth/gabrieltoth.com/pull/243) — Stream key management
- [ ] **Review & promote** PR [#244](https://github.com/GabrielToth/gabrieltoth.com/pull/244) — Scheduled streams (DRAFT → ready)
- [ ] **Review & merge** PR [#245](https://github.com/GabrielToth/gabrieltoth.com/pull/245) — Live streaming tests
- [ ] **Review & merge** PR [#246](https://github.com/GabrielToth/gabrieltoth.com/pull/246) — Live streaming docs
- [ ] **Review & promote** PR [#247](https://github.com/GabrielToth/gabrieltoth.com/pull/247) — NPM deps update (DRAFT → ready)
- [ ] **Review & promote** PR [#248](https://github.com/GabrielToth/gabrieltoth.com/pull/248) — session.ts refactor (DRAFT → ready)
- [ ] **Review & merge** PR [#249](https://github.com/GabrielToth/gabrieltoth.com/pull/249) — PublishWizard refactor
- [ ] **Review & merge** PR [#250](https://github.com/GabrielToth/gabrieltoth.com/pull/250) — YouTubeMetadataForm refactor
- [ ] **Review & merge** PR [#251](https://github.com/GabrielToth/gabrieltoth.com/pull/251) — OAuth token tests
- [ ] **Review & merge** PR [#252](https://github.com/GabrielToth/gabrieltoth.com/pull/252) — CI blocking tests
- [ ] **Review & merge** PR [#253](https://github.com/GabrielToth/gabrieltoth.com/pull/253) — OAuth flow docs
- [ ] **Tag release** after all PRs are merged

### Infrastructure

- [ ] **Add status check / CI** to ensure DB migrations are run in preview deployments
- [ ] **Verify CI pipeline works with blocking tests** — tests now block CI, confirm no regressions

### Live Streaming — Stretch Goals (Future)

- [ ] Multi-platform simultaneous streaming (RTMP relay)
- [ ] Stream health monitoring (bitrate, dropped frames, latency)
- [ ] Live viewer analytics and retention metrics
- [ ] Chat moderation tools (keyword filters, timeout, automated responses)

### Refactoring — Next Candidates

- [ ] **Audit remaining large components** (>300 lines) for potential splitting — the session.ts, PublishWizard, and YouTubeMetadataForm refactors significantly improved maintainability
- [ ] **Review barrel exports** after refactoring — ensure clean import paths, no circular dependencies

### Testing — Expansion

- [ ] **Add E2E tests** for critical user flows (login, publish, OAuth connection)
- [ ] **Add integration tests** for SSE real-time chat delivery (PR #242)

## 📌 Milestones

| Milestone | State | Issues |
|-----------|-------|--------|
| Stage 1 — Create and Configure | Open | 0 open |
| Feature Roadmap — Social Media & AI Integration | Open | 0 open |

## 💡 Proactive Suggestions

| Priority | Description | Reason |
|----------|-------------|--------|
| 🟢 1 | **DB migration CI check** — Add a CI step to verify migrations run cleanly in preview deployments | Existing roadmap item; gaps found during live streaming work |
| 🟢 2 | **Promote 4 Draft PRs to ready** — SSE backend, scheduled streams, deps update, session refactor | These PRs are implemented but not mergeable in Draft state |
| 🔵 3 | **E2E test setup** — Framework exists but no end-to-end tests for critical user flows | Project now has unit + component tests; E2E is the next level |
| 🔵 4 | **Verify CI after blocking mode** — Confirm `continue-on-error` removal doesn't break deploys | CI was recently made blocking; should validate nothing is broken |
