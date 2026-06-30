# Plano: Implementar Conexões de Redes Sociais no Dashboard

## Diagnóstico

### O que existe (backend)
- Rotas OAuth per-platform para: **Instagram, Facebook, TikTok, Kick** (authorize + callback + disconnect)
- Rotas OAuth genéricas `[platform]` para: **youtube, twitter, linkedin**
- `OAuthManager` com config por env vars
- `state-signer` HMAC (sem Redis)
- `TokenStore` com criptografia AES-256-GCM
- `NetworkManager` gerencia tabela `social_networks`

### O que está quebrado

| # | Problema | Impacto |
|---|----------|---------|
| 1 | `x-user-id` header nunca enviado pelo frontend | Nenhuma rota OAuth funciona (exigem esse header e nenhuma middleware o define) |
| 2 | `SettingsContainer` usa mock data hardcoded | Settings mostra dados falsos |
| 3 | `handleConnectChannel()` hardcoded pra facebook | Parâmetro `platform` ignorado |
| 4 | Dashboard page só trata `?youtube` | Callbacks de outras plataformas ignorados |
| 5 | Tabela `social_networks` não existe no schema.sql | Callbacks que fazem upsert falham |
| 6 | Sidebar usa emoji icons (▶️, 📷, 𝕏) | Inconsistência visual |
| 7 | Sem strings i18n para facebook, instagram, tiktok, kick, twitter, linkedin | Labels genéricas |

---

## Fase 1: Schema do Banco

**Arquivo:** `supabase/schema.sql`

Adicionar tabela `social_networks` após `oauth_tokens` (como #12, renumerando as seguintes):

```sql
CREATE TABLE IF NOT EXISTS public.social_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'disconnected', 'expired')),
  linked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform),
  UNIQUE(user_id, platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_networks_user_id ON public.social_networks(user_id);
CREATE INDEX IF NOT EXISTS idx_social_networks_platform ON public.social_networks(platform);
CREATE INDEX IF NOT EXISTS idx_social_networks_status ON public.social_networks(status);

ALTER TABLE public.social_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own social networks"
  ON public.social_networks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Também adicionar no `cleanup_all_users()`: `DELETE FROM public.social_networks;`

---

## Fase 2: Autenticação nas API Routes

### 2a. Criar helper `getCurrentUserId`

**Arquivo:** `src/lib/auth/get-current-user.ts`

```typescript
import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

const BCRYPT_HASH_REGEX = /^\$2[aby]\$/

function hashToken(token: string): string {
  // Usa SHA-256 pra hashear o session token (mesmo esquema do login route)
  const crypto = require("crypto")
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Tenta ler o cookie "session"
  const sessionCookie = request.cookies.get("session")?.value
  if (!sessionCookie) return null

  // Valida contra a tabela sessions
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  // O session token é armazenado como hash
  const tokenHash = hashToken(sessionCookie)

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .single()

  if (!session) return null
  if (new Date(session.expires_at) < new Date()) return null

  return session.user_id
}
```

### 2b. Atualizar rotas OAuth

Em TODAS as rotas OAuth (authorize, callback, disconnect, status), substituir:

```typescript
const userId = request.headers.get("x-user-id")
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

Por:

```typescript
const userId = await getCurrentUserId(request)
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

**Arquivos a modificar (12-16 arquivos):**

**Authorize:**
- `src/app/api/oauth/authorize/[platform]/route.ts`
- `src/app/api/oauth/authorize/instagram/route.ts`
- `src/app/api/oauth/authorize/facebook/route.ts`
- `src/app/api/oauth/authorize/tiktok/route.ts`
- `src/app/api/oauth/authorize/kick/route.ts`

**Callback:**
- `src/app/api/oauth/callback/[platform]/route.ts` (aqui o userId vem do state, não do header — verificar)
- `src/app/api/oauth/callback/instagram/route.ts` (userId vem do state signer)
- `src/app/api/oauth/callback/facebook/route.ts`
- `src/app/api/oauth/callback/tiktok/route.ts`
- `src/app/api/oauth/callback/kick/route.ts`

**Disconnect:**
- `src/app/api/oauth/disconnect/[platform]/route.ts`
- `src/app/api/oauth/disconnect/instagram/route.ts`
- `src/app/api/oauth/disconnect/facebook/route.ts`
- `src/app/api/oauth/disconnect/tiktok/route.ts`
- `src/app/api/oauth/disconnect/kick/route.ts`

**Status:**
- `src/app/api/oauth/status/route.ts`

**Nota:** As rotas de callback per-platform (instagram, facebook, tiktok, kick) usam `state-signer` HMAC que já contém o `userId` no payload — essas não precisam mudar o método de obter userId, apenas as que usam `x-user-id` header.

---

## Fase 3: Endpoint GET /api/user/channels

**Arquivo:** `src/app/api/user/channels/route.ts`

Endpoint que retorna os canais conectados do usuário real, lendo de `social_networks` + `oauth_tokens`.

```typescript
import { getCurrentUserId } from "@/lib/auth/get-current-user"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  // Busca redes conectadas + tokens para determinar status
  const [socialResult, tokensResult] = await Promise.all([
    supabase.from("social_networks").select("*").eq("user_id", userId),
    supabase.from("oauth_tokens").select("platform, expires_at").eq("user_id", userId),
  ])

  const socialNetworks = socialResult.data || []
  const tokens = tokensResult.data || []

  // Map de tokens por plataforma
  const tokenMap = new Map(tokens.map(t => [t.platform, t]))

  const channels = socialNetworks.map(sn => {
    const token = tokenMap.get(sn.platform)
    const isExpired = token?.expires_at ? new Date(token.expires_at) < new Date() : false

    return {
      id: sn.id,
      platform: sn.platform,
      accountId: sn.platform_user_id,
      accountName: sn.platform_username || sn.platform,
      isConnected: sn.status === "connected" && !isExpired,
      connectedAt: sn.linked_at,
    }
  })

  return NextResponse.json({ channels })
}
```

---

## Fase 4: Frontend — SettingsContainer

**Arquivo:** `src/components/settings/SettingsContainer.tsx`

### Mudanças:

1. **Substituir `handleFetchChannels()` mock por chamada real:**
   ```typescript
   const handleFetchChannels = useCallback(async () => {
     try {
       const response = await fetch("/api/user/channels")
       if (!response.ok) throw new Error("Failed to fetch channels")
       const data = await response.json()
       setChannels(data.channels)
     } catch (err) {
       console.error("Failed to fetch channels:", err)
       setChannels([])
     }
   }, [])
   ```

2. **Alterar `handleConnectChannel` para aceitar platform como parâmetro:**
   ```typescript
   const handleConnectChannel = async (platform: string) => {
     try {
       const response = await fetch(`/api/oauth/authorize/${platform}`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
       })
       if (!response.ok) {
         const data = await response.json()
         throw new Error(data.message || "Failed to start connection")
       }
       const data = await response.json()
       if (data.authorizationUrl) {
         window.location.href = data.authorizationUrl
       }
     } catch (err) {
       logger.error("Failed to connect channel", { error: err })
     }
   }
   ```

3. **Atualizar a prop `onConnect` do ChannelsSection:**
   ```tsx
   <ChannelsSection
     channels={channels}
     onDisconnect={handleDisconnectChannel}
     onConnect={handleConnectChannel}
   />
   ```

4. **ChannelsSection já usa `onConnect(platform)` corretamente** — mas a assinatura da prop `onConnect` precisa mudar de `() => void` para `(platform: string) => void`.

   **Em `ChannelsSection.tsx`:**
   ```typescript
   export interface ChannelsSectionProps {
     channels: SocialChannel[]
     onDisconnect: (channelId: string) => void
     onConnect: (platform: string) => void
   }
   ```

---

## Fase 5: Dashboard Page — Callback Handling

**Arquivo:** `src/app/[locale]/dashboard/page.tsx`

Adicionar tratamento para parâmetros de callback OAuth:

```typescript
function DashboardRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("dashboard.common")

  // OAuth callback params
  const oauthSuccess = searchParams.get("oauth_success")
  const oauthError = searchParams.get("oauth_error")
  const youtube = searchParams.get("youtube")
  const instagram = searchParams.get("instagram")
  const facebook = searchParams.get("facebook")
  const tiktok = searchParams.get("tiktok")
  const kick = searchParams.get("kick")

  useEffect(() => {
    let target = `/${locale}/dashboard/publish`

    // Handle platform-specific OAuth callbacks
    if (youtube) {
      target = `/${locale}/dashboard/publish?youtube=${encodeURIComponent(youtube)}`
    } else if (instagram || facebook || tiktok || kick) {
      // Redirect to settings to show connection status
      target = `/${locale}/dashboard/settings`
    } else if (oauthSuccess) {
      target = `/${locale}/dashboard/settings?connected=${encodeURIComponent(oauthSuccess)}`
    } else if (oauthError) {
      target = `/${locale}/dashboard/settings?error=${encodeURIComponent(oauthError)}`
    }

    router.push(target)
  }, [router, locale, youtube, instagram, facebook, tiktok, kick, oauthSuccess, oauthError])

  return <LoadingSpinner />
}
```

**Opcional:** Adicionar um toast/notificação no `SettingsContainer` ou `ChannelsSection` quando `?connected=instagram` ou `?error=...` estiver presente na URL.

---

## Fase 6: Sidebar — Ícones

**Arquivo:** `src/components/dashboard/Sidebar.tsx`

Substituir emojis por componentes `DynamicIcon`:

```typescript
import { DynamicIcon } from "@/components/ui/dynamic-icon"

const channels = [
  { id: "youtube", name: "YouTube", icon: "Youtube" },
  { id: "facebook", name: "Facebook", icon: "facebook" },
  { id: "instagram", name: "Instagram", icon: "instagram" },
  { id: "twitter", name: "Twitter/X", icon: "twitter" },
  { id: "tiktok", name: "TikTok", icon: "tiktok" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin" },
]
```

E no JSX:
```tsx
<DynamicIcon name={channel.icon as IconName} size={20} />
```

---

## Fase 7: i18n

**Arquivo:** `src/i18n/{en,pt-BR,es,de}/dashboard.json`

Adicionar strings para as plataformas (em cada locale):

```json
{
  "settings": {
    "channels": {
      "connect": "Connect",
      "connecting": "Connecting...",
      "disconnect": "Disconnect",
      "disconnecting": "Disconnecting...",
      "connected": "Connected",
      "notConnected": "Not Connected",
      "confirmDisconnect": "Disconnect",
      "cancel": "Cancel"
    }
  }
}
```

E no `ChannelsSection.tsx`, substituir `t("youtube.connect")` por `t("settings.channels.connect")` para as plataformas não-YouTube, e `t("youtube.connectedSince")` por `t("settings.channels.connectedSince")` ou similar.

---

## Fase 8: Testes

- Adicionar security tests para as rotas alteradas
- Atualizar testes existentes que usam `x-user-id` mock para usar o novo helper

---

## Resumo de Arquivos a Modificar/Criar

### Criar:
1. `src/lib/auth/get-current-user.ts`
2. `src/app/api/user/channels/route.ts`

### Modificar:
3. `supabase/schema.sql` — add social_networks table
4. `src/app/api/oauth/authorize/[platform]/route.ts`
5. `src/app/api/oauth/authorize/instagram/route.ts`
6. `src/app/api/oauth/authorize/facebook/route.ts`
7. `src/app/api/oauth/authorize/tiktok/route.ts`
8. `src/app/api/oauth/authorize/kick/route.ts`
9. `src/app/api/oauth/disconnect/[platform]/route.ts`
10. `src/app/api/oauth/disconnect/instagram/route.ts`
11. `src/app/api/oauth/disconnect/facebook/route.ts`
12. `src/app/api/oauth/disconnect/tiktok/route.ts`
13. `src/app/api/oauth/disconnect/kick/route.ts`
14. `src/app/api/oauth/status/route.ts`
15. `src/components/settings/SettingsContainer.tsx`
16. `src/components/settings/ChannelsSection.tsx`
17. `src/app/[locale]/dashboard/page.tsx`
18. `src/components/dashboard/Sidebar.tsx`
19. `src/i18n/{en,pt-BR,es,de}/dashboard.json`

---

## Ordem de Implementação

1. Schema (social_networks table)
2. Auth helper (getCurrentUserId)
3. Atualizar rotas OAuth (authorize, disconnect, status)
4. Criar endpoint /api/user/channels
5. SettingsContainer + ChannelsSection (mock → real)
6. Dashboard page (callback handling)
7. Sidebar (ícones)
8. i18n (strings)
9. Build + testes
