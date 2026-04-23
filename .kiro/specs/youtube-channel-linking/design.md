# Design Document - YouTube Channel Linking

## Overview

The YouTube Channel Linking feature enables users to securely link their YouTube channels to their platform accounts. This design document outlines the architecture, data models, security considerations, and implementation strategy for this feature.

### Key Objectives

1. Enable secure OAuth-based channel linking with YouTube
2. Validate channel ownership through YouTube API
3. Prevent channel duplication across users
4. Detect and alert on suspicious linking/unlinking activities
5. Provide recovery mechanisms for compromised accounts
6. Maintain comprehensive audit trails for compliance
7. Protect against both Google account and platform account invasion

### Scope

This design covers:
- OAuth 2.0 integration with YouTube
- Channel ownership validation
- Duplicate channel detection
- Suspicious activity detection (IP, location, device tracking)
- Recovery flows with email verification
- Audit logging and retention
- Secure token management
- API endpoints and frontend components
- Error handling and edge cases

---

## Architecture

### High-Level Flow

```
User Initiates Link
    ↓
OAuth Redirect to YouTube
    ↓
User Authorizes
    ↓
OAuth Callback with Code
    ↓
Exchange Code for Token
    ↓
Validate Channel Ownership (YouTube API)
    ↓
Check for Duplicates
    ├─ Duplicate Found → Recovery Flow
    └─ No Duplicate → Create Link
    ↓
Detect Suspicious Activity
    ├─ Suspicious → Require Verification
    └─ Normal → Complete Link
    ↓
Log to Audit Trail
    ↓
Send Confirmation Email
```

### System Components

1. **OAuth Service**: Handles YouTube OAuth 2.0 flow
2. **Channel Validation Service**: Validates channel ownership via YouTube API
3. **Duplicate Detection Service**: Checks for existing channel links
4. **Suspicious Activity Detection Service**: Analyzes linking patterns and device/location changes
5. **Recovery Service**: Manages recovery flows with email verification
6. **Audit Service**: Logs all activities to audit trail
7. **Email Service**: Sends notifications and verification emails
8. **Token Management Service**: Securely stores and manages OAuth tokens

### Technology Stack

- **Backend**: Node.js/Express or similar
- **Database**: PostgreSQL for relational data
- **Cache**: Redis for rate limiting and temporary data
- **Email**: SendGrid or similar for transactional emails
- **Geolocation**: MaxMind GeoIP2 or similar for location detection
- **Encryption**: AES-256 for token storage, bcrypt for verification codes

---

## Components and Interfaces

### 1. OAuth Service

**Responsibilities:**
- Generate OAuth authorization URLs
- Exchange authorization codes for access tokens
- Refresh tokens when needed
- Revoke tokens on unlinking

**Key Methods:**
```
generateAuthorizationUrl(userId, state) → string
exchangeCodeForToken(code) → {accessToken, refreshToken, expiresIn}
refreshAccessToken(refreshToken) → {accessToken, expiresIn}
revokeToken(accessToken) → boolean
```

### 2. Channel Validation Service

**Responsibilities:**
- Call YouTube API to fetch channel information
- Verify channel ID matches OAuth response
- Extract channel metadata (name, description, subscriber count)

**Key Methods:**
```
validateChannelOwnership(accessToken, expectedChannelId) → {valid: boolean, channelInfo: object}
getChannelInfo(accessToken) → {channelId, title, description, customUrl}
```

### 3. Duplicate Detection Service

**Responsibilities:**
- Query database for existing channel links
- Determine if channel is already linked
- Trigger recovery flow if duplicate found

**Key Methods:**
```
isChannelLinked(youtubeChannelId) → boolean
getLinkedUser(youtubeChannelId) → User | null
checkDuplicateAndRecover(youtubeChannelId, currentUserId) → {isDuplicate: boolean, linkedUser: User | null}
```

### 4. Suspicious Activity Detection Service

**Responsibilities:**
- Collect device/location/IP information
- Compare with previous linking activity
- Determine if activity is suspicious
- Trigger additional verification if needed

**Key Methods:**
```
collectDeviceInfo(request) → {ip, userAgent, deviceType}
getLocationFromIP(ip) → {country, city, latitude, longitude}
compareWithPreviousActivity(userId, currentInfo) → {isSuspicious: boolean, reason: string}
detectRateLimiting(userId) → {isBlocked: boolean, reason: string}
```

### 5. Recovery Service

**Responsibilities:**
- Generate unique recovery tokens
- Send recovery emails
- Validate recovery tokens
- Transfer channel ownership

**Key Methods:**
```
initiateRecovery(youtubeChannelId, userEmail) → {recoveryToken: string, expiresAt: timestamp}
validateRecoveryToken(recoveryToken) → {valid: boolean, youtubeChannelId: string}
completeRecovery(recoveryToken, newUserId) → boolean
```

### 6. Audit Service

**Responsibilities:**
- Log all linking/unlinking activities
- Log suspicious activities
- Log recovery attempts
- Provide query interface for audit logs

**Key Methods:**
```
logLinkingActivity(userId, youtubeChannelId, metadata) → void
logUnlinkingActivity(userId, youtubeChannelId, metadata) → void
logSuspiciousActivity(userId, activityType, details) → void
queryAuditLogs(filters) → AuditLog[]
```

### 7. Email Service

**Responsibilities:**
- Send confirmation emails
- Send recovery emails
- Send suspicious activity alerts
- Send unlink notifications

**Key Methods:**
```
sendLinkingConfirmation(userEmail, channelName, metadata) → void
sendRecoveryEmail(userEmail, recoveryLink) → void
sendSuspiciousActivityAlert(userEmail, activityDetails) → void
sendUnlinkingNotification(userEmail, channelName) → void
```

---

## Data Models

### Database Schema

#### youtube_channels Table

```sql
CREATE TABLE youtube_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  youtube_channel_id VARCHAR(255) NOT NULL UNIQUE,
  channel_name VARCHAR(255) NOT NULL,
  channel_description TEXT,
  custom_url VARCHAR(255),
  subscriber_count INTEGER,
  access_token TEXT NOT NULL, -- AES-256 encrypted
  refresh_token TEXT, -- AES-256 encrypted
  token_expires_at TIMESTAMP,
  linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_channel_per_user UNIQUE(user_id, youtube_channel_id),
  CONSTRAINT unique_youtube_channel UNIQUE(youtube_channel_id)
);

CREATE INDEX idx_youtube_channels_user_id ON youtube_channels(user_id);
CREATE INDEX idx_youtube_channels_youtube_channel_id ON youtube_channels(youtube_channel_id);
CREATE INDEX idx_youtube_channels_is_active ON youtube_channels(is_active);
```

#### linking_activity Table

```sql
CREATE TABLE linking_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  youtube_channel_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'link', 'unlink', 'recovery_attempt', 'suspicious_detected'
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  country VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicious_reason VARCHAR(255),
  status VARCHAR(50), -- 'pending', 'completed', 'failed', 'blocked'
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_youtube_channel FOREIGN KEY (youtube_channel_id) 
    REFERENCES youtube_channels(youtube_channel_id) ON DELETE CASCADE
);

CREATE INDEX idx_linking_activity_user_id ON linking_activity(user_id);
CREATE INDEX idx_linking_activity_youtube_channel_id ON linking_activity(youtube_channel_id);
CREATE INDEX idx_linking_activity_created_at ON linking_activity(created_at);
CREATE INDEX idx_linking_activity_is_suspicious ON linking_activity(is_suspicious);
```

#### recovery_tokens Table

```sql
CREATE TABLE recovery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_channel_id VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt hash
  user_email VARCHAR(255) NOT NULL,
  initiated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'used', 'expired', 'revoked'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_youtube_channel FOREIGN KEY (youtube_channel_id) 
    REFERENCES youtube_channels(youtube_channel_id) ON DELETE CASCADE
);

CREATE INDEX idx_recovery_tokens_youtube_channel_id ON recovery_tokens(youtube_channel_id);
CREATE INDEX idx_recovery_tokens_expires_at ON recovery_tokens(expires_at);
CREATE INDEX idx_recovery_tokens_status ON recovery_tokens(status);
```

#### audit_logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  youtube_channel_id VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- 'channel_linked', 'channel_unlinked', 'recovery_initiated', 'recovery_completed', 'suspicious_activity_detected'
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_youtube_channel FOREIGN KEY (youtube_channel_id) 
    REFERENCES youtube_channels(youtube_channel_id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_youtube_channel_id ON audit_logs(youtube_channel_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

#### unlink_revocation_window Table

```sql
CREATE TABLE unlink_revocation_window (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  youtube_channel_id VARCHAR(255) NOT NULL,
  unlink_initiated_at TIMESTAMP NOT NULL,
  revocation_expires_at TIMESTAMP NOT NULL, -- 24 hours from initiation
  revoked_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'revoked', 'expired'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_youtube_channel FOREIGN KEY (youtube_channel_id) 
    REFERENCES youtube_channels(youtube_channel_id) ON DELETE CASCADE
);

CREATE INDEX idx_unlink_revocation_window_user_id ON unlink_revocation_window(user_id);
CREATE INDEX idx_unlink_revocation_window_revocation_expires_at ON unlink_revocation_window(revocation_expires_at);
```

### Data Retention Policy

- **linking_activity**: Retained for 2 years, then archived
- **audit_logs**: Retained for 2 years, then archived
- **recovery_tokens**: Deleted after 24 hours if unused, or after use
- **unlink_revocation_window**: Deleted after 24 hours

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Channel ID Validation

*For any* valid YouTube OAuth response and channel ID, the system SHALL verify that the channel ID from the OAuth response matches the expected channel ID, and only proceed with linking if they match.

**Validates: Requirements 2.2**

### Property 2: Unique Channel Constraint

*For any* YouTube channel ID, the system SHALL prevent the same channel from being linked to multiple users simultaneously through database constraints.

**Validates: Requirements 3.4**

### Property 3: Token Encryption

*For any* OAuth access token, the system SHALL store it in encrypted form such that retrieving and decrypting it produces the original token.

**Validates: Requirements 1.4**

### Property 4: Duplicate Detection

*For any* YouTube channel ID that is already linked to a user, attempting to link it to a different user SHALL trigger the recovery flow instead of creating a new link.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Recovery Token Uniqueness

*For any* recovery initiation, the system SHALL generate a unique token that cannot be guessed or reused, and SHALL expire after 24 hours.

**Validates: Requirements 4.4**

### Property 6: Channel Ownership Transfer

*For any* valid recovery token, confirming the recovery SHALL transfer the channel from the previous user to the new user, and the previous user SHALL no longer have access.

**Validates: Requirements 4.5**

### Property 7: Audit Trail Completeness

*For any* linking, unlinking, or recovery activity, the system SHALL record all required metadata (timestamp, IP, location, device, user ID) in the audit log.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 8: Suspicious Activity Detection

*For any* linking or unlinking request, if the IP, location, or device differs significantly from the previous activity, the system SHALL mark it as suspicious and require additional verification.

**Validates: Requirements 5.2, 5.3**

### Property 9: Suspicious Activity Blocking

*For any* user with multiple linking attempts from different channels within a short time period, the system SHALL block subsequent linking attempts until additional verification is completed.

**Validates: Requirements 8.2**

### Property 10: Email Verification Requirement

*For any* suspicious unlinking activity, the system SHALL require email confirmation before processing the unlink, and SHALL send an alert to the user's recovery email.

**Validates: Requirements 9.2, 9.3**

### Property 11: Unlink Revocation Window

*For any* unlinking initiated due to suspicious activity, the user SHALL be able to revoke the unlink within 24 hours by confirming via email.

**Validates: Requirements 9.4**

### Property 12: Audit Log Filtering

*For any* combination of user ID, channel ID, or date range filters, the system SHALL return only audit logs matching all specified filters.

**Validates: Requirements 6.5**

### Property 13: Email Content Completeness

*For any* notification email sent (linking, unlinking, recovery, suspicious activity), the email SHALL include timestamp, IP address, location, device type, and revocation instructions.

**Validates: Requirements 10.5**

---

## Error Handling

### OAuth Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Invalid OAuth Code | Code expired or invalid | Redirect to linking page with error message |
| Token Exchange Failed | Network error or invalid credentials | Retry with exponential backoff, then show error |
| Token Revocation Failed | YouTube API unavailable | Log error, continue with local cleanup |
| Insufficient Permissions | User didn't grant required scopes | Show permission request again |

### Channel Validation Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Channel Not Found | Invalid channel ID | Show error, suggest checking YouTube account |
| Channel ID Mismatch | OAuth response doesn't match expected channel | Block linking, suggest recovery flow |
| API Rate Limit | Too many YouTube API calls | Implement exponential backoff and queue |
| API Unavailable | YouTube API down | Show error, suggest retry later |

### Duplicate Channel Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Channel Already Linked | Channel linked to another user | Show recovery flow options |
| Duplicate Link Attempt | User trying to link same channel twice | Show message that channel is already linked |

### Recovery Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Invalid Recovery Token | Token expired or doesn't exist | Show error, offer to restart recovery |
| Recovery Token Expired | Token older than 24 hours | Show error, offer to restart recovery |
| Email Delivery Failed | Email service unavailable | Retry with exponential backoff, log error |
| Recovery Already Used | Token already used for recovery | Show error, suggest contacting support |

### Suspicious Activity Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Verification Code Invalid | Wrong code entered | Show error, allow retry (max 3 attempts) |
| Verification Code Expired | Code older than 15 minutes | Send new code, show error |
| Too Many Failed Attempts | User exceeded retry limit | Block for 1 hour, send alert email |
| 2FA Unavailable | 2FA service down | Show error, suggest retry later |

### Database Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Unique Constraint Violation | Duplicate channel link | Trigger recovery flow |
| Foreign Key Violation | Referenced user doesn't exist | Log error, show generic error to user |
| Connection Timeout | Database unavailable | Retry with exponential backoff, show error |

---

## Testing Strategy

### Unit Tests

**Token Encryption/Decryption:**
- Test that tokens are encrypted and can be decrypted
- Test that encrypted tokens cannot be read in plaintext
- Test with various token lengths and special characters

**Channel ID Validation:**
- Test valid channel ID matching
- Test mismatched channel IDs
- Test with various channel ID formats

**Duplicate Detection:**
- Test detection of already-linked channels
- Test with multiple users and channels
- Test edge cases (deleted users, inactive channels)

**Suspicious Activity Detection:**
- Test IP change detection
- Test location change detection
- Test device change detection
- Test combinations of changes
- Test rate limiting logic

**Recovery Token Generation:**
- Test token uniqueness
- Test token expiration
- Test token validation

**Audit Logging:**
- Test that all required fields are logged
- Test filtering by user, channel, date range
- Test data retention policies

**Email Notifications:**
- Test email content includes all required fields
- Test email is sent for all activity types
- Test email delivery failures are handled

### Property-Based Tests

**Property 1: Channel ID Validation**
- Generate random valid/invalid channel IDs
- Verify validation logic works correctly
- Test with various OAuth response formats

**Property 2: Unique Channel Constraint**
- Generate multiple users and channels
- Attempt to link same channel to different users
- Verify constraint prevents duplicates

**Property 3: Token Encryption**
- Generate random tokens
- Encrypt and decrypt
- Verify round-trip produces original token

**Property 4: Duplicate Detection**
- Generate channels with various link states
- Verify detection works for all states
- Test recovery flow triggering

**Property 5: Recovery Token Uniqueness**
- Generate multiple recovery tokens
- Verify all are unique
- Test expiration logic

**Property 6: Channel Ownership Transfer**
- Generate recovery scenarios
- Verify ownership transfers correctly
- Test previous user loses access

**Property 7: Audit Trail Completeness**
- Generate various activities
- Verify all metadata is logged
- Test with different IP/location/device combinations

**Property 8: Suspicious Activity Detection**
- Generate activities with various IP/location/device changes
- Verify detection algorithm works correctly
- Test threshold logic

**Property 9: Suspicious Activity Blocking**
- Generate multiple rapid linking attempts
- Verify blocking logic works
- Test rate limiting windows

**Property 10: Email Verification Requirement**
- Generate suspicious unlink scenarios
- Verify email is required
- Test verification code validation

**Property 11: Unlink Revocation Window**
- Generate unlink scenarios
- Verify revocation works within 24 hours
- Test expiration after 24 hours

**Property 12: Audit Log Filtering**
- Generate various audit logs
- Test filtering by user, channel, date
- Verify filter combinations work correctly

**Property 13: Email Content Completeness**
- Generate various notification scenarios
- Verify all required fields are in emails
- Test with different activity types

### Integration Tests

**OAuth Flow:**
- Test complete OAuth flow with YouTube
- Test token refresh
- Test token revocation

**Channel Linking Flow:**
- Test complete linking flow from start to finish
- Test with duplicate channels
- Test with suspicious activity

**Recovery Flow:**
- Test complete recovery flow
- Test email verification
- Test channel ownership transfer

**Unlinking Flow:**
- Test complete unlinking flow
- Test with suspicious activity
- Test revocation window

**Audit Trail:**
- Test audit logging for all activities
- Test audit log queries
- Test data retention

### Performance Tests

- Test OAuth token exchange latency (target: < 500ms)
- Test channel validation API call latency (target: < 1s)
- Test duplicate detection query performance (target: < 100ms)
- Test suspicious activity detection latency (target: < 200ms)
- Test audit log queries with large datasets (target: < 2s for 2-year retention)

### Security Tests

- Test token encryption/decryption
- Test recovery token cannot be guessed
- Test rate limiting prevents brute force
- Test email verification prevents unauthorized recovery
- Test audit logs cannot be tampered with

---

## API Endpoints

### Linking Endpoints

**POST /api/youtube/link/start**
- Initiates linking process
- Returns OAuth authorization URL
- Request: `{}`
- Response: `{authorizationUrl: string, state: string}`

**GET /api/youtube/link/callback**
- OAuth callback endpoint
- Exchanges code for token
- Validates channel ownership
- Checks for duplicates
- Request: `{code: string, state: string}`
- Response: `{success: boolean, message: string, requiresVerification?: boolean}`

**POST /api/youtube/link/verify**
- Verifies suspicious activity code
- Completes linking if verification passes
- Request: `{verificationCode: string}`
- Response: `{success: boolean, message: string}`

### Recovery Endpoints

**POST /api/youtube/recovery/initiate**
- Initiates recovery process
- Sends recovery email
- Request: `{youtubeChannelId: string}`
- Response: `{success: boolean, message: string}`

**GET /api/youtube/recovery/verify**
- Verifies recovery token
- Request: `{token: string}`
- Response: `{valid: boolean, youtubeChannelId: string}`

**POST /api/youtube/recovery/complete**
- Completes recovery process
- Transfers channel ownership
- Request: `{token: string}`
- Response: `{success: boolean, message: string}`

### Unlinking Endpoints

**POST /api/youtube/unlink/initiate**
- Initiates unlinking process
- Checks for suspicious activity
- Request: `{youtubeChannelId: string}`
- Response: `{success: boolean, requiresVerification?: boolean, message: string}`

**POST /api/youtube/unlink/verify**
- Verifies suspicious activity code
- Completes unlinking if verification passes
- Request: `{verificationCode: string, youtubeChannelId: string}`
- Response: `{success: boolean, message: string}`

**POST /api/youtube/unlink/revoke**
- Revokes unlinking within 24-hour window
- Request: `{youtubeChannelId: string}`
- Response: `{success: boolean, message: string}`

### Audit Endpoints

**GET /api/youtube/audit**
- Retrieves audit logs
- Supports filtering by user, channel, date range
- Request: `{userId?: string, youtubeChannelId?: string, startDate?: timestamp, endDate?: timestamp, limit?: number, offset?: number}`
- Response: `{logs: AuditLog[], total: number}`

**GET /api/youtube/channels**
- Lists user's linked YouTube channels
- Request: `{}`
- Response: `{channels: [{id: string, name: string, linkedAt: timestamp, lastActivity: timestamp}]}`

---

## Frontend Components and Flows

### Linking Flow Components

1. **Link Channel Button**
   - Triggers OAuth flow
   - Shows loading state during OAuth

2. **OAuth Redirect**
   - Redirects to YouTube OAuth
   - Handles OAuth callback

3. **Linking Confirmation**
   - Shows channel name and details
   - Displays confirmation message

4. **Suspicious Activity Verification**
   - Shows verification code input
   - Displays activity details (IP, location, device)
   - Allows retry or cancel

5. **Recovery Flow**
   - Shows recovery options
   - Displays linked user information
   - Initiates recovery process

### Unlinking Flow Components

1. **Unlink Confirmation**
   - Shows warning about irreversible action
   - Displays channel details
   - Requires confirmation

2. **Suspicious Activity Verification**
   - Shows verification code input
   - Displays activity details
   - Allows retry or cancel

3. **Revocation Window**
   - Shows 24-hour revocation window
   - Allows revoking unlink
   - Displays countdown timer

### Audit Dashboard Components

1. **Activity List**
   - Shows linking/unlinking activities
   - Displays timestamps, IPs, locations, devices
   - Allows filtering and sorting

2. **Suspicious Activity Alerts**
   - Highlights suspicious activities
   - Shows alert details
   - Allows taking action

3. **Recovery History**
   - Shows recovery attempts
   - Displays success/failure status
   - Shows channel ownership changes

---

## Security Considerations

### Token Storage

- **Access Tokens**: Encrypted with AES-256 before storage
- **Refresh Tokens**: Encrypted with AES-256 before storage
- **Encryption Keys**: Stored in secure key management service (AWS KMS, HashiCorp Vault)
- **Token Rotation**: Refresh tokens rotated on each use
- **Token Revocation**: Tokens revoked immediately on unlinking

### Recovery Token Security

- **Token Generation**: Cryptographically secure random generation (minimum 32 bytes)
- **Token Hashing**: Bcrypt hashing before storage
- **Token Expiration**: 24-hour expiration
- **Single Use**: Tokens can only be used once
- **Email Verification**: Recovery requires email verification

### Suspicious Activity Detection

- **IP Tracking**: Collect and compare IP addresses
- **Location Tracking**: Use GeoIP to detect location changes
- **Device Tracking**: Collect user agent and device type
- **Rate Limiting**: Limit linking attempts per user per time period
- **Threshold**: Mark as suspicious if IP, location, or device changes significantly

### Rate Limiting

- **Linking Attempts**: Max 5 per hour per user
- **Recovery Attempts**: Max 3 per day per channel
- **Verification Code Attempts**: Max 3 per code
- **Unlink Attempts**: Max 5 per hour per user

### Audit Trail Security

- **Immutability**: Audit logs cannot be modified or deleted
- **Retention**: Logs retained for 2 years minimum
- **Access Control**: Only admins can view audit logs
- **Encryption**: Audit logs encrypted at rest

### Email Security

- **Verification Links**: Include unique token, expire after 24 hours
- **Email Verification**: Verify email ownership before recovery
- **Email Content**: Include instructions to revoke if unauthorized
- **Email Delivery**: Use TLS for email transmission

### OAuth Security

- **State Parameter**: Use state parameter to prevent CSRF
- **PKCE**: Use PKCE for additional security
- **Scope Limitation**: Request only necessary scopes
- **Token Validation**: Validate token signature and expiration

---

## Edge Cases and Considerations

### Edge Case 1: User Deletes YouTube Channel

**Scenario**: User links channel, then deletes it on YouTube

**Handling**:
- Next API call to YouTube will fail
- Mark channel as inactive
- Send notification to user
- Allow unlinking without YouTube API call

### Edge Case 2: User Changes YouTube Email

**Scenario**: User links channel, then changes YouTube account email

**Handling**:
- Recovery email sent to old email won't work
- User can initiate recovery from platform account
- Verify ownership through YouTube OAuth

### Edge Case 3: Rapid Linking/Unlinking

**Scenario**: User rapidly links and unlinks same channel

**Handling**:
- Rate limiting prevents abuse
- Audit trail tracks all attempts
- Suspicious activity detection triggers

### Edge Case 4: Concurrent Linking Attempts

**Scenario**: Multiple users attempt to link same channel simultaneously

**Handling**:
- Database unique constraint prevents duplicates
- First successful link wins
- Others see recovery flow

### Edge Case 5: Token Expiration During Flow

**Scenario**: OAuth token expires during linking process

**Handling**:
- Detect expired token
- Prompt user to restart linking
- Don't create incomplete link

### Edge Case 6: Email Delivery Failure

**Scenario**: Email service unavailable during recovery

**Handling**:
- Retry with exponential backoff
- Log error for monitoring
- Show error to user
- Allow retry

### Edge Case 7: User Loses Access to Recovery Email

**Scenario**: User can't access recovery email during recovery process

**Handling**:
- Contact support for manual recovery
- Verify identity through other means
- Admin can manually transfer channel

### Edge Case 8: Suspicious Activity False Positive

**Scenario**: Legitimate activity flagged as suspicious (e.g., VPN, travel)

**Handling**:
- User can verify with code
- Whitelist trusted devices/locations
- Adjust detection thresholds

---

## Implementation Phases

### Phase 1: Core Linking (Week 1-2)
- OAuth integration
- Channel validation
- Basic linking flow
- Token storage

### Phase 2: Duplicate Detection & Recovery (Week 3-4)
- Duplicate detection
- Recovery flow
- Email verification
- Channel ownership transfer

### Phase 3: Suspicious Activity Detection (Week 5-6)
- IP/location/device tracking
- Suspicious activity detection
- Rate limiting
- Verification code flow

### Phase 4: Audit & Notifications (Week 7-8)
- Audit logging
- Email notifications
- Audit dashboard
- Data retention

### Phase 5: Security Hardening (Week 9-10)
- Token encryption
- Recovery token security
- Rate limiting refinement
- Security testing

### Phase 6: Testing & Deployment (Week 11-12)
- Comprehensive testing
- Performance optimization
- Documentation
- Production deployment

---

## Success Metrics

- **Linking Success Rate**: > 95% of users successfully link channels
- **Recovery Success Rate**: > 90% of recovery attempts successful
- **False Positive Rate**: < 5% of legitimate activities flagged as suspicious
- **Email Delivery Rate**: > 99% of emails delivered
- **API Response Time**: < 500ms for linking endpoints
- **Audit Log Query Time**: < 2s for 2-year retention
- **Security Incidents**: 0 unauthorized channel transfers
- **User Satisfaction**: > 4.5/5 rating for feature

