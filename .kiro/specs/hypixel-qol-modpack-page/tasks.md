# Tasks: Hypixel-QoL Modpack Page

## Phase 1: Foundation and Data Layer

### 1.1 Create Type Definitions
- [ ] 1.1.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/hypixel-qol-types.ts`
- [ ] 1.1.2 Define `PageProps`, `ModpackData`, `Mod`, `ModCategory` interfaces
- [ ] 1.1.3 Define `ExternalLink`, `Feature` interfaces
- [ ] 1.1.4 Export all types for use across components

### 1.2 Create GitHub API Integration
- [ ] 1.2.1 Create `src/lib/github/github-types.ts` with `GitHubRelease`, `GitHubAPIResponse` interfaces
- [ ] 1.2.2 Create `src/lib/github/github-api.ts` with `fetchGitHubReleases()` function
- [ ] 1.2.3 Implement error handling with `GitHubAPIError` class
- [ ] 1.2.4 Add rate limit detection and handling
- [ ] 1.2.5 Configure Next.js fetch cache with 1-hour revalidation
- [ ] 1.2.6 Add unit tests for GitHub API functions

### 1.3 Create Static Mod Data
- [ ] 1.3.1 Create `src/data/minecraft/hypixel-qol-mods.ts`
- [ ] 1.3.2 Define all 150+ mods with name, category, URL, platform
- [ ] 1.3.3 Organize mods by categories: performance, qol, skyblock, visual, utility
- [ ] 1.3.4 Export `HYPIXEL_QOL_MODPACK_DATA` constant with version, Minecraft version, mod loader, JVM args

### 1.4 Create Translation Files
- [ ] 1.4.1 Update `src/i18n/en/minecraft.json` with Hypixel-QoL translations
- [ ] 1.4.2 Update `src/i18n/pt-BR/minecraft.json` with Portuguese translations
- [ ] 1.4.3 Update `src/i18n/es/minecraft.json` with Spanish translations
- [ ] 1.4.4 Update `src/i18n/de/minecraft.json` with German translations
- [ ] 1.4.5 Include translations for: title, description, tabs, sidebar, features, modList, changelog

## Phase 2: Core Components

### 2.1 Create Modpack Sidebar Component
- [ ] 2.1.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/modpack-sidebar.tsx`
- [ ] 2.1.2 Implement responsive layout (sidebar on desktop, top section on mobile)
- [ ] 2.1.3 Display version, Minecraft version, mod loader, installation type
- [ ] 2.1.4 Display recommended JVM arguments in code block
- [ ] 2.1.5 Render external link buttons (Modrinth, GitHub, PayPal, Report Issues)
- [ ] 2.1.6 Add proper ARIA labels and accessibility attributes
- [ ] 2.1.7 Style with Modrinth-inspired design using Tailwind CSS
- [ ] 2.1.8 Add unit tests for component rendering

### 2.2 Create Tab Navigation Component
- [ ] 2.2.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/modpack-tabs.tsx`
- [ ] 2.2.2 Implement using Radix UI Tabs (@radix-ui/react-tabs)
- [ ] 2.2.3 Create tabs: Overview, Changelog, Gallery, Versions
- [ ] 2.2.4 Sync active tab with URL query parameter (?tab=changelog)
- [ ] 2.2.5 Implement keyboard navigation (Tab, Enter, Arrow keys)
- [ ] 2.2.6 Add active tab visual indication
- [ ] 2.2.7 Make tabs scrollable on mobile devices
- [ ] 2.2.8 Add unit tests for tab switching and URL sync

### 2.3 Create Overview Section Component
- [ ] 2.3.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/overview-section.tsx`
- [ ] 2.3.2 Display modpack description
- [ ] 2.3.3 Render Key Features section with icons
- [ ] 2.3.4 Use lucide-react icons for features
- [ ] 2.3.5 Implement responsive grid layout
- [ ] 2.3.6 Add unit tests for component rendering

### 2.4 Create Key Features Component
- [ ] 2.4.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/key-features.tsx`
- [ ] 2.4.2 Define features: automations, price tracking, HUD improvements, QoL enhancements, profile management, performance optimization
- [ ] 2.4.3 Map features to lucide-react icons
- [ ] 2.4.4 Implement responsive grid (1 column mobile, 2 columns tablet, 3 columns desktop)
- [ ] 2.4.5 Style feature cards with Modrinth-inspired design
- [ ] 2.4.6 Add unit tests for feature rendering

### 2.5 Create Mod List Component
- [ ] 2.5.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/mod-list.tsx`
- [ ] 2.5.2 Implement search functionality with input field
- [ ] 2.5.3 Implement category filter dropdown
- [ ] 2.5.4 Display total mod count
- [ ] 2.5.5 Group mods by category with collapsible sections
- [ ] 2.5.6 Render mod cards in responsive grid
- [ ] 2.5.7 Add unit tests for search and filter logic

### 2.6 Create Mod Card Component
- [ ] 2.6.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/mod-card.tsx`
- [ ] 2.6.2 Display mod name as clickable link
- [ ] 2.6.3 Display mod category badge
- [ ] 2.6.4 Add external link icon for mod URL
- [ ] 2.6.5 Style with Modrinth-inspired card design
- [ ] 2.6.6 Add hover effects and transitions
- [ ] 2.6.7 Add unit tests for component rendering

### 2.7 Create Changelog Section Component
- [ ] 2.7.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/changelog-section.tsx`
- [ ] 2.7.2 Accept `releases` prop from GitHub API
- [ ] 2.7.3 Display loading state while fetching
- [ ] 2.7.4 Display error state if GitHub API fails
- [ ] 2.7.5 Display "No releases" state if empty
- [ ] 2.7.6 Render release entries with version, date, and changelog body
- [ ] 2.7.7 Format markdown content in changelog body
- [ ] 2.7.8 Add "View on GitHub" link for each release
- [ ] 2.7.9 Add unit tests for different states

### 2.8 Create Gallery Section Component
- [ ] 2.8.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/gallery-section.tsx`
- [ ] 2.8.2 Implement image grid layout
- [ ] 2.8.3 Use Next.js Image component for optimization
- [ ] 2.8.4 Add lightbox functionality for full-size images
- [ ] 2.8.5 Implement lazy loading for images
- [ ] 2.8.6 Add alt text for all images
- [ ] 2.8.7 Add unit tests for component rendering

### 2.9 Create Versions Section Component
- [ ] 2.9.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/components/versions-section.tsx`
- [ ] 2.9.2 Display version history table
- [ ] 2.9.3 Show version number, release date, Minecraft version, mod count
- [ ] 2.9.4 Add download links for each version
- [ ] 2.9.5 Implement responsive table (cards on mobile)
- [ ] 2.9.6 Add unit tests for component rendering

## Phase 3: Main Page and Metadata

### 3.1 Create Main Page Component
- [ ] 3.1.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/page.tsx`
- [ ] 3.1.2 Fetch changelog data from GitHub API using `fetchGitHubReleases()`
- [ ] 3.1.3 Handle GitHub API errors with try-catch
- [ ] 3.1.4 Compose layout with sidebar and main content area
- [ ] 3.1.5 Render ModpackTabs with all section components
- [ ] 3.1.6 Add Breadcrumbs component
- [ ] 3.1.7 Configure ISR with `export const revalidate = 3600` (1 hour)
- [ ] 3.1.8 Add integration tests for page rendering

### 3.2 Create Metadata Generation
- [ ] 3.2.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/hypixel-qol-metadata.ts`
- [ ] 3.2.2 Implement `generateMetadata()` function
- [ ] 3.2.3 Generate title, description, keywords for each locale
- [ ] 3.2.4 Generate Open Graph tags (og:title, og:description, og:image, og:type)
- [ ] 3.2.5 Generate Twitter Card tags
- [ ] 3.2.6 Generate canonical URL tags
- [ ] 3.2.7 Add unit tests for metadata generation

### 3.3 Create Structured Data
- [ ] 3.3.1 Create `src/app/[locale]/minecraft/modpacks/hypixel-qol/hypixel-qol-structured.ts`
- [ ] 3.3.2 Implement `buildHypixelQoLStructured()` function
- [ ] 3.3.3 Generate SoftwareApplication JSON-LD schema
- [ ] 3.3.4 Generate BreadcrumbList JSON-LD schema
- [ ] 3.3.5 Generate FAQPage JSON-LD schema (if applicable)
- [ ] 3.3.6 Add unit tests for structured data generation

## Phase 4: Styling and Responsive Design

### 4.1 Implement Modrinth-Style Design System
- [ ] 4.1.1 Define Modrinth color palette in Tailwind config or CSS variables
- [ ] 4.1.2 Create custom Tailwind classes for Modrinth-style cards
- [ ] 4.1.3 Create custom Tailwind classes for Modrinth-style buttons
- [ ] 4.1.4 Create custom Tailwind classes for Modrinth-style badges
- [ ] 4.1.5 Ensure consistency with existing site theme system (light/dark mode)

### 4.2 Implement Responsive Layouts
- [ ] 4.2.1 Test mobile layout (viewport width < 768px)
- [ ] 4.2.2 Test tablet layout (viewport width 768px-1024px)
- [ ] 4.2.3 Test desktop layout (viewport width > 1024px)
- [ ] 4.2.4 Ensure sidebar stacks on mobile
- [ ] 4.2.5 Ensure tabs are scrollable on mobile
- [ ] 4.2.6 Ensure mod grid adjusts columns based on viewport
- [ ] 4.2.7 Add visual regression tests for responsive layouts

### 4.3 Implement Theme Support
- [ ] 4.3.1 Test light mode styling
- [ ] 4.3.2 Test dark mode styling
- [ ] 4.3.3 Ensure proper color contrast in both themes
- [ ] 4.3.4 Test theme switching without page reload
- [ ] 4.3.5 Add visual regression tests for theme switching

## Phase 5: Accessibility and SEO

### 5.1 Implement Accessibility Features
- [ ] 5.1.1 Add ARIA labels to all interactive elements
- [ ] 5.1.2 Ensure keyboard navigation works for tabs
- [ ] 5.1.3 Ensure keyboard navigation works for mod list search/filter
- [ ] 5.1.4 Add focus indicators for all focusable elements
- [ ] 5.1.5 Use semantic HTML elements (nav, main, section, article)
- [ ] 5.1.6 Add skip-to-content link
- [ ] 5.1.7 Ensure all images have descriptive alt text
- [ ] 5.1.8 Test with screen reader (NVDA or JAWS)
- [ ] 5.1.9 Run axe accessibility tests
- [ ] 5.1.10 Verify WCAG 2.1 Level AA compliance

### 5.2 Implement SEO Optimization
- [ ] 5.2.1 Verify metadata is generated correctly for all locales
- [ ] 5.2.2 Verify Open Graph tags are present
- [ ] 5.2.3 Verify Twitter Card tags are present
- [ ] 5.2.4 Verify structured data is valid (use Google Rich Results Test)
- [ ] 5.2.5 Verify canonical URLs are correct
- [ ] 5.2.6 Add page to sitemap.xml
- [ ] 5.2.7 Test page with Google Search Console
- [ ] 5.2.8 Verify Lighthouse SEO score is above 90

## Phase 6: Performance Optimization

### 6.1 Optimize Images
- [ ] 6.1.1 Use Next.js Image component for all images
- [ ] 6.1.2 Configure image formats (WebP, AVIF)
- [ ] 6.1.3 Implement lazy loading for below-the-fold images
- [ ] 6.1.4 Add proper width and height attributes to prevent layout shift
- [ ] 6.1.5 Optimize image sizes for different viewports

### 6.2 Optimize JavaScript Bundle
- [ ] 6.2.1 Verify code splitting is working correctly
- [ ] 6.2.2 Lazy load non-critical components
- [ ] 6.2.3 Minimize third-party dependencies
- [ ] 6.2.4 Run bundle analyzer to identify large dependencies
- [ ] 6.2.5 Verify JavaScript bundle size is acceptable

### 6.3 Optimize Caching and ISR
- [ ] 6.3.1 Configure ISR revalidation period (1 hour)
- [ ] 6.3.2 Test ISR behavior in production
- [ ] 6.3.3 Verify GitHub API responses are cached
- [ ] 6.3.4 Configure proper cache headers for static assets
- [ ] 6.3.5 Test cache invalidation when new releases are published

### 6.4 Performance Testing
- [ ] 6.4.1 Run Lighthouse performance audit
- [ ] 6.4.2 Verify Lighthouse performance score is above 90
- [ ] 6.4.3 Measure First Contentful Paint (FCP)
- [ ] 6.4.4 Measure Largest Contentful Paint (LCP)
- [ ] 6.4.5 Measure Cumulative Layout Shift (CLS)
- [ ] 6.4.6 Measure Time to Interactive (TTI)
- [ ] 6.4.7 Test performance on slow 3G network
- [ ] 6.4.8 Test performance on mobile devices

## Phase 7: Testing

### 7.1 Unit Tests
- [ ] 7.1.1 Write unit tests for ModpackSidebar component
- [ ] 7.1.2 Write unit tests for ModpackTabs component
- [ ] 7.1.3 Write unit tests for OverviewSection component
- [ ] 7.1.4 Write unit tests for KeyFeatures component
- [ ] 7.1.5 Write unit tests for ModList component (search and filter logic)
- [ ] 7.1.6 Write unit tests for ModCard component
- [ ] 7.1.7 Write unit tests for ChangelogSection component (loading, error, empty states)
- [ ] 7.1.8 Write unit tests for GallerySection component
- [ ] 7.1.9 Write unit tests for VersionsSection component
- [ ] 7.1.10 Write unit tests for GitHub API functions
- [ ] 7.1.11 Write unit tests for metadata generation
- [ ] 7.1.12 Write unit tests for structured data generation
- [ ] 7.1.13 Verify unit test coverage is above 80%

### 7.2 Integration Tests
- [ ] 7.2.1 Write integration test for GitHub API with mocked responses
- [ ] 7.2.2 Write integration test for GitHub API rate limit handling
- [ ] 7.2.3 Write integration test for GitHub API network error handling
- [ ] 7.2.4 Write integration test for ISR cache behavior
- [ ] 7.2.5 Write integration test for page rendering with real data

### 7.3 E2E Tests
- [ ] 7.3.1 Write E2E test for page navigation
- [ ] 7.3.2 Write E2E test for tab switching with URL state
- [ ] 7.3.3 Write E2E test for mod search functionality
- [ ] 7.3.4 Write E2E test for mod category filtering
- [ ] 7.3.5 Write E2E test for external link clicks (open in new tab)
- [ ] 7.3.6 Write E2E test for language switching
- [ ] 7.3.7 Write E2E test for theme switching
- [ ] 7.3.8 Write E2E test for mobile responsive behavior
- [ ] 7.3.9 Write E2E test for keyboard navigation

### 7.4 Accessibility Tests
- [ ] 7.4.1 Write accessibility test for keyboard navigation
- [ ] 7.4.2 Write accessibility test for ARIA attributes
- [ ] 7.4.3 Write accessibility test for color contrast
- [ ] 7.4.4 Write accessibility test for focus indicators
- [ ] 7.4.5 Run axe accessibility tests on all components
- [ ] 7.4.6 Verify WCAG 2.1 Level AA compliance

### 7.5 Visual Regression Tests
- [ ] 7.5.1 Write visual regression test for desktop layout
- [ ] 7.5.2 Write visual regression test for tablet layout
- [ ] 7.5.3 Write visual regression test for mobile layout
- [ ] 7.5.4 Write visual regression test for light mode
- [ ] 7.5.5 Write visual regression test for dark mode
- [ ] 7.5.6 Write visual regression test for each locale

## Phase 8: Integration and Deployment

### 8.1 Integrate with Existing Site
- [ ] 8.1.1 Verify page uses existing Header component
- [ ] 8.1.2 Verify page uses existing Footer component
- [ ] 8.1.3 Verify page uses existing theme system
- [ ] 8.1.4 Verify page uses existing Locale_System (next-intl)
- [ ] 8.1.5 Verify page follows existing file structure pattern
- [ ] 8.1.6 Verify page uses existing URL_Mapping system
- [ ] 8.1.7 Verify page uses Tailwind CSS consistent with existing site
- [ ] 8.1.8 Verify page reuses existing UI components where applicable

### 8.2 Add Navigation Links
- [ ] 8.2.1 Add link to Hypixel-QoL page in Minecraft section navigation
- [ ] 8.2.2 Add link to Hypixel-QoL page in site header (if applicable)
- [ ] 8.2.3 Add link to Hypixel-QoL page in site footer (if applicable)
- [ ] 8.2.4 Update breadcrumbs to include Hypixel-QoL page

### 8.3 Update Sitemaps
- [ ] 8.3.1 Add Hypixel-QoL page to sitemap.xml
- [ ] 8.3.2 Add Hypixel-QoL page to sitemap-en.xml
- [ ] 8.3.3 Add Hypixel-QoL page to sitemap-pt-BR.xml
- [ ] 8.3.4 Add Hypixel-QoL page to sitemap-es.xml
- [ ] 8.3.5 Add Hypixel-QoL page to sitemap-de.xml

### 8.4 Deployment
- [ ] 8.4.1 Run full test suite locally
- [ ] 8.4.2 Run `npm run build` to verify production build
- [ ] 8.4.3 Test page in production-like environment
- [ ] 8.4.4 Deploy to staging environment
- [ ] 8.4.5 Run E2E tests on staging
- [ ] 8.4.6 Verify ISR behavior on staging
- [ ] 8.4.7 Deploy to production
- [ ] 8.4.8 Verify page is accessible in production
- [ ] 8.4.9 Monitor GitHub API rate limits
- [ ] 8.4.10 Monitor page performance metrics

## Phase 9: Documentation and Maintenance

### 9.1 Documentation
- [ ] 9.1.1 Document component API and props
- [ ] 9.1.2 Document GitHub API integration
- [ ] 9.1.3 Document ISR configuration
- [ ] 9.1.4 Document translation key structure
- [ ] 9.1.5 Document mod data structure
- [ ] 9.1.6 Create README for Hypixel-QoL page directory

### 9.2 Maintenance Plan
- [ ] 9.2.1 Set up monitoring for GitHub API rate limits
- [ ] 9.2.2 Set up alerts for page errors
- [ ] 9.2.3 Document process for updating mod list
- [ ] 9.2.4 Document process for updating translations
- [ ] 9.2.5 Document process for updating modpack version
- [ ] 9.2.6 Schedule regular reviews of changelog data freshness

