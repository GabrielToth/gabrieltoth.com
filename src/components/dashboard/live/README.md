# Live Dashboard Components

Streaming dashboard components for monitoring and managing live stream status across platforms (Twitch, Kick, etc.). Provides real-time stream status display, stream metadata editing, and unified multi-platform chat.

## Components

### StreamStatusCard

Displays live stream status for a single platform with key metrics.

**Location:** `src/components/dashboard/live/stream-status-card.tsx`

**Features:**

- Platform branding with color-coded accent (Twitch purple `#9146FF`, Kick green `#53FC18`)
- Live indicator with animated pulse badge when streaming
- Viewer count display (formatted with locale separators)
- Uptime calculation from `startedAt` timestamp (`Xh Ym` format)
- Current game/category display
- Stream title display (truncated)
- Hover shadow effect for visual depth

**Props:**

```typescript
interface StreamStatusCardProps {
    platform: string      // "twitch" | "kick"
    username: string
    displayName: string
    isLive: boolean
    viewerCount: number
    title: string
    gameName: string
    startedAt: string | null  // ISO timestamp
}
```

**Usage:**

```tsx
import { StreamStatusCard } from "@/components/dashboard/live"

<StreamStatusCard
    platform="twitch"
    username="mytwitch"
    displayName="My Twitch"
    isLive={true}
    viewerCount={42}
    title="Building cool stuff"
    gameName="Just Chatting"
    startedAt="2026-01-01T00:00:00Z"
/>
```

---

### StreamTitleEditor

Allows editing stream title and game/category for connected platforms.

**Location:** `src/components/dashboard/live/stream-title-editor.tsx`

**Features:**

- Title input field (max 140 characters)
- Game / Category input field
- Save button with loading state ("Saving..." while updating)
- Success message display ("Stream updated!" with green text, auto-dismiss after 3s)
- Error message display (red text, auto-dismiss after 3s)
- Calls `POST /api/live/update` with `{ platform, title, game_id }`
- Calls `onUpdate` callback on success for parent re-fetch

**Props:**

```typescript
interface StreamTitleEditorProps {
    platform: string
    currentTitle: string
    currentGame: string
    onUpdate: () => void  // Called after successful save
}
```

**Usage:**

```tsx
import { StreamTitleEditor } from "@/components/dashboard/live"

<StreamTitleEditor
    platform="twitch"
    currentTitle="Building cool stuff"
    currentGame="Just Chatting"
    onUpdate={() => fetchStreamStatus()}
/>
```

---

### UnifiedChat

Combined chat feed from multiple platforms in a single interface.

**Location:** `src/components/dashboard/live/unified-chat.tsx`

**Features:**

- Platform tabs to select which platform to send messages to
- Connection status indicator (green dot = connected, red dot = disconnected)
- Unified message feed with platform color indicators
- Badge display for broadcaster, moderator roles
- Timestamp display on hover
- Quick timeout button on non-broadcaster messages
- Message input with Enter key support
- Send button with disabled state when input is empty
- Quick command buttons (`/timeout`, `/ban`, `/me`)
- Auto-scroll to newest messages
- Dark mode support

**Current implementation notes:**

- Messages are simulated client-side (no real WebSocket/SSE backend yet)
- Sending messages is client-only (no API call in production)
- In production, this would connect to an SSE endpoint (`/api/chat/stream`) and send via `POST /api/chat/send`

**Props:**

```typescript
interface UnifiedChatProps {
    platforms: string[]       // ["twitch", "kick"]
}
```

> Note: `activePlatform` is declared in the props interface but derived from internal state.

**Usage:**

```tsx
import { UnifiedChat } from "@/components/dashboard/live"

<UnifiedChat platforms={["twitch", "kick"]} />
```

## Data Flow

```
Page (/dashboard/live)
    │
    ├── GET /api/live/status
    │       │
    │       ├── Twitch Helix API (stream + channel info)
    │       └── Kick API (channel info)
    │
    │   Returns: { twitch: StreamData, kick: StreamData }
    │
    ├── StreamStatusCard ← receives stream data per platform
    ├── StreamTitleEditor ← receives current title/game
    │       │
    │       └── POST /api/live/update → platform API (PATCH title/game)
    │
    └── UnifiedChat ← receives platform list
            │
            ├── Currently: simulated messages (client-side)
            └── Future: SSE /api/chat/stream + POST /api/chat/send
```

### Architecture Diagram

```
┌────────────────────────────────────────────────────┐
│                    Dashboard Page                    │
│                                                      │
│  ┌────────────────┐  ┌────────────────────────┐     │
│  │ StreamStatusCard│  │  StreamTitleEditor     │     │
│  │ ┌─────────────┐│  │ ┌────────────────────┐ │     │
│  │ │ LIVE Badge   ││  │ │ Title Input        │ │     │
│  │ │ Viewers     ││  │ │ Game Input         │ │     │
│  │ │ Uptime      ││  │ │ Save Button        │ │     │
│  │ │ Game        ││  │ └────────────────────┘ │     │
│  │ └─────────────┘│  └────────────────────────┘     │
│  └────────────────┘                                  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              UnifiedChat                      │   │
│  │  ┌────────────────────────────────────────┐   │   │
│  │  │ Platform Tabs     [Twitch] [Kick]      │   │   │
│  │  │ Connection Status  ● Connected          │   │   │
│  │  │ ┌────────────────────────────────────┐ │   │   │
│  │  │ │ Message Feed                       │ │   │   │
│  │  │ │ [T] User: Hello!            12:30  │ │   │   │
│  │  │ │ [K] User2: Hi!              12:31  │ │   │   │
│  │  │ │ ...                                │ │   │   │
│  │  │ └────────────────────────────────────┘ │   │   │
│  │  │ [Input field               ] [Send]   │   │   │
│  │  │ Quick: [/timeout] [/ban] [/me]        │   │   │
│  │  └────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Data Source: /api/live/status                       │
│  Updates:    POST /api/live/update                   │
└──────────────────────────────────────────────────────┘
```

## i18n Notes

The live dashboard components use the `dashboard.live` i18n namespace for translations. Currently, component labels are hardcoded in English; future internationalization should extract strings to:

```typescript
import { useTranslations } from "next-intl"
const t = useTranslations("dashboard.live")
```

## Styling

Components use Tailwind CSS with dark mode support via the `dark:` variant. Platform-specific colors:

| Platform | Color | Hex |
|----------|-------|-----|
| Twitch | Purple | `#9146FF` |
| Kick | Green | `#53FC18` |

## Testing

Refer to test files in `src/__tests__/` for live dashboard component tests:

```bash
npm run test -- src/__tests__/components/dashboard/live/
```

## Future Enhancements

- [ ] Real SSE backend connection for live chat messages
- [ ] Real API integration for sending messages across platforms
- [ ] Emote rendering with tooltips
- [ ] Chat history persistence and search
- [ ] Multiple streamer account support
- [ ] Stream scheduler integration
- [ ] Stream analytics and viewer trends
