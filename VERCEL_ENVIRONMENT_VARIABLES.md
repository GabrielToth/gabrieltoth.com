# 🔐 Guia Completo de Variáveis de Ambiente - Vercel

## 📋 Índice
1. [Entendendo os Ambientes](#entendendo-os-ambientes)
2. [Entendendo NEXT_PUBLIC_](#entendendo-next_public_)
3. [Todas as Variáveis](#todas-as-variáveis)
4. [Análise Detalhada](#análise-detalhada)
5. [Variáveis Críticas](#variáveis-críticas)
6. [To-Do Futuro](#to-do-futuro)
7. [Checklist de Configuração](#checklist-de-configuração)

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

### Legenda:
- ✅ **Implementada**: Usada no código e funcionando
- 🔄 **To-Do**: Planejada para implementação futura
- 🐳 **Docker/CI**: Usada apenas em Docker/GitHub Actions (não precisa na Vercel)
- 📝 **Documentação**: Existe em specs/docs mas não implementada ainda
- ❌ **Remover**: Não será usada, pode excluir
- ⚠️ **Revisar**: Precisa verificar se está funcionando

| # | Variável | Status | Exposta? | Vercel? | Usado em | Notas |
|---|----------|--------|----------|---------|----------|-------|
| 1 | `APP_URL` | 📝 | ❌ Não | ❌ Não | `.kiro/specs/video-upload-multi-platform/design.md` | Será usado para OAuth redirects futuros |
| 2 | `AWS_ACCESS_KEY_ID` | 🐳 | ❌ Não | ❌ Não | `.github/workflows/deploy-aws.yml`, `scripts/aws-setup.sh` | Apenas para CI/CD, não Vercel |
| 3 | `AWS_PROFILE` | 🐳 | ❌ Não | ❌ Não | Configuração local AWS CLI | Apenas para desenvolvimento local |
| 4 | `AWS_REGION` | 🐳 | ❌ Não | ❌ Não | `.github/workflows/deploy-aws.yml` | Apenas para CI/CD, não Vercel |
| 5 | `AWS_SECRET_ACCESS_KEY` | 🐳 | ❌ Não | ❌ Não | `.github/workflows/deploy-aws.yml`, `scripts/aws-setup.sh` | Apenas para CI/CD, não Vercel |
| 6 | `BASE_URL` | 🐳 | ❌ Não | ❌ Não | `docker/docker-compose.yml` | Apenas para Docker, não Vercel |
| 7 | `CDP_ENDPOINT` | ❌ | ❌ Não | ❌ Não | Nenhum | **EXCLUÍDO** - Sem referências |
| 8 | `DATABASE_URL` | 🐳 | ❌ Não | ⚠️ Talvez | `src/lib/db/index.ts`, `docker-compose.yml` | Vercel tem Postgres integrado, verificar se precisa |
| 9 | `DEBUG` | ✅ | ❌ Não | ⚠️ Opcional | `src/lib/logger/pino-logger.ts`, `src/lib/config/env.ts` | Apenas para debug, não obrigatório em prod |
| 10 | `DISCORD_BOT_TOKEN` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login com Discord |
| 11 | `DISCORD_CLIENT_ID` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login com Discord |
| 12 | `DISCORD_CLIENT_SECRET` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login com Discord |
| 13 | `DISCORD_GUILD_ID` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Integração Discord |
| 14 | `DISCORD_REDIRECT_URI` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login com Discord |
| 15 | `DISCORD_WEBHOOK_URL` | ✅ | ❌ Não | ✅ Sim | `src/lib/discord.ts`, `src/lib/logger/index.ts` | **ATIVO**: Notificações de registro/login |
| 16 | `ENCRYPTION_KEY` | 📝 | ❌ Não | ⚠️ Futuro | Nenhum | Pode ser necessário no futuro |
| 17 | `GITHUB_TOKEN` | ⚠️ | ❌ Não | ⚠️ Verificar | Nenhum | Verificar se MCP precisa |
| 18 | `GOOGLE_CLIENT_ID` | ❌ | ❌ Não | ✅ Sim | `src/lib/auth/google-auth.ts` | **CRÍTICO**: Faltando na Vercel |
| 19 | `GOOGLE_CLIENT_SECRET` | ✅ | ❌ Não | ✅ Sim | `src/lib/auth/google-auth.ts` | **ATIVO**: Google OAuth |
| 20 | `INSTAGRAM_APP_ID` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login + Post Instagram |
| 21 | `INSTAGRAM_APP_SECRET` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login + Post Instagram |
| 22 | `KICK_BROADCASTER_USER_ID` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Unificação de chats de lives |
| 23 | `KICK_CHATROOM_ID` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Unificação de chats de lives |
| 24 | `KICK_CLIENT_ID` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Unificação de chats de lives |
| 25 | `KICK_CLIENT_SECRET` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Unificação de chats de lives |
| 26 | `KICK_REDIRECT_URI` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Unificação de chats de lives |
| 27 | `MERCADOPAGO_ACCESS_TOKEN` | ❌ | ❌ Não | ❌ Não | Nenhum | **REMOVER**: Usando Stripe |
| 28 | `MERCADOPAGO_CLIENT_ID` | ❌ | ❌ Não | ❌ Não | Nenhum | **REMOVER**: Usando Stripe |
| 29 | `MERCADOPAGO_CLIENT_SECRET` | ❌ | ❌ Não | ❌ Não | Nenhum | **REMOVER**: Usando Stripe |
| 30 | `MERCADOPAGO_PUBLIC_KEY` | ❌ | ❌ Não | ❌ Não | Nenhum | **REMOVER**: Usando Stripe |
| 31 | `META_APP_ID` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login Facebook + Post |
| 32 | `META_APP_SECRET` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login Facebook + Post |
| 33 | `MONERO_ADDRESS` | 🔄 | ❌ Não | ✅ Sim | `src/lib/monero.ts` | **To-Do**: Sistema de verificação de pagamento |
| 34 | `MONERO_VIEW_KEY` | 🔄 | ❌ Não | ✅ Sim | `src/lib/monero.ts` | **To-Do**: Sistema de verificação de pagamento |
| 35 | `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` | ✅ | ✅ Sim | ✅ Sim | `src/app/[locale]/amazon-affiliate/page.tsx` | **ATIVO**: Links de afiliado |
| 36 | `NEXT_PUBLIC_DEBUG` | ✅ | ✅ Sim | ⚠️ Opcional | `src/lib/logger/index.ts`, `src/app/[locale]/iq-test/step/[step]/page.tsx` | Apenas para debug |
| 37 | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | ✅ Sim | ✅ Sim | `src/components/auth/google-login-button.tsx` | **ATIVO**: Google OAuth |
| 38 | `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` | ✅ | ✅ Sim | ✅ Sim | `src/components/auth/google-login-button.tsx`, `src/app/api/auth/google/callback/route.ts` | **ATIVO**: Google OAuth |
| 39 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ | ✅ Sim | ❌ Não | Nenhum | **REMOVER**: Duplicada (usar PUBLISHABLE_KEY) |
| 40 | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | ✅ Sim | ✅ Sim | `src/lib/supabase/client.ts`, `src/lib/server.ts`, `src/lib/middleware.ts` | **ATIVO**: Supabase |
| 41 | `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ Sim | ✅ Sim | `src/lib/supabase/client.ts`, `src/lib/server.ts`, `src/lib/middleware.ts` | **ATIVO**: Supabase |
| 42 | `NODE_ENV` | ✅ | ❌ Não | ❌ Não | Vários | Vercel define automaticamente |
| 43 | `PIX_KEY` | ❌ | ❌ Não | ❌ Não | `src/lib/pix.ts` | **To-Do**: Remover PIX do projeto |
| 44 | `PIX_MERCHANT_CITY` | ❌ | ❌ Não | ❌ Não | `src/lib/pix.ts` | **To-Do**: Remover PIX do projeto |
| 45 | `PIX_MERCHANT_NAME` | ❌ | ❌ Não | ❌ Não | `src/lib/pix.ts` | **To-Do**: Remover PIX do projeto |
| 46 | `POSTGRES_DB` | 🐳 | ❌ Não | ❌ Não | `docker/docker-compose.yml`, `src/lib/config/env.ts` | Apenas para Docker |
| 47 | `POSTGRES_PASSWORD` | 🐳 | ❌ Não | ❌ Não | `docker/docker-compose.yml`, `src/lib/config/env.ts` | Apenas para Docker |
| 48 | `POSTGRES_USER` | 🐳 | ❌ Não | ❌ Não | `docker/docker-compose.yml`, `src/lib/config/env.ts` | Apenas para Docker |
| 49 | `POSTMAN_API_KEY` | ⚠️ | ❌ Não | ⚠️ Verificar | Nenhum | Verificar se MCP precisa |
| 50 | `REDIS_URL` | 🔄 | ❌ Não | ❌ Não | `src/lib/config/env.ts`, `docker-compose.yml` | **To-Do**: Cache (quando necessário) |
| 51 | `SEND_DISCORD_IN_TESTS` | ✅ | ❌ Não | ✅ Sim | Testes | **ATIVO**: Notificações de teste |
| 52 | `SESSION_SECRET` | 📝 | ❌ Não | ⚠️ Futuro | Nenhum | Pode ser necessário no futuro |
| 53 | `STRIPE_PUBLIC_KEY` | ⚠️ | ❌ Não | ❌ Não | Nenhum | **ERRO**: Deveria ser NEXT_PUBLIC_ |
| 54 | `STRIPE_SECRET_KEY` | ✅ | ❌ Não | ✅ Sim | `src/lib/stripe/index.ts` | **ATIVO**: Pagamentos |
| 55 | `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ | ❌ Não | ⚠️ Verificar | `src/__tests__/database-constraints.test.ts` | Apenas em testes, verificar se precisa em prod |
| 56 | `TIKTOK_CLIENT_KEY` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login + Post TikTok |
| 57 | `TIKTOK_CLIENT_SECRET` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Login + Post TikTok |
| 58 | `TWITCH_CLIENT_ID` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Unificação de chats de lives |
| 59 | `TWITCH_CLIENT_SECRET` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Unificação de chats de lives |
| 60 | `TWITCH_REDIRECT_URI` | 🔄 | ❌ Não | ❌ Não | Nenhum | **To-Do**: Unificação de chats de lives |
| 61 | `WHATSAPP_ACCESS_TOKEN` | ⚠️ | ❌ Não | ✅ Sim | `src/app/api/whatsapp/webhook/route.ts` | **REVISAR**: Não está funcionando |
| 62 | `WHATSAPP_PHONE_NUMBER_ID` | ⚠️ | ❌ Não | ✅ Sim | `src/app/api/whatsapp/webhook/route.ts` | **REVISAR**: Não está funcionando |
| 63 | `WHATSAPP_VERIFY_TOKEN` | ⚠️ | ❌ Não | ✅ Sim | `src/app/api/whatsapp/webhook/route.ts` | **REVISAR**: Não está funcionando |

---

## 🔍 Análise Detalhada

### 🚨 CRÍTICO - Adicionar AGORA:

#### 1. `GOOGLE_CLIENT_ID` (Server-Side)
```
Nome: GOOGLE_CLIENT_ID
Valor: 1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com
Ambientes: ✅ Production, ✅ Preview
Sensitive: ✅ Sim
```
**Por que**: O servidor precisa validar tokens do Google OAuth. Sem isso, o login com Google não funciona.

---

### ✅ ATIVAS - Manter na Vercel:

| Variável | Motivo | Sensitive? |
|----------|--------|------------|
| `DISCORD_WEBHOOK_URL` | Notificações de registro/login funcionando | ✅ Sim |
| `GOOGLE_CLIENT_SECRET` | Google OAuth funcionando | ✅ Sim |
| `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` | Links de afiliado funcionando | ❌ Não |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Botão de login Google funcionando | ❌ Não |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` | Google OAuth funcionando | ❌ Não |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase funcionando | ❌ Não |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase funcionando | ❌ Não |
| `STRIPE_SECRET_KEY` | Pagamentos funcionando | ✅ Sim |
| `SEND_DISCORD_IN_TESTS` | Notificações de teste ativas | ❌ Não |

---

### ❌ REMOVER da Vercel:

#### Duplicadas:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

#### MercadoPago (usando Stripe):
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_CLIENT_ID`
- `MERCADOPAGO_CLIENT_SECRET`
- `MERCADOPAGO_PUBLIC_KEY`

#### PIX (será removido do projeto):
- `PIX_KEY`
- `PIX_MERCHANT_CITY`
- `PIX_MERCHANT_NAME`

#### Docker/CI apenas (não precisa na Vercel):
- `AWS_ACCESS_KEY_ID` → Apenas GitHub Actions
- `AWS_PROFILE` → Apenas desenvolvimento local
- `AWS_REGION` → Apenas GitHub Actions
- `AWS_SECRET_ACCESS_KEY` → Apenas GitHub Actions
- `BASE_URL` → Apenas Docker
- `POSTGRES_DB` → Apenas Docker
- `POSTGRES_PASSWORD` → Apenas Docker
- `POSTGRES_USER` → Apenas Docker

#### Excluído do projeto:
- `CDP_ENDPOINT` → Sem referências no código

---

### ⚠️ REVISAR:

#### WhatsApp (não está funcionando):
```
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
```
**Problema**: Configuradas mas não recebe mensagens, não notifica, não adiciona em grupo.
**Ação**: Criar spec para investigar e corrigir integração WhatsApp.

#### DATABASE_URL:
**Situação**: Usada no código mas Vercel tem Postgres integrado.
**Ação**: Verificar se Vercel fornece automaticamente ou se precisa configurar.

#### SUPABASE_SERVICE_ROLE_KEY:
**Situação**: Apenas usada em testes, não em produção.
**Ação**: Verificar se precisa em produção ou apenas em desenvolvimento.

#### DEBUG e NEXT_PUBLIC_DEBUG:
**Situação**: Apenas para debug, não obrigatório em produção.
**Ação**: Manter desativado em produção (false ou não definir).

#### REDIS_URL:
**Situação**: Configurada mas Redis não está implementado ainda.
**Ação**: Remover até implementar cache (to-do futuro).

#### GITHUB_TOKEN e POSTMAN_API_KEY:
**Situação**: Não usadas no código, podem ser para MCP.
**Ação**: Verificar se algum MCP precisa dessas variáveis.

#### STRIPE_PUBLIC_KEY:
**Situação**: Nome errado, deveria ser `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`.
**Ação**: Renomear na Vercel e atualizar código se necessário.

#### ENCRYPTION_KEY e SESSION_SECRET:
**Situação**: Não usadas agora, mas podem ser necessárias no futuro.
**Ação**: Manter por enquanto, podem ser úteis para features futuras.

---

### 🔄 TO-DO FUTURO (não adicionar agora):

#### Login com Discord:
```
DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_GUILD_ID
DISCORD_REDIRECT_URI
```
**Quando implementar**: Criar spec "Login com Discord"

#### Login + Post Instagram:
```
INSTAGRAM_APP_ID
INSTAGRAM_APP_SECRET
```
**Quando implementar**: Parte da spec "video-upload-multi-platform"

#### Login Facebook + Post:
```
META_APP_ID
META_APP_SECRET
```
**Quando implementar**: Parte da spec "video-upload-multi-platform"

#### Login + Post TikTok:
```
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
```
**Quando implementar**: Parte da spec "video-upload-multi-platform"

#### Unificação de Chats de Lives (Kick + Twitch):
```
KICK_BROADCASTER_USER_ID
KICK_CHATROOM_ID
KICK_CLIENT_ID
KICK_CLIENT_SECRET
KICK_REDIRECT_URI
TWITCH_CLIENT_ID
TWITCH_CLIENT_SECRET
TWITCH_REDIRECT_URI
```
**Quando implementar**: Criar spec "Unificação de Chats de Streaming"
**Objetivo**: Unificar chats de Twitch, YouTube, Kick e Trovo para streamers e moderação.

#### Sistema de Pagamento Monero:
```
MONERO_ADDRESS
MONERO_VIEW_KEY
```
**Quando implementar**: Criar spec "Sistema de Verificação de Pagamento Monero"
**Objetivo**: Implementar verificação de hash e pagamento efetuado.

#### OAuth Redirects (Multi-plataforma):
```
APP_URL
```
**Quando implementar**: Parte da spec "video-upload-multi-platform"
**Uso**: Construir URLs de redirect para OAuth de múltiplas plataformas.

---

## 🚨 Variáveis Críticas (AGORA)

### Adicionar na Vercel IMEDIATAMENTE:

1. **`GOOGLE_CLIENT_ID`**
   ```
   Valor: 1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com
   Ambientes: Production + Preview
   Sensitive: ✅ Sim
   ```

### Remover da Vercel IMEDIATAMENTE:

1. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (duplicada)
2. **`MERCADOPAGO_*`** (4 variáveis - usando Stripe)
3. **`PIX_*`** (3 variáveis - será removido)
4. **`CDP_ENDPOINT`** (excluída do projeto)
5. **`AWS_*`** (5 variáveis - apenas CI/CD)
6. **`BASE_URL`** (apenas Docker)
7. **`POSTGRES_*`** (3 variáveis - apenas Docker)
8. **`REDIS_URL`** (não implementado ainda)

---

## � To-Do Futuro (Specs a Criar)

### 1. **Spec: Investigar e Corrigir WhatsApp**
**Problema**: WhatsApp configurado mas não funciona.
**Variáveis**: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
**Objetivo**: Fazer WhatsApp notificar, adicionar em grupo, enviar mensagens.

### 2. **Spec: Login com Discord**
**Variáveis**: `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_GUILD_ID`, `DISCORD_REDIRECT_URI`
**Objetivo**: Permitir login com Discord.

### 3. **Spec: Video Upload Multi-Platform** (já existe)
**Variáveis**: `APP_URL`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
**Objetivo**: Login e post em Instagram, Facebook, TikTok.
**Status**: Spec já existe em `.kiro/specs/video-upload-multi-platform/`

### 4. **Spec: Unificação de Chats de Streaming**
**Variáveis**: `KICK_*` (5 variáveis), `TWITCH_*` (3 variáveis)
**Objetivo**: Unificar chats de Twitch, YouTube, Kick e Trovo para streamers.
**Benefício**: Moderação centralizada, evitar evasão de banimentos.

### 5. **Spec: Sistema de Pagamento Monero**
**Variáveis**: `MONERO_ADDRESS`, `MONERO_VIEW_KEY`
**Objetivo**: Implementar verificação de hash e pagamento efetuado.

### 6. **Spec: Remover PIX do Projeto**
**Variáveis**: `PIX_KEY`, `PIX_MERCHANT_CITY`, `PIX_MERCHANT_NAME`
**Objetivo**: Remover completamente código e variáveis relacionadas a PIX.

### 7. **Spec: Implementar Cache com Redis** (futuro distante)
**Variáveis**: `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
**Objetivo**: Adicionar camada de cache quando necessário.

---

## ✅ Checklist de Configuração

### 🚨 AÇÕES IMEDIATAS (Críticas):

- [ ] **Adicionar `GOOGLE_CLIENT_ID`** na Vercel
  - Valor: `1023018705537-055ktg86ht5oeuja585etp3bu10699n9.apps.googleusercontent.com`
  - Ambientes: Production + Preview
  - Sensitive: ✅ Sim
  - **Motivo**: Google OAuth não funciona sem isso

### 🧹 LIMPEZA (Remover da Vercel):

- [ ] **Remover `NEXT_PUBLIC_SUPABASE_ANON_KEY`** (duplicada)
- [ ] **Remover `MERCADOPAGO_ACCESS_TOKEN`**
- [ ] **Remover `MERCADOPAGO_CLIENT_ID`**
- [ ] **Remover `MERCADOPAGO_CLIENT_SECRET`**
- [ ] **Remover `MERCADOPAGO_PUBLIC_KEY`**
- [ ] **Remover `PIX_KEY`**
- [ ] **Remover `PIX_MERCHANT_CITY`**
- [ ] **Remover `PIX_MERCHANT_NAME`**
- [ ] **Remover `CDP_ENDPOINT`**
- [ ] **Remover `AWS_ACCESS_KEY_ID`** (apenas CI/CD)
- [ ] **Remover `AWS_PROFILE`** (apenas local)
- [ ] **Remover `AWS_REGION`** (apenas CI/CD)
- [ ] **Remover `AWS_SECRET_ACCESS_KEY`** (apenas CI/CD)
- [ ] **Remover `BASE_URL`** (apenas Docker)
- [ ] **Remover `POSTGRES_DB`** (apenas Docker)
- [ ] **Remover `POSTGRES_PASSWORD`** (apenas Docker)
- [ ] **Remover `POSTGRES_USER`** (apenas Docker)
- [ ] **Remover `REDIS_URL`** (não implementado)

### ⚠️ REVISAR:

- [ ] **Verificar `DATABASE_URL`**: Vercel fornece automaticamente?
- [ ] **Verificar `SUPABASE_SERVICE_ROLE_KEY`**: Precisa em produção?
- [ ] **Verificar `GITHUB_TOKEN`**: Algum MCP precisa?
- [ ] **Verificar `POSTMAN_API_KEY`**: Algum MCP precisa?
- [ ] **Desativar `DEBUG`** em produção (false ou não definir)
- [ ] **Desativar `NEXT_PUBLIC_DEBUG`** em produção (false ou não definir)
- [ ] **Investigar WhatsApp**: Por que não está funcionando?
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_VERIFY_TOKEN`

### 📝 TO-DO (Criar Specs):

- [ ] **Spec: Investigar e Corrigir WhatsApp**
- [ ] **Spec: Login com Discord**
- [ ] **Spec: Unificação de Chats de Streaming** (Kick + Twitch + YouTube + Trovo)
- [ ] **Spec: Sistema de Pagamento Monero**
- [ ] **Spec: Remover PIX do Projeto**
- [ ] **Spec: Implementar Cache com Redis** (futuro distante)

### ✅ MANTER (Funcionando):

- [x] `DISCORD_WEBHOOK_URL` - Notificações ativas
- [x] `GOOGLE_CLIENT_SECRET` - Google OAuth funcionando
- [x] `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` - Links de afiliado
- [x] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Botão de login Google
- [x] `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` - Google OAuth
- [x] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Supabase
- [x] `STRIPE_SECRET_KEY` - Pagamentos
- [x] `SEND_DISCORD_IN_TESTS` - Notificações de teste

### 🔄 FUTURO (Não adicionar agora):

**Quando implementar "video-upload-multi-platform":**
- `APP_URL`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `META_APP_ID`
- `META_APP_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

**Quando implementar "Login com Discord":**
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_GUILD_ID`
- `DISCORD_REDIRECT_URI`

**Quando implementar "Unificação de Chats":**
- `KICK_BROADCASTER_USER_ID`
- `KICK_CHATROOM_ID`
- `KICK_CLIENT_ID`
- `KICK_CLIENT_SECRET`
- `KICK_REDIRECT_URI`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TWITCH_REDIRECT_URI`

**Quando implementar "Pagamento Monero":**
- `MONERO_ADDRESS`
- `MONERO_VIEW_KEY`

---

## 🎯 Resumo de Ambientes

### Para variáveis ATIVAS:
```
✅ Production
✅ Preview
❌ Development (usa .env.local)
```

### Exceções:
- `NODE_ENV`: Vercel define automaticamente
- Variáveis Docker/CI: Não configurar na Vercel
- Variáveis To-Do: Adicionar apenas quando implementar

---

## 🔒 Segurança

### ✅ Variáveis que DEVEM ser "Sensitive":
- Todas com `SECRET`, `KEY`, `TOKEN`, `PASSWORD`
- `GOOGLE_CLIENT_ID` (server-side)
- `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `DISCORD_WEBHOOK_URL`
- `DATABASE_URL`
- Todas as credenciais de OAuth futuras

### ❌ Variáveis que NÃO precisam ser "Sensitive":
- Todas as `NEXT_PUBLIC_*` (públicas por natureza)
- `NODE_ENV`
- `DEBUG`
- URLs públicas

---

## 📞 Suporte

Documentos relacionados:
1. `VERCEL_ENVIRONMENT_VARIABLES.md` (este documento)
2. `GOOGLE_OAUTH_ENV_VARS.md` (detalhes do Google OAuth)
3. `.env.production` (valores locais)
4. `.kiro/specs/video-upload-multi-platform/` (spec de multi-plataforma)

---

**Última atualização**: 20 de Abril de 2026
