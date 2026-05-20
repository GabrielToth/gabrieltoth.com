# Deploy — gabrieltoth.com

Stack: **Vercel** (app) + **Cloudflare** (DNS/CDN) + **Supabase** + **Resend**. No AWS/GCP/Azure/SMTP.

## 1. Environment variables

| File | Use |
|------|-----|
| `.env.local.example` | Development (`cp .env.local.example .env.local`) |
| `.env.production.example` | Production reference + Vercel (do not commit `.env.production`) |
| `.env.test` | Vitest overrides (committed, no secrets) |
| `.env.docker.example` | Docker Compose local stack |

Each variable in the `.example` files has a tag line:

- `GitHub: ❌ DO NOT COMMIT | Vercel: ✅ SENSITIVE - Production/Preview`
- `GitHub: ❌ DO NOT COMMIT | Vercel: ⚪ NOT SENSITIVE - Production/Preview`
- `GitHub: ✅ COMMIT | Vercel: ⚪ NOT SENSITIVE - Development`

**Sensitive** is only a Vercel dashboard checkbox — enable it when the tag says `✅ SENSITIVE`.

### Sync with Vercel

```bash
# Download (overwrites local .env.production)
vercel env pull .env.production

# Upload (overwrites production if wrong target)
vercel env push .env.production
```

Prefer editing [Vercel → Project → Settings → Environment Variables](https://vercel.com) and keeping `.env.production` as a local mirror only.

## 2. Vercel

1. Import the GitHub repo on Vercel.
2. Framework: Next.js (auto-detected).
3. Paste variables from `.env.production.example` (real values).
4. Domain: `www.gabrieltoth.com` / `gabrieltoth.com`.
5. Deploy.

## 3. Cloudflare

1. DNS pointing to Vercel (CNAME or records Vercel provides).
2. SSL/TLS: Full (strict) when the Vercel certificate is active.
3. Optional: cache rules for static assets.

## 4. Supabase

1. Project at [supabase.com](https://supabase.com).
2. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Apply migrations: `npx supabase db push` (or SQL Editor).
4. Full reset (you as sole user): `npx tsx scripts/cleanup-supabase.ts --confirm`

### Auth in dashboard (email / OTP)

You may enable **Email** under Authentication → Providers. The app still uses **custom auth** (`users` + Argon2id + `/api/auth/*`) and **Resend** for transactional mail. Both can coexist until you migrate login fully to Supabase Auth.

### Database Linter warnings (expected on free tier)

| Warning | Action |
|---------|--------|
| `auth_leaked_password_protection` | Pro plan only. On free, ignore — strong password policy in dashboard still helps. |
| `rls_auto_enable` SECURITY DEFINER RPC | Migration `20260518120000_revoke_rls_auto_enable_rpc.sql` revokes `EXECUTE` from `anon`/`authenticated`. |

## 5. Discord

1. Create or open a **Discord server** (guild).
2. Open the target text channel → **Integrations** → **Webhooks**.
3. If none exists: **New Webhook** → name it → save.
4. Copy the webhook URL → `DISCORD_WEBHOOK_URL` on Vercel → enable **Sensitive**.

## 6. Resend (email)

1. Account at [resend.com](https://resend.com).
2. Verify domain `gabrieltoth.com`.
3. `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` on Vercel (`RESEND_API_KEY` = Sensitive).

Do not configure SMTP — the app does not send via SMTP.

## 7. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → Credentials.
2. Redirect URIs: `https://www.gabrieltoth.com/api/auth/google/callback`.
3. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## 8. Docker local (tests)

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis supabase
```

## 9. Tests before deploy

```bash
npm test
npm run build
```

## 10. Passwords

**Argon2id only.** After a Supabase reset, create a new account — only Argon2id hashes are accepted.
