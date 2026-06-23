# Security Policy

## Reporting a Vulnerability

We take the security of gabrieltoth.com seriously. If you believe you have found a security vulnerability, please report it to us immediately.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [security@gabrieltoth.com](mailto:security@gabrieltoth.com).

You should receive a response within 48 hours. If you do not receive a response, please follow up via email to ensure we received your original message.

## What to Include

Please include the following information in your report:

- Type of issue (e.g., SQL injection, XSS, CSRF, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue (what an attacker might be able to do)

## Scope

The following are in scope:

- The main application at gabrieltoth.com
- API endpoints under /api/
- Authentication and authorization mechanisms
- Data storage and processing

The following are out of scope:

- Third-party services (Supabase, Vercel, Resend, Upstash)
- Social media platform APIs (Twitter, LinkedIn, YouTube, Instagram)

## Disclosure Policy

When we receive a security report, we will:

1. Confirm receipt within 48 hours
2. Investigate and validate the issue
3. Develop and test a fix
4. Release a security update
5. Publicly disclose the issue after the fix is deployed

We ask that you refrain from publicly disclosing the issue until we have released a fix.

## Recognition

We will publicly acknowledge security researchers who report valid vulnerabilities, unless they prefer to remain anonymous.

## Supported Versions

Only the latest version (main branch) is supported with security updates.
