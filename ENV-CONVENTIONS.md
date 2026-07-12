# Env Var Conventions — gabrieltoth.com

## CRITICAL: Always use `vercel env add --value "..." --yes --no-sensitive`
**NUNCA use stdin pipe** (`echo "x" | vercel env add`) no Windows PowerShell — o Vercel CLI não lê corretamente.
Sempre use `--value "..."` explicitamente.

## Canonical Naming (from `src/lib/config/env.ts`)

### YouTube

| Var | Status |
|-----|--------|
| `YOUTUBE_CLIENT_ID` | Encrypted in Vercel |
| `YOUTUBE_CLIENT_SECRET` | Encrypted in Vercel |
| `YOUTUBE_REDIRECT_URI` | `https://www.gabrieltoth.com/api/oauth/callback/youtube` |

### Facebook/Meta

| Var | Status |
|-----|--------|
| `FACEBOOK_APP_ID` | = `META_APP_ID` (alias) = `"your-meta-app-id"` placeholder |
| `FACEBOOK_APP_SECRET` | = `META_APP_SECRET` (alias) = `"your-meta-app-secret"` placeholder |
| `FACEBOOK_REDIRECT_URI` | `https://www.gabrieltoth.com/api/oauth/callback/facebook` |
| `META_APP_ID` | Legacy name, same value as `FACEBOOK_APP_ID` |
| `META_APP_SECRET` | Legacy name, same value as `FACEBOOK_APP_SECRET` |

### Instagram

| Var | Status |
|-----|--------|
| `INSTAGRAM_APP_ID` | `1298289779064053` ✅ Real |
| `INSTAGRAM_APP_SECRET` | Placeholder — user needs real value |
| `INSTAGRAM_REDIRECT_URI` | `https://www.gabrieltoth.com/api/oauth/callback/instagram` |

### TikTok

| Var | Status |
|-----|--------|
| `TIKTOK_CLIENT_KEY` | Empty — needs real value |
| `TIKTOK_CLIENT_SECRET` | Empty — needs real value |
| `TIKTOK_REDIRECT_URI` | `https://www.gabrieltoth.com/api/oauth/callback/tiktok` |

### Twitch

| Var | Status |
|-----|--------|
| `TWITCH_CLIENT_ID` | Empty — needs real value |
| `TWITCH_CLIENT_SECRET` | Empty — needs real value |
| `TWITCH_REDIRECT_URI` | `https://www.gabrieltoth.com/api/oauth/callback/twitch` |

### Kick

| Var | Status |
|-----|--------|
| `KICK_CLIENT_ID` | `01KVPT4Y8XMT10QWWVDTNQZ5G7` ✅ Real |
| `KICK_CLIENT_SECRET` | Empty — needs real value |
| `KICK_REDIRECT_URI` | `https://www.gabrieltoth.com/api/oauth/callback/kick` ✅ |

### Twitter/X
**Nenhuma env var configurada.** Precisa criar Twitter Developer App.

### LinkedIn
**Nenhuma env var configurada.** Precisa criar LinkedIn Developer App.

## Naming Conflicts (ALL ALREADY FIXED)

| Component | Usava (ERRADO) | Corrigido para |
|-----------|----------------|----------------|
| `oauth-manager.ts` (Facebook) | `FACEBOOK_CLIENT_ID` | `FACEBOOK_APP_ID` |
| `oauth-manager.ts` (Facebook) | `FACEBOOK_CLIENT_SECRET` | `FACEBOOK_APP_SECRET` |
| `oauth-manager.ts` (Instagram) | `INSTAGRAM_CLIENT_ID` | `INSTAGRAM_APP_ID` |
| `oauth-manager.ts` (Instagram) | `INSTAGRAM_CLIENT_SECRET` | `INSTAGRAM_APP_SECRET` |

Todos os outros componentes (`facebook/config.ts`, `instagram/config.ts`, `tiktok/config.ts`, `env.ts`) já usavam os nomes corretos.

## Rotas que cada plataforma usa

| Plataforma | Rota | Arquivo |
|-----------|------|---------|
| YouTube | Genérica `[platform]` | `oauth-manager.ts` |
| Twitter | Genérica `[platform]` | `oauth-manager.ts` |
| LinkedIn | Genérica `[platform]` | `oauth-manager.ts` |
| Facebook | **Específica** | `facebook/route.ts` |
| Instagram | **Específica** | `instagram/route.ts` |
| TikTok | **Específica** | `tiktok/route.ts` |
| Twitch | **Específica** | `twitch/route.ts` |
| Kick | **Específica** | `kick/route.ts` |

No Next.js App Router, rotas específicas têm precedência sobre rotas dinâmicas `[platform]`.

## YouTube Scopes Atuais (v2)

Definidos em `src/lib/oauth/oauth-manager.ts` e registrados no Google Cloud Console:

| Escopo | Versão | Funcionalidades |
|--------|--------|----------------|
| `.../auth/youtube.upload` | v1 | Postar vídeos |
| `.../auth/youtube` | v1 | Gerenciar conta, ler comentários, chat ao vivo, moderar |
| `.../auth/userinfo.email` | v1 | Ver email |
| `.../auth/userinfo.profile` | v1 | Ver info pessoal |
| `.../auth/yt-analytics.readonly` | **v2** | Dados analíticos do canal |
| `.../auth/yt-analytics-monetary.readonly` | **v2** | Dados monetários, membros, afiliados |

Usuários conectados antes da v2 precisam **desconectar e reconectar** o YouTube. O sistema detecta automaticamente via `scopeVersion` e mostra um aviso "Reconnect needed" na UI.

## Scope Version Tracking

Arquivo: `src/lib/oauth/scope-versions.ts`

| Plataforma | Versão Atual |
|-----------|-------------|
| youtube | 2 (analytics add) |
| facebook | 1 |
| instagram | 1 |
| tiktok | 1 |
| twitch | 1 |
| kick | 1 |
| twitter | 1 |
| linkedin | 1 |

Quando um canal é conectado, o callback salva `metadata.scopeVersion` na tabela `social_networks`. O endpoint `/api/user/channels` compara com a versão atual e retorna `needsReconnect: true` se desatualizado.

## Lições Aprendidas (NÃO REPETIR)

1. **Sempre verificar nomes de env vars em 3 lugares**: código (oauth-manager), config files (facebook/config.ts), e Vercel (env ls)
2. **Usar `--value "..."` sempre** no Windows — stdin pipe não funciona com Vercel CLI
3. **Esperar propagação** (~10-15s) antes de verificar com `vercel env pull`
4. **Salvar env pull em arquivo** para ver valores reais (não confiar só no `env ls` que mostra "Encrypted")
