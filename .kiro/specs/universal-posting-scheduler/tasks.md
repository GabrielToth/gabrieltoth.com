# Implementation Plan: Universal Posting Scheduler

## Overview

The Universal Posting Scheduler feature enables authenticated users to create, schedule, and publish content across multiple social media networks from a single unified interface. This implementation plan breaks down the feature into discrete, manageable coding tasks organized by functional area. Each task builds incrementally on previous work, with integration checkpoints to validate progress.

The implementation leverages existing infrastructure (OAuth, Token Store, Audit Logger, YouTube integration) while extending support to additional platforms (Facebook, Instagram, Twitter, LinkedIn). The architecture follows the existing Next.js/TypeScript patterns and integrates with Supabase for data persistence and Redis for caching.

## Phase 1: Database Setup and Core Infrastructure

- [x] 1. Set up database schema and migrations
  - Create migration files for all required tables
  - Implement social_networks table with platform, user_id, status, and metadata columns
  - Implement network_groups table with user_id, name, and created_at columns
  - Implement group_networks junction table for many-to-many relationships
  - Implement scheduled_posts table with user_id, content, scheduled_time, status columns
  - Implement scheduled_post_networks junction table for post-to-network mapping
  - Implement publication_history table with post_id, network_id, status, external_id columns
  - Implement oauth_tokens table with encrypted token storage and expiration tracking
  - Implement user_preferences table for timezone, default networks, and notification settings
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [x] 2. Add database indexes and constraints
  - Create idx_user_platform index on social_networks(user_id, platform)
  - Create idx_user_scheduled_time index on scheduled_posts(user_id, scheduled_time)
  - Create idx_status index on scheduled_posts(status) and publication_history(status)
  - Create idx_user_published_at index on publication_history(user_id, published_at)
  - Create idx_expires_at index on oauth_tokens(expires_at)
  - Add foreign key constraints between all junction tables
  - Add unique constraints on user-platform combinations
  - _Requirements: 20.1, 20.2_

- [x] 3. Configure row-level security (RLS) policies
  - Enable RLS on all tables
  - Create policy for social_networks: users can only access their own networks
  - Create policy for network_groups: users can only access their own groups
  - Create policy for scheduled_posts: users can only access their own posts
  - Create policy for publication_history: users can only access their own history
  - Create policy for oauth_tokens: users can only access their own tokens
  - Create policy for user_preferences: users can only access their own preferences
  - Test RLS policies with multiple users
  - _Requirements: 20.1, 20.2, 20.4_

- [x] 4. Set up Redis caching layer
  - Configure Redis connection with Upstash
  - Implement cache key patterns for network status, user preferences, and publication queue
  - Create cache invalidation utilities
  - Set up TTL policies for different cache types
  - _Requirements: 19.6_

## Phase 2: OAuth and Authentication Infrastructure

- [x] 5. Implement OAuth Manager service
  - Create src/lib/oauth/oauth-manager.ts with OAuth flow orchestration
  - Implement OAuth authorization URL generation for all platforms
  - Implement OAuth callback handler for token exchange
  - Implement token refresh logic for platforms requiring it
  - Implement token revocation and disconnection flow
  - Add error handling for OAuth failures and expired tokens
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 6. Implement Token Store service with encryption
  - Create src/lib/token-store/token-store.ts for secure token management
  - Implement AES-256 encryption for token storage
  - Implement token retrieval and decryption
  - Implement token refresh and update operations
  - Implement token revocation and deletion
  - Add validation for token expiration
  - Integrate with existing Token Store infrastructure
  - _Requirements: 10.8, 8.1, 8.2_

- [x] 7. Create OAuth API endpoints
  - Create POST /api/oauth/authorize/:platform endpoint
  - Create GET /api/oauth/callback/:platform endpoint
  - Create POST /api/oauth/disconnect/:platform endpoint
  - Create GET /api/oauth/status endpoint to check all network statuses
  - Add CSRF protection to OAuth endpoints
  - Add rate limiting to OAuth endpoints
  - Add comprehensive error handling and logging
  - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7_

- [x] 8. Checkpoint - OAuth authentication working
  - Verify OAuth flow works for at least one platform (YouTube)
  - Verify tokens are encrypted and stored securely
  - Verify token refresh works correctly
  - Verify disconnection revokes access
  - Ask the user if questions arise.

## Phase 3: Network Management

- [x] 9. Implement Network Manager service
  - Create src/lib/networks/network-manager.ts
  - Implement network linking and unlinking logic
  - Implement network status checking and caching
  - Implement network metadata management
  - Add support for all platforms (YouTube, Facebook, Instagram, Twitter, LinkedIn)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Create network management API endpoints
  - Create GET /api/networks endpoint to list all linked networks
  - Create POST /api/networks/:platform/connect endpoint
  - Create DELETE /api/networks/:platform/disconnect endpoint
  - Create GET /api/networks/status endpoint for all network statuses
  - Add authentication and authorization checks
  - Add error handling for network operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Implement Network Group Manager service
  - Create src/lib/groups/network-group-manager.ts
  - Implement group creation with validation
  - Implement group deletion with cascade handling
  - Implement group renaming
  - Implement adding/removing networks from groups
  - Implement group retrieval and listing
  - Add validation for unique group names per user
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 12. Create network group API endpoints
  - Create GET /api/groups endpoint to list all groups
  - Create POST /api/groups endpoint to create new group
  - Create PUT /api/groups/:groupId endpoint to update group
  - Create DELETE /api/groups/:groupId endpoint to delete group
  - Create POST /api/groups/:groupId/networks endpoint to add networks
  - Create DELETE /api/groups/:groupId/networks/:networkId endpoint to remove networks
  - Add validation and error handling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 13. Checkpoint - Network management complete
  - Verify networks can be linked and unlinked
  - Verify groups can be created, updated, and deleted
  - Verify networks can be added to and removed from groups
  - Verify all operations are properly persisted
  - Ask the user if questions arise.

## Phase 4: Content Adaptation and Conflict Detection

- [x] 14. Implement Content Adapter service
  - Create src/lib/posting/content-adapter.ts
  - Implement platform-specific character limit validation
  - Implement content truncation with platform awareness
  - Implement platform-specific formatting support (hashtags, mentions, emojis)
  - Implement image size and format validation per platform
  - Implement platform-specific metadata handling (alt text, captions)
  - Implement content variation generation for different platforms
  - Add comprehensive validation logic
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 15. Implement Conflict Detector service
  - Create src/lib/posting/conflict-detector.ts
  - Implement scheduling conflict detection
  - Implement content limit validation
  - Implement network authentication status checking
  - Implement platform-specific incompatibility detection
  - Implement conflict reporting with actionable messages
  - Add conflict resolution suggestions
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [x] 16. Create content validation API endpoint
  - Create POST /api/posts/validate endpoint
  - Implement content validation against all selected networks
  - Implement conflict detection and reporting
  - Return detailed validation results with warnings and errors
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

## Phase 5: Posting and Scheduling

- [x] 17. Implement Publication Queue service
  - Create src/lib/queue/publication-queue.ts
  - Implement scheduled post storage and retrieval
  - Implement queue processing with chronological ordering
  - Implement concurrent publication handling
  - Implement retry logic with exponential backoff (2s, 4s, 8s)
  - Implement state persistence across restarts
  - Implement publication status tracking
  - Add comprehensive error handling
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [x] 18. Create posting API endpoints
  - Create POST /api/posts endpoint to create new post
  - Create POST /api/posts/:postId/schedule endpoint to schedule post
  - Create POST /api/posts/:postId/publish endpoint to publish immediately
  - Create PUT /api/posts/:postId endpoint to update scheduled post
  - Create DELETE /api/posts/:postId endpoint to delete scheduled post
  - Add validation and conflict detection
  - Add authentication and authorization
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 19. Implement publication history tracking
  - Create POST /api/posts/:postId/publish endpoint with history recording
  - Implement publication_history table updates on successful publication
  - Implement external ID tracking for published content
  - Implement status tracking (success, failed, pending)
  - Add network-specific publication details
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 20. Implement user preferences service
  - Create src/lib/preferences/user-preferences.ts
  - Implement timezone preference management
  - Implement default network selection
  - Implement visibility/privacy settings per network
  - Implement notification preferences
  - Implement retry behavior configuration
  - Add preference persistence and retrieval
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [x] 21. Create user preferences API endpoints
  - Create GET /api/preferences endpoint
  - Create PUT /api/preferences endpoint
  - Create POST /api/preferences/export endpoint
  - Create POST /api/preferences/import endpoint
  - Add validation and error handling
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [x] 22. Checkpoint - Posting and scheduling working
  - Verify posts can be created and scheduled
  - Verify scheduled posts are stored correctly
  - Verify publication history is tracked
  - Verify user preferences are persisted
  - Ask the user if questions arise.

## Phase 6: Frontend Components - Core UI

- [~] 23. Create Universal Posting Button component
  - Create src/components/publish/UniversalPostingButton.tsx
  - Implement button styling and accessibility
  - Implement linked networks count display
  - Implement disabled state with tooltip
  - Implement active state indicator
  - Add keyboard navigation support
  - Add ARIA labels and descriptions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [~] 24. Create Network Selector component
  - Create src/components/publish/NetworkSelector.tsx
  - Implement network list display with categories
  - Implement network group display
  - Implement network status indicators
  - Implement search functionality
  - Implement Select All/Deselect All options
  - Implement platform-specific icons
  - Implement indeterminate state for groups
  - Add keyboard navigation and ARIA support
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [~] 25. Create Posting Scheduler component
  - Create src/components/publish/PostingScheduler.tsx
  - Implement date and time picker
  - Implement immediate publication option
  - Implement timezone support
  - Implement future date validation
  - Implement 365-day advance scheduling
  - Implement human-readable time preview
  - Implement recurring schedule support
  - Add keyboard navigation and ARIA support
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [~] 26. Create Content Creator component
  - Create src/components/publish/ContentCreator.tsx
  - Implement rich text editor with formatting (bold, italic, underline, links)
  - Implement image upload and selection
  - Implement URL addition
  - Implement character count display
  - Implement platform-specific character limit warnings
  - Implement content preview
  - Implement draft saving
  - Add keyboard navigation and ARIA support
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [~] 27. Create main Posting Interface component
  - Create src/components/publish/PostingInterface.tsx
  - Integrate Network Selector, Posting Scheduler, and Content Creator
  - Implement form state management
  - Implement validation and conflict detection
  - Implement error display and handling
  - Implement loading states
  - Implement success feedback
  - Add responsive design for mobile, tablet, desktop
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [~] 28. Checkpoint - Frontend components rendering
  - Verify all components render correctly
  - Verify form state management works
  - Verify responsive design on all screen sizes
  - Verify keyboard navigation works
  - Ask the user if questions arise.

## Phase 7: Frontend Components - Management Interfaces

- [~] 29. Create Network Group Management component
  - Create src/components/settings/NetworkGroupManager.tsx
  - Implement group list display
  - Implement group creation form
  - Implement group editing interface
  - Implement group deletion with confirmation
  - Implement network selection within groups
  - Implement drag-and-drop for network organization
  - Add error handling and validation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [~] 30. Create Publication History component
  - Create src/components/history/PublicationHistory.tsx
  - Implement publication list display with date and time
  - Implement network display for each publication
  - Implement status indicators (success, failed, pending)
  - Implement filtering by network
  - Implement filtering by date range
  - Implement sorting by publication date
  - Implement detail view for individual publications
  - Implement links to published content
  - Add pagination for large lists
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [~] 31. Create User Preferences component
  - Create src/components/settings/UserPreferences.tsx
  - Implement timezone selection
  - Implement default network configuration
  - Implement visibility/privacy settings per network
  - Implement notification preferences
  - Implement retry behavior configuration
  - Implement export/import functionality
  - Add form validation and error handling
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [~] 32. Create error handling and notification system
  - Create src/components/notifications/ErrorNotification.tsx
  - Create src/components/notifications/SuccessNotification.tsx
  - Implement error message display with actionable guidance
  - Implement success feedback for operations
  - Implement retry prompts for failed publications
  - Implement conflict resolution UI
  - Add accessibility support for notifications
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

## Phase 8: Integration and Wiring

- [~] 33. Integrate with existing YouTube infrastructure
  - Verify YouTube OAuth flow works with existing implementation
  - Verify YouTube video upload infrastructure is accessible
  - Implement YouTube-specific metadata support (title, description, tags, visibility)
  - Implement YouTube premiere and scheduled release features
  - Add YouTube-specific error handling
  - Test YouTube publishing end-to-end
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [~] 34. Integrate with existing OAuth authentication
  - Verify OAuth Manager uses existing Google OAuth implementation
  - Verify session management integration
  - Verify user context is properly passed through components
  - Test authentication flow end-to-end
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

- [~] 35. Integrate with existing Token Store
  - Verify Token Store encryption/decryption works
  - Verify token refresh logic integrates properly
  - Verify token revocation works
  - Test token operations end-to-end
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

- [~] 36. Integrate with existing Audit Logger
  - Implement OAuth operation logging
  - Implement post creation and scheduling logging
  - Implement publication attempt logging
  - Implement API error logging
  - Implement token operation logging
  - Implement user preference change logging
  - Verify logs are retained for 90+ days
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_

- [~] 37. Set up environment variables
  - Add NEXT_PUBLIC_API_URL configuration
  - Add OAuth client IDs and secrets for all platforms
  - Add DATABASE_URL for Supabase
  - Add REDIS_URL for Upstash
  - Add TOKEN_ENCRYPTION_KEY for AES-256
  - Add AUDIT_LOG_RETENTION_DAYS configuration
  - Verify environment variables work in both cloud and local environments
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

- [~] 38. Checkpoint - All integrations working
  - Verify all existing systems integrate properly
  - Verify environment variables are configured
  - Verify end-to-end posting flow works
  - Ask the user if questions arise.

## Phase 9: Testing

- [~] 39. Write unit tests for services
  - Create tests/unit/oauth-manager.test.ts for OAuth Manager
  - Create tests/unit/token-store.test.ts for Token Store
  - Create tests/unit/content-adapter.test.ts for Content Adapter
  - Create tests/unit/conflict-detector.test.ts for Conflict Detector
  - Create tests/unit/publication-queue.test.ts for Publication Queue
  - Create tests/unit/network-group-manager.test.ts for Network Group Manager
  - Aim for > 80% code coverage
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [~] 40. Write integration tests for API endpoints
  - Create tests/integration/oauth-endpoints.test.ts
  - Create tests/integration/network-endpoints.test.ts
  - Create tests/integration/group-endpoints.test.ts
  - Create tests/integration/posting-endpoints.test.ts
  - Create tests/integration/history-endpoints.test.ts
  - Create tests/integration/preferences-endpoints.test.ts
  - Test complete workflows end-to-end
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [~] 41. Write component tests for UI components
  - Create tests/components/UniversalPostingButton.test.tsx
  - Create tests/components/NetworkSelector.test.tsx
  - Create tests/components/PostingScheduler.test.tsx
  - Create tests/components/ContentCreator.test.tsx
  - Create tests/components/PublicationHistory.test.tsx
  - Create tests/components/NetworkGroupManager.test.tsx
  - Test user interactions and state changes
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [~] 42. Write E2E tests for complete workflows
  - Create tests/e2e/posting-workflow.spec.ts for complete posting flow
  - Create tests/e2e/oauth-flow.spec.ts for OAuth authentication
  - Create tests/e2e/group-management.spec.ts for group operations
  - Create tests/e2e/publication-history.spec.ts for history tracking
  - Test on multiple browsers and devices
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [~] 43. Write accessibility tests
  - Create tests/a11y/posting-interface.test.tsx
  - Test keyboard navigation for all components
  - Test screen reader compatibility
  - Test color contrast ratios
  - Test text resizing
  - Test ARIA labels and descriptions
  - Verify WCAG 2.1 Level AA compliance
  - _Requirements: 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [~] 44. Write security tests
  - Create tests/security/token-encryption.test.ts
  - Create tests/security/csrf-protection.test.ts
  - Create tests/security/xss-prevention.test.ts
  - Create tests/security/input-validation.test.ts
  - Create tests/security/rate-limiting.test.ts
  - Create tests/security/sql-injection-prevention.test.ts
  - Verify all security measures are in place
  - _Requirements: 10.8, 8.1, 8.2_

- [~] 45. Checkpoint - All tests passing
  - Run full test suite: npm run test
  - Verify coverage > 80%
  - Verify all E2E tests pass
  - Verify accessibility compliance
  - Ask the user if questions arise.

## Phase 10: Documentation and Storybook

- [~] 46. Create Storybook stories for components
  - Create stories/UniversalPostingButton.stories.tsx
  - Create stories/NetworkSelector.stories.tsx
  - Create stories/PostingScheduler.stories.tsx
  - Create stories/ContentCreator.stories.tsx
  - Create stories/PublicationHistory.stories.tsx
  - Create stories/NetworkGroupManager.stories.tsx
  - Document all props and behaviors
  - Add interactive examples
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [~] 47. Create API documentation
  - Document all OAuth endpoints with examples
  - Document all network management endpoints
  - Document all posting endpoints
  - Document all history endpoints
  - Document all preferences endpoints
  - Include request/response examples
  - Document error codes and handling
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

- [~] 48. Create developer guide
  - Document architecture and design patterns
  - Document how to add new platform support
  - Document token encryption/decryption
  - Document publication queue processing
  - Document error handling patterns
  - Document testing patterns
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

- [~] 49. Create user guide
  - Document how to link social networks
  - Document how to create and manage groups
  - Document how to schedule posts
  - Document how to view publication history
  - Document how to configure preferences
  - Include screenshots and examples
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

## Phase 11: Performance and Optimization

- [~] 50. Optimize database queries
  - Add query optimization for network listing
  - Add query optimization for publication history
  - Add query optimization for group retrieval
  - Implement query result caching
  - Verify query performance with large datasets
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [~] 51. Optimize frontend performance
  - Implement code splitting for posting interface
  - Implement lazy loading for components
  - Implement image optimization
  - Implement bundle size optimization
  - Verify Lighthouse scores meet targets
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [~] 52. Optimize publication queue processing
  - Implement batch processing for multiple publications
  - Implement concurrent publication handling
  - Implement queue processing optimization
  - Verify publication latency is minimal
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [~] 53. Implement caching strategy
  - Implement Redis caching for network status
  - Implement caching for user preferences
  - Implement caching for publication history
  - Implement cache invalidation logic
  - Verify cache hit rates are optimal
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

## Phase 12: Internationalization

- [~] 54. Implement multi-language support
  - Add Portuguese (pt-BR) translations
  - Add English (en) translations
  - Add Spanish (es) translations
  - Add German (de) translations
  - Implement language selection UI
  - Implement language persistence
  - Test all languages in all components
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_

## Phase 13: Final Integration and Deployment

- [~] 55. Verify responsive design
  - Test on mobile devices (iOS, Android)
  - Test on tablets
  - Test on desktop browsers
  - Verify all components are responsive
  - Verify touch interactions work on mobile
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [~] 56. Run full test suite and quality checks
  - Run npm run test for all tests
  - Run npm run type-check for TypeScript validation
  - Run npm run lint for linting
  - Run npm run format for code formatting
  - Run npm run spell-check for spelling
  - Verify all checks pass
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [~] 57. Build and verify production bundle
  - Run npm run build
  - Verify build completes without errors
  - Verify bundle size is acceptable
  - Verify no warnings in build output
  - Test production build locally
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [~] 58. Final checkpoint - Feature complete
  - Verify all requirements are met
  - Verify all acceptance criteria are satisfied
  - Verify all tests pass
  - Verify documentation is complete
  - Verify performance targets are met
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- All tasks assume TypeScript/Next.js development environment
- All tasks assume Supabase for database and Redis for caching
- All tasks assume existing OAuth, Token Store, and Audit Logger infrastructure
- Testing tasks are integrated throughout to catch issues early
- Performance optimization is included in later phases
- Internationalization support is included for all user-facing text
- Accessibility compliance is verified throughout implementation
