# Roadmap — gabrieltoth.com

> This document tracks completed work and planned future work for the project.

## ✅ Completed — July 2026 Cycle

| Item | Issue | PR | Status |
|------|-------|----|--------|
| Twitter/X OAuth 2.0 PKCE Integration | [#221](https://github.com/GabrielToth/gabrieltoth.com/issues/221) | [#223](https://github.com/GabrielToth/gabrieltoth.com/pull/223) | ✅ **MERGED & DEPLOYED** |
| LinkedIn OAuth 2.0 Integration | [#222](https://github.com/GabrielToth/gabrieltoth.com/issues/222) | [#224](https://github.com/GabrielToth/gabrieltoth.com/pull/224) | ✅ **MERGED & DEPLOYED** |
| Fix TikTok OAuth token response format — nested `data.data` wrapping | [#215](https://github.com/GabrielToth/gabrieltoth.com/issues/215) | [#218](https://github.com/GabrielToth/gabrieltoth.com/pull/218) | ✅ **MERGED** — Added `normalizeTokenResponse()` helper |
| Document Facebook redirect URI whitelist requirement | [#216](https://github.com/GabrielToth/gabrieltoth.com/issues/216) | — | 📋 **Config-only** — User must add URIs in Meta Developer Portal |
| Document Instagram OAuth bypass (CNPJ limitation) | [#217](https://github.com/GabrielToth/gabrieltoth.com/issues/217) | — | 📋 **Config-only** — Bypass via `INSTAGRAM_PAGE_ACCESS_TOKEN` env var |

## ✅ Completed — June 2026 Cycle

| Item | Issue | PR | Status |
|------|-------|----|--------|
| Fix "Conectar Canais" OAuth buttons not working — replace `x-user-id` header with `getServerSession()` | [#100](https://github.com/GabrielToth/gabrieltoth.com/issues/100) | [#102](https://github.com/GabrielToth/gabrieltoth.com/pull/102) | ✅ Built & validated (DRAFT — needs merge) |
| Fix GET `/api/posts/` 500 error — create missing `scheduled_posts` table | [#101](https://github.com/GabrielToth/gabrieltoth.com/issues/101) | [#103](https://github.com/GabrielToth/gabrieltoth.com/pull/103) | ✅ Built & validated (DRAFT — needs merge) |
| Update CHANGELOG with production fixes | — | [#104](https://github.com/GabrielToth/gabrieltoth.com/pull/104) | ✅ Built & validated |
| Superseded: OAuth inconsistent error responses | — | — | ⏭️ Superseded by session-cookie approach |
| Superseded: Middleware `x-user-id` header injection | — | — | ⏭️ Superseded by session-cookie approach |

## 🔜 Next Up

### Manual Config (User Action Required)

- [ ] **Add redirect URIs** to Meta Developer Portal > Facebook Login > Settings (Issue [#216](https://github.com/GabrielToth/gabrieltoth.com/issues/216))
- [ ] **Set up Instagram Business Account** or use `INSTAGRAM_PAGE_ACCESS_TOKEN` env var bypass (Issue [#217](https://github.com/GabrielToth/gabrieltoth.com/issues/217))

### Merge & Release

- [ ] **Manual review & merge** PR [#102](https://github.com/GabrielToth/gabrieltoth.com/pull/102) — OAuth authorize fix (DRAFT → ready)
- [ ] **Manual review & merge** PR [#103](https://github.com/GabrielToth/gabrieltoth.com/pull/103) — Database migration for `scheduled_posts`
- [ ] **Merge & deploy** PR [#104](https://github.com/GabrielToth/gabrieltoth.com/pull/104) — CHANGELOG update
- [ ] **Tag release** `v1.17.0` after all three PRs are merged (bug-fix release)

### Testing & Quality

- [ ] Add test coverage for OAuth authorize routes (NextAuth `getServerSession` path)
- [ ] Add integration test for `POST /api/posts` with valid session
- [ ] Add test for `GET /api/posts` after migration (verify tables exist)
- [ ] Add unit tests for `normalizeTokenResponse()` helper (TikTok OAuth)
- [ ] Write actual vitest test files — framework is configured but no tests exist

### Infrastructure

- [ ] Change CI test suite from `continue-on-error: true` to blocking once test coverage is established
- [ ] Add status check / CI to ensure DB migrations are run in preview deployments
- [ ] Document OAuth flow for future maintainers (session vs. header approach)

## 📌 Milestones

| Milestone | State | Issues |
|-----------|-------|--------|
| Stage 1 — Create and Configure | Open | 0 open |
| Feature Roadmap — Social Media & AI Integration | Open | 0 open |
