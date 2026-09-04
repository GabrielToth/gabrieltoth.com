# GABRIELTOTH.COM — COMPONENT REGISTRY & DESIGN SYSTEM STANDARDS

> **Status:** ACTIVE (Source of Truth for Agents & Developers)
> **Last Updated:** September 2026

---

## 🎨 1. DESIGN SYSTEM & COLOR TOKENS

To maintain high contrast and avoid "washed out greys", **NEVER** use hardcoded hex colors (`#0a0a0a`, `#171717`, `#242424`) or untokenized Tailwind grey classes (`bg-neutral-800`, `bg-zinc-900`).

### Semantic Color Variables (CSS)

| Token | CSS Variable | Intended Usage |
| :--- | :--- | :--- |
| `bg-background` | `var(--background)` | Deepest layer / page root background (`#050505`) |
| `bg-card` | `var(--card)` | Elevated cards, forms, panels, dialogs (`#111111`) |
| `bg-muted` | `var(--muted)` | Subtle section dividers / container fills (`#0f0f0f`) |
| `border-border` | `var(--border)` | Subtle crisp container borders (`#2e2e2e`) |
| `text-foreground` | `var(--foreground)` | Primary high-contrast text |
| `text-muted-foreground` | `var(--muted-foreground)` | Secondary supporting text |
| `text-primary` | `var(--primary)` | Accent branding / primary call-to-actions |

---

## 📄 2. PAGE ALIAS & ROUTE TYPING CONVENTION

All App Router pages located in localized directories must enforce strong parameter typing:

```tsx
import type { LocalePageProps } from "../lib/locale-page-props"

export async function generateMetadata(props: LocalePageProps) {
    const { locale } = await props.params
    // ...
}
```

---

## 🧩 3. COMPONENT REGISTRY BY CATEGORY

### A. Layout & Global Shell (`src/components/layout/`)
- `Header`: Main global navigation header with locale selector and auth state.
- `Footer`: Global footer with sitemap links across all 5 locales.

### B. Insights & Analytics (`src/components/insights/`)
- `InsightsContainer`: Dashboard container organizing tabs for metrics and comparison.
- `UserActivityHeatmap`: 24h x 7d user action audit frequency grid with real-time log feed.
- `ChannelComparison`: Multi-channel engagement metric comparison table.
- `ChannelGraphs`: Interactive follower / reach trend charts.
- `MetricsGrid`: 4-column summary metric cards with percentage change indicators.

### C. Live Stream & Unified Chat (`src/components/dashboard/live/`)
- `UnifiedChat`: Multi-platform aggregated chat (Twitch, Kick, YouTube, Facebook).
- `ChatModerationPanel`: Moderation tools, user timeout, ban controls.
- `StreamHealthCard`: Bitrate, drop-frame rate, and encoder telemetry monitor.
- `ViewerAnalyticsCard`: Real-time viewer count trend per live channel.

### D. Publishing & Scheduler (`src/components/publish/`)
- `PublishWizard`: Multi-step post creation wizard with channel targeting.
- `PostingScheduler`: Immediate vs scheduled publishing picker.
- `CalendarView`: Visual calendar view of upcoming scheduled posts.
- `PostList`: List of active, queued, and historical publications.

### E. Location & Geocoding (`src/components/location/`)
- `TownSearch`: MapLibre GL + Nominatim OSM city/town search client component.

---

## 🧪 4. TESTING ARCHITECTURE

- **Unit & Integration**: Vitest (`npm run test`)
- **i18n Parameters**: `npm run i18n:check-params`
- **Selenium Stealth E2E**: `npm run test:e2e:selenium` (Optional `--profile` mode for reusing Chrome/Edge/Brave real sessions).
- **Standards Linter**: `npm run standards:check`
