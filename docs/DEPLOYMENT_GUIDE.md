# Account Completion Flow - Deployment Guide

## Pre-Deployment Checklist

Before deploying to production, ensure all items are completed:

### Code Quality

- [ ] All unit tests passing (`npm run test`)
- [ ] All integration tests passing (`npm run test -- src/__tests__/integration/`)
- [ ] All property-based tests passing
- [ ] Code coverage > 80%
- [ ] No linting errors (`npm run lint`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Build successful (`npm run build`)

### Documentation

- [ ] API documentation updated
- [ ] Developer guide updated
- [ ] User guide updated
- [ ] README updated
- [ ] Deployment guide completed

### Security

- [ ] Security audit completed
- [ ] OWASP Top 10 vulnerabilities checked
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection verified
- [ ] Rate limiting configured
- [ ] Password hashing verified (bcrypt cost factor 12)
- [ ] Session security verified (HTTP-only, Secure, SameSite)

### Performance

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals targets met
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- [ ] API response time < 500ms
- [ ] Database query time < 200ms
- [ ] Bundle size acceptable

### Database

- [ ] Migration script created
- [ ] Migration tested in staging
- [ ] Rollback plan documented
- [ ] Database backups configured
- [ ] Indexes created
- [ ] Query performance verified

### Monitoring

- [ ] Monitoring metrics configured
- [ ] Logging configured
- [ ] Alerts configured
- [ ] Error tracking configured
- [ ] Performance monitoring configured

### Accessibility

- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Color contrast verified
- [ ] Form labels verified

## Database Migration

### Create Migration

```bash
# Create migration file
npm run db:create-migration -- add_account_completion_fields

# This creates a file like: migrations/20240101120000_add_account_completion_fields.sql
```

### Migration Script

```sql
-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_completion_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_completed_at TIMESTAMP;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_account_completion_status ON users(account_completion_status);

-- Update existing users
UPDATE users SET account_completion_status = 'completed' WHERE password_hash IS NOT NULL;
```

### Test Migration

```bash
# Test in local environment
npm run db:migrate

# Verify migration
npm run db:verify

# Check data integrity
SELECT COUNT(*) as total_users,
       COUNT(CASE WHEN account_completion_status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN account_completion_status = 'pending' THEN 1 END) as pending
FROM users;
```

### Rollback Plan

```bash
# If migration fails, rollback
npm run db:rollback

# Verify rollback
npm run db:verify
```

## Staging Deployment

### 1. Deploy to Staging

```bash
# Build for staging
npm run build

# Deploy to staging environment
npm run deploy:staging

# Verify deployment
curl https://staging.gabrieltoth.com/api/health
```

### 2. Run Smoke Tests

```bash
# Run smoke tests
npm run test:smoke

# Check critical endpoints
curl https://staging.gabrieltoth.com/api/auth/complete-account
```

### 3. Manual Testing

- [ ] Test account completion flow in English
- [ ] Test account completion flow in Portuguese
- [ ] Test account completion flow in Spanish
- [ ] Test account completion flow in German
- [ ] Test middleware redirection
- [ ] Test duplicate email prevention
- [ ] Test error handling
- [ ] Test on desktop browsers
- [ ] Test on mobile browsers

### 4. Performance Testing

```bash
# Run performance tests
npm run test:performance

# Run Lighthouse audit
npm run lighthouse

# Check Core Web Vitals
npm run perf:full
```

### 5. Security Testing

```bash
# Run security tests
npm run test:security

# Check for vulnerabilities
npm audit

# Run OWASP tests
npm run test:owasp
```

### 6. Get Approval

- [ ] QA team approval
- [ ] Security team approval
- [ ] Product team approval
- [ ] Stakeholder approval

## Production Deployment

### 1. Pre-Deployment

```bash
# Create backup
npm run db:backup

# Verify backup
npm run db:verify-backup

# Check production health
curl https://gabrieltoth.com/api/health
```

### 2. Deploy Database Migration

```bash
# Run migration in production
npm run db:migrate:prod

# Verify migration
npm run db:verify:prod

# Check data integrity
SELECT COUNT(*) FROM users WHERE account_completion_status IS NOT NULL;
```

### 3. Deploy Application

```bash
# Build for production
npm run build

# Deploy to production
npm run deploy:prod

# Verify deployment
curl https://gabrieltoth.com/api/health
```

### 4. Verify Deployment

```bash
# Check API endpoint
curl https://gabrieltoth.com/api/auth/complete-account

# Check frontend
curl https://gabrieltoth.com/en/auth/complete-account

# Check middleware
curl -H "Cookie: session=invalid" https://gabrieltoth.com/en/dashboard
```

### 5. Monitor Deployment

- [ ] Check error rates (should be < 0.1%)
- [ ] Check API response times (should be < 500ms)
- [ ] Check database query times (should be < 200ms)
- [ ] Check user feedback
- [ ] Monitor logs for errors

### 6. Post-Deployment

```bash
# Run post-deployment tests
npm run test:post-deployment

# Check metrics
npm run metrics:check

# Generate report
npm run report:deployment
```

## Rollback Plan

If issues occur after deployment:

### 1. Immediate Rollback

```bash
# Disable feature flag
npm run feature-flag:disable account-completion

# This prevents new users from accessing the feature
```

### 2. Database Rollback

```bash
# Rollback database migration
npm run db:rollback:prod

# Verify rollback
npm run db:verify:prod
```

### 3. Application Rollback

```bash
# Rollback to previous version
npm run deploy:rollback:prod

# Verify rollback
curl https://gabrieltoth.com/api/health
```

### 4. Verify Rollback

- [ ] Check error rates
- [ ] Check API response times
- [ ] Check user feedback
- [ ] Monitor logs

### 5. Post-Rollback Analysis

- [ ] Identify root cause
- [ ] Fix issues
- [ ] Re-test in staging
- [ ] Plan re-deployment

## Feature Flags

### Enable Feature

```typescript
// In code
if (featureFlags.accountCompletion) {
  // Enable account completion flow
}
```

### Toggle Feature Flag

```bash
# Enable
npm run feature-flag:enable account-completion

# Disable
npm run feature-flag:disable account-completion

# Check status
npm run feature-flag:status account-completion
```

## Monitoring

### Metrics to Monitor

- Account completion rate
- Average completion time
- Error rate by type
- API response time
- Database query time
- Session creation rate
- Email verification rate

### Set Up Alerts

```bash
# Alert on high error rate
npm run alert:create error-rate --threshold 1%

# Alert on slow API response
npm run alert:create api-response-time --threshold 500ms

# Alert on database connection failure
npm run alert:create db-connection-failure
```

### View Metrics

```bash
# View real-time metrics
npm run metrics:realtime

# View historical metrics
npm run metrics:history

# Generate report
npm run metrics:report
```

## Logging

### View Logs

```bash
# View recent logs
npm run logs:tail

# View logs for specific service
npm run logs:tail --service auth

# View logs for specific time range
npm run logs:tail --from "2024-01-01" --to "2024-01-02"
```

### Search Logs

```bash
# Search for errors
npm run logs:search "error"

# Search for specific user
npm run logs:search "user@example.com"

# Search for specific action
npm run logs:search "ACCOUNT_COMPLETION"
```

## Troubleshooting

### Issue: Migration Failed

**Symptoms:** Database migration fails during deployment

**Solution:**

1. Check migration logs: `npm run logs:tail --service db`
2. Verify database connection: `npm run db:check`
3. Rollback migration: `npm run db:rollback`
4. Fix migration script
5. Re-run migration: `npm run db:migrate`

### Issue: High Error Rate

**Symptoms:** Error rate > 1% after deployment

**Solution:**

1. Check error logs: `npm run logs:search "error"`
2. Identify error pattern
3. Check recent changes
4. Rollback if necessary: `npm run deploy:rollback:prod`
5. Fix issue and re-deploy

### Issue: Slow API Response

**Symptoms:** API response time > 500ms

**Solution:**

1. Check database query time: `npm run metrics:check`
2. Check API logs: `npm run logs:tail --service api`
3. Optimize slow queries
4. Add database indexes if needed
5. Re-deploy and monitor

### Issue: Database Connection Failure

**Symptoms:** Cannot connect to database

**Solution:**

1. Check database status: `npm run db:check`
2. Check database logs: `npm run logs:tail --service db`
3. Verify connection string
4. Check firewall rules
5. Restart database if necessary

## Rollback Checklist

- [ ] Disable feature flag
- [ ] Rollback database migration
- [ ] Rollback application code
- [ ] Verify rollback successful
- [ ] Monitor error rates
- [ ] Notify stakeholders
- [ ] Document incident
- [ ] Plan fix and re-deployment

## Post-Deployment Checklist

- [ ] All tests passing
- [ ] Error rate < 0.1%
- [ ] API response time < 500ms
- [ ] Database query time < 200ms
- [ ] User feedback positive
- [ ] Monitoring alerts configured
- [ ] Logs being collected
- [ ] Metrics being tracked
- [ ] Documentation updated
- [ ] Team notified

## Support

For deployment issues:

- **Slack:** #deployments
- **Email:** devops@gabrieltoth.com
- **Documentation:** https://docs.gabrieltoth.com/deployment
- **Status Page:** https://status.gabrieltoth.com
