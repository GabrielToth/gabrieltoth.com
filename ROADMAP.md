# Roadmap — gabrieltoth.com

> This document tracks completed work and planned future work for the project.

## ✅ Completed — June 2026 Cycle

| Item | Issue | PR | Status |
|------|-------|----|--------|
| Fix "Conectar Canais" OAuth buttons not working — replace `x-user-id` header with `getServerSession()` | [#100](https://github.com/GabrielToth/gabrieltoth.com/issues/100) | [#102](https://github.com/GabrielToth/gabrieltoth.com/pull/102) | ✅ Built & validated (DRAFT — needs merge) |
| Fix GET `/api/posts/` 500 error — create missing `scheduled_posts` table | [#101](https://github.com/GabrielToth/gabrieltoth.com/issues/101) | [#103](https://github.com/GabrielToth/gabrieltoth.com/pull/103) | ✅ Built & validated (DRAFT — needs merge) |
| Update CHANGELOG with production fixes | — | [#104](https://github.com/GabrielToth/gabrieltoth.com/pull/104) | ✅ Built & validated |
| Superseded: OAuth inconsistent error responses | — | — | ⏭️ Superseded by session-cookie approach |
| Superseded: Middleware `x-user-id` header injection | — | — | ⏭️ Superseded by session-cookie approach |

## 🔜 Next Up

### Merge & Release

- [ ] **Manual review & merge** PR [#102](https://github.com/GabrielToth/gabrieltoth.com/pull/102) — OAuth authorize fix (DRAFT → ready)
- [ ] **Manual review & merge** PR [#103](https://github.com/GabrielToth/gabrieltoth.com/pull/103) — Database migration for `scheduled_posts`
- [ ] **Merge & deploy** PR [#104](https://github.com/GabrielToth/gabrieltoth.com/pull/104) — CHANGELOG update
- [ ] **Tag release** `v1.17.0` after all three PRs are merged (bug-fix release)

### Testing & Quality

- [ ] Add test coverage for OAuth authorize routes (NextAuth `getServerSession` path)
- [ ] Add integration test for `POST /api/posts` with valid session
- [ ] Add test for `GET /api/posts` after migration (verify tables exist)

### Infrastructure

- [ ] Add status check / CI to ensure DB migrations are run in preview deployments
- [ ] Document OAuth flow for future maintainers (session vs. header approach)

## 📌 Milestones

| Milestone | State | Issues |
|-----------|-------|--------|
| Stage 1 — Create and Configure | Open | 0 open |
| Feature Roadmap — Social Media & AI Integration | Open | 0 open |
