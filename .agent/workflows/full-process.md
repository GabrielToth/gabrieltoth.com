---
description: Mandatory development workflow covering testing, security, build, and free-tier compatibility
---
// turbo-all

# Comprehensive AI Agent Workflow (Antigravity)

**MANDATORY EXECUTION ORDER FOR EVERY FEATURE OR FIX:**

## 1. Planning & Context
1. **Understand Task**: Read requirements and verify if there are any specific architectural guidelines (`docs/ARCHITECTURE.md`).
2. **Create GitHub Issue**: NEVER write code before creating an issue outlining requirements via `gh issue create`.
3. **Free-Tier Constraint Check**: Ensure the proposed solution will not incur costs (e.g., uses Vercel Free, Supabase Free, Cloudflare Free).

## 2. Implementation & Cloud/Local Compatibility
1. **Develop**: Write the code in English (variables, functions, comments).
2. **Compatibility Strategy**: Ensure the solution supports both Local (Docker/Node) and Cloud (Vercel) environments gracefully. Do not hardcode remote production URLs; always rely on environment variables (`process.env.NEXT_PUBLIC_APP_URL` vs `localhost`).
3. **Documentation**: Update any technical documentation (`docs/`) or `README.md` if significant changes are introduced.

## 3. Strict Security Assessment
For every new endpoint, form, or database mutation, the following vectors MUST be assessed and mitigated:
- [ ] **SQL/NoSQL Injection**: Use Supabase parameterized queries/ORM.
- [ ] **XSS (Cross-Site Scripting)**: Sanitize user inputs and rely on React's built-in escaping.
- [ ] **CSRF (Cross-Site Request Forgery)**: Verify Next.js Server Actions and API route protections.
- [ ] **Broken Access Control (IDOR)**: Check RLS (Row Level Security) policies on Supabase for data access.
- [ ] **Sensitive Data Exposure**: Ensure variables like `PEPPER_SECRET` are never sent to the client.
- [ ] **Rate Limiting & Brute Force**: Apply Upstash Redis / Vercel rate limiting.
- [ ] **SSRF (Server-Side Request Forgery)**: Validate all outbound URLs if hitting external sources.
- [ ] **Path Traversal**: Restrict file system lookups recursively.
- [ ] **Bot / Spam Attacks**: Ensure Cloudflare Turnstile CAPTCHA is enforced on public endpoints.

## 4. Testing (Mandatory for ALL changes)
1. **Always Create/Update Tests**: Every modified or new file needs corresponding unit or integration tests in `src/__tests__`.
2. **Execute Tests**:
```bash
npm run type-check
npm run lint:fix
npm run test
```

## 5. Build Verification
1. **Local Build Check**:
```bash
npm run build
```
2. **CI/CD Updating**: If additional steps were added, update the Github Actions or Vercel config.

## 6. Commit & Delivery
1. **Semantic Commit**:
```bash
git add .
git commit -m "feat(#ISSUE_NUMBER): description of feature in english"
```
2. **Provide Summary**: Respond to the user in a concise text block in Portuguese without generating `.md` files in their chat scope.
