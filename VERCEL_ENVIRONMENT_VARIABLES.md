# 🔐 Guia Completo de Variáveis de Ambiente - Vercel

## 📋 Índice
1. [Entendendo os Ambientes](#entendendo-os-ambientes)
2. [Entendendo NEXT_PUBLIC_](#entendendo-next_public_)
3. [Todas as Variáveis](#todas-as-variáveis)
4. [Análise do Código](#análise-do-código)
5. [Variáveis Faltando](#variáveis-faltando)
6. [Checklist de Configuração](#checklist-de-configuração)

---

## 🌍 Entendendo os Ambientes

A Vercel tem 3 ambientes diferentes:

### 1. **Development** (Local)
- Quando você roda `npm run dev` na sua máquina
- Usa `.env.local` e `.env.development`
- **NÃO precisa configurar na Vercel**

### 2. **Preview** (Branches)
- Quando você faz push de qualquer branch que não seja `main`
- Cada PR gera um deploy de preview
- URL: `https://seu-projeto-git-branch.vercel.app`
- **Configurar na Vercel**: Marque "Preview"

### 3. **Production** (Main Branch)
- Quando você faz push para `main` ou faz deploy manual
- URL: `https://www.gabrieltoth.com`
- **Configurar na Vercel**: Marque "Production"

### 🎯 Regra Geral:
- **Maioria das variáveis**: Marque "Production" E "Preview"
- **Variáveis de teste/debug**: Apenas "Development" (local)
- **Variáveis sensíveis de produção**: Apenas "Production"

---

## 🔓 Entendendo NEXT_PUBLIC_

### Variáveis SEM `NEXT_PUBLIC_`
```
GOOGLE_CLIENT_SECRET=abc123
```
- ✅ Disponível **apenas no servidor** (API routes, server components)
- ❌ **NUNCA** exposta ao navegador
- 🔒 Usada para **secrets e dados sensíveis**

### Variáveis COM `NEXT_PUBLIC_`
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=abc123
```
- ✅ Disponível **no servidor E no cliente** (navegador)
- ⚠️ **Exposta publicamente** no JavaScript do navegador
- 🌐 Usada para dados que o **frontend precisa acessar**

### ⚠️ NUNCA use `NEXT_PUBLIC_` para:
- Senhas
- API secrets
- Tokens de acesso
- Chaves privadas
- Qualquer dado sensível

---

## 📊 Todas as Variáveis

### ✅ = Implementada e usada no código
### ⚠️ = Configurada mas não usada
### ❌ = Faltando implementação

| # | Variável | Status | Exposta? | Ambientes | Usado em |
|---|----------|--------|----------|-----------|----------|
| 1 | `APP_URL` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 2 | `AWS_ACCESS_KEY_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 3 | `AWS_PROFILE` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 4 | `AWS_REGION` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 5 | `AWS_SECRET_ACCESS_KEY` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 6 | `BASE_URL` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 7 | `CDP_ENDPOINT` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 8 | `DATABASE_URL` | ✅ | ❌ Não | Prod + Preview | `src/lib/db/index.ts` |
| 9 | `DEBUG` | ✅ | ❌ Não | Prod + Preview | `src/lib/logger/pino-logger.ts`, `src/lib/config/env.ts` |
| 10 | `DISCORD_BOT_TOKEN` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 11 | `DISCORD_CLIENT_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 12 | `DISCORD_CLIENT_SECRET` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 13 | `DISCORD_GUILD_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 14 | `DISCORD_REDIRECT_URI` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 15 | `DISCORD_WEBHOOK_URL` | ✅ | ❌ Não | Prod + Preview | `src/lib/discord.ts`, `src/lib/logger/index.ts` |
| 16 | `ENCRYPTION_KEY` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 17 | `GITHUB_TOKEN` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 18 | `GOOGLE_CLIENT_ID` | ❌ | ❌ Não | Prod + Preview | `src/lib/auth/google-auth.ts` **FALTANDO NA VERCEL** |
| 19 | `GOOGLE_CLIENT_SECRET` | ✅ | ❌ Não | Prod + Preview | `src/lib/auth/google-auth.ts` |
| 20 | `INSTAGRAM_APP_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 21 | `INSTAGRAM_APP_SECRET` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 22 | `KICK_BROADCASTER_USER_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 23 | `KICK_CHATROOM_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 24 | `KICK_CLIENT_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 25 | `KICK_CLIENT_SECRET` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 26 | `KICK_REDIRECT_URI` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 27 | `MERCADOPAGO_ACCESS_TOKEN` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 28 | `MERCADOPAGO_CLIENT_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 29 | `MERCADOPAGO_CLIENT_SECRET` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 30 | `MERCADOPAGO_PUBLIC_KEY` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 31 | `META_APP_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 32 | `META_APP_SECRET` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 33 | `MONERO_ADDRESS` | ✅ | ❌ Não | Prod + Preview | `src/lib/monero.ts` |
| 34 | `MONERO_VIEW_KEY` | ✅ | ❌ Não | Prod + Preview | `src/lib/monero.ts` |
| 35 | `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` | ✅ | ✅ Sim | Prod + Preview | `src/app/[locale]/amazon-affiliate/page.tsx` |
| 36 | `NEXT_PUBLIC_DEBUG` | ✅ | ✅ Sim | Prod + Preview | `src/lib/logger/index.ts`, `src/app/[locale]/iq-test/step/[step]/page.tsx` |
| 37 | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | ✅ Sim | Prod + Preview | `src/components/auth/google-login-button.tsx` |
| 38 | `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` | ✅ | ✅ Sim | Prod + Preview | `src/components/auth/google-login-button.tsx`, `src/app/api/auth/google/callback/route.ts` |
| 39 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ | ✅ Sim | Prod + Preview | Não encontrado (talvez seja PUBLISHABLE_KEY) |
| 40 | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | ✅ Sim | Prod + Preview | `src/lib/supabase/client.ts`, `src/lib/server.ts`, `src/lib/middleware.ts` |
| 41 | `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ Sim | Prod + Preview | `src/lib/supabase/client.ts`, `src/lib/server.ts`, `src/lib/middleware.ts` |
| 42 | `NODE_ENV` | ✅ | ❌ Não | Auto | Usado em vários lugares (Vercel define automaticamente) |
| 43 | `PIX_KEY` | ✅ | ❌ Não | Prod + Preview | `src/lib/pix.ts` |
| 44 | `PIX_MERCHANT_CITY` | ✅ | ❌ Não | Prod + Preview | `src/lib/pix.ts` |
| 45 | `PIX_MERCHANT_NAME` | ✅ | ❌ Não | Prod + Preview | `src/lib/pix.ts` |
| 46 | `POSTGRES_DB` | ✅ | ❌ Não | Prod + Preview | `src/lib/config/env.ts` |
| 47 | `POSTGRES_PASSWORD` | ✅ | ❌ Não | Prod + Preview | `src/lib/config/env.ts` |
| 48 | `POSTGRES_USER` | ✅ | ❌ Não | Prod + Preview | `src/lib/config/env.ts` |
| 49 | `POSTMAN_API_KEY` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 50 | `REDIS_URL` | ✅ | ❌ Não | Prod + Preview | `src/lib/config/env.ts` |
| 51 | `SEND_DISCORD_IN_TESTS` | ⚠️ | ❌ Não | Dev only | Usado apenas em testes |
| 52 | `SESSION_SECRET` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 53 | `STRIPE_PUBLIC_KEY` | ⚠️ | ❌ Não | Prod + Preview | Deveria ser NEXT_PUBLIC_ |
| 54 | `STRIPE_SECRET_KEY` | ✅ | ❌ Não | Prod + Preview | `src/lib/stripe/index.ts` |
| 55 | `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ❌ Não | Prod + Preview | `src/__tests__/database-constraints.test.ts` |
| 56 | `TIKTOK_CLIENT_KEY` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 57 | `TIKTOK_CLIENT_SECRET` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 58 | `TWITCH_CLIENT_ID` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 59 | `TWITCH_CLIENT_SECRET` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 60 | `TWITCH_REDIRECT_URI` | ⚠️ | ❌ Não | Prod + Preview | Não encontrado no código |
| 61 | `WHATSAPP_ACCESS_TOKEN` | ✅ | ❌ Não | Prod + Preview | `src/app/api/whatsapp/webhook/route.ts` |
| 62 | `WHATSAPP_PHONE_NUMBER_ID` | ✅ | ❌ Não | Prod + Preview | `src/app/api/whatsapp/webhook/route.ts` |
| 63 | `WHATSAPP_VERIFY_TOKEN` | ✅ | ❌ Não | Prod + Preview | `src/app/api/whatsapp/webhook/route.ts` |

---

## 🔍 Análise do Código

### ❌ Variáveis FALTANDO na Vercel (mas usadas no código):

1. **`GOOGLE_CLIENT_ID`** (server-side)
   - **Usado em**: `src/lib/auth/google-auth.ts`
   - **Ação**: ADICIONAR na Vercel
   - **Valor**: `1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com`
   - **Ambientes**: Production + Preview
   - **Sensitive**: ✅ Sim

### ⚠️ Variáveis com NOME ERRADO:

2. **`STRIPE_PUBLIC_KEY`** deveria ser **`NEXT_PUBLIC_STRIPE_PUBLIC_KEY`**
   - **Motivo**: Chaves públicas do Stripe precisam estar disponíveis no cliente
   - **Ação**: Renomear na Vercel e atualizar código
   - **Ambientes**: Production + Preview
   - **Sensitive**: ❌ Não (é pública)

3. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** vs **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**
   - **Situação**: Você tem ambas configuradas, mas o código usa apenas `PUBLISHABLE_KEY`
   - **Ação**: Remover `ANON_KEY` da Vercel (duplicada)

### ⚠️ Variáveis NÃO USADAS (podem ser removidas):

4. Variáveis de OAuth não implementados:
   - `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_GUILD_ID`, `DISCORD_REDIRECT_URI`
   - `KICK_*` (todas)
   - `TWITCH_*` (todas)
   - `INSTAGRAM_*` (todas)
   - `META_*` (todas)
   - `MERCADOPAGO_*` (todas)
   - `TIKTOK_*` (todas)

5. Variáveis AWS não usadas:
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_PROFILE`

6. Outras não usadas:
   - `APP_URL` (use `BASE_URL` se precisar)
   - `CDP_ENDPOINT`
   - `ENCRYPTION_KEY`
   - `GITHUB_TOKEN`
   - `POSTMAN_API_KEY`
   - `SESSION_SECRET`

### ⚠️ Variáveis Opcionais (não implementadas mas configuradas):

7. **`RESEND_API_KEY`** e **`TURNSTILE_SECRET_KEY`**
   - **Usado em**: `src/app/api/contact/route.ts`
   - **Status**: Código tem fallback se não estiverem configuradas
   - **Ação**: Se quiser enviar emails de contato, adicione `RESEND_API_KEY`

8. **`UPSTASH_REDIS_REST_URL`** e **`UPSTASH_REDIS_REST_TOKEN`**
   - **Usado em**: `src/lib/rate-limit.ts`
   - **Status**: Código tem fallback se não estiverem configuradas
   - **Ação**: Se quiser rate limiting distribuído, adicione essas variáveis

---

## 🚨 Variáveis Faltando (CRÍTICAS)

### 1. `GOOGLE_CLIENT_ID` (Server-Side)
```
Nome: GOOGLE_CLIENT_ID
Valor: 1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com
Ambientes: ✅ Production, ✅ Preview
Sensitive: ✅ Sim
```

**Por que precisa**: O servidor usa para validar tokens do Google OAuth.

---

## 📝 Variáveis Opcionais (Recomendadas)

### 2. `RESEND_API_KEY` (para emails de contato)
```
Nome: RESEND_API_KEY
Valor: [Sua chave da Resend]
Ambientes: ✅ Production, ✅ Preview
Sensitive: ✅ Sim
```

### 3. `TURNSTILE_SECRET_KEY` (para proteção anti-bot)
```
Nome: TURNSTILE_SECRET_KEY
Valor: [Sua chave do Cloudflare Turnstile]
Ambientes: ✅ Production, ✅ Preview
Sensitive: ✅ Sim
```

### 4. `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (para rate limiting)
```
Nome: UPSTASH_REDIS_REST_URL
Valor: [URL do Upstash Redis]
Ambientes: ✅ Production, ✅ Preview
Sensitive: ❌ Não

Nome: UPSTASH_REDIS_REST_TOKEN
Valor: [Token do Upstash Redis]
Ambientes: ✅ Production, ✅ Preview
Sensitive: ✅ Sim
```

### 5. `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` (se for usar Stripe no frontend)
```
Nome: NEXT_PUBLIC_STRIPE_PUBLIC_KEY
Valor: pk_test_51TMrIeKjPOKAO0oXOwI3LmjLEyWFhkEohh5pzBe5KfGQmoCaJXqLgv17teKa6bj3eh9yan1RSudBK4JAE66NaUQ300RwhOMRF0
Ambientes: ✅ Production, ✅ Preview
Sensitive: ❌ Não (é pública)
```

---

## ✅ Checklist de Configuração

### Ações Imediatas (CRÍTICAS):

- [ ] **Adicionar `GOOGLE_CLIENT_ID`** na Vercel
  - Valor: `1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com`
  - Ambientes: Production + Preview
  - Sensitive: ✅ Sim

### Ações Recomendadas:

- [ ] **Remover `NEXT_PUBLIC_SUPABASE_ANON_KEY`** (duplicada)
- [ ] **Adicionar `RESEND_API_KEY`** (se quiser emails de contato)
- [ ] **Adicionar `TURNSTILE_SECRET_KEY`** (se quiser proteção anti-bot)
- [ ] **Adicionar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`** (se quiser rate limiting distribuído)

### Limpeza (Opcional):

- [ ] **Remover variáveis não usadas**:
  - Discord OAuth (BOT_TOKEN, CLIENT_ID, CLIENT_SECRET, GUILD_ID, REDIRECT_URI)
  - Kick OAuth (todas)
  - Twitch OAuth (todas)
  - Instagram (todas)
  - Meta (todas)
  - MercadoPago (todas)
  - TikTok (todas)
  - AWS (todas, se não estiver usando)
  - `APP_URL`, `CDP_ENDPOINT`, `ENCRYPTION_KEY`, `GITHUB_TOKEN`, `POSTMAN_API_KEY`, `SESSION_SECRET`

---

## 🎯 Resumo de Ambientes

### Para TODAS as variáveis de produção:
```
✅ Production
✅ Preview
❌ Development (não precisa, usa .env.local)
```

### Exceções:
- `NODE_ENV`: Vercel define automaticamente, não precisa configurar
- `SEND_DISCORD_IN_TESTS`: Apenas para testes locais, não configurar na Vercel

---

## 🔒 Segurança

### ✅ Variáveis que DEVEM ser "Sensitive":
- Todas as que contêm `SECRET`, `KEY`, `TOKEN`, `PASSWORD`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` (server-side)
- `STRIPE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `DISCORD_WEBHOOK_URL`
- `DATABASE_URL`
- `REDIS_URL`
- Todas as credenciais de OAuth

### ❌ Variáveis que NÃO precisam ser "Sensitive":
- Todas as `NEXT_PUBLIC_*` (são públicas por natureza)
- `NODE_ENV`
- `DEBUG`
- URLs públicas

---

## 📞 Suporte

Se tiver dúvidas sobre alguma variável específica, consulte:
1. Este documento
2. `GOOGLE_OAUTH_ENV_VARS.md` (para detalhes do Google OAuth)
3. `.env.production` (para ver os valores locais)

---

**Última atualização**: 20 de Abril de 2026
