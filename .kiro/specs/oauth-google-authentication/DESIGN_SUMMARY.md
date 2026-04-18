# Design Summary - OAuth Google Authentication

## Quick Reference

### Database Schema

```
users
├── id (UUID, PK)
├── google_id (VARCHAR, UNIQUE)
├── google_email (VARCHAR)
├── google_name (VARCHAR)
├── google_picture (VARCHAR, nullable)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

sessions
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── session_id (VARCHAR, UNIQUE)
├── created_at (TIMESTAMP)
└── expires_at (TIMESTAMP)

audit_logs
├── id (UUID, PK)
├── user_id (UUID, FK → users.id, nullable)
├── evento (VARCHAR: login, logout, login_failed, user_created)
├── timestamp (TIMESTAMP)
├── ip_address (VARCHAR)
└── user_agent (TEXT)
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/google/callback | No | Exchange Google code for session |
| GET | /api/auth/me | Yes | Get authenticated user data |
| POST | /api/auth/logout | Yes | Logout and remove session |

### Frontend Components

| Component | Purpose | Props |
|-----------|---------|-------|
| GoogleLoginButton | Initiate OAuth flow | onSuccess, onError, className |
| GoogleLogoutButton | Logout user | onSuccess, onError, className |
| Dashboard | Protected user dashboard | None (uses useAuth) |
| useAuth | Access auth state | Returns: user, isAuthenticated, isLoading, logout |

### Authentication Flow

```
1. User clicks "Login com Google"
   ↓
2. Redirect to Google OAuth consent page
   ↓
3. User authorizes access
   ↓
4. Google redirects to callback with code
   ↓
5. Frontend sends code to POST /api/auth/google/callback
   ↓
6. Backend exchanges code for token
   ↓
7. Backend validates token with Google
   ↓
8. Backend creates/updates user
   ↓
9. Backend creates session
   ↓
10. Backend sends HTTP-Only cookie with session_id
    ↓
11. Frontend redirects to /dashboard
```

### Security Features

- ✅ Google token validation with google-auth-library
- ✅ HTTP-Only cookies (HttpOnly, Secure, SameSite=Strict)
- ✅ CSRF protection with csrf library
- ✅ Session expiration (30 days)
- ✅ Audit logging for all auth events
- ✅ Input validation for all user data
- ✅ Unique google_id constraint
- ✅ Protected routes with authentication middleware

### Correctness Properties

1. **Google Token Validation** - Valid tokens are validated and user info extracted
2. **User Creation on First Login** - New users are created with all required fields
3. **User Update on Subsequent Login** - Existing users are updated if profile changed
4. **Session Creation and Validation** - Sessions are created with unique IDs and validated
5. **Session Expiration** - Expired sessions are rejected
6. **Logout Removes Session** - Sessions are removed and cookies cleared on logout
7. **Audit Log Recording** - All auth events are logged with full details
8. **HTTP-Only Cookie Security** - Cookies have all required security flags
9. **Invalid Token Rejection** - Invalid tokens are rejected without creating sessions
10. **Unique Google ID Constraint** - Each Google ID is associated with exactly one user

### Error Handling

| Scenario | Status | Message |
|----------|--------|---------|
| Invalid Google token | 401 | Invalid or expired Google token |
| Session not found | 401 | Session not found or expired |
| CSRF token invalid | 403 | CSRF token validation failed |
| User not authenticated | 401 | Unauthorized |
| Database error | 500 | Internal server error |

### Implementation Checklist

**Backend**
- [ ] Database tables created
- [ ] Auth service implemented
- [ ] Auth routes implemented
- [ ] Auth middleware implemented
- [ ] Google OAuth configured
- [ ] CSRF protection configured
- [ ] Tests written and passing

**Frontend**
- [ ] GoogleLoginButton component created
- [ ] GoogleLogoutButton component created
- [ ] Dashboard component created
- [ ] useAuth hook created
- [ ] Route protection implemented
- [ ] Error handling implemented
- [ ] Tests written and passing

**Deployment**
- [ ] All tests passing
- [ ] Build successful
- [ ] No linting errors
- [ ] Security checklist completed
- [ ] Staging deployment successful
- [ ] Production deployment successful

### Key Decisions

1. **Google OAuth Only** - Removed email/password authentication for simplicity
2. **HTTP-Only Cookies** - Sessions stored in secure cookies, not localStorage
3. **30-Day Expiration** - Sessions expire after 30 days of creation
4. **Audit Logging** - All auth events logged for security monitoring
5. **CSRF Protection** - All POST requests protected with CSRF tokens
6. **Unique Google ID** - Database constraint ensures one user per Google account

### Dependencies

**Backend**
- google-auth-library - Google token validation
- csrf - CSRF token management
- express - Web framework
- pg - PostgreSQL client

**Frontend**
- @react-oauth/google - Google OAuth integration
- react - UI framework
- axios - HTTP client

### Configuration

**Environment Variables**
```
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
SESSION_EXPIRATION_DAYS=30
CSRF_SECRET=<random-secret>
DATABASE_URL=postgresql://user:password@localhost/dbname
```

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test complete flows (login, logout, session)
- **Property-Based Tests**: Test universal properties across many inputs
- **Minimum 100 iterations** for each property-based test

### Performance Considerations

- Index on google_id for fast user lookup
- Index on session_id for fast session validation
- Index on audit_logs.timestamp for log queries
- Session cleanup job to remove expired sessions
- Database connection pooling

### Monitoring

- Monitor login success/failure rates
- Monitor session creation/expiration
- Monitor audit logs for suspicious activity
- Monitor database performance
- Monitor API response times

---

**Design Status**: ✅ Complete and Ready for Implementation

**Next Steps**: 
1. Review design with stakeholders
2. Create implementation tasks
3. Begin backend implementation
4. Begin frontend implementation
5. Execute tests
6. Deploy to production
