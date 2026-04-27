# Design Document: Universal Posting Scheduler

## Overview

The Universal Posting Scheduler is a comprehensive feature that enables authenticated users to create, schedule, and publish content across multiple social media networks from a single unified interface.

## Architecture

### System Components

The system consists of several interconnected layers:

- **Frontend Layer**: Universal Posting Button, Network Selection Interface, Posting Scheduler, Content Creation Interface, Publication History
- **API Layer**: REST API Endpoints, OAuth Manager, Content Adapter, Conflict Detector
- **Service Layer**: Publication Queue, Token Store, Audit Logger, Network Group Manager
- **External Services**: YouTube API, Facebook Graph API, Instagram Graph API, Twitter API, LinkedIn API
- **Data Layer**: PostgreSQL Database, Redis Cache

### Integration Points

#### 1. OAuth Authentication
- Leverages existing Google OAuth implementation
- Extends with OAuth flows for Facebook, Instagram, Twitter, LinkedIn
- Reuses existing Token Store with AES-256 encryption
- Integrates with existing session management

#### 2. YouTube Integration
- Uses existing YouTube OAuth service
- Reuses existing YouTube video upload infrastructure
- Supports YouTube-specific metadata (title, description, tags, visibility)
- Supports YouTube premiere and scheduled release features

#### 3. Token Store
- All OAuth tokens encrypted with AES-256
- Tokens stored in Supabase with encryption at rest
- Automatic refresh for platforms requiring it
- Support token revocation and disconnection

#### 4. Audit Logger
- Logs all authentication attempts and token operations
- Logs all post creation, scheduling, and publication
- Logs all API errors and publication failures
- Retains logs for 90+ days for compliance

## Components and Interfaces

### 1. Universal Posting Button Component

**Location**: src/components/publish/UniversalPostingButton.tsx

**Props**:
- linkedNetworksCount: number
- isDisabled?: boolean
- onOpen?: () => void

**Behavior**:
- Displays prominently in main navigation
- Shows visual indicator when linked networks available
- Disabled state with tooltip when no networks configured
- Accessible from all authenticated pages
- Indicates active state when posting interface open

### 2. Network Selection Interface Component

**Location**: src/components/publish/NetworkSelector.tsx

**Features**:
- Display all linked networks organized by category
- Display all network groups in separate section
- Show network status (connected, disconnected, expired)
- Search functionality for networks and groups
- Display count of selected networks
- Select All and Deselect All options
- Platform-specific icons for visual identification
- Indeterminate state for partially selected groups

### 3. Posting Scheduler Component

**Location**: src/components/publish/PostingScheduler.tsx

**Features**:
- Date and time picker for scheduling
- Immediate publication option
- Timezone support (user's local timezone)
- Validation for future dates only
- Support for scheduling up to 365 days in advance
- Human-readable preview of scheduled time
- Recurring schedule support (daily, weekly, monthly)

### 4. Content Creation Interface

**Location**: src/components/publish/ContentCreator.tsx

**Features**:
- Rich text editor with formatting support (bold, italic, underline, links)
- Image upload and selection
- URL addition
- Character count display
- Platform-specific character limit warnings
- Content preview
- Draft saving

### 5. Content Adapter Component

**Location**: src/lib/posting/content-adapter.ts

**Responsibilities**:
- Adjust character limits based on selected networks
- Display warnings for content exceeding limits
- Support platform-specific formatting
- Handle image size and format requirements
- Support platform-specific metadata
- Create platform-specific content variations
- Validate content compatibility

### 6. Conflict Detector Component

**Location**: src/lib/posting/conflict-detector.ts

**Responsibilities**:
- Identify scheduling conflicts
- Warn about content exceeding platform limits
- Validate network authentication status
- Identify platform-specific incompatibilities
- Prevent publication with unresolved conflicts

## Data Models

### Database Schema

#### 1. social_networks Table
Stores linked social media accounts with connection status and metadata

#### 2. network_groups Table
Stores user-defined groups of networks

#### 3. group_networks Table
Junction table linking networks to groups

#### 4. scheduled_posts Table
Stores scheduled posts with content and metadata

#### 5. scheduled_post_networks Table
Junction table linking posts to target networks

#### 6. publication_history Table
Records all published posts with status and external references

#### 7. oauth_tokens Table
Stores encrypted OAuth tokens for each network

#### 8. user_preferences Table
Stores user preferences for posting and scheduling

### Key Indexes
- idx_user_platform on social_networks
- idx_user_scheduled_time on scheduled_posts
- idx_status on scheduled_posts and publication_history
- idx_user_published_at on publication_history
- idx_expires_at on oauth_tokens

## Error Handling

### Error Categories

#### 1. Authentication Errors
- Expired Token: Prompt for re-authentication
- Invalid Credentials: Display clear error message
- Revoked Access: Notify user and disable network

#### 2. Network Errors
- Connection Timeout: Retry with exponential backoff
- Rate Limiting: Queue for retry after limit resets
- Service Unavailable: Retry with exponential backoff

#### 3. Content Errors
- Character Limit Exceeded: Display warning and truncation options
- Unsupported Format: Display incompatibility warning
- Invalid Content: Display validation errors

#### 4. Scheduling Errors
- Past Date: Display error and prevent scheduling
- Conflict Detected: Display conflicts and resolution options
- Invalid Timezone: Display error and suggest correction

### Retry Logic

**Exponential Backoff Strategy**:
- Attempt 1: Immediate
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay
- Attempt 4: 8 seconds delay
- Max attempts: 3

**Retry Conditions**:
- Network errors (timeout, connection refused)
- Rate limiting (HTTP 429)
- Server errors (HTTP 5xx)
- Temporary service unavailability

**Non-Retryable Errors**:
- Authentication errors (HTTP 401)
- Authorization errors (HTTP 403)
- Invalid content (HTTP 400)
- Not found (HTTP 404)

## Testing Strategy

### Unit Tests

**Coverage Target**: > 80%

**Test Categories**:
1. Content Adapter Tests: Character limit validation, content truncation, format support
2. Conflict Detector Tests: Scheduling conflicts, authentication status, compatibility
3. Network Group Manager Tests: Group creation, network management, toggle functionality
4. OAuth Manager Tests: Token exchange, refresh logic, encryption/decryption
5. Publication Queue Tests: Scheduling, retrieval, retry logic, concurrent handling

### Integration Tests

**Test Scenarios**:
1. Complete Posting Flow: Create, select, schedule, verify storage and publication
2. OAuth Flow: Authorization, callback, token storage, refresh, expiration
3. Error Handling: Network errors, rate limiting, authentication, conflicts
4. Multi-Platform Publishing: Simultaneous publishing, partial failures, history tracking

### Performance Tests

**Targets**:
- Posting interface load: < 2 seconds
- Network selector render: < 500ms
- Schedule validation and save: < 1 second
- Publication queue processing: minimal latency
- Concurrent user operations: no degradation

### Accessibility Tests

**Standards**: WCAG 2.1 Level AA

**Test Coverage**:
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Text resizing
- ARIA labels and descriptions

### Security Tests

**Coverage**:
- Token encryption/decryption
- CSRF protection
- XSS prevention
- Input validation
- Rate limiting
- SQL injection prevention

## Technology Stack

### Frontend
- Framework: Next.js 16+ with React 19
- Styling: Tailwind CSS 4
- UI Components: Radix UI
- State Management: React Hooks + Context API
- Date/Time: date-fns with timezone support
- Rich Text Editor: TipTap or Slate
- HTTP Client: Fetch API with custom wrapper

### Backend
- Runtime: Node.js 24+
- Framework: Express.js (existing)
- Language: TypeScript
- Database: PostgreSQL with Supabase
- Cache: Redis (Upstash)
- Authentication: OAuth 2.0
- Encryption: crypto module (AES-256)

### External Services
- YouTube API: googleapis library
- Facebook Graph API: facebook-sdk
- Instagram Graph API: instagram-sdk
- Twitter API: twitter-api-v2
- LinkedIn API: linkedin-api

### Development Tools
- Testing: Vitest + @testing-library/react
- E2E Testing: Playwright
- Linting: ESLint
- Formatting: Prettier
- Type Checking: TypeScript
- Documentation: Storybook

## Deployment Considerations

### Environment Variables
- NEXT_PUBLIC_API_URL
- OAUTH_GOOGLE_CLIENT_ID and SECRET
- OAUTH_FACEBOOK_CLIENT_ID and SECRET
- OAUTH_INSTAGRAM_CLIENT_ID and SECRET
- OAUTH_TWITTER_CLIENT_ID and SECRET
- OAUTH_LINKEDIN_CLIENT_ID and SECRET
- DATABASE_URL
- REDIS_URL
- TOKEN_ENCRYPTION_KEY
- AUDIT_LOG_RETENTION_DAYS

### Database Migrations
- Create all required tables
- Add indexes for performance
- Set up foreign key constraints
- Configure row-level security (RLS) policies

### Monitoring & Alerts
- Publication queue processing latency
- OAuth token refresh failures
- Publication failure rates
- API error rates
- Database query performance

## Compliance & Security

### Data Protection
- All OAuth tokens encrypted with AES-256
- Tokens stored in Supabase with encryption at rest
- Audit logs retained for 90+ days
- GDPR compliance for user data

### Security Headers
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy

### Rate Limiting
- API endpoints: 100 requests/minute per user
- OAuth endpoints: 10 requests/minute per IP
- Publication queue: Platform-specific limits

### Audit Logging
- All OAuth operations logged
- All post creation/scheduling logged
- All publication attempts logged
- All API errors logged
- All user preference changes logged

## Conclusion

The Universal Posting Scheduler provides a comprehensive, secure, and scalable solution for multi-platform content publishing. By leveraging existing infrastructure and following established patterns, the implementation will be maintainable, performant, and aligned with the application's architecture.

The design prioritizes user experience, security, and reliability while providing a foundation for future enhancements and additional platform integrations.
