# Deploy — gabrieltoth.com

Stack: **Vercel** (app) + **Cloudflare** (DNS/CDN) + **Supabase** + **Resend**. Sem AWS/GCP/Azure/SMTP.

## 1. Variáveis de ambiente

| Arquivo | Uso |
|---------|-----|
| `.env.local.example` | Desenvolvimento (`cp .env.local.example .env.local`) |
| `.env.production.example` | Referência produção + Vercel (não commitar `.env.production`) |
| `.env.test.example` | Testes Vitest |

Cada variável no `.env.production.example` inclui comentários: onde obter, Vercel sensitive ou não, e se está **IMPLEMENTADA** ou **NÃO USADA**.

### Sincronizar com Vercel

```bash
# Baixar (cuidado: sobrescreve .env.production local)
vercel env pull .env.production

# Enviar (cuidado: sobrescreve produção se target errado)
vercel env push .env.production
```

Prefira editar no painel [Vercel → Project → Settings → Environment Variables](https://vercel.com) e manter `.env.production` só como espelho local.

## 2. Vercel

1. Importar repositório GitHub no Vercel.
2. Framework: Next.js (detecção automática).
3. Colar variáveis de `.env.production.example` (valores reais).
4. Domínio: `www.gabrieltoth.com` / `gabrieltoth.com`.
5. Deploy.

## 3. Cloudflare

1. DNS apontando para Vercel (CNAME ou registros que a Vercel indicar).
2. SSL/TLS: Full (strict) quando certificado Vercel ativo.
3. Opcional: regras de cache para assets estáticos.

## 4. Supabase

1. Projeto em [supabase.com](https://supabase.com).
2. Copiar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Aplicar migrações: `npx supabase db push` (ou SQL Editor no painel).
4. Reset total (só você como usuário): `npx tsx scripts/cleanup-supabase.ts --confirm`

### Auth no painel (e-mail / OTP)

Pode ativar **Email** em Authentication → Providers (signup, OTP, requisitos de senha). Isso cobre fluxos nativos do Supabase Auth (confirmação, troca de e-mail, etc.).

O app ainda usa **auth custom** (`users` + Argon2id + rotas `/api/auth/*`) e **Resend** para e-mails transacionais da aplicação (contato, YouTube, etc.). Os dois podem coexistir; alinhe o produto antes de migrar login 100% para Supabase Auth.

### Avisos do Database Linter (esperados no free)

| Aviso | Ação |
|-------|------|
| `auth_leaked_password_protection` | Só no plano **Pro**. No free, ignore — política forte de senha no painel já ajuda. |
| `rls_auto_enable` SECURITY DEFINER via RPC | Migração `20260518120000_revoke_rls_auto_enable_rpc.sql` revoga `EXECUTE` de `anon`/`authenticated`. A função continua para triggers internos; não é API pública. |

## 5. Resend (e-mail)

1. Conta em [resend.com](https://resend.com).
2. Verificar domínio `gabrieltoth.com`.
3. `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` na Vercel.

Não configure SMTP — o código não envia via SMTP.

## 6. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → Credentials.
2. Redirect URIs: `https://www.gabrieltoth.com/api/auth/google/callback` (e variantes sem `www` se usar).
3. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## 7. Docker local (testes)

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis supabase
```

## 8. Testes antes do deploy

```bash
npm test
npm run build
```

## 9. Senhas

Somente **Argon2id**. Após reset do Supabase, crie conta nova — hashes bcrypt antigos não são aceitos.
