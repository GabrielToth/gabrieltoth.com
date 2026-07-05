# gabrieltoth.com — Summary

## Goal
Manter o site pessoal funcional, seguro e atualizado.

## Progress

### ✅ Fix: Autenticação via sessão em vez de x-user-id header (jul/2026)
**Problema CRÍTICO:** 30+ API routes usavam `request.headers.get("x-user-id")` para autenticar, mas nenhum middleware setava este header. Resultado: toda chamada a `/api/networks/status` retornava 401. O front-end silenciosamente capturava o erro e usava dados hardcoded (`exampleNetworks`) mostrando Facebook/Instagram como "connected", Twitter como "expired", LinkedIn como "disconnected" — mesmo sem o usuário jamais ter conectado nada.

**Solução:**
- Todas as 30+ API routes agora usam `getServerSession(request)` que valida o cookie `auth_session` contra o banco de dados
- `getSessionFromCookie()` corrigido para ler `"auth_session"` em vez de `"session"` (cookie name mismatch)
- Traduções `xOfYSelected` corrigidas (usava `{networks}` mas componente passa `{total}`)
- Testes de segurança atualizados para mockar `getServerSession`

**Commits:**
- `8fc31ab` — fix: replace x-user-id header auth with getServerSession for all API routes

### ✅ Fix: Login redirect para usuários autenticados (jul/2026)
**Problema:** Usuários com sessão ativa que clicavam "Entrar" no header iam para `/signin` e viam o formulário de login, mesmo já estando logados (o dashboard funcionava direto).

**Solução:** As páginas `/login` e `/signin` (server components) agora leem os cookies `auth_session` e `remember_me_token` via `next/headers cookies()` e redirecionam para `/dashboard` se o usuário já tiver sessão ativa.

**Commits:**
- `23368bb` — fix: redirect authenticated users from login page to dashboard

### ✅ Fix: CSRF com tokens stateless HMAC (jul/2026)
**Problema:** O logout falhava silenciosamente em produção porque o token CSRF era armazenado em um `Map` em memória — efêmero entre instâncias/serverless functions.

**Solução:** Migrado para tokens stateless HMAC-signed: o token é um HMAC-SHA256 do `sessionId` + timestamp + nonce, verificado sem estado compartilhado. O interceptor Axios agora usa `withCredentials: true` e `xsrfCookieName: 'csrf-token'` + `xsrfHeaderName: 'X-CSRF-Token'`.

**Commits:**
- `8124d2c` — fix: migrate CSRF protection to stateless HMAC-signed tokens

### ✅ Deploy inicial (jun/2026)
- Site no ar via Cloudflare Pages + Supabase
- Autenticação funcionando (Supabase Auth + cookies server-side)
- Testes: 226 passing

## Relevant Files
- `src/app/[locale]/login/page.tsx` — login page (server comp, agora com cookie check)
- `src/app/[locale]/signin/page.tsx` — signin page (server comp, agora com cookie check)
- `src/lib/csrf.ts` — CSRF stateless HMAC
- `src/middleware.ts` — CSRF token refresh + cookie set
- `src/lib/db/schema/auth.sql` — auth schema
- `src/lib/auth/session.ts` — session management (inclui getSessionFromCookie fix)
- `src/lib/auth/get-server-session.ts` — server session helper
- `src/app/[locale]/dashboard/page.tsx` — dashboard
- `src/components/header.tsx` — header com "Entrar" button
- `src/components/publish/NetworkSelector.tsx` — network selector (translation fix)
- `src/components/publish/PostingInterface.tsx` — posting UI (fallback exampleNetworks bug)

## Testing
```bash
npm test            # 6697/6705 tests (8 pre-existing failures unrelated)
npm run test:e2e    # Playwright E2E
```

## Next Steps
Nenhum bug ativo. Próximos passos possíveis:
- Animações de loading/transição
- newsletter
- blog
- dashboard improvements
