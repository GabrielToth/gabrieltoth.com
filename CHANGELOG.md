# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.23.0] - 2026-07-12

### Added
- **Twitch OAuth 2.0 Integration**: Full OAuth 2.0 authorization code flow for Twitch with user-level token management. New `src/lib/twitch/` module with config (scopes: `chat`, `moderation`, `channel:manage:broadcast`, `user:read:broadcast`, `user:read:email`, `whispers`), OAuth service (authorize URL generation, token exchange, refresh, revoke), and barrel export. API routes at `/api/oauth/authorize/twitch`, `/api/oauth/callback/twitch`, and `/api/oauth/disconnect/twitch`. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Kick OAuth 2.1 Integration with PKCE**: Full OAuth 2.1 authorization code flow with Proof Key for Code Exchange (PKCE S256) for Kick. New configuration with scopes: `user:read`, `channel:read`, `channel:write`, `chat:write`, `moderation`, `channel_points`. API routes at `/api/oauth/authorize/kick`, `/api/oauth/callback/kick`, and `/api/oauth/disconnect/kick`. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Twitch IRC Chat Adapter**: Real-time Twitch chat via IRC protocol. New `src/lib/chat/twitch-adapter.ts` for receiving and sending chat messages. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Kick WebSocket Chat Adapter**: Real-time Kick chat via WebSocket protocol. New `src/lib/chat/kick-adapter.ts` for receiving and sending chat messages. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Live Dashboard Page**: New live streaming management page with `StreamStatusCard`, `StreamTitleEditor`, and `UnifiedChat` components. Accessible via "Live" nav item in sidebar. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Live Status API endpoints**: `/api/live/status` and `/api/live/update` for real-time stream state management. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **YouTube live status support**: Live stream detection via YouTube Data API v3. ([#227](https://github.com/GabrielToth/gabrieltoth.com/pull/227))
- **Facebook live status support**: Live stream detection via Facebook Graph API. ([#227](https://github.com/GabrielToth/gabrieltoth.com/pull/227))
- **Instagram live status support**: Live stream detection via Instagram Graph API. ([#227](https://github.com/GabrielToth/gabrieltoth.com/pull/227))
- **"twitch" and "kick" added to types**: Both added to `SocialPlatform` and `OAuthPlatform` type unions across the platform system. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Dashboard redirect OAuth params**: Dashboard now handles `?twitch=` and `?kick=` query parameters for OAuth callback redirects. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Translation keys**: Added i18n strings for all live/streaming features across all 4 locales (en, pt-BR, es, de). ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Environment variables**: Added `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_REDIRECT_URI`, `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, and `KICK_REDIRECT_URI` to `env.ts` and all platform configs. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))

### Changed
- **Facebook/Instagram marked as `localOnly`**: Meta Advanced Access requires CNPJ for production publishing. Both platforms set to `localOnly: true` in platform configs. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Twitch/Kick marked as `implemented: true`**: Both platforms fully enabled in production. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Trovo removed entirely**: Removed from wizard types, icons, SEO metadata, and channels page (4 files). ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **Kick added to channels VALID_PLATFORMS**: Kick now available in channel connect/disconnect API routes. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))
- **"Live" nav item added to Sidebar**: New navigation entry with `dashboard-layout-client` type support. ([#225](https://github.com/GabrielToth/gabrieltoth.com/issues/225), [#226](https://github.com/GabrielToth/gabrieltoth.com/pull/226))

### Fixed
- **Twitch OAuth scopes corrected**: 7 invalid scopes removed and replaced with valid Twitch API scopes (`chat`, `moderation`, `channel:manage:broadcast`, `user:read:broadcast`, `user:read:email`, `whispers`). ([#227](https://github.com/GabrielToth/gabrieltoth.com/pull/227))
- **Kick OAuth now uses PKCE**: Added `code_verifier` and `code_challenge` (S256) for OAuth 2.1 compliance. ([#227](https://github.com/GabrielToth/gabrieltoth.com/pull/227))

## [1.22.0] - 2026-07-10

### Added
- **Twitter/X OAuth 2.0 PKCE Integration**: Full OAuth 2.0 authorization code flow with Proof Key for Code Exchange (PKCE S256) for Twitter/X API v2. New `src/lib/twitter/` module with config, OAuth service (code_challenge/code_verifier generation, token exchange, secure storage), token refresh helper, and user-level posting adapter. API routes at `/api/oauth/authorize/twitter` and `/api/oauth/callback/twitter`. Twitter/X now uses user-level OAuth tokens instead of the previous Bearer token approach. ([#221](https://github.com/GabrielToth/gabrieltoth.com/issues/221), [#223](https://github.com/GabrielToth/gabrieltoth.com/pull/223))
- **LinkedIn OAuth 2.0 Integration**: Full OAuth 2.0 authorization code flow for LinkedIn with user-level token management. New `src/lib/linkedin/` module with config (scopes: `w_member_social`, `r_liteprofile`, `r_emailaddress`, `w_organization_social`, `openid`, `profile`, `email`), OAuth service (authorize URL generation, token exchange, refresh, revoke, user info), and token refresh helper. API routes at `/api/oauth/authorize/linkedin` and `/api/oauth/callback/linkedin`. Posting adapter rewritten to use user-level OAuth tokens from the token store with UGC post API fallback, replacing the previous static `LINKEDIN_ACCESS_TOKEN` environment variable approach. Environment variables `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI` added. ([#222](https://github.com/GabrielToth/gabrieltoth.com/issues/222), [#224](https://github.com/GabrielToth/gabrieltoth.com/pull/224))

## [1.21.2] - 2026-07-09

### Fixed
- **TikTok token response format**: TikTok's `/v2/oauth/token/` wraps tokens in nested `data.data` object. Added `normalizeTokenResponse()` helper that checks both flat and wrapped formats. ([#215](https://github.com/GabrielToth/gabrieltoth.com/issues/215), [#218](https://github.com/GabrielToth/gabrieltoth.com/pull/218))
- **Facebook OAuth redirect URI**: Error 1349168 "URL bloqueada" — production redirect URI needs to be whitelisted in Meta Developer Portal > Facebook Login > Settings. ([#216](https://github.com/GabrielToth/gabrieltoth.com/issues/216))
- **Instagram OAuth redirect URI**: Same redirect URI whitelist issue. OAuth permanently blocked without CNPJ for Meta Advanced Access. Bypass via `INSTAGRAM_PAGE_ACCESS_TOKEN` env var is already implemented. ([#217](https://github.com/GabrielToth/gabrieltoth.com/issues/217))
- **Facebook and TikTok OAuth**: Fixed 500 error "Environment configuration is required" — added `process.env` fallback to config singletons so they work in serverless without explicit env parameter. Facebook also falls back to Instagram's app credentials. ([#200](https://github.com/GabrielToth/gabrieltoth.com/pull/200))

### Added
- **TikTok publishing**: Full TikTok publishing end-to-end — NetworkSelect entry, metadata types, background processor, adapter barrel export, API route validation, publish status endpoint, content adapter config. ([#197](https://github.com/GabrielToth/gabrieltoth.com/issues/197), [#198](https://github.com/GabrielToth/gabrieltoth.com/pull/198))
- **Instagram publishing**: Full Instagram publishing support — background processor now calls real adapter instead of mock, barrel export added. ([#194](https://github.com/GabrielToth/gabrieltoth.com/issues/194), [#195](https://github.com/GabrielToth/gabrieltoth.com/pull/195))
- **Draft management UI**: Post history with draft indicators (grayed-out cards), calendar shows gray dots for drafts and blue for scheduled/published. API-based draft CRUD replaces localStorage. ([#185](https://github.com/GabrielToth/gabrieltoth.com/issues/185), [#191](https://github.com/GabrielToth/gabrieltoth.com/pull/191))
- **YouTube members-only visibility**: Added members-only option and scheduled publishing (publishAt) for YouTube videos. ([#180](https://github.com/GabrielToth/gabrieltoth.com/issues/180), [#186](https://github.com/GabrielToth/gabrieltoth.com/pull/186))

### Changed
- **Network select**: Now shows actual linked account count per platform instead of hardcoded "implemented"/"connected" booleans. Platforms with 0 accounts appear grayed out. ([#183](https://github.com/GabrielToth/gabrieltoth.com/issues/183), [#189](https://github.com/GabrielToth/gabrieltoth.com/pull/189))
- **Publish wizard title**: Changed from "Publish to YouTube" to generic "Publish" across all 4 locales. ([#181](https://github.com/GabrielToth/gabrieltoth.com/issues/181), [#187](https://github.com/GabrielToth/gabrieltoth.com/pull/187))

### Fixed
- **Step navigation bug**: Added Next button to VideoUploadStep when navigating back with existing video, fixing blocked progression. ([#182](https://github.com/GabrielToth/gabrieltoth.com/issues/182), [#193](https://github.com/GabrielToth/gabrieltoth.com/pull/193))
- **Dark mode readability**: Added `dark:text-white` to PublishContainer title and `dark:text-gray-400` to descriptions. ([#184](https://github.com/GabrielToth/gabrieltoth.com/issues/184), [#190](https://github.com/GabrielToth/gabrieltoth.com/pull/190))

## [1.16.0] - 2026-06-30

### Added
- Services landing page test suite — 35 unit and metadata tests (PR [#89](https://github.com/GabrielToth/gabrieltoth.com/pull/89))
- Coverage crisis Phase 1 — test suite stabilization with 357 files passing, 6645/6649 tests (PR [#87](https://github.com/GabrielToth/gabrieltoth.com/pull/87))
- `src/lib/validation/` domain modules — extracted from 988-line validation.ts into 8 files (PR [#86](https://github.com/GabrielToth/gabrieltoth.com/pull/86))

### Changed
- Updated resend from ^6.12.0 to ^6.16.0 (PR [#88](https://github.com/GabrielToth/gabrieltoth.com/pull/88))

## [1.12.0] - 2024-04-28

### Added

#### Secure Login Implementation

**Backend Infrastructure**

- Database schema for users, sessions, remember_me_tokens, audit_logs, and rate_limit_attempts
- Comprehensive input validation functions (email, password, CSRF token, request body)
- Password hashing with Argon2id (cost factor 12) and constant-time comparison
- CSRF protection with cryptographically secure token generation and validation
- Session management with 1-hour expiration and automatic refresh
- Remember Me functionality with 30-day token expiration
- Rate limiting with 5 attempts per hour per IP address
- Audit logging for all authentication events with 90+ day retention
- Redis integration for distributed caching (with in-memory fallback for local development)

**API Endpoints**

- POST /api/auth/login - Authenticate user with email and password
- Comprehensive error handling with generic error messages
- Security headers (CSP, X-Frame-Options, HSTS, etc.)
- Request ID generation for tracing and debugging
- Performance monitoring and metrics

**Frontend Components**

- LoginForm component with email and password inputs
- PasswordVisibilityToggle component with keyboard accessibility
- Remember Me checkbox for extended session duration
- CSRF token integration
- Error message display with user-friendly messages
- Loading state during submission
- Accessibility features (ARIA labels, keyboard navigation)
- Responsive design (mobile, tablet, desktop)

**Security Features**

- SQL injection prevention with parameterized queries
- XSS protection with input sanitization and CSP headers
- CSRF protection with token validation
- Brute force protection with rate limiting
- Timing attack prevention with constant-time comparison
- User enumeration prevention with generic error messages
- Session hijacking prevention with secure cookies
- Password cracking prevention with Argon2id hashing
- Information disclosure prevention with generic error messages

**Testing**

- Unit tests for all authentication functions (>90% coverage)
- Integration tests for complete login flow
- Security tests for injection attacks, XSS, CSRF, brute force
- Performance tests for response time under load
- Accessibility tests for WCAG 2.1 Level AA compliance
- Tests for both cloud and local environments
- Tests for edge cases (expired tokens, concurrent requests)

**Documentation**

- API documentation with endpoint details, parameters, and responses
- Security documentation with threat model and security measures
- Deployment guide for cloud (Vercel/AWS) and local environments
- Troubleshooting guide for common issues
- Code comments explaining complex logic and security decisions
- Runbooks for operational tasks
- Changelog documenting all changes

**Environment Configuration**

- Support for cloud deployment (Vercel, AWS)
- Support for local development with Docker
- Environment-specific configuration (database, cache, secrets)
- Security headers configuration
- HTTPS enforcement in production
- Audit log retention policy

**Monitoring and Alerting**

- Error tracking with Sentry integration
- Performance monitoring with Lighthouse
- Audit log monitoring for compliance
- Rate limiting alerts
- Authentication failure alerts
- Security event alerts

### Changed

- Updated authentication middleware to support session token validation
- Enhanced error handling with request IDs for tracing
- Improved password validation with strength requirements
- Optimized database queries with proper indexing
- Updated security headers for better protection

### Fixed

- Fixed timing attack vulnerability in password comparison
- Fixed user enumeration vulnerability with generic error messages
- Fixed CSRF token expiration handling
- Fixed rate limiting counter reset logic
- Fixed session token refresh logic

### Security

- Implemented Argon2id password hashing with cost factor 12
- Implemented CSRF token validation on all login requests
- Implemented rate limiting (5 attempts per hour per IP)
- Implemented secure cookie flags (HttpOnly, Secure, SameSite)
- Implemented input validation and sanitization
- Implemented security headers (CSP, X-Frame-Options, HSTS)
- Implemented audit logging for compliance
- Implemented constant-time password comparison

### Performance

- Optimized database queries with indexes on email, user_id, IP
- Optimized password hashing with Argon2id cost factor 12
- Optimized rate limiting with Redis caching
- Optimized session storage with caching strategy
- Achieved <500ms response time for login endpoint
- Achieved >90% test coverage

### Compliance

- OWASP Top 10 (2021) compliance
- NIST password guidelines compliance
- GDPR compliance with audit logging
- SOC 2 compliance with access control and monitoring

## [1.11.0] - 2024-04-15

### Added

- Initial project setup with Next.js and TypeScript
- Database schema for user management
- Basic authentication middleware
- Environment configuration for cloud and local

### Changed

- Updated project dependencies to latest versions
- Improved build process with better error handling

### Fixed

- Fixed TypeScript compilation errors
- Fixed ESLint warnings

## [1.10.0] - 2024-04-01

### Added

- Initial project structure
- Basic API routes
- Frontend components

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner
- **PATCH** version when you make backwards compatible bug fixes

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Create git tag: `git tag v1.12.0`
4. Push to repository: `git push origin main --tags`
5. Create GitHub release with changelog

## Security

For security issues, please email <security@gabrieltoth.com> instead of using the issue tracker.

## Support

For support, please visit:

- Documentation: <https://gabrieltoth.com/docs>
- Issues: <https://github.com/gabrieltoth/gabrieltoth.com/issues>
- Email: <support@gabrieltoth.com>
