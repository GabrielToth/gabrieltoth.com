# Secure Login Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Issue: "Invalid email or password" error

**Symptoms**:
- User cannot log in
- Error message: "Invalid email or password"
- Correct credentials are being used

**Possible Causes**:
1. Email not verified
2. User account doesn't exist
3. Password is incorrect
4. Database connection issue

**Solutions**:

```bash
# 1. Check if email is verified
SELECT email, email_verified FROM users WHERE email = 'user@example.com';

# 2. Verify user exists
SELECT * FROM users WHERE email = 'user@example.com';

# 3. Check password hash
SELECT password_hash FROM users WHERE email = 'user@example.com';

# 4. Test password verification
npm run test -- src/__tests__/auth/password-hashing.test.ts

# 5. Check database connection
npm run db:check
```

**Resolution**:
- If email not verified: Send verification email
- If user doesn't exist: Create user account
- If password incorrect: Reset password
- If database issue: Check connection string

---

#### Issue: "Too many login attempts" error

**Symptoms**:
- Error message: "Too many login attempts. Please try again in 1 hour."
- User is locked out
- Cannot log in even with correct credentials

**Possible Causes**:
1. 5 failed login attempts in the last hour
2. Rate limiting triggered
3. Shared IP address (office, school, etc.)

**Solutions**:

```bash
# 1. Check rate limit counter
redis-cli GET rate_limit:user_ip_address

# 2. Check attempt count
SELECT * FROM rate_limit_attempts WHERE ip_address = '192.168.1.1';

# 3. Reset rate limit manually (admin only)
redis-cli DEL rate_limit:user_ip_address

# 4. Check if IP is shared
# Ask user to try from different network

# 5. Verify rate limiting is working
npm run test -- src/__tests__/auth/rate-limiting.test.ts
```

**Resolution**:
- Wait 1 hour for automatic reset
- Try from different IP address
- Contact support for manual reset
- Use VPN to change IP address

---

#### Issue: "Invalid request. Please refresh and try again." error

**Symptoms**:
- Error message: "Invalid request. Please refresh and try again."
- CSRF token validation fails
- Login form doesn't submit

**Possible Causes**:
1. CSRF token missing
2. CSRF token expired
3. CSRF token tampered with
4. Session cookie cleared

**Solutions**:

```bash
# 1. Check CSRF token in cookies
document.cookie  // In browser console

# 2. Verify CSRF token format
npm run test -- src/__tests__/auth/csrf-validator.test.ts

# 3. Check token expiration
SELECT * FROM csrf_tokens WHERE token = 'token_value';

# 4. Clear browser cookies and try again
# Settings > Privacy > Clear browsing data > Cookies

# 5. Try in incognito mode
# Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
```

**Resolution**:
- Refresh the page to get a new CSRF token
- Clear browser cookies
- Try in incognito/private mode
- Try in different browser
- Check browser console for errors

---

#### Issue: "Email not verified" error

**Symptoms**:
- Error message: "Email not verified. Please check your email for verification link."
- User cannot log in
- Verification email not received

**Possible Causes**:
1. Email verification not completed
2. Verification link expired
3. Verification email not sent
4. Email marked as spam

**Solutions**:

```bash
# 1. Check email verification status
SELECT email, email_verified FROM users WHERE email = 'user@example.com';

# 2. Check verification token
SELECT * FROM verification_tokens WHERE email = 'user@example.com';

# 3. Resend verification email
npm run send-verification-email -- user@example.com

# 4. Manually verify email (admin only)
UPDATE users SET email_verified = true WHERE email = 'user@example.com';

# 5. Check email logs
grep "verification" logs/email.log
```

**Resolution**:
- Check email inbox and spam folder
- Click verification link in email
- Request new verification email
- Contact support for manual verification

---

### Session Issues

#### Issue: Session expires too quickly

**Symptoms**:
- User is logged out after a few minutes
- Session token expires unexpectedly
- "Please log in again" message appears

**Possible Causes**:
1. Session expiration time too short
2. Session not being refreshed
3. Browser clearing cookies
4. Server time out of sync

**Solutions**:

```bash
# 1. Check session expiration time
SELECT expires_at FROM sessions WHERE user_id = 'user_id';

# 2. Verify session refresh is working
npm run test -- src/__tests__/auth/session.test.ts

# 3. Check browser cookie settings
// In browser console
document.cookie

# 4. Verify server time
date

# 5. Check for clock skew
timedatectl status  # Linux
date  # Mac/Windows
```

**Resolution**:
- Increase session expiration time (if needed)
- Enable session refresh
- Check browser cookie settings
- Sync server time with NTP
- Use Remember Me for longer sessions

---

#### Issue: Remember Me token not working

**Symptoms**:
- Remember Me checkbox selected but not working
- User is logged out after closing browser
- Remember Me token not persisted

**Possible Causes**:
1. Remember Me token not created
2. Remember Me cookie not set
3. Cookie expiration too short
4. Browser clearing cookies

**Solutions**:

```bash
# 1. Check Remember Me token creation
SELECT * FROM remember_me_tokens WHERE user_id = 'user_id';

# 2. Verify Remember Me cookie is set
// In browser console
document.cookie

# 3. Check cookie expiration
SELECT expires_at FROM remember_me_tokens WHERE user_id = 'user_id';

# 4. Verify Remember Me validation
npm run test -- src/__tests__/auth/session.test.ts

# 5. Check browser cookie settings
// Settings > Privacy > Cookies
```

**Resolution**:
- Ensure Remember Me checkbox is selected
- Check browser cookie settings
- Increase cookie expiration time
- Try in different browser
- Clear browser cache and cookies

---

### Password Issues

#### Issue: Password reset not working

**Symptoms**:
- Password reset email not received
- Password reset link expired
- Cannot set new password

**Possible Causes**:
1. Password reset email not sent
2. Password reset link expired
3. Email marked as spam
4. Database error

**Solutions**:

```bash
# 1. Check password reset token
SELECT * FROM password_reset_tokens WHERE email = 'user@example.com';

# 2. Check token expiration
SELECT expires_at FROM password_reset_tokens WHERE email = 'user@example.com';

# 3. Resend password reset email
npm run send-password-reset-email -- user@example.com

# 4. Check email logs
grep "password_reset" logs/email.log

# 5. Manually reset password (admin only)
npm run reset-password -- user@example.com new_password
```

**Resolution**:
- Check email inbox and spam folder
- Request new password reset email
- Use password reset link within 24 hours
- Contact support for manual password reset

---

#### Issue: Password strength validation failing

**Symptoms**:
- Error message: "Password does not meet strength requirements"
- Cannot create account or change password
- Password requirements unclear

**Possible Causes**:
1. Password too short (< 8 characters)
2. Missing uppercase letter
3. Missing lowercase letter
4. Missing number
5. Missing special character

**Solutions**:

```bash
# 1. Check password requirements
npm run test -- src/__tests__/auth/password-strength.test.ts

# 2. Verify password validation
const password = "MyPassword123!"
const isValid = validatePassword(password)
console.log(isValid)

# 3. Check password strength rules
cat src/lib/auth/password-strength.ts
```

**Resolution**:
- Use password with 8+ characters
- Include uppercase letter (A-Z)
- Include lowercase letter (a-z)
- Include number (0-9)
- Include special character (!@#$%^&*)

---

### Rate Limiting Issues

#### Issue: Rate limiting too strict

**Symptoms**:
- Users locked out after a few failed attempts
- Cannot log in for 1 hour
- Rate limiting affecting legitimate users

**Possible Causes**:
1. Rate limit threshold too low
2. Shared IP address (office, school, etc.)
3. Automated login attempts
4. Testing/debugging

**Solutions**:

```bash
# 1. Check rate limit configuration
cat src/lib/auth/rate-limiter.ts

# 2. Adjust rate limit threshold
// In src/lib/auth/rate-limiter.ts
const RATE_LIMIT_THRESHOLD = 5  // Change to higher value

# 3. Check rate limit attempts
SELECT * FROM rate_limit_attempts WHERE ip_address = '192.168.1.1';

# 4. Reset rate limit for IP
redis-cli DEL rate_limit:192.168.1.1

# 5. Whitelist IP address (if needed)
// Add to whitelist in rate-limiter.ts
const WHITELIST_IPS = ['192.168.1.1']
```

**Resolution**:
- Increase rate limit threshold
- Whitelist trusted IP addresses
- Use VPN to change IP address
- Wait 1 hour for automatic reset
- Contact support for manual reset

---

#### Issue: Rate limiting not working

**Symptoms**:
- Users can attempt login unlimited times
- No rate limiting enforcement
- Brute force attacks possible

**Possible Causes**:
1. Rate limiting disabled
2. Redis connection issue
3. Rate limiting logic error
4. Configuration issue

**Solutions**:

```bash
# 1. Check if rate limiting is enabled
grep "checkRateLimit" src/app/api/auth/login/route.ts

# 2. Verify Redis connection
redis-cli ping

# 3. Check rate limit counter
redis-cli GET rate_limit:192.168.1.1

# 4. Test rate limiting
npm run test -- src/__tests__/auth/rate-limiting.test.ts

# 5. Check rate limiting configuration
cat src/lib/auth/rate-limiter.ts
```

**Resolution**:
- Enable rate limiting in configuration
- Check Redis connection
- Verify rate limiting logic
- Run tests to verify functionality
- Check logs for errors

---

### Database Issues

#### Issue: Database connection timeout

**Symptoms**:
- Error message: "Database connection timeout"
- Login endpoint returns 500 error
- Cannot connect to database

**Possible Causes**:
1. Database server down
2. Network connectivity issue
3. Connection string incorrect
4. Database credentials wrong

**Solutions**:

```bash
# 1. Check database connection string
echo $DATABASE_URL

# 2. Test database connection
psql $DATABASE_URL -c "SELECT 1"

# 3. Check database server status
# Via Supabase dashboard: https://app.supabase.com

# 4. Verify network connectivity
ping db.supabase.co

# 5. Check database logs
# Via Supabase dashboard: Logs section

# 6. Restart database connection
npm run db:check
```

**Resolution**:
- Verify database connection string
- Check database server status
- Verify network connectivity
- Check database credentials
- Contact database provider support

---

#### Issue: Database query slow

**Symptoms**:
- Login endpoint slow (> 500ms)
- Database queries taking long time
- Performance degradation

**Possible Causes**:
1. Missing database indexes
2. Inefficient query
3. Large dataset
4. Database server overloaded

**Solutions**:

```bash
# 1. Check database indexes
SELECT * FROM pg_indexes WHERE tablename = 'users';

# 2. Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

# 3. Add missing indexes
CREATE INDEX idx_users_email ON users(email);

# 4. Check database server load
# Via Supabase dashboard: Monitoring section

# 5. Run performance tests
npm run perf

# 6. Optimize queries
// Review src/lib/auth/session.ts
```

**Resolution**:
- Add missing database indexes
- Optimize inefficient queries
- Archive old data
- Scale database server
- Use caching for frequently accessed data

---

### Cache/Redis Issues

#### Issue: Redis connection error

**Symptoms**:
- Error message: "Cannot connect to Redis"
- Rate limiting not working
- Session caching not working

**Possible Causes**:
1. Redis server down
2. Network connectivity issue
3. Connection string incorrect
4. Redis credentials wrong

**Solutions**:

```bash
# 1. Check Redis connection string
echo $REDIS_URL

# 2. Test Redis connection
redis-cli -u $REDIS_URL ping

# 3. Check Redis server status
# Via Upstash dashboard: https://console.upstash.com

# 4. Verify network connectivity
ping redis.upstash.io

# 5. Check Redis logs
# Via Upstash dashboard: Logs section

# 6. Restart Redis connection
npm run redis:check
```

**Resolution**:
- Verify Redis connection string
- Check Redis server status
- Verify network connectivity
- Check Redis credentials
- Contact Redis provider support

---

#### Issue: Cache not working

**Symptoms**:
- Rate limiting not enforced
- Session not cached
- Performance not improved

**Possible Causes**:
1. Cache disabled
2. Cache key incorrect
3. Cache expiration too short
4. Cache not being used

**Solutions**:

```bash
# 1. Check if caching is enabled
grep "REDIS_URL" .env.local

# 2. Verify cache keys
redis-cli KEYS "*"

# 3. Check cache expiration
redis-cli TTL rate_limit:192.168.1.1

# 4. Test caching
npm run test -- src/__tests__/auth/rate-limiting.test.ts

# 5. Check cache configuration
cat src/lib/cache/index.ts
```

**Resolution**:
- Enable caching in configuration
- Verify cache keys are correct
- Increase cache expiration time
- Verify cache is being used
- Check logs for cache errors

---

### Security Issues

#### Issue: CSRF token validation failing

**Symptoms**:
- Error message: "Invalid request. Please refresh and try again."
- CSRF token validation fails
- Login form doesn't submit

**Possible Causes**:
1. CSRF token missing
2. CSRF token expired
3. CSRF token tampered with
4. CSRF validation disabled

**Solutions**:

```bash
# 1. Check CSRF token validation
npm run test -- src/__tests__/auth/csrf-validator.test.ts

# 2. Verify CSRF token is being sent
// In browser console
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
    csrfToken: document.querySelector('[name="csrf_token"]').value
  })
})

# 3. Check CSRF token in cookies
document.cookie

# 4. Verify CSRF validation is enabled
grep "validateCSRFToken" src/app/api/auth/login/route.ts
```

**Resolution**:
- Refresh page to get new CSRF token
- Ensure CSRF token is included in request
- Check browser console for errors
- Clear browser cookies and try again

---

#### Issue: SQL injection attempt detected

**Symptoms**:
- Error message: "Invalid input"
- Login fails with special characters
- Suspicious activity in logs

**Possible Causes**:
1. Input validation too strict
2. SQL injection attempt
3. Special characters in password

**Solutions**:

```bash
# 1. Check input validation
npm run test -- src/__tests__/auth/input-validation.test.ts

# 2. Review security logs
grep "SQL" logs/security.log

# 3. Verify parameterized queries
grep "SELECT" src/app/api/auth/login/route.ts

# 4. Check for injection attempts
grep "OR '1'='1'" logs/security.log
```

**Resolution**:
- Verify input validation is working
- Use parameterized queries
- Escape special characters
- Monitor security logs
- Contact security team if attack detected

---

### Performance Issues

#### Issue: Login endpoint slow

**Symptoms**:
- Login takes > 500ms
- User experience degraded
- Performance metrics poor

**Possible Causes**:
1. Slow database query
2. Slow password hashing
3. Slow CSRF validation
4. Network latency

**Solutions**:

```bash
# 1. Run performance tests
npm run perf

# 2. Check response time
curl -w "@curl-format.txt" -o /dev/null -s https://gabrieltoth.com/api/auth/login

# 3. Profile login endpoint
npm run test -- src/__tests__/performance/login.test.ts

# 4. Check database performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

# 5. Check password hashing performance
npm run test -- src/__tests__/auth/password-hashing.test.ts

# 6. Run Lighthouse audit
npm run lighthouse
```

**Resolution**:
- Optimize database queries
- Add database indexes
- Reduce password hashing cost (if safe)
- Use caching for frequently accessed data
- Optimize network latency

---

### Logging and Monitoring Issues

#### Issue: Audit logs not being recorded

**Symptoms**:
- No login events in audit logs
- Audit logs table empty
- Cannot track user activity

**Possible Causes**:
1. Audit logging disabled
2. Database error
3. Audit logs table doesn't exist
4. RLS policy blocking inserts

**Solutions**:

```bash
# 1. Check if audit logging is enabled
grep "logLoginSuccess" src/app/api/auth/login/route.ts

# 2. Verify audit logs table exists
SELECT * FROM audit_logs LIMIT 1;

# 3. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'audit_logs';

# 4. Test audit logging
npm run test -- src/__tests__/auth/audit-logging.test.ts

# 5. Check for database errors
grep "audit_logs" logs/error.log
```

**Resolution**:
- Enable audit logging in configuration
- Create audit logs table if missing
- Verify RLS policies allow inserts
- Check database for errors
- Review audit logging implementation

---

#### Issue: Error tracking not working

**Symptoms**:
- Errors not appearing in Sentry
- No error notifications
- Cannot track issues

**Possible Causes**:
1. Sentry not configured
2. Sentry DSN incorrect
3. Error tracking disabled
4. Network issue

**Solutions**:

```bash
# 1. Check Sentry configuration
echo $SENTRY_DSN

# 2. Verify Sentry is initialized
grep "Sentry.init" src/app/layout.tsx

# 3. Test error tracking
npm run test -- src/__tests__/error-tracking.test.ts

# 4. Check Sentry dashboard
# https://sentry.io/organizations/your-org/

# 5. Verify network connectivity
curl https://sentry.io/api/0/
```

**Resolution**:
- Configure Sentry DSN
- Initialize Sentry in application
- Enable error tracking
- Check network connectivity
- Verify Sentry account and project

---

## Getting Help

### Support Channels

- **Documentation**: https://gabrieltoth.com/docs
- **GitHub Issues**: https://github.com/gabrieltoth/gabrieltoth.com/issues
- **Email**: support@gabrieltoth.com
- **Discord**: https://discord.gg/gabrieltoth

### Providing Debug Information

When reporting issues, include:

1. **Error Message**: Exact error message from logs
2. **Steps to Reproduce**: How to reproduce the issue
3. **Environment**: Local, staging, or production
4. **Browser**: Chrome, Firefox, Safari, Edge
5. **OS**: Windows, Mac, Linux
6. **Logs**: Relevant log entries
7. **Screenshots**: Visual evidence of issue
8. **Request ID**: From error response headers

### Debug Mode

Enable debug logging:

```bash
# Set log level to debug
export LOG_LEVEL=debug

# Run application
npm run dev

# Check logs
tail -f logs/debug.log
```

