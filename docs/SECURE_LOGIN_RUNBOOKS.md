# Secure Login Operational Runbooks

## Overview

This document provides step-by-step procedures for common operational tasks related to the Secure Login implementation.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [User Management](#user-management)
3. [Security Operations](#security-operations)
4. [Performance Operations](#performance-operations)
5. [Incident Response](#incident-response)
6. [Maintenance Operations](#maintenance-operations)

## Daily Operations

### Runbook: Check System Health

**Purpose**: Verify all systems are operational and healthy

**Frequency**: Daily (start of business day)

**Steps**:

1. Check application status
```bash
curl https://gabrieltoth.com/api/health
# Expected: 200 OK
```

2. Check database connectivity
```bash
npm run db:check
# Expected: Connected successfully
```

3. Check Redis connectivity
```bash
npm run redis:check
# Expected: Connected successfully
```

4. Check error logs
```bash
# Via Sentry dashboard
# https://sentry.io/organizations/your-org/

# Check for critical errors
# Expected: No critical errors
```

5. Check authentication metrics
```bash
# Via monitoring dashboard
# Check login success rate (target: >95%)
# Check average response time (target: <500ms)
```

6. Review rate limiting events
```bash
# Check for unusual rate limiting activity
SELECT COUNT(*) FROM audit_logs 
WHERE event_type = 'RATE_LIMIT_EXCEEDED' 
AND created_at > NOW() - INTERVAL '24 hours';
```

**Success Criteria**:
- ✅ Application responds to health check
- ✅ Database connection successful
- ✅ Redis connection successful
- ✅ No critical errors in logs
- ✅ Login success rate > 95%
- ✅ Average response time < 500ms

**Escalation**:
- If any check fails, follow [Incident Response](#incident-response) procedures

---

### Runbook: Review Audit Logs

**Purpose**: Monitor authentication events for security and compliance

**Frequency**: Daily

**Steps**:

1. Check successful logins
```bash
SELECT COUNT(*) as successful_logins
FROM audit_logs
WHERE event_type = 'LOGIN_SUCCESS'
AND created_at > NOW() - INTERVAL '24 hours';
```

2. Check failed logins
```bash
SELECT COUNT(*) as failed_logins
FROM audit_logs
WHERE event_type = 'LOGIN_FAILURE'
AND created_at > NOW() - INTERVAL '24 hours';
```

3. Check CSRF failures
```bash
SELECT COUNT(*) as csrf_failures
FROM audit_logs
WHERE event_type = 'CSRF_VIOLATION'
AND created_at > NOW() - INTERVAL '24 hours';
```

4. Check rate limiting events
```bash
SELECT COUNT(*) as rate_limit_events
FROM audit_logs
WHERE event_type = 'RATE_LIMIT_EXCEEDED'
AND created_at > NOW() - INTERVAL '24 hours';
```

5. Check for suspicious patterns
```bash
-- Multiple failed attempts from same IP
SELECT ip_address, COUNT(*) as attempts
FROM audit_logs
WHERE event_type = 'LOGIN_FAILURE'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY attempts DESC;
```

6. Export audit logs for compliance
```bash
npm run export-audit-logs -- \
  --start-date 2024-04-27 \
  --end-date 2024-04-28 \
  --output audit-logs-2024-04-28.csv
```

**Success Criteria**:
- ✅ Audit logs reviewed
- ✅ No suspicious patterns detected
- ✅ Compliance requirements met
- ✅ Logs exported for archival

**Escalation**:
- If suspicious patterns detected, follow [Security Incident Response](#security-incident-response)

---

## User Management

### Runbook: Reset User Password

**Purpose**: Help user regain access to account

**Frequency**: As needed

**Prerequisites**:
- User identity verified
- User email confirmed
- Admin access to database

**Steps**:

1. Verify user identity
```bash
# Confirm user email and account details
SELECT * FROM users WHERE email = 'user@example.com';
```

2. Generate password reset token
```bash
npm run generate-password-reset-token -- user@example.com
# Output: Reset token and expiration time
```

3. Send password reset email
```bash
npm run send-password-reset-email -- user@example.com
# Email sent to user@example.com
```

4. User clicks link in email and sets new password

5. Verify password reset
```bash
# Test login with new password
curl -X POST https://gabrieltoth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "new_password",
    "csrfToken": "token"
  }'
# Expected: 200 OK
```

6. Log password reset event
```bash
INSERT INTO audit_logs (event_type, email, details)
VALUES ('PASSWORD_RESET', 'user@example.com', '{"admin": "admin@example.com"}');
```

**Success Criteria**:
- ✅ User identity verified
- ✅ Password reset email sent
- ✅ User can log in with new password
- ✅ Event logged for audit trail

**Escalation**:
- If user cannot receive email, contact email provider
- If password reset fails, check database for errors

---

### Runbook: Verify User Email

**Purpose**: Manually verify user email when verification email fails

**Frequency**: As needed

**Prerequisites**:
- User identity verified
- Admin access to database

**Steps**:

1. Verify user exists
```bash
SELECT * FROM users WHERE email = 'user@example.com';
```

2. Check email verification status
```bash
SELECT email, email_verified FROM users WHERE email = 'user@example.com';
```

3. Manually verify email (if needed)
```bash
UPDATE users 
SET email_verified = true 
WHERE email = 'user@example.com';
```

4. Verify update
```bash
SELECT email, email_verified FROM users WHERE email = 'user@example.com';
# Expected: email_verified = true
```

5. Log verification event
```bash
INSERT INTO audit_logs (event_type, email, details)
VALUES ('EMAIL_VERIFIED_MANUAL', 'user@example.com', '{"admin": "admin@example.com"}');
```

6. Notify user
```bash
npm run send-email -- \
  --to user@example.com \
  --subject "Email Verified" \
  --template email-verified
```

**Success Criteria**:
- ✅ User email verified in database
- ✅ User can log in
- ✅ Event logged for audit trail
- ✅ User notified

**Escalation**:
- If email verification fails, check database for errors

---

### Runbook: Unlock User Account

**Purpose**: Unlock user account after rate limiting

**Frequency**: As needed

**Prerequisites**:
- User identity verified
- Admin access to database and Redis

**Steps**:

1. Verify user is locked out
```bash
# Check rate limit counter
redis-cli GET rate_limit:user_ip_address
# Expected: 5 or higher
```

2. Get user IP address
```bash
SELECT ip_address FROM audit_logs 
WHERE email = 'user@example.com' 
ORDER BY created_at DESC LIMIT 1;
```

3. Reset rate limit counter
```bash
redis-cli DEL rate_limit:192.168.1.1
# Expected: (integer) 1
```

4. Verify rate limit reset
```bash
redis-cli GET rate_limit:192.168.1.1
# Expected: (nil)
```

5. Log unlock event
```bash
INSERT INTO audit_logs (event_type, ip_address, details)
VALUES ('RATE_LIMIT_RESET', '192.168.1.1', '{"admin": "admin@example.com"}');
```

6. Notify user
```bash
npm run send-email -- \
  --to user@example.com \
  --subject "Account Unlocked" \
  --template account-unlocked
```

**Success Criteria**:
- ✅ Rate limit counter reset
- ✅ User can log in again
- ✅ Event logged for audit trail
- ✅ User notified

**Escalation**:
- If rate limit reset fails, check Redis connection

---

## Security Operations

### Runbook: Investigate Suspicious Login Activity

**Purpose**: Investigate and respond to suspicious login patterns

**Frequency**: As needed (triggered by alerts)

**Steps**:

1. Identify suspicious activity
```bash
-- Multiple failed attempts from same IP
SELECT ip_address, COUNT(*) as attempts, 
       MIN(created_at) as first_attempt,
       MAX(created_at) as last_attempt
FROM audit_logs
WHERE event_type = 'LOGIN_FAILURE'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

2. Get details of suspicious attempts
```bash
SELECT * FROM audit_logs
WHERE ip_address = '192.168.1.1'
AND event_type = 'LOGIN_FAILURE'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

3. Check if IP is known
```bash
-- Check if IP has successful logins
SELECT COUNT(*) as successful_logins
FROM audit_logs
WHERE ip_address = '192.168.1.1'
AND event_type = 'LOGIN_SUCCESS'
AND created_at > NOW() - INTERVAL '30 days';
```

4. Determine if attack or legitimate user
```bash
-- If successful_logins > 0: Likely legitimate user with wrong password
-- If successful_logins = 0: Likely attack or new user
```

5. Take action based on assessment

**If Legitimate User**:
```bash
# Reset rate limit
redis-cli DEL rate_limit:192.168.1.1

# Notify user
npm run send-email -- \
  --to user@example.com \
  --subject "Account Unlock" \
  --template account-unlocked
```

**If Attack**:
```bash
# Block IP address (if needed)
npm run block-ip -- 192.168.1.1

# Alert security team
npm run send-alert -- \
  --channel security \
  --message "Brute force attack detected from 192.168.1.1"

# Increase monitoring
# Set up additional alerts for this IP
```

6. Document incident
```bash
INSERT INTO security_incidents (ip_address, event_type, action_taken, details)
VALUES ('192.168.1.1', 'BRUTE_FORCE_ATTEMPT', 'RATE_LIMIT_RESET', '...');
```

**Success Criteria**:
- ✅ Suspicious activity identified
- ✅ Root cause determined
- ✅ Appropriate action taken
- ✅ Incident documented

**Escalation**:
- If attack confirmed, escalate to security team
- If multiple IPs attacking, consider DDoS mitigation

---

### Runbook: Respond to CSRF Token Failures

**Purpose**: Investigate and respond to CSRF token validation failures

**Frequency**: As needed (triggered by alerts)

**Steps**:

1. Check CSRF failure rate
```bash
SELECT COUNT(*) as csrf_failures
FROM audit_logs
WHERE event_type = 'CSRF_VIOLATION'
AND created_at > NOW() - INTERVAL '1 hour';
```

2. Get details of CSRF failures
```bash
SELECT * FROM audit_logs
WHERE event_type = 'CSRF_VIOLATION'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

3. Determine root cause

**Possible Causes**:
- Session expired (normal)
- Browser cleared cookies (normal)
- CSRF token validation bug (investigate)
- Attack attempt (investigate)

4. Check CSRF token validation logic
```bash
npm run test -- src/__tests__/auth/csrf-validator.test.ts
# Expected: All tests pass
```

5. Review CSRF token generation
```bash
# Check if tokens are being generated correctly
grep "generateCSRFToken" src/lib/auth/csrf-validator.ts
```

6. If bug found, fix and deploy
```bash
# Fix CSRF validation logic
# Run tests
npm run test

# Deploy fix
npm run build && npm run deploy
```

7. Monitor CSRF failures after fix
```bash
-- Monitor for 24 hours
SELECT COUNT(*) as csrf_failures
FROM audit_logs
WHERE event_type = 'CSRF_VIOLATION'
AND created_at > NOW() - INTERVAL '24 hours';
```

**Success Criteria**:
- ✅ CSRF failures investigated
- ✅ Root cause identified
- ✅ Fix deployed (if needed)
- ✅ Monitoring in place

**Escalation**:
- If attack detected, escalate to security team
- If bug found, create GitHub issue for tracking

---

## Performance Operations

### Runbook: Investigate Slow Login Response

**Purpose**: Diagnose and fix slow login endpoint performance

**Frequency**: As needed (triggered by alerts)

**Steps**:

1. Check current response time
```bash
curl -w "@curl-format.txt" -o /dev/null -s https://gabrieltoth.com/api/auth/login
# Expected: < 500ms
```

2. Run performance tests
```bash
npm run perf
# Check response time metrics
```

3. Identify bottleneck

**Check Database Performance**:
```bash
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
# Check execution time
```

**Check Password Hashing Performance**:
```bash
npm run test -- src/__tests__/auth/password-hashing.test.ts
# Check bcrypt comparison time
```

**Check CSRF Validation Performance**:
```bash
npm run test -- src/__tests__/auth/csrf-validator.test.ts
# Check token validation time
```

**Check Rate Limiting Performance**:
```bash
npm run test -- src/__tests__/auth/rate-limiting.test.ts
# Check rate limit check time
```

4. Optimize based on bottleneck

**If Database Slow**:
```bash
-- Add missing indexes
CREATE INDEX idx_users_email ON users(email);

-- Analyze query
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

**If Password Hashing Slow**:
```bash
-- Reduce bcrypt cost factor (if safe)
// In src/lib/auth/password-hashing.ts
const BCRYPT_COST_FACTOR = 11  // Reduced from 12
```

**If Rate Limiting Slow**:
```bash
-- Verify Redis is working
redis-cli ping

-- Check Redis performance
redis-cli --latency
```

5. Run performance tests after optimization
```bash
npm run perf
# Verify improvement
```

6. Monitor performance
```bash
-- Monitor response time for 24 hours
SELECT AVG(response_time) as avg_response_time
FROM performance_metrics
WHERE endpoint = '/api/auth/login'
AND created_at > NOW() - INTERVAL '24 hours';
```

**Success Criteria**:
- ✅ Bottleneck identified
- ✅ Optimization applied
- ✅ Response time < 500ms
- ✅ Performance monitoring in place

**Escalation**:
- If optimization doesn't help, escalate to architecture team

---

## Incident Response

### Runbook: Security Incident Response

**Purpose**: Respond to security incidents

**Frequency**: As needed

**Steps**:

1. **Detect**: Identify security incident
   - Automated alerts (rate limiting, CSRF failures, etc.)
   - Manual detection (suspicious logs, user reports)
   - Third-party notification (security researchers, etc.)

2. **Assess**: Determine severity
   - **Critical**: Active attack, data breach, system down
   - **High**: Potential attack, suspicious activity
   - **Medium**: Unusual patterns, potential vulnerability
   - **Low**: Minor issues, no immediate threat

3. **Contain**: Stop the incident
   - Block malicious IP addresses
   - Disable compromised accounts
   - Isolate affected systems
   - Increase monitoring

4. **Investigate**: Determine root cause
   - Review audit logs
   - Check system logs
   - Analyze attack patterns
   - Identify affected users

5. **Remediate**: Fix the issue
   - Apply security patches
   - Update security rules
   - Reset compromised credentials
   - Deploy fixes

6. **Communicate**: Notify stakeholders
   - Alert security team
   - Notify affected users
   - Update status page
   - Document incident

7. **Recover**: Restore normal operations
   - Verify systems are secure
   - Monitor for recurrence
   - Remove temporary blocks
   - Resume normal operations

8. **Learn**: Prevent future incidents
   - Conduct post-mortem
   - Update security procedures
   - Implement preventive measures
   - Share lessons learned

**Success Criteria**:
- ✅ Incident contained
- ✅ Root cause identified
- ✅ Fix deployed
- ✅ Stakeholders notified
- ✅ Systems restored
- ✅ Preventive measures implemented

**Escalation**:
- Critical incidents: Escalate to CTO/Security Lead immediately
- High incidents: Escalate within 1 hour
- Medium incidents: Escalate within 4 hours
- Low incidents: Escalate within 24 hours

---

## Maintenance Operations

### Runbook: Database Maintenance

**Purpose**: Maintain database health and performance

**Frequency**: Weekly

**Steps**:

1. Analyze tables
```bash
ANALYZE users;
ANALYZE sessions;
ANALYZE remember_me_tokens;
ANALYZE audit_logs;
ANALYZE rate_limit_attempts;
```

2. Vacuum tables
```bash
VACUUM ANALYZE users;
VACUUM ANALYZE sessions;
VACUUM ANALYZE remember_me_tokens;
VACUUM ANALYZE audit_logs;
VACUUM ANALYZE rate_limit_attempts;
```

3. Check table sizes
```bash
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

4. Archive old audit logs
```bash
-- Archive logs older than 90 days
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

5. Check index usage
```bash
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

6. Rebuild unused indexes
```bash
-- Identify unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Drop unused indexes (if safe)
DROP INDEX idx_unused;
```

**Success Criteria**:
- ✅ Tables analyzed
- ✅ Tables vacuumed
- ✅ Old logs archived
- ✅ Indexes optimized
- ✅ Database performance maintained

**Escalation**:
- If database size grows unexpectedly, investigate
- If performance degrades, check for missing indexes

---

### Runbook: Backup and Recovery

**Purpose**: Ensure data is backed up and recoverable

**Frequency**: Daily (automated), Weekly (manual verification)

**Steps**:

1. Verify automated backups
```bash
# Check Supabase backup status
# Via Supabase dashboard: Settings > Backups

# Expected: Daily backups enabled
```

2. Test backup recovery
```bash
# Restore from backup to test environment
# Via Supabase dashboard: Settings > Backups > Restore

# Verify data integrity
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM audit_logs;
```

3. Document backup procedure
```bash
# Backup location: Supabase
# Backup frequency: Daily
# Retention: 30 days
# Recovery time: < 1 hour
```

4. Test recovery procedure
```bash
# Simulate data loss
# Restore from backup
# Verify data integrity
# Document recovery time
```

**Success Criteria**:
- ✅ Backups enabled
- ✅ Backups verified
- ✅ Recovery tested
- ✅ Recovery time acceptable

**Escalation**:
- If backup fails, escalate to database team
- If recovery fails, escalate to disaster recovery team

---

### Runbook: Update Dependencies

**Purpose**: Keep dependencies up to date for security and performance

**Frequency**: Monthly

**Steps**:

1. Check for updates
```bash
npm outdated
```

2. Review security advisories
```bash
npm audit
```

3. Update dependencies
```bash
npm update
```

4. Update major versions (if needed)
```bash
npm install package@latest
```

5. Run tests
```bash
npm run test
npm run type-check
npm run lint
```

6. Build application
```bash
npm run build
```

7. Deploy to staging
```bash
npm run deploy -- --environment staging
```

8. Test on staging
```bash
npm run test:e2e -- --project=staging
```

9. Deploy to production
```bash
npm run deploy -- --environment production
```

**Success Criteria**:
- ✅ Dependencies updated
- ✅ Security advisories resolved
- ✅ Tests pass
- ✅ Build succeeds
- ✅ Staging tests pass
- ✅ Production deployment successful

**Escalation**:
- If tests fail, investigate and fix
- If deployment fails, rollback to previous version

---

## Contact Information

**On-Call Support**:
- **Email**: support@gabrieltoth.com
- **Slack**: #secure-login-support
- **PagerDuty**: https://gabrieltoth.pagerduty.com

**Escalation**:
- **Level 1**: On-call engineer
- **Level 2**: Engineering manager
- **Level 3**: CTO/Security Lead

