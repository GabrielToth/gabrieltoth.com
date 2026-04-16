# Design Document - Minecraft Wiki Section

## Overview

This design document specifies the technical architecture for adding a Minecraft wiki section to gabrieltoth.com. The feature introduces a new top-level navigation category with dropdown support, modpack wiki pages styled after Modrinth's design system, and GitHub changelog integration.

### Design Goals

1. **Visual Consistency**: Replicate Modrinth's dark theme, green accent colors (#10b981), card-based layouts, and metadata sidebar design
2. **Seamless Integration**: Integrate with existing Next.js App Router, i18n system (next-intl), and URL mapping patterns
3. **Performance**: Optimize for fast page loads with caching strategies for GitHub API data
4. **Extensibility**: Design component architecture to support multiple modpacks and mods in the future
5. **Accessibility**: Maintain WCAG compliance with semantic HTML and proper ARIA attributes

### Technology Stack

- **Framework**: Next.js 16.2.4 with App Router
- **Styling**: Tailwind CSS 4.2.2 with dark mode support
- **Internationalization**: next-intl 4.9.1
- **External API**: GitHub REST API v3 for changelog data
- **State Management**: React Server Components with minimal client-side state

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Navigation Layer                         │
│  (Header with Minecraft dropdown: Modpacks, Mods)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Routing Layer                           │
│  /[locale]/minecraft/modpacks/[slug]                        │
│  /[locale]/minecraft/modpacks/[slug]/changelog              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Page Components                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Modpack Page    │  │  Changelog Page  │                │
│  │  - Hero Section  │  │  - Version List  │                │
│  │  - Metadata Bar  │  │  - Release Notes │                │
│  │  - Mod List      │  └──────────────────┘                │
│  └──────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Static Modpack  │  │  GitHub API      │                │
│  │  Data (JSON)     │  │  (Changelog)     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Header (modified)
└── MinecraftDropdown
    ├── ModpacksLink
    └── ModsLink

ModpackPage
├── ModpackHero
├── ModpackMetadataSidebar
│   ├── CompatibilitySection
│   ├── PlatformsSection
│   ├── LinksSection
│   ├── TagsSection
│   ├── CreatorsSection
│   └── DetailsSection
├── ModpackTabs
│   ├── DescriptionTab
│   ├── ModListTab
│   │   └── ModListWithSearch
│   └── ChangelogTab (link to separate page)
└── Footer

ChangelogPage
├── ChangelogHero
└── VersionList
    └── VersionCard[]
```

## Components and Interfaces

### 1. Navigation Integration

#### Modified Header Component

**Location**: `src/components/layout/header.tsx`

**Changes**:
- Add "Minecraft" navigation item with dropdown state management
- Implement dropdown menu similar to existing "Services" dropdown
- Support locale-specific labels from i18n

**Implementation Pattern**:
```typescript
const [isMinecraftOpen, setIsMinecraftOpen] = useState(false)

const getMinecraftLinks = () => [
  {
    href: getLocalizedPath("minecraft-modpacks", locale),
    label: t("minecraftDropdown.modpacks"),
  },
  {
    href: getLocalizedPath("minecraft-mods", locale),
    label: t("minecraftDropdown.mods"),
  },
]
```

### 2. Routing Structure

#### URL Patterns

**Modpack List Page** (future):
- `/en/minecraft/modpacks`
- `/pt-BR/minecraft/modpacks`
- `/es/minecraft/modpacks`
- `/de/minecraft/modpacks`

**Modpack Detail Page**:
- `/en/minecraft/modpacks/hypixel-qol`
- `/pt-BR/minecraft/modpacks/hypixel-qol`
- `/es/minecraft/modpacks/hypixel-qol`
- `/de/minecraft/modpacks/hypixel-qol`

**Changelog Page**:
- `/en/minecraft/modpacks/hypixel-qol/changelog`
- `/pt-BR/minecraft/modpacks/hypixel-qol/changelog`
- `/es/minecraft/modpacks/hypixel-qol/changelog`
- `/de/minecraft/modpacks/hypixel-qol/changelog`

#### File Structure

```
src/app/[locale]/minecraft/
├── modpacks/
│   ├── page.tsx                    # Modpack list (future)
│   └── [slug]/
│       ├── page.tsx                # Modpack detail page
│       ├── modpack-view.tsx        # Main view component
│       ├── modpack-metadata.ts     # SEO metadata generation
│       ├── modpack-structured.ts   # Structured data
│       ├── changelog/
│       │   ├── page.tsx            # Changelog page
│       │   └── changelog-view.tsx  # Changelog view component
│       └── components/
│           ├── modpack-hero.tsx
│           ├── modpack-sidebar.tsx
│           ├── modpack-tabs.tsx
│           ├── mod-list.tsx
│           └── mod-search.tsx
└── mods/
    └── page.tsx                    # Mods list (future)
```

### 3. URL Mapping Updates

**Location**: `src/lib/url-mapping.ts`

**New Entries**:
```typescript
const urlMapping: Record<Locale, Record<string, string>> = {
  en: {
    // ... existing entries
    "minecraft-modpacks": "minecraft/modpacks",
    "minecraft-mods": "minecraft/mods",
  },
  "pt-BR": {
    // ... existing entries
    "minecraft-modpacks": "minecraft/modpacks",
    "minecraft-mods": "minecraft/mods",
  },
  es: {
    // ... existing entries
    "minecraft-modpacks": "minecraft/modpacks",
    "minecraft-mods": "minecraft/mods",
  },
  de: {
    // ... existing entries
    "minecraft-modpacks": "minecraft/modpacks",
    "minecraft-mods": "minecraft/mods",
  },
}
```

### 4. i18n Integration

#### New Namespace: `minecraft.json`

**Location**: `src/i18n/{locale}/minecraft.json`

**Structure**:
```json
{
  "navigation": {
    "minecraft": "Minecraft",
    "modpacks": "Modpacks",
    "mods": "Mods"
  },
  "modpack": {
    "version": "Version",
    "compatibility": "Compatibility",
    "platforms": "Platforms",
    "links": "Links",
    "tags": "Tags",
    "creators": "Creators",
    "details": "Details",
    "minecraftVersion": "Minecraft Version",
    "modLoader": "Mod Loader",
    "environment": "Environment",
    "clientSide": "Client-side",
    "serverSide": "Server-side",
    "viewOnModrinth": "View on Modrinth",
    "viewSource": "View source",
    "reportIssues": "Report issues",
    "donate": "Donate",
    "description": "Description",
    "modList": "Mod List",
    "changelog": "Changelog",
    "searchMods": "Search mods...",
    "modsCount": "{count} mods"
  },
  "changelog": {
    "title": "Changelog",
    "version": "Version",
    "released": "Released",
    "changes": "Changes",
    "noChangelog": "No changelog available",
    "errorLoading": "Error loading changelog"
  }
}
```

#### Updated `src/i18n/en/layout.header.json`

Add to existing structure:
```json
{
  "minecraftDropdown": {
    "modpacks": "Modpacks",
    "mods": "Mods"
  }
}
```

#### Updated `src/i18n/request.ts`

Add minecraft namespace loading:
```typescript
const minecraft = await loadJson(() => import(`@/i18n/${selectedLocale}/minecraft.json`))

const messages: MessagesRecord = {
  // ... existing namespaces
  minecraft,
}
```

## Data Models

### Modpack Data Model

```typescript
interface ModpackMetadata {
  id: string                    // "hypixel-qol"
  name: string                  // "Hypixel QoL"
  slug: string                  // "hypixel-qol"
  version: string               // "0.1.0"
  description: string           // Full description (supports markdown)
  shortDescription: string      // Brief summary
  
  // Compatibility
  minecraftVersion: string      // "1.21.1"
  modLoader: "fabric" | "forge" | "quilt" | "neoforge"
  environment: "client" | "server" | "both"
  
  // Links
  modrinthUrl: string
  githubUrl: string
  donateUrl?: string
  
  // Metadata
  tags: string[]                // ["Lightweight", "Multiplayer", "Optimization"]
  creators: Creator[]
  
  // Content
  mods: ModEntry[]
  
  // SEO
  metaTitle: string
  metaDescription: string
  keywords: string[]
}

interface Creator {
  name: string
  role: "author" | "contributor"
  url?: string
}

interface ModEntry {
  id: string
  name: string
  description?: string
  url?: string
  category?: string
}
```

### Changelog Data Model

```typescript
interface ChangelogVersion {
  version: string               // "v0.1.0"
  releaseDate: string           // ISO 8601 date
  changes: ChangeEntry[]
  githubUrl?: string            // Link to release on GitHub
}

interface ChangeEntry {
  type: "added" | "changed" | "fixed" | "removed"
  description: string
}

interface ChangelogData {
  versions: ChangelogVersion[]
  lastUpdated: string
}
```

### GitHub API Response Model

```typescript
interface GitHubRelease {
  tag_name: string
  name: string
  body: string                  // Markdown content
  published_at: string
  html_url: string
}
```

## GitHub API Integration

### API Client

**Location**: `src/lib/github-api.ts`

```typescript
interface GitHubConfig {
  owner: string
  repo: string
  token?: string                // Optional for public repos
}

class GitHubClient {
  private baseUrl = "https://api.github.com"
  private config: GitHubConfig
  
  constructor(config: GitHubConfig) {
    this.config = config
  }
  
  async getReleases(): Promise<GitHubRelease[]> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/releases`
    const headers: HeadersInit = {
      "Accept": "application/vnd.github.v3+json",
    }
    
    if (this.config.token) {
      headers["Authorization"] = `Bearer ${this.config.token}`
    }
    
    const response = await fetch(url, {
      headers,
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    return response.json()
  }
  
  parseChangelog(release: GitHubRelease): ChangelogVersion {
    // Parse markdown body into structured changes
    // Implementation details in next section
  }
}
```

### Changelog Parser

**Location**: `src/lib/changelog-parser.ts`

```typescript
function parseChangelogMarkdown(markdown: string): ChangeEntry[] {
  const changes: ChangeEntry[] = []
  const lines = markdown.split('\n')
  
  let currentType: ChangeEntry['type'] | null = null
  
  for (const line of lines) {
    // Detect section headers: ## Added, ## Changed, ## Fixed, ## Removed
    if (line.startsWith('## ')) {
      const header = line.slice(3).toLowerCase().trim()
      if (['added', 'changed', 'fixed', 'removed'].includes(header)) {
        currentType = header as ChangeEntry['type']
      }
      continue
    }
    
    // Parse list items
    if (line.startsWith('- ') && currentType) {
      changes.push({
        type: currentType,
        description: line.slice(2).trim()
      })
    }
  }
  
  return changes
}
```

### Caching Strategy

- **Revalidation**: 1 hour (3600 seconds) using Next.js `revalidate`
- **Fallback**: Display cached data if GitHub API is unavailable
- **Error Handling**: Show user-friendly error message with retry option

## Styling Approach - Modrinth Replication

### Color Palette

```typescript
// Modrinth-inspired colors
const colors = {
  // Primary green accent
  primary: {
    DEFAULT: '#10b981',      // emerald-500
    hover: '#059669',        // emerald-600
    light: '#34d399',        // emerald-400
  },
  
  // Dark theme backgrounds
  background: {
    primary: '#1a1a1a',      // Near black
    secondary: '#242424',    // Slightly lighter
    tertiary: '#2d2d2d',     // Card backgrounds
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#a3a3a3',    // neutral-400
    muted: '#737373',        // neutral-500
  },
  
  // Border colors
  border: {
    DEFAULT: '#404040',      // neutral-700
    light: '#525252',        // neutral-600
  }
}
```

### Tailwind Configuration

**Location**: `tailwind.config.ts`

Add custom colors:
```typescript
theme: {
  extend: {
    colors: {
      modrinth: {
        green: '#10b981',
        'green-hover': '#059669',
        'bg-primary': '#1a1a1a',
        'bg-secondary': '#242424',
        'bg-card': '#2d2d2d',
      }
    }
  }
}
```

### Component Styling Patterns

#### Card Component
```typescript
const cardClasses = cn(
  "bg-modrinth-bg-card",
  "border border-neutral-700",
  "rounded-lg",
  "p-6",
  "hover:border-modrinth-green",
  "transition-colors duration-200"
)
```

#### Metadata Sidebar
```typescript
const sidebarClasses = cn(
  "bg-modrinth-bg-secondary",
  "border border-neutral-700",
  "rounded-lg",
  "p-4",
  "space-y-4",
  "sticky top-20"
)
```

#### Tag Component
```typescript
const tagClasses = cn(
  "inline-flex items-center",
  "px-3 py-1",
  "bg-modrinth-green/10",
  "text-modrinth-green",
  "border border-modrinth-green/20",
  "rounded-full",
  "text-sm font-medium"
)
```

### Typography

- **Headings**: Font weight 700, tracking tight
- **Body**: Font weight 400, line height relaxed
- **Code**: Monospace font with syntax highlighting for mod names

### Responsive Design

- **Mobile** (< 768px): Single column, sidebar below content
- **Tablet** (768px - 1024px): Single column, sidebar below content
- **Desktop** (> 1024px): Two-column layout with sticky sidebar

## Error Handling

### GitHub API Errors

```typescript
interface ErrorState {
  type: 'network' | 'api' | 'parse'
  message: string
  retryable: boolean
}

function handleGitHubError(error: unknown): ErrorState {
  if (error instanceof TypeError) {
    return {
      type: 'network',
      message: 'Unable to connect to GitHub',
      retryable: true
    }
  }
  
  if (error instanceof Response) {
    if (error.status === 403) {
      return {
        type: 'api',
        message: 'GitHub API rate limit exceeded',
        retryable: false
      }
    }
    
    if (error.status === 404) {
      return {
        type: 'api',
        message: 'Repository not found',
        retryable: false
      }
    }
  }
  
  return {
    type: 'parse',
    message: 'Error processing changelog data',
    retryable: true
  }
}
```

### User-Facing Error Messages

- **Network Error**: "Unable to load changelog. Please check your connection and try again."
- **Rate Limit**: "Changelog temporarily unavailable. Please try again later."
- **Not Found**: "Changelog not found for this modpack."
- **Parse Error**: "Error displaying changelog. Please report this issue."

### Fallback Content

When GitHub API fails:
1. Display cached data if available
2. Show error message with retry button
3. Provide link to GitHub releases page as alternative

## Testing Strategy

This feature is primarily UI-focused with external API integration. Property-based testing is **not appropriate** for the following reasons:

1. **UI Rendering**: Component rendering and layout are best tested with snapshot tests and visual regression tests
2. **External API Integration**: GitHub API behavior is deterministic and controlled by GitHub, not our code
3. **Static Content**: Modpack data is static JSON configuration
4. **Localization**: i18n strings are static translations

### Recommended Testing Approach

#### Unit Tests
- **Changelog Parser**: Test markdown parsing with specific examples
  - Valid changelog format
  - Empty changelog
  - Malformed markdown
  - Missing sections

- **URL Mapping**: Test locale-specific URL generation
  - All supported locales
  - Invalid locale fallback

- **Error Handling**: Test error state transformations
  - Network errors
  - API errors (403, 404, 500)
  - Parse errors

#### Integration Tests
- **GitHub API Client**: Test with mocked responses
  - Successful fetch (1-2 examples)
  - Rate limit response
  - Network timeout
  - Invalid JSON response

- **Page Rendering**: Test with React Testing Library
  - Modpack page renders with data
  - Changelog page renders with data
  - Error states display correctly
  - Loading states display correctly

#### End-to-End Tests (Playwright)
- **Navigation Flow**:
  - Click Minecraft dropdown → Navigate to modpack
  - Navigate to changelog from modpack page
  - Search mods in mod list
  - Click external links (Modrinth, GitHub)

- **Responsive Design**:
  - Mobile layout renders correctly
  - Tablet layout renders correctly
  - Desktop layout renders correctly
  - Sidebar positioning on different screen sizes

#### Visual Regression Tests
- **Modrinth Style Replication**:
  - Compare screenshots with Modrinth reference
  - Verify color palette matches
  - Verify spacing and typography
  - Verify card layouts

#### Accessibility Tests
- **WCAG Compliance**:
  - Keyboard navigation works
  - Screen reader labels are present
  - Color contrast meets AA standards
  - Focus indicators are visible

### Test Coverage Goals
- Unit tests: 80%+ coverage for utility functions
- Integration tests: All critical user paths
- E2E tests: Happy path + error scenarios
- Visual tests: All major components

### Testing Tools
- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright
- **Visual Regression**: Playwright screenshots
- **Accessibility**: @storybook/addon-a11y, axe-core

## Performance Optimization

### Static Generation
- Pre-render modpack pages at build time
- Use `generateStaticParams` for known modpack slugs

### Caching Strategy
```typescript
// Modpack page
export const revalidate = 3600 // 1 hour

// Changelog page with GitHub data
export const revalidate = 3600 // 1 hour
```

### Image Optimization
- Use Next.js `<Image>` component for all images
- Provide appropriate sizes for responsive images
- Use WebP format with fallbacks

### Code Splitting
- Lazy load mod list component for large lists
- Lazy load changelog data on tab switch
- Use dynamic imports for heavy components

### Mod List Virtualization

For 150+ mods, implement virtual scrolling:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function ModList({ mods }: { mods: ModEntry[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: mods.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5
  })
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <ModCard
            key={virtualRow.key}
            mod={mods[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

### Search Performance

Implement client-side search with debouncing:

```typescript
import { useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

function useModSearch(mods: ModEntry[]) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  
  const filteredMods = useMemo(() => {
    if (!debouncedQuery) return mods
    
    const lowerQuery = debouncedQuery.toLowerCase()
    return mods.filter(mod =>
      mod.name.toLowerCase().includes(lowerQuery) ||
      mod.description?.toLowerCase().includes(lowerQuery)
    )
  }, [mods, debouncedQuery])
  
  return { query, setQuery, filteredMods }
}
```

## SEO and Metadata

### Page Metadata

```typescript
// src/app/[locale]/minecraft/modpacks/[slug]/modpack-metadata.ts
import { type Metadata } from 'next'
import { type Locale } from '@/lib/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const modpack = await getModpackData(slug)
  
  return {
    title: `${modpack.name} - Minecraft Modpack`,
    description: modpack.shortDescription,
    keywords: [
      'minecraft',
      'modpack',
      modpack.modLoader,
      ...modpack.tags,
    ],
    openGraph: {
      title: modpack.name,
      description: modpack.shortDescription,
      type: 'website',
      locale: locale,
      url: `https://gabrieltoth.com/${locale}/minecraft/modpacks/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: modpack.name,
      description: modpack.shortDescription,
    },
  }
}
```

### Structured Data

```typescript
// src/app/[locale]/minecraft/modpacks/[slug]/modpack-structured.ts
export function buildModpackStructured(
  modpack: ModpackMetadata,
  locale: Locale
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: modpack.name,
    description: modpack.shortDescription,
    applicationCategory: 'Game',
    operatingSystem: 'Windows, macOS, Linux',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
    },
  }
}
```

### Sitemap Integration

Add modpack pages to sitemap:

```typescript
// src/app/sitemap-[locale].xml/route.ts
const modpackPages = [
  {
    url: `https://gabrieltoth.com/${locale}/minecraft/modpacks/hypixel-qol`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
]
```

## Extensibility Considerations

### Multi-Modpack Support

Design data structure to support multiple modpacks:

```typescript
// src/data/modpacks/index.ts
export const modpacks: Record<string, ModpackMetadata> = {
  'hypixel-qol': hypixelQolData,
  // Future modpacks can be added here
}

export function getModpackData(slug: string): ModpackMetadata | null {
  return modpacks[slug] || null
}

export function getAllModpackSlugs(): string[] {
  return Object.keys(modpacks)
}
```

### Component Reusability

All components should accept data as props:

```typescript
// Reusable for any modpack
<ModpackSidebar metadata={modpack} />
<ModList mods={modpack.mods} />
<ChangelogView changelog={changelog} />
```

### Future Features

Design supports easy addition of:
- Modpack comparison tool
- User ratings and reviews
- Download statistics
- Version history timeline
- Mod dependency graph
- Installation guides

## Implementation Phases

### Phase 1: Navigation and Routing (Foundation)
1. Update header with Minecraft dropdown
2. Add URL mappings for all locales
3. Create i18n files for all locales
4. Set up basic routing structure

### Phase 2: Modpack Page (Core Feature)
1. Create modpack data model and JSON file
2. Implement modpack page layout
3. Build metadata sidebar component
4. Implement mod list with search
5. Add Modrinth-style theming

### Phase 3: Changelog Integration (External API)
1. Implement GitHub API client
2. Create changelog parser
3. Build changelog page
4. Add error handling and fallbacks
5. Implement caching strategy

### Phase 4: Polish and Optimization (Quality)
1. Add loading states and skeletons
2. Implement virtual scrolling for mod list
3. Optimize images and assets
4. Add SEO metadata and structured data
5. Implement responsive design refinements

### Phase 5: Testing and Documentation (Validation)
1. Write unit tests for utilities
2. Write integration tests for components
3. Write E2E tests for user flows
4. Perform accessibility audit
5. Visual regression testing

## Dependencies

### New Dependencies Required

```json
{
  "@tanstack/react-virtual": "^3.0.0"  // For mod list virtualization
}
```

### Existing Dependencies Used

- `next`: App Router, Image optimization, caching
- `next-intl`: Internationalization
- `tailwindcss`: Styling
- `lucide-react`: Icons
- `clsx` / `tailwind-merge`: Class name utilities

## Security Considerations

### GitHub API Token

- Store token in environment variable: `GITHUB_API_TOKEN`
- Use server-side only (never expose to client)
- Implement rate limiting fallback
- Consider using GitHub App for higher rate limits

### External Links

- Use `rel="noopener noreferrer"` for external links
- Validate URLs before rendering
- Sanitize user-generated content (if added in future)

### Content Security Policy

Update CSP headers to allow GitHub API:

```typescript
// next.config.js
const cspHeader = `
  connect-src 'self' https://api.github.com;
`
```

## Monitoring and Analytics

### Performance Metrics

Track with Vercel Analytics:
- Page load time for modpack pages
- GitHub API response time
- Search interaction rate
- Changelog view rate

### Error Tracking

Log errors to monitoring service:
- GitHub API failures
- Changelog parse errors
- Component render errors

### User Behavior

Track with analytics:
- Most viewed modpacks
- Most searched mods
- External link click-through rate
- Changelog engagement

## Conclusion

This design provides a comprehensive architecture for the Minecraft wiki section that:

1. **Integrates seamlessly** with existing Next.js App Router and i18n patterns
2. **Replicates Modrinth's design** with dark theme, green accents, and card layouts
3. **Optimizes performance** with caching, virtualization, and static generation
4. **Supports extensibility** for future modpacks and features
5. **Maintains quality** through comprehensive testing strategy

The implementation follows Next.js best practices, leverages React Server Components for optimal performance, and provides a solid foundation for future Minecraft-related content.
