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

- End-to-end: Playwright (`tests/**`). These tests validate navigation, i18n, and UI behavior across browsers. Artifacts (report, traces) are generated on failures.
- Unit/Component: Vitest for Storybook stories (via `@storybook/addon-vitest`). Run with `npm run test:unit`.
- Jest: Kept for compatibility; `npm test` runs with `--passWithNoTests` so it won’t fail if there are no Jest tests yet.

## 🧪 Artifacts Policy

- Playwright: `playwright-report/` and `test-results/` are gitignored. Use `npm run test:e2e:report` to open the report.
- Lighthouse CI: `.lighthouseci/` and `lhci_reports/` are gitignored. Use `npm run lighthouse`
