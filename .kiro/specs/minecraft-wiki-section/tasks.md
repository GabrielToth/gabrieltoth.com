# Implementation Plan: Minecraft Wiki Section

## Overview

This implementation plan breaks down the Minecraft wiki section feature into discrete coding tasks. The feature adds a new top-level navigation category with modpack pages styled after Modrinth's design system, GitHub changelog integration, and full i18n support across 4 locales.

The implementation follows a bottom-up approach: foundation (routing, i18n) → core features (modpack pages, components) → external integrations (GitHub API) → polish (optimization, SEO).

## Tasks

- [x] 1. Set up routing structure and URL mappings
  - Create directory structure: `src/app/[locale]/minecraft/modpacks/[slug]/`
  - Add URL mappings to `src/lib/url-mapping.ts` for all 4 locales (en, pt-BR, es, de)
  - Add entries for "minecraft-modpacks" and "minecraft-mods" routes
  - _Requirements: 1.4, 8.2_

- [x] 2. Create i18n translation files for all locales
  - [x] 2.1 Create `src/i18n/en/minecraft.json` with all translation keys
    - Include navigation, modpack, and changelog namespaces
    - Add all UI labels: version, compatibility, platforms, links, tags, creators, details
    - Add search and mod list labels
    - _Requirements: 8.1, 8.3_
  
  - [x] 2.2 Create `src/i18n/pt-BR/minecraft.json` with Portuguese translations
    - Translate all keys from English version
    - _Requirements: 8.1, 8.3_
  
  - [x] 2.3 Create `src/i18n/es/minecraft.json` with Spanish translations
    - Translate all keys from English version
    - _Requirements: 8.1, 8.3_
  
  - [x] 2.4 Create `src/i18n/de/minecraft.json` with German translations
    - Translate all keys from English version
    - _Requirements: 8.1, 8.3_
  
  - [x] 2.5 Update `src/i18n/en/layout.header.json` with Minecraft dropdown labels
    - Add "minecraftDropdown.modpacks" and "minecraftDropdown.mods"
    - Replicate for all other locales (pt-BR, es, de)
    - _Requirements: 1.3, 8.3_
  
  - [x] 2.6 Update `src/i18n/request.ts` to load minecraft namespace
    - Import and include minecraft translations in messages object
    - _Requirements: 8.1_

- [x] 3. Update header navigation with Minecraft dropdown
  - Modify `src/components/layout/header.tsx` to add Minecraft navigation item
  - Implement dropdown state management (similar to Services dropdown)
  - Add "Modpacks" and "Mods" dropdown links using `getLocalizedPath`
  - Ensure visual consistency with existing navigation items
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 4. Create modpack data model and JSON file
  - [ ] 4.1 Define TypeScript interfaces for modpack data
    - Create `src/types/modpack.ts` with ModpackMetadata, Creator, ModEntry interfaces
    - Include all fields: id, name, version, description, compatibility, links, tags, creators, mods
    - _Requirements: 2.1, 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 4.2 Create Hypixel QoL modpack data file
    - Create `src/data/modpacks/hypixel-qol.json` with complete modpack data
    - Include all 150+ mods in the mod list
    - Add metadata: version 0.1.0, Minecraft 1.21.1, Fabric, Client-side
    - Add all tags: Lightweight, Multiplayer, Optimization, Challenging, Combat, Magic, Quests, Technology
    - Add external links: Modrinth, GitHub, PayPal
    - _Requirements: 2.1, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 4.3 Create modpack data loader utility
    - Create `src/data/modpacks/index.ts` with getModpackData and getAllModpackSlugs functions
    - Support multiple modpacks for future extensibility
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 5. Checkpoint - Verify foundation setup
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement modpack page layout and routing
  - [ ] 6.1 Create modpack detail page
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/page.tsx`
    - Implement generateStaticParams for known modpack slugs
    - Set revalidate to 3600 (1 hour cache)
    - _Requirements: 2.1, 10.2_
  
  - [ ] 6.2 Create modpack metadata generation
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/modpack-metadata.ts`
    - Generate title, description, keywords, OpenGraph, and Twitter card metadata
    - _Requirements: 11.1, 11.2_
  
  - [ ] 6.3 Create modpack structured data
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/modpack-structured.ts`
    - Generate Schema.org SoftwareApplication structured data
    - _Requirements: 11.4, 11.5_
  
  - [ ] 6.4 Create main modpack view component
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/modpack-view.tsx`
    - Implement responsive layout with hero, sidebar, and content sections
    - _Requirements: 2.1, 2.2, 9.1_

- [ ] 7. Build modpack hero section component
  - Create `src/app/[locale]/minecraft/modpacks/[slug]/components/modpack-hero.tsx`
  - Display modpack name, version, and short description
  - Apply Modrinth-style dark theme and green accents
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4_

- [ ] 8. Build metadata sidebar component
  - [ ] 8.1 Create main sidebar component
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/components/modpack-sidebar.tsx`
    - Implement sticky positioning for desktop
    - Apply Modrinth-style card design with dark background and borders
    - _Requirements: 2.2, 3.3, 3.5, 9.2_
  
  - [ ] 8.2 Implement sidebar sections
    - Add Compatibility section (Minecraft version, mod loader, environment)
    - Add Platforms section (display supported platforms)
    - Add Links section (Modrinth, GitHub, Report issues, Donate)
    - Add Tags section (display all modpack tags with green styling)
    - Add Creators section (display creator name and role)
    - Add Details section (additional metadata)
    - _Requirements: 2.2, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Implement mod list with search functionality
  - [ ] 9.1 Create mod list component with virtualization
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/components/mod-list.tsx`
    - Implement virtual scrolling using @tanstack/react-virtual for 150+ mods
    - Apply Modrinth-style card layout for mod entries
    - _Requirements: 2.3, 5.1, 5.2, 10.3_
  
  - [ ] 9.2 Create mod search component
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/components/mod-search.tsx`
    - Implement debounced search (300ms delay)
    - Filter mods by name and description
    - Display mod count with search results
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 9.3 Write unit tests for mod search functionality
    - Test search filtering with various queries
    - Test debounce behavior
    - Test empty results handling
    - _Requirements: 5.3_

- [ ] 10. Create modpack tabs component
  - Create `src/app/[locale]/minecraft/modpacks/[slug]/components/modpack-tabs.tsx`
  - Implement Description, Mod List, and Changelog tabs
  - Changelog tab should link to separate changelog page
  - Apply Modrinth-style tab design
  - _Requirements: 2.3, 3.3, 3.4_

- [ ] 11. Checkpoint - Verify modpack page functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement GitHub API client
  - [ ] 12.1 Create GitHub API client class
    - Create `src/lib/github-api.ts` with GitHubClient class
    - Implement getReleases method with fetch and caching (1 hour revalidate)
    - Support optional authentication token from environment variable
    - Handle API errors (403 rate limit, 404 not found, network errors)
    - _Requirements: 7.1, 7.6, 10.2_
  
  - [ ] 12.2 Create changelog parser utility
    - Create `src/lib/changelog-parser.ts` with parseChangelogMarkdown function
    - Parse markdown sections: ## Added, ## Changed, ## Fixed, ## Removed
    - Extract list items into structured ChangeEntry objects
    - _Requirements: 7.4_
  
  - [ ]* 12.3 Write unit tests for changelog parser
    - Test valid changelog format parsing
    - Test empty changelog handling
    - Test malformed markdown handling
    - Test missing sections handling
    - _Requirements: 7.4_

- [ ] 13. Implement changelog page
  - [ ] 13.1 Create changelog page route
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/changelog/page.tsx`
    - Fetch changelog data from GitHub API
    - Set revalidate to 3600 (1 hour cache)
    - _Requirements: 7.1, 10.2_
  
  - [ ] 13.2 Create changelog view component
    - Create `src/app/[locale]/minecraft/modpacks/[slug]/changelog/changelog-view.tsx`
    - Display versions in reverse chronological order (newest first)
    - Show version numbers, release dates, and change descriptions
    - Apply Modrinth-style changelog design
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 13.3 Implement error handling for GitHub API
    - Display user-friendly error messages for network, rate limit, and parse errors
    - Show fallback message when GitHub API is unavailable
    - Provide retry button for retryable errors
    - Include link to GitHub releases page as alternative
    - _Requirements: 7.6_
  
  - [ ]* 13.4 Write integration tests for GitHub API client
    - Test successful fetch with mocked response
    - Test rate limit response (403)
    - Test network timeout
    - Test invalid JSON response
    - _Requirements: 7.1, 7.6_

- [ ] 14. Apply Modrinth-style theming with Tailwind
  - [ ] 14.1 Update Tailwind configuration
    - Add custom colors to `tailwind.config.ts`: modrinth-green, bg-primary, bg-secondary, bg-card
    - Define color palette matching Modrinth (#10b981 green, dark backgrounds)
    - _Requirements: 3.1, 3.2_
  
  - [ ] 14.2 Apply consistent styling across components
    - Use modrinth-green for accents, buttons, and interactive elements
    - Use dark theme backgrounds for all cards and sections
    - Apply consistent border colors and hover states
    - Ensure typography matches Modrinth (font weights, spacing)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 15. Implement responsive design for all screen sizes
  - Update modpack page layout for mobile (< 768px): single column, sidebar below content
  - Update modpack page layout for tablet (768px - 1024px): single column, sidebar below content
  - Update modpack page layout for desktop (> 1024px): two-column with sticky sidebar
  - Ensure mod list is readable and usable on small screens
  - Test navigation dropdown on mobile devices
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 16. Checkpoint - Verify responsive design and styling
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Add SEO metadata and sitemap entries
  - [ ] 17.1 Update sitemap generation for all locales
    - Add modpack pages to `src/app/sitemap-[locale].xml/route.ts` for all 4 locales
    - Set changeFrequency to 'weekly' and priority to 0.8
    - _Requirements: 11.3_
  
  - [ ] 17.2 Verify metadata implementation
    - Ensure meta tags are correctly generated for modpack pages
    - Verify OpenGraph tags for social media sharing
    - Verify structured data is included in page HTML
    - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [ ] 18. Optimize performance and add loading states
  - [ ] 18.1 Add loading skeletons
    - Create loading skeleton for modpack page
    - Create loading skeleton for changelog page
    - Apply Modrinth-style skeleton design
    - _Requirements: 10.1_
  
  - [ ] 18.2 Optimize images and assets
    - Use Next.js Image component for all images
    - Provide appropriate sizes for responsive images
    - Use WebP format with fallbacks
    - _Requirements: 10.4_
  
  - [ ] 18.3 Implement code splitting
    - Lazy load mod list component for large lists
    - Use dynamic imports for heavy components
    - _Requirements: 10.1_

- [ ] 19. Add @tanstack/react-virtual dependency
  - Install @tanstack/react-virtual package: `npm install @tanstack/react-virtual`
  - Verify package.json includes the dependency
  - _Requirements: 10.3_

- [ ]* 20. Write end-to-end tests for user flows
  - [ ]* 20.1 Test navigation flow
    - Click Minecraft dropdown → Navigate to modpack
    - Navigate to changelog from modpack page
    - Search mods in mod list
    - Click external links (Modrinth, GitHub)
    - _Requirements: 1.1, 1.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 20.2 Test responsive design
    - Verify mobile layout renders correctly
    - Verify tablet layout renders correctly
    - Verify desktop layout renders correctly
    - Verify sidebar positioning on different screen sizes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 20.3 Test accessibility compliance
    - Verify keyboard navigation works
    - Verify screen reader labels are present
    - Verify color contrast meets WCAG AA standards
    - Verify focus indicators are visible
    - _Requirements: 11.4_

- [ ] 21. Final checkpoint - Complete testing and verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Implementation uses TypeScript, Next.js 16.2.4, React, Tailwind CSS 4.2.2, and next-intl 4.9.1
- All components follow Modrinth's design system: dark theme, green accents (#10b981), card-based layouts
- GitHub API integration includes caching (1 hour) and comprehensive error handling
- Mod list uses virtualization (@tanstack/react-virtual) for optimal performance with 150+ items
- Full i18n support across 4 locales (en, pt-BR, es, de) with locale-specific URLs
- SEO optimization includes meta tags, OpenGraph, structured data, and sitemap entries
- Responsive design supports mobile, tablet, and desktop with adaptive layouts
