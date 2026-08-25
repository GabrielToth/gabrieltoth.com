# Component Architecture & UI Design Standards — gabrieltoth.com

This document describes the general reusable components, charts, layout controls, and visual conventions across the application.

---

## 🎨 Design System & Theme Standards

- **Tailwind CSS 4**: Semantic theme tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`).
- **Color Palettes for Platforms**:
  - Twitch: `#9147ff` (`bg-purple-600`)
  - Kick: `#00e676` (`bg-emerald-500`)
  - YouTube: `#ff0000` (`bg-red-600`)
  - Facebook: `#1877f2` (`bg-blue-600`)
  - Instagram: `#e4405f` (`bg-pink-600`)
  - TikTok: `#000000` (`bg-neutral-900`)
  - LinkedIn: `#0a66c2` (`bg-blue-700`)
  - Twitter/X: `#1da1f2` (`bg-sky-500`)

---

## 🧩 Reusable Core Components

### `InsightsContainer` (`src/components/insights/InsightsContainer.tsx`)
- **Purpose:** Main analytics dashboard container.
- **Props:** `children?: React.ReactNode`
- **State & Data:** Fetches normalized platform analytics from `/api/platform/analytics`. Coordinates `MetricsGrid`, `ChannelComparison`, `ChannelGraphs`, and `TimePeriodSelector`.

### `ViewerAnalyticsCard` (`src/components/dashboard/live/viewer-analytics-card.tsx`)
- **Purpose:** Visualizes real-time viewer retention and chat engagement retention curves.
- **Props:**
  - `history`: `Array<{ timestamp: number; count: number }>`
  - `chatHistory`: `Array<{ timestamp: number; chattersCount: number; repeatChattersCount: number }>`

### `UnifiedChat` (`src/components/dashboard/live/unified-chat.tsx`)
- **Purpose:** Aggregates multi-platform chat messages (Twitch, Kick, YouTube, Facebook, Instagram) into a single stream.
- **Features:** Moderation actions, user detail cards, command autocomplete palette, duplicate message grouping.

### `ExecutionModeSwitch` (`src/components/ui/execution-mode-switch.tsx`)
- **Purpose:** Minimalist toggle switch between Cloud Mode (Server Infra) and Local Mode (Client Direct).
- **Props:**
  - `mode`: `"cloud" | "local"`
  - `onChange`: `(mode: ExecutionMode) => void`
  - `disabled?: boolean`

---

## 📈 Charts & Visual Data Representation

- **MetricsGrid**: Renders standardized metric cards (`Followers`, `Engagement`, `Reach`, `Impressions`) with trend badges (`+X%` / `-Y%`).
- **ChannelGraphs**: Line and area charts visualizing performance over selectable periods (`7d`, `30d`, `90d`).
- **ChannelComparison**: Comparative side-by-side performance bars across connected social channels.
