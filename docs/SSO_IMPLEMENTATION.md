# SSO (Single Sign-On) Implementation Guide

## What is SSO?

Single Sign-On (SSO) is an authentication method that allows users to sign in to multiple applications using a single set of credentials. Instead of maintaining separate usernames and passwords for each application, users authenticate once with their organization's identity provider.

## How SSO Works

```
User → Application → Identity Provider (IdP) → User's Organization
                                                    ↓
                                            Verify Credentials
                                                    ↓
                                            Return Auth Token
                                                    ↓
                                            User Authenticated
```

## SSO Flow in Our Application

### Step 1: User Enters Email
```
User enters: john@company.com
```

### Step 2: Domain Detection
```
Extract domain: company.com
Check if company.com has SSO configured
```

### Step 3: Redirect to Identity Provider
```
If SSO is configured:
  → Redirect to company.com's identity provider (e.g., Okta, Azure AD, Google Workspace)
  → User authenticates with their company credentials
  → Identity provider redirects back to our app with auth token

If SSO is NOT configured:
  → Show password field for manual authentication
```

### Step 4: User Authenticated
```
Token received → Create session → Redirect to dashboard
```

## Supported SSO Providers

### Enterprise SSO
- **Okta** - Popular enterprise SSO platform
- **Azure AD (Microsoft Entra ID)** - Microsoft's identity platform
- **Google Workspace** - For organizations using Google
- **Ping Identity** - Enterprise identity platform
- **JumpCloud** - Directory-as-a-Service

### Implementation with Supabase

Supabase supports SSO through SAML 2.0 and OAuth 2.0 protocols.

#### SAML 2.0 (Most Common for Enterprise)
```typescript
// Configure SAML provider in Supabase
const { error } = await supabase.auth.signInWithSSO({
  domain: 'company.com',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

#### OAuth 2.0
```typescript
// For OAuth-based providers
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'azure', // or 'okta', 'google', etc.
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

## Setup Instructions

### 1. Configure SSO in Supabase

**Via Supabase Dashboard:**
1. Go to Authentication → Providers
2. Enable SAML 2.0
3. Add your organization's identity provider details:
   - Entity ID
   - Single Sign-On URL
   - X.509 Certificate

**Via Supabase CLI:**
```bash
# Configure SAML provider
npx supabase auth update-provider saml \
  --entity-id "https://your-idp.com/metadata" \
  --sso-url "https://your-idp.com/sso" \
  --certificate "-----BEGIN CERTIFICATE-----..."
```

### 2. Configure Your Identity Provider

**For Okta:**
1. Create SAML application in Okta
2. Set Single Sign-On URL: `https://your-app.com/auth/callback`
3. Set Audience URI: `https://your-app.com`
4. Download metadata XML
5. Upload to Supabase

**For Azure AD:**
1. Register application in Azure Portal
2. Configure SAML URLs
3. Download federation metadata
4. Upload to Supabase

**For Google Workspace:**
1. Enable SAML in Google Admin Console
2. Configure service provider details
3. Download metadata
4. Upload to Supabase

### 3. Test SSO Flow

```typescript
// Test SSO sign-in
async function testSSO() {
  try {
    await signInWithSSO('user@company.com')
    // Should redirect to identity provider
  } catch (error) {
    console.error('SSO failed:', error)
  }
}
```

## User Experience

### Without SSO (Manual Login)
```
1. User enters email
2. User enters password
3. User clicks "Sign In"
4. Authenticated → Dashboard
```

### With SSO (Automatic)
```
1. User enters email
2. System detects SSO is configured
3. User redirected to company's login page
4. User enters company credentials
5. Redirected back to app
6. Authenticated → Dashboard
```

## Benefits of SSO

✅ **Improved Security**
- Centralized password management
- Multi-factor authentication at organization level
- Audit logs of all access

✅ **Better User Experience**
- Single password to remember
- Faster login process
- Automatic logout when leaving organization

✅ **Reduced Support Costs**
- Fewer password reset requests
- Centralized user management
- Easier offboarding

✅ **Compliance**
- Meets enterprise security requirements
- Audit trail for compliance
- Centralized access control

## Troubleshooting

### Issue: SSO Not Working
```
Solution:
1. Verify domain is configured in identity provider
2. Check certificate is valid and not expired
3. Verify redirect URL matches in both systems
4. Check browser console for error messages
```

### Issue: User Redirected to Wrong Page
```
Solution:
1. Verify redirectTo URL in signInWithSSO
2. Check auth callback route is configured
3. Verify session is created after SSO
```

### Issue: Certificate Expired
```
Solution:
1. Download new certificate from identity provider
2. Update in Supabase dashboard
3. Test SSO flow again
```

## Security Considerations

### Best Practices
- ✅ Always use HTTPS for SSO
- ✅ Validate SAML assertions
- ✅ Implement CSRF protection
- ✅ Log all SSO events
- ✅ Monitor for suspicious activity

### Never Do
- ❌ Store passwords in application
- ❌ Bypass certificate validation
- ❌ Log sensitive authentication data
- ❌ Allow unencrypted SSO traffic

## Code Example: Unified Sign-In with SSO

```typescript
// src/lib/auth/unified-auth.ts
export async function signInWithSSO(email: string): Promise<void> {
  try {
    const supabase = createClient()
    
    // Extract domain from email
    const domain = email.split('@')[1]
    
    // Check if domain has SSO configured
    const { data: ssoConfig } = await supabase
      .from('sso_configurations')
      .select('*')
      .eq('domain', domain)
      .single()
    
    if (!ssoConfig) {
      throw new Error('SSO not configured for this domain')
    }
    
    // Initiate SSO flow
    const { error } = await supabase.auth.signInWithSSO({
      domain,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      throw new Error(error.message)
    }
  } catch (err) {
    throw err instanceof Error ? err : new Error('SSO sign-in failed')
  }
}
```

## References

- [Supabase SSO Documentation](https://supabase.com/docs/guides/auth/sso)
- [SAML 2.0 Specification](https://en.wikipedia.org/wiki/SAML_2.0)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [Okta SAML Integration](https://developer.okta.com/docs/guides/build-sso-integration/)
- [Azure AD SAML Integration](https://docs.microsoft.com/en-us/azure/active-directory/develop/single-sign-on-saml-protocol)

## Next Steps

1. Choose your identity provider (Okta, Azure AD, Google Workspace, etc.)
2. Configure SSO in Supabase dashboard
3. Set up identity provider with your app details
4. Test SSO flow with test user
5. Deploy to production
6. Monitor SSO events and user feedback
