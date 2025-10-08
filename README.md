# Gabriel Toth Portfolio

Personal portfolio of Gabriel Toth Gonçalves - Full Stack Developer

## 🚀 Demo

- **Production**: [https://www.gabrieltoth.com](https://www.gabrieltoth.com)
- **Repository**: [GitHub](https://github.com/gabrieltoth)

## ⚡ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel
- **Internationalization**: EN/PT-BR support

## 🛠️ Development Tools

- **Linting**: ESLint with custom rules
- **Formatting**: Prettier
- **Spell Check**: CSpell (EN + PT-BR)
- **Git Hooks**: Husky + lint-staged
- **Type Checking**: TypeScript strict mode

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/gabrieltoth/gabrieltoth.com.git

# Navigate to directory
cd gabrieltoth.com

# Install dependencies
npm install

# Run in development
npm run dev
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server (Turbopack)

# Build and Deploy
npm run build            # Generate production build
npm run start            # Start production server

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Auto fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check if code is formatted
npm run type-check       # Check TypeScript types
npm run spell-check      # Check spelling
npm run test             # Run Vitest (non-failing if no tests)
npm run test:unit        # Run Vitest
npm run test:e2e         # Run Playwright tests

# Utilities
npm run clean            # Clean build files
```

## ✅ Testing Strategy

## 🔑 Environment Variables

Create a `.env.local` file at the project root based on `env.example`:

```bash
cp env.example .env.local
```

Key variables:

- NEXT_PUBLIC_DEBUG: Enable debug UI (0/1 or true/false). When enabled, append `?debug=1` to IQ Test step URLs to open the panel.
- NEXT_PUBLIC_TURNSTILE_SITE_KEY: Cloudflare Turnstile (client).
- TURNSTILE_SECRET_KEY: Cloudflare Turnstile (server secret).
- NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG: Amazon affiliate tag shown in the affiliate page.
- WHATSAPP_*: Business API (webhook and outbound messages).
- PIX_*: PIX payment configuration.
- MONERO_ADDRESS / MONERO_VIEW_KEY: Monero payments.
- RESEND_API_KEY: Email provider.
- DISCORD_WEBHOOK_URL: Optional notifications.

On production (Vercel), set variables in Project Settings → Environment Variables. For debug UI, set `NEXT_PUBLIC_DEBUG=1` temporarily, then disable after use.

This project uses Vitest (unit/component) and Playwright (E2E). We collect coverage and enforce quality via CI.

- Unit/Component (Vitest): `npm run test` or `npm run test:unit`.
- Coverage: `npm run test:coverage` generates HTML and LCOV under `coverage/`.
- E2E (Playwright): `npm run test:e2e` (see report with `npm run test:e2e:report`).
- Watch mode: `npm run test:watch`.

Coverage workflow:

- We batch edits across multiple files, then run a single `npm run test:coverage` pass to validate all changes.
- LCOV is parsed in CI to list files below 100% and auto-create TODOs per file, which are then completed in batches.
- Some browser-native branches (alerts/navigation) are covered via targeted mocks; when not feasible, `/* c8 ignore next */` is used sparingly.

## 🧪 Artifacts Policy

- Playwright: `playwright-report/` and `test-results/` are gitignored. Use `npm run test:e2e:report` to open the report.
- Lighthouse CI: `.lighthouseci/` and `lhci_reports/` are gitignored. Use `npm run lighthouse`

## 🔐 Security & Audits

- Dependency audits are run periodically. Historical outputs may be stored as `audit.json`/`audit2.json` for reference.
- If not required for your workflow, these files can be safely removed. CI does not depend on them.

## 📊 Performance Toolkit

This project includes a comprehensive performance toolkit integrated into development and CI/CD.

Tools:

- Bundle Analysis: visualize chunks and dependencies (Next.js/webpack analyzer).
- Dev Performance Monitor: real-time Web Vitals and resources while developing.
- Lighthouse CI: automated audits with thresholds enforced in CI.

Key scripts:

```bash
# Bundle Analysis
npm run analyze          # generate analysis
npm run analyze:open     # open analysis automatically
npm run bundle:size      # show total bundle size

# Performance Testing
npm run perf             # build + analysis
npm run perf:full        # build + analysis + lighthouse

# Lighthouse CI
npm run lighthouse       # run audits
npm run lighthouse:ci    # collect and validate metrics
```

Thresholds (CI):

- Performance ≥ 80%, Accessibility ≥ 90%, SEO ≥ 80%, Core Web Vitals within limits.

Best practices implemented:

- Code splitting and dynamic imports, image optimization (WebP/AVIF), compression, optimized headers, lazy loading, and Web Vitals tracking. For deeper guidance, see inline comments and scripts above.
