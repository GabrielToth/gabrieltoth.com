# 🤖 AI Context - Gabriel Toth Platform

This file contains essential context for any AI working on this project.

---

## About the Project

**gabrieltoth.com** is a multi-purpose platform that includes:

1. **Personal Portfolio** (existing frontend)
2. **Content Creator Platform** (in development)
    - Credit system for usage
    - Unified multi-platform chat
    - Video download/scheduling
    - Analytics dashboard
    - Streaming with metering

---

## Relevant Folder Structure

```
src/
├── app/
│   ├── [locale]/         # Frontend (Next.js i18n)
│   └── api/
│       ├── platform/     # ⭐ Content creator platform APIs
│       │   ├── credits/
│       │   ├── youtube/
│       │   ├── chat/
│       │   ├── analytics/
│       │   ├── stream/
│       │   └── webhooks/
│       └── ...           # Existing APIs (contact, payments)
├── lib/
│   ├── db/               # ⭐ PostgreSQL client
│   ├── credits/          # ⭐ Credit system
│   ├── metering/         # ⭐ Infrastructure metering
│   ├── stripe/           # Payments
│   └── ...               # Existing libraries
└── components/           # UI components
```

---

## Code Patterns

### Naming Conventions

- **Files**: `kebab-case.ts`
- **React Components**: `PascalCase.tsx`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

### API Routes

- Use `NextResponse.json()` for responses
- Always validate user input
- Always verify authentication where necessary
- Log errors with `console.error`

### Database

- Use `query()` from `@/lib/db`
- Transactions with `BEGIN`, `COMMIT`, `ROLLBACK`
- Parameterize queries (prevent SQL injection)

---

## Credit System

- 1 Credit ≈ $0.0001 USD
- Each action has a cost in `CREDIT_COSTS` (see `src/lib/credits/index.ts`)
- Infrastructure is charged: bandwidth, disk, cache

---

## Main Endpoints

| Method | Path                           | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| GET    | `/api/platform/analytics`      | User consumption dashboard     |
| POST   | `/api/platform/credits/deduct` | Deduct credits                 |
| GET    | `/api/health`                  | Health check                   |

---

## Before Starting

1. Read `/onboarding` workflow
2. Understand the specific module in `docs/modules/`
3. Follow `/testing` before committing
4. In case of problems, use `EMERGENCY_ROLLBACK.md`
