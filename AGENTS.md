# gabrieltoth.com — Agent Guide

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 6** — single `package.json`, not a monorepo
- **Tailwind CSS 4** via PostCSS, **shadcn/ui** (new-york, RSC enabled), **lucide-react** icons
- **next-intl** — 4 locales shipped by default: `en`, `pt-BR`, `es`, `de`; default is `pt-BR`. Architecture supports adding more — every user-facing string lives in `src/i18n/{locale}/*.json`, never in TSX.
- **Separate Express 5 backend** in `src/backend/` (port 4000, via `tsx` for dev). Vercel handles frontend + API routes; the Express backend is for Docker/local/AWS Lambda deployments.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Next.js dev server (Turbopack, port 3000) |
| `npm run build` | Production build — **does NOT type-check** (see next.config.ts) |
| `npm run type-check` | `tsc --noEmit` on both tsconfig.json + tsconfig.test.json |
| `npm run lint` | ESLint on `src/**/*.{ts,tsx}` |
| `npm run format:check` | Prettier check (CI uses this) |
| `npm run format` | Prettier write |
| `npm run spell-check` | CSpell on source files |
| `npm run test` | Vitest (unit/component tests only — see exclusions below) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with coverage (v8) |
| `npm run test:all` | **Full CI quality gate**: type-check → lint → format:check → spell-check → test |
| `npm run test:e2e` | Playwright E2E tests (`tests/`) |
| `npm run start:backend` | Express 5 backend on port 4000 (tsx watch) |

**Use `npm run test:all` before pushing** — it runs the same gate as CI.

## Testing quirks

- Vitest runs **jsdom** environment, globals enabled, 10s timeout.
- Many test files are **explicitly excluded** from `vitest.config.ts` and will be **skipped** unless infra is up:
  - DB/integration/security tests that require Docker + Supabase
  - Backend integration tests, credit/metering system tests
- Property-based testing uses `@fast-check/vitest` (tests that use it may be slower).
- E2E tests live in `tests/` (root), not `src/`.
- `npm run test:e2e` auto-starts the dev server via Playwright config.

## Architecture notes

- **Path alias**: `@/*` → `./src/*` (used in all imports).
- **Supabase**: Schema dump (`supabase/schema.sql` + `supabase/seed.sql`) is the source of truth. Migration files (`supabase/migrations/`) can also be used and uploaded via `npx supabase db push`. First run `npx supabase login` (opens browser — user logs in manually).
- **Generated/build artifacts**: `.next/`, `dist/`, `out/`, `coverage/`, `playwright-report/` — `npm run clean` removes them all.
- **Debug**: Single `DEBUG=true` env var controls both server and client debug output.
- **Node**: `24.x` required (`.nvmrc` = `24.13.0`). Builds will fail on older versions.
- **`.env.local.example`** has extensive documentation (695 lines) for every environment variable.

## Mandatory: Check existing patterns before implementing

**BEFORE writing ANY new code (routes, tests, docs, components), you MUST:**
1. Read **this file** (`AGENTS.md`) fully
2. Read **`.cursorrules`** — project conventions
3. Search for **existing test files** in `src/__tests__/` relevant to your task — copy their patterns
4. Read **`docs/API.md`** and any relevant `docs/modules/*.md` — follow the exact documentation format
5. Check **`src/__tests__/security/`** for security test patterns (request validation, CSRF, rate limiting)
6. Check **`src/lib/middleware/CSRF_USAGE.md`** for CSRF patterns on state-changing endpoints
7. Check **`.cursor/rules/`** for any rule files (`.mdc`)
8. Look at similar existing implementations before creating new ones

**For API routes specifically:**
- Always add JSDoc comment blocks matching the pattern in `src/app/api/auth/login/route.ts`
- Always add input validation: type checks, extra field rejection, length limits
- Always update `docs/API.md` with new endpoints

**CRITICAL: Complete attack test matrix — do NOT skip this step.**
Before finishing ANY route implementation, you MUST enumerate ALL attack vectors per route and implement tests for EVERY applicable category below. For each route, write a comment listing which categories apply before writing tests.

| # | Category | What to test |
|---|----------|-------------|
| 1 | **Auth bypass** | null/expired/invalid/malformed session, non-existent user |
| 2 | **HTTP method confusion** | POST on GET route, GET on POST route |
| 3 | **Type attacks** | string, number, boolean, null, array, object, NaN, Infinity, undefined |
| 4 | **Value attacks** | negative, zero, decimal, max boundary, >MAX_SAFE_INTEGER, empty string, whitespace-only |
| 5 | **Structure attacks** | missing fields, extra fields, empty body `{}`, array body `[]`, null body, BOM prefix |
| 6 | **Prototype pollution** | `__proto__`, `constructor.prototype`, `constructor[prototype]` |
| 7 | **Injection** | SQL injection in string fields, XSS/HTML, command injection, NoSQL operators (`$ne`, `$gt`) |
| 8 | **Unicode/encoding** | emoji, null byte `\0`, control chars, unicode normalization, UTF-16, right-to-left override |
| 9 | **Size attacks** | oversized string (10k+), deep JSON nesting (100+ levels), body > 1MB, duplicate keys, JSON bomb |
| 10 | **Rate limiting** | within limit, exceeded limit, burst (concurrent), reset behavior |
| 11 | **CSRF** | missing token, expired token, wrong token, token from different session |
| 12 | **Race conditions** | concurrent duplicate requests, TOCTOU window, parallel state mutations |
| 13 | **Content-Type** | wrong Content-Type, missing Content-Type, multipart, charset confusion |
| 14 | **HTTP header** | request smuggling, host override, X-Forwarded-For spoofing, cache poisoning |
| 15 | **Info disclosure** | stack traces in errors, internal paths, user enumeration, timing side-channels |
| 16 | **Business logic** | self-grant, negative credit operations, replay attacks, insufficient funds bypass |
| 17 | **IDOR** | access another user's resource by changing ID/email in params/body |
| 18 | **Path traversal** | `../`, `..\\`, absolute paths in filename/directory params |
| 19 | **Mass assignment** | extra body fields that map to DB columns (role, isAdmin, balance) |
| 20 | **SSRF** | URL params that make the server fetch external resources |
| 21 | **Timing side-channel** | measurable response time difference between valid/invalid inputs |

**Implementation rule:** For EACH route, first write a comment block listing which matrix rows apply (e.g., `// Attack matrix: 1,3,4,5,6,7,8,9,10,11,13`), then write one `it()` per attack variant. Only omit a category if you can justify it with a `// SKIP: reason` comment. If unsure, implement anyway — false positive > missed attack.

**Failing to complete the full attack matrix is the #1 source of rework — this has been explicitly requested by the project owner.**

## Code conventions

- **No semicolons**, **double quotes** for strings and JSX, **4-space indent** (see `.prettierrc.json`).
- **English only** in code, comments, commits, docs, issues, PRs. Non-English only in i18n JSON translation files (`src/i18n/`).
- **All user-facing text must come from i18n JSON** — never hardcode display strings in TSX files.
- Arrow functions for components, props destructuring, `export default` at end of file.
- Components in PascalCase, files in kebab-case.

## Existing instruction files

- `.cursorrules` — Cursor IDE rules (partially stale: says Next.js 15, i18n EN/PT-BR only)
- `.agents/steering/best-practices.md` — Very detailed (1349 lines) with mandatory startup infra, auto-issue/commit workflow, security testing, DB migrations
- `.agents/skills/` — Email/Resend skill instructions
