# Implementation Plan: YouTube Channel Linking

## Overview

This implementation plan breaks down the YouTube Channel Linking feature into actionable, incremental tasks organized by the 6 implementation phases defined in the design document. Each task builds on previous steps, with comprehensive testing (unit, integration, and property-based) integrated throughout. The feature uses TypeScript/Next.js backend with PostgreSQL (Supabase), Redis for caching/rate limiting, and follows the existing project architecture.

## Phase 1: Core Infrastructure & Database Setup

- [ ] 1. Set up database schema and migrations
  - Create PostgreSQL migration files for all 5 tables (youtube_channels, linking_activity, recovery_tokens, audit_logs, unlink_revocation_window)
  - Implement table creation with proper constraints, indexes, and foreign keys
  - Set up data retention policies and archival procedures
  - Create database seed data for testing
  - _Requirements: 1.1, 2.1, 6.1_

- [ ] 2. Implement token encryption/decryption utilities
  - Create encryption service using AES-256 for OAuth tokens
  - Implement secure key management integration (AWS KMS or similar)
  - Write utility functions for encrypt/decrypt operations
  - _Requirements: 1.4, 8.1_

- [ ]* 2.1 Write property test for token encryption
  - **Property 3: Token Encryption**
  - **Validates: Requirements 1.4**

- [ ] 3. Set up core service infrastructure
  - Create base service class with error handling and logging
  - Set up dependency injection container
  - Configure environment variables for YouTube OAuth, email service, geolocation service
  - _Requirements: 1.1_

- [ ] 4. Implement geolocation and device detection utilities
  - Integrate GeoIP service (MaxMind or similar) for location detection
  - Create device type detection from user agent
  - Implement IP address collection and validation
  - _Requirements: 5.1, 5.2_

- [ ] 5. Checkpoint - Verify database and utilities
  - Ensure all database migrations run successfully
  - Verify encryption/decryption works correctly
  - Test geolocation and device detection with sample data
  - Ensure all utilities are properly typed and documented

## Phase 2: OAuth Integration & Channel Validation

- [ ] 6. Implement OAuth service
  - Create OAuth 2.0 authorization URL generation with state parameter
  - Implement authorization code exchange for access tokens
  - Add token refresh logic with automatic rotation
  - Implement token revocation for unlinking
  - _Requirements: 1.1, 1.3_

- [ ]* 6.1 Write unit tests for OAuth service
  - Test authorization URL generation with various parameters
  - Test token exchange with mock YouTube API responses
  - Test token refresh and rotation logic
  - Test token revocation
  - _Requirements: 1.1, 1.3_

- [ ] 7. Implement channel validation service
  - Create YouTube API integration to fetch channel information
  - Implement channel ID validation against OAuth response
  - Add error handling for API failures and rate limiting
  - _Requirements: 2.1, 2.2_

- [ ]* 7.1 Write property test for channel validation
  - **Property 1: Channel ID Validation**
  - **Validates: Requirements 2.2**

- [ ]* 7.2 Write unit tests for channel validation
  - Test valid channel ID matching
  - Test mismatched channel IDs
  - Test API error handling
  - _Requirements: 2.1, 2.2_

- [ ] 8. Implement linking initiation endpoint
  - Create POST /api/youtube/link/start endpoint
  - Generate OAuth authorization URL
  - Store state parameter in Redis with expiration
  - Return authorization URL to frontend
  - _Requirements: 1.1, 1.2_

- [ ] 9. Implement OAuth callback endpoint
  - Create GET /api/youtube/link/callback endpoint
  - Validate state parameter
  - Exchange authorization code for token
  - Call channel validation service
  - Store encrypted token in database
  - _Requirements: 1.3, 2.1, 2.2_

- [ ]* 9.1 Write integration tests for OAuth flow
  - Test complete OAuth flow from start to callback
  - Test with valid and invalid authorization codes
  - Test state parameter validation
  - _Requirements: 1.1, 1.3, 2.1_

- [ ] 10. Checkpoint - OAuth and validation working
  - Test OAuth flow end-to-end with YouTube sandbox
  - Verify tokens are encrypted and stored correctly
  - Verify channel validation works with real YouTube API
  - Ensure error handling works for all failure scenarios

## Phase 3: Duplicate Detection & Recovery Flow

- [ ] 11. Implement duplicate detection service
  - Create database query to check if channel is already linked
  - Implement logic to determine if duplicate exists
  - Return linked user information if duplicate found
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 11.1 Write property test for duplicate detection
  - **Property 2: Unique Channel Constraint**
  - **Validates: Requirements 3.4**

- [ ]* 11.2 Write property test for duplicate detection logic
  - **Property 4: Duplicate Detection**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ]* 11.3 Write unit tests for duplicate detection
  - Test detection of already-linked channels
  - Test with multiple users and channels
  - Test edge cases (deleted users, inactive channels)
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 12. Implement recovery token generation and storage
  - Create cryptographically secure recovery token generation
  - Implement bcrypt hashing for token storage
  - Set 24-hour expiration on tokens
  - Store recovery token in database
  - _Requirements: 4.4_

- [ ]* 12.1 Write property test for recovery token uniqueness
  - **Property 5: Recovery Token Uniqueness**
  - **Validates: Requirements 4.4**

- [ ]* 12.2 Write unit tests for recovery token generation
  - Test token uniqueness across multiple generations
  - Test token expiration logic
  - Test token validation
  - _Requirements: 4.4_

- [ ] 13. Implement recovery initiation endpoint
  - Create POST /api/youtube/recovery/initiate endpoint
  - Check if channel is linked to another user
  - Generate recovery token
  - Send recovery email with verification link
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 14. Implement recovery verification endpoint
  - Create GET /api/youtube/recovery/verify endpoint
  - Validate recovery token format and expiration
  - Return channel information if valid
  - _Requirements: 4.4_

- [ ] 15. Implement recovery completion endpoint
  - Create POST /api/youtube/recovery/complete endpoint
  - Validate recovery token
  - Transfer channel ownership from previous user to new user
  - Revoke previous user's access
  - Log recovery action to audit trail
  - _Requirements: 4.5, 4.6_

- [ ]* 15.1 Write property test for channel ownership transfer
  - **Property 6: Channel Ownership Transfer**
  - **Validates: Requirements 4.5**

- [ ]* 15.2 Write integration tests for recovery flow
  - Test complete recovery flow from initiation to completion
  - Test with valid and invalid recovery tokens
  - Test channel ownership transfer
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 16. Update linking callback to handle duplicates
  - Modify POST /api/youtube/link/callback to check for duplicates
  - If duplicate found, return recovery flow options
  - If no duplicate, proceed with linking
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 17. Checkpoint - Duplicate detection and recovery working
  - Test duplicate detection with multiple users
  - Test recovery flow end-to-end
  - Verify channel ownership transfers correctly
  - Verify previous user loses access after recovery

## Phase 4: Suspicious Activity Detection & Verification

- [ ] 18. Implement suspicious activity detection service
  - Create logic to collect device/location/IP information
  - Implement comparison with previous activity
  - Determine if activity is suspicious based on thresholds
  - Implement rate limiting logic
  - _Requirements: 5.1, 5.2, 5.3, 8.2_

- [ ]* 18.1 Write property test for suspicious activity detection
  - **Property 8: Suspicious Activity Detection**
  - **Validates: Requirements 5.2, 5.3**

- [ ]* 18.2 Write property test for suspicious activity blocking
  - **Property 9: Suspicious Activity Blocking**
  - **Validates: Requirements 8.2**

- [ ]* 18.3 Write unit tests for suspicious activity detection
  - Test IP change detection
  - Test location change detection
  - Test device change detection
  - Test combinations of changes
  - Test rate limiting logic
  - _Requirements: 5.1, 5.2, 5.3, 8.2_

- [ ] 19. Implement verification code generation and email sending
  - Create secure verification code generation (6-digit numeric)
  - Store verification code in Redis with 15-minute expiration
  - Implement email sending for verification codes
  - _Requirements: 5.5, 8.3, 9.2_

- [ ] 20. Implement verification code validation endpoint
  - Create POST /api/youtube/link/verify endpoint
  - Validate verification code against Redis
  - Check retry attempts (max 3)
  - Complete linking if verification passes
  - _Requirements: 5.5, 8.3_

- [ ]* 20.1 Write unit tests for verification code validation
  - Test valid and invalid codes
  - Test code expiration
  - Test retry limit enforcement
  - _Requirements: 5.5, 8.3_

- [ ] 21. Update linking callback to detect suspicious activity
  - Modify POST /api/youtube/link/callback to call suspicious activity detection
  - If suspicious, return verification requirement
  - If not suspicious, complete linking
  - _Requirements: 5.1, 5.2, 5.3, 8.1, 8.2_

- [ ] 22. Checkpoint - Suspicious activity detection working
  - Test suspicious activity detection with various scenarios
  - Test verification code flow
  - Verify rate limiting blocks excessive attempts
  - Ensure legitimate activities are not blocked

## Phase 5: Audit Logging & Email Notifications

- [ ] 23. Implement audit logging service
  - Create audit log entry creation for all activities
  - Implement audit log querying with filters (user, channel, date range)
  - Add data retention policy enforcement
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 23.1 Write property test for audit trail completeness
  - **Property 7: Audit Trail Completeness**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ]* 23.2 Write property test for audit log filtering
  - **Property 12: Audit Log Filtering**
  - **Validates: Requirements 6.5**

- [ ]* 23.3 Write unit tests for audit logging
  - Test audit log creation for all activity types
  - Test filtering by user, channel, date range
  - Test data retention policies
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 24. Implement email notification service
  - Create email templates for all notification types (linking, unlinking, recovery, suspicious activity)
  - Implement email sending with retry logic
  - Add email content validation (includes all required fields)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 24.1 Write property test for email content completeness
  - **Property 13: Email Content Completeness**
  - **Validates: Requirements 10.5**

- [ ]* 24.2 Write unit tests for email notifications
  - Test email template rendering
  - Test email sending with various scenarios
  - Test retry logic for failed sends
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 25. Integrate audit logging into linking flow
  - Add audit log entry creation to linking callback
  - Log all required metadata (timestamp, IP, location, device, user ID)
  - _Requirements: 6.1_

- [ ] 26. Integrate email notifications into linking flow
  - Send confirmation email after successful linking
  - Include all required information in email
  - _Requirements: 10.1_

- [ ] 27. Implement audit endpoint
  - Create GET /api/youtube/audit endpoint
  - Implement filtering by user, channel, date range
  - Add pagination support
  - Restrict access to admin users
  - _Requirements: 6.5_

- [ ] 28. Implement channels list endpoint
  - Create GET /api/youtube/channels endpoint
  - Return user's linked YouTube channels
  - Include linking date and last activity
  - _Requirements: 10.1_

- [ ] 29. Checkpoint - Audit and notifications working
  - Test audit logging for all activities
  - Test email notifications are sent correctly
  - Verify audit logs can be queried and filtered
  - Ensure email content includes all required fields

## Phase 6: Unlinking & Revocation

- [ ] 30. Implement unlinking initiation endpoint
  - Create POST /api/youtube/unlink/initiate endpoint
  - Check for suspicious activity
  - If suspicious, require verification
  - If not suspicious, proceed with unlinking
  - _Requirements: 7.1, 7.2, 9.1, 9.2_

- [ ] 31. Implement unlinking verification endpoint
  - Create POST /api/youtube/unlink/verify endpoint
  - Validate verification code
  - Revoke YouTube OAuth token
  - Remove channel from database
  - Log unlinking to audit trail
  - _Requirements: 7.3, 7.4, 7.5, 9.2_

- [ ]* 31.1 Write integration tests for unlinking flow
  - Test complete unlinking flow
  - Test with suspicious activity
  - Test token revocation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 32. Implement unlink revocation window
  - Create unlink_revocation_window table entries on suspicious unlink
  - Implement POST /api/youtube/unlink/revoke endpoint
  - Allow revoking unlink within 24-hour window
  - Restore channel link if revocation successful
  - _Requirements: 9.4_

- [ ]* 32.1 Write property test for unlink revocation window
  - **Property 11: Unlink Revocation Window**
  - **Validates: Requirements 9.4**

- [ ]* 32.2 Write unit tests for unlink revocation
  - Test revocation within 24-hour window
  - Test revocation after expiration
  - Test channel restoration
  - _Requirements: 9.4_

- [ ] 33. Integrate email notifications into unlinking flow
  - Send notification email on unlink initiation
  - Send alert email if suspicious activity detected
  - Send confirmation email after successful unlink
  - _Requirements: 10.2, 10.3_

- [ ] 34. Integrate audit logging into unlinking flow
  - Log unlink initiation
  - Log suspicious activity detection
  - Log unlink completion
  - _Requirements: 6.2_

- [ ] 35. Checkpoint - Unlinking and revocation working
  - Test unlinking with and without suspicious activity
  - Test revocation window functionality
  - Verify emails are sent for all scenarios
  - Ensure audit logs capture all activities

## Phase 7: Frontend Components & User Interface

- [ ] 36. Create linking flow components
  - Create LinkChannelButton component
  - Create OAuth redirect handler
  - Create LinkingConfirmation component
  - Create SuspiciousActivityVerification component
  - Create RecoveryFlow component
  - _Requirements: 1.1, 5.5, 4.1_

- [ ] 37. Create unlinking flow components
  - Create UnlinkConfirmation component
  - Create UnlinkSuspiciousActivityVerification component
  - Create RevocationWindow component with countdown timer
  - _Requirements: 7.1, 7.2, 9.2, 9.4_

- [ ] 38. Create audit dashboard components
  - Create ActivityList component with filtering and sorting
  - Create SuspiciousActivityAlerts component
  - Create RecoveryHistory component
  - _Requirements: 6.5_

- [ ] 39. Integrate components into user settings page
  - Add YouTube channel linking section to settings
  - Display linked channels with management options
  - Add audit activity view
  - _Requirements: 1.1, 7.1_

- [ ]* 39.1 Write component tests for linking flow
  - Test component rendering
  - Test user interactions
  - Test error states
  - _Requirements: 1.1, 5.5_

- [ ]* 39.2 Write component tests for unlinking flow
  - Test component rendering
  - Test user interactions
  - Test revocation window countdown
  - _Requirements: 7.1, 9.4_

- [ ] 40. Checkpoint - Frontend components working
  - Test all components render correctly
  - Test user interactions work as expected
  - Verify error states are handled
  - Ensure accessibility compliance

## Phase 8: Security Hardening & Advanced Features

- [ ] 41. Implement rate limiting
  - Set up rate limiting for linking attempts (5 per hour per user)
  - Set up rate limiting for recovery attempts (3 per day per channel)
  - Set up rate limiting for verification code attempts (3 per code)
  - Set up rate limiting for unlink attempts (5 per hour per user)
  - Use Redis for rate limiting storage
  - _Requirements: 8.2, 9.2_

- [ ]* 41.1 Write unit tests for rate limiting
  - Test rate limiting enforcement
  - Test rate limit reset
  - Test blocking behavior
  - _Requirements: 8.2_

- [ ] 42. Implement two-factor authentication for suspicious linking
  - Create 2FA code generation and sending
  - Implement 2FA verification endpoint
  - Require 2FA for suspicious linking attempts
  - _Requirements: 8.4_

- [ ] 43. Implement two-factor authentication for suspicious unlinking
  - Create 2FA code generation and sending
  - Implement 2FA verification endpoint
  - Require 2FA for suspicious unlinking attempts
  - _Requirements: 9.3_

- [ ] 44. Implement PKCE for OAuth security
  - Add PKCE code challenge generation
  - Add PKCE code verifier validation
  - Update OAuth flow to use PKCE
  - _Requirements: 1.1_

- [ ] 45. Implement CSRF protection
  - Add state parameter validation to all endpoints
  - Implement CSRF token generation and validation
  - _Requirements: 1.1_

- [ ] 46. Implement input validation and sanitization
  - Add validation for all API inputs
  - Sanitize user inputs to prevent injection attacks
  - Validate email addresses, URLs, and other user data
  - _Requirements: 1.1_

- [ ] 47. Implement error handling and logging
  - Add comprehensive error handling to all services
  - Implement structured logging for debugging
  - Add error tracking and monitoring
  - _Requirements: 2.3, 2.4_

- [ ] 48. Checkpoint - Security hardening complete
  - Test rate limiting works correctly
  - Test 2FA flow works correctly
  - Test PKCE implementation
  - Test CSRF protection
  - Verify all inputs are validated

## Phase 9: Integration Testing & Edge Cases

- [ ] 49. Test edge case: User deletes YouTube channel
  - Test handling when YouTube channel is deleted
  - Verify channel is marked as inactive
  - Verify user is notified
  - Verify unlinking works without YouTube API call
  - _Requirements: 2.3_

- [ ] 50. Test edge case: User changes YouTube email
  - Test recovery when YouTube email changes
  - Verify recovery email is sent to old email
  - Verify recovery can be initiated from platform account
  - _Requirements: 4.1_

- [ ] 51. Test edge case: Rapid linking/unlinking
  - Test rapid linking and unlinking of same channel
  - Verify rate limiting prevents abuse
  - Verify audit trail captures all attempts
  - _Requirements: 5.1, 6.1_

- [ ] 52. Test edge case: Concurrent linking attempts
  - Test multiple users attempting to link same channel simultaneously
  - Verify database constraint prevents duplicates
  - Verify first successful link wins
  - Verify others see recovery flow
  - _Requirements: 3.4_

- [ ] 53. Test edge case: Token expiration during flow
  - Test OAuth token expiration during linking
  - Verify user is prompted to restart
  - Verify incomplete links are not created
  - _Requirements: 1.3_

- [ ] 54. Test edge case: Email delivery failure
  - Test email service unavailability
  - Verify retry logic works
  - Verify error is logged
  - Verify user is notified
  - _Requirements: 10.1_

- [ ] 55. Test edge case: User loses recovery email access
  - Test recovery when user can't access recovery email
  - Verify support contact information is provided
  - Verify admin can manually transfer channel
  - _Requirements: 4.1_

- [ ] 56. Test edge case: Suspicious activity false positive
  - Test legitimate activity flagged as suspicious (VPN, travel)
  - Verify user can verify with code
  - Verify trusted devices can be whitelisted
  - _Requirements: 5.4_

- [ ]* 56.1 Write integration tests for all edge cases
  - Test all edge cases end-to-end
  - Verify error handling works correctly
  - _Requirements: 2.3, 4.1, 5.1, 6.1_

- [ ] 57. Checkpoint - All edge cases handled
  - Test all edge cases work correctly
  - Verify error messages are helpful
  - Ensure no data corruption occurs
  - Verify audit logs capture all activities

## Phase 10: Performance Optimization & Monitoring

- [ ] 58. Optimize database queries
  - Add query optimization for duplicate detection
  - Add query optimization for audit log filtering
  - Add caching for frequently accessed data
  - _Requirements: 6.5_

- [ ] 59. Implement caching strategy
  - Cache channel information in Redis
  - Cache user linking status in Redis
  - Implement cache invalidation on updates
  - _Requirements: 1.1_

- [ ] 60. Implement monitoring and alerting
  - Set up monitoring for API response times
  - Set up monitoring for error rates
  - Set up monitoring for email delivery rates
  - Set up alerts for suspicious activity spikes
  - _Requirements: 5.1, 6.1_

- [ ] 61. Implement performance metrics
  - Track linking success rate
  - Track recovery success rate
  - Track false positive rate for suspicious activity
  - Track email delivery rate
  - _Requirements: 1.1_

- [ ]* 61.1 Write performance tests
  - Test OAuth token exchange latency (target: < 500ms)
  - Test channel validation API call latency (target: < 1s)
  - Test duplicate detection query performance (target: < 100ms)
  - Test suspicious activity detection latency (target: < 200ms)
  - Test audit log queries with large datasets (target: < 2s for 2-year retention)
  - _Requirements: 1.1_

- [ ] 62. Checkpoint - Performance optimized
  - Verify all performance targets are met
  - Verify monitoring is working correctly
  - Ensure no performance regressions

## Phase 11: Documentation & Deployment Preparation

- [ ] 63. Create API documentation
  - Document all API endpoints with request/response examples
  - Document error codes and handling
  - Document rate limiting and quotas
  - _Requirements: 1.1_

- [ ] 64. Create user documentation
  - Create linking guide for users
  - Create recovery guide for users
  - Create FAQ for common issues
  - _Requirements: 1.1_

- [ ] 65. Create admin documentation
  - Create audit log query guide
  - Create manual recovery procedures
  - Create troubleshooting guide
  - _Requirements: 6.5_

- [ ] 66. Create deployment guide
  - Document deployment steps
  - Document environment configuration
  - Document database migration procedures
  - _Requirements: 1.1_

- [ ] 67. Create monitoring and alerting guide
  - Document monitoring setup
  - Document alert configuration
  - Document incident response procedures
  - _Requirements: 5.1, 6.1_

- [ ] 68. Checkpoint - Documentation complete
  - Review all documentation for accuracy
  - Verify all procedures are clear and complete
  - Ensure documentation is accessible to team

## Phase 12: Final Testing & Deployment

- [ ] 69. Run comprehensive test suite
  - Run all unit tests
  - Run all integration tests
  - Run all property-based tests
  - Run all component tests
  - Verify test coverage > 80%
  - _Requirements: 1.1_

- [ ] 70. Run security testing
  - Test for common vulnerabilities (OWASP Top 10)
  - Test token encryption and storage
  - Test rate limiting effectiveness
  - Test CSRF and PKCE protection
  - _Requirements: 1.1, 8.1, 9.1_

- [ ] 71. Run performance testing
  - Test with production-like data volumes
  - Test with concurrent users
  - Verify all performance targets are met
  - _Requirements: 1.1_

- [ ] 72. Run accessibility testing
  - Test all components for WCAG 2.1 AA compliance
  - Test keyboard navigation
  - Test screen reader compatibility
  - _Requirements: 1.1_

- [ ] 73. Prepare staging deployment
  - Deploy to staging environment
  - Run smoke tests
  - Verify all features work in staging
  - _Requirements: 1.1_

- [ ] 74. Prepare production deployment
  - Create deployment checklist
  - Document rollback procedures
  - Set up monitoring and alerting
  - _Requirements: 1.1_

- [ ] 75. Final checkpoint - Ready for production
  - Verify all tests pass
  - Verify all documentation is complete
  - Verify monitoring is working
  - Verify team is trained on feature
  - Ensure rollback procedures are documented

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are strongly recommended for production quality
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Checkpoints ensure incremental validation and allow for course correction
- All code should follow the existing project conventions (TypeScript, Next.js, Tailwind CSS)
- All components should be accessible (WCAG 2.1 AA compliant)
- All endpoints should be properly documented with OpenAPI/Swagger
- All sensitive data (tokens, verification codes) should be encrypted and stored securely
- All activities should be logged to audit trail for compliance
- All email communications should include clear instructions for users to revoke if unauthorized
