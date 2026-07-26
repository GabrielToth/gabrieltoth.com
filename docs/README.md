# gabrieltoth.com Documentation

> Complete documentation for the gabrieltoth.com platform

## 📚 Table of Contents

- [Architecture](./architecture/README.md) - System design, patterns, and principles
- [API Reference](./api/README.md) - All REST API endpoints
- [Components](./components/README.md) - React component library
- [Guides](./guides/README.md) - How-to guides and tutorials

## 🚀 Quick Start

### Local Development

```bash
npm install
npm run dev
```

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL=your_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🏗️ Architecture Overview

```
src/
├── app/              # Next.js App Router (pages + API routes)
├── components/       # React components
├── lib/              # Business logic + utilities
├── hooks/            # Custom React hooks
├── types/            # TypeScript definitions
└── i18n/             # Internationalization (4 languages)
```

**Principles:**
- Clean Architecture (domain → application → infrastructure)
- Zero external costs (free tier only)
- i18n first (EN, PT-BR, ES, DE)
- Type-safe everywhere

## 🔗 Key Links

- [API Documentation](./api/README.md)
- [Component Storybook](http://localhost:6006)
- [Architecture Diagrams](./architecture/diagrams/)
- [Contributing Guide](../CONTRIBUTING.md)

## 📊 Tech Stack

- **Framework**: Next.js 15 + React 19
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth + Custom JWT
- **Styling**: Tailwind CSS + Radix UI
- **i18n**: next-intl (4 languages)
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions

## 🌍 Internationalization

All UI strings are translated into 4 languages:
- English (`en`)
- Português Brasil (`pt-BR`)
- Español (`es`)
- Deutsch (`de`)

Translation files: `src/i18n/{locale}/*.json`

## 📝 Documentation Status

| Category | Status | Files |
|----------|--------|-------|
| API Routes | 🚧 In Progress | 50+ endpoints |
| Components | 🚧 In Progress | 150+ components |
| Architecture | ✅ Complete | 8 diagrams |
| Guides | 📝 Planned | - |

---

**Last updated**: 2026-07-26  
**Maintained by**: Gabriel Toth
