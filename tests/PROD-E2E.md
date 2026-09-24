# Production E2E Test Suites (Real Chrome / Real Site)

Suítes de testes E2E que rodam contra **produção real** (`https://www.gabrieltoth.com`)
usando seu **Chrome real e visível** (não headless, não browser de automação).

## Como funciona

- Conecta via CDP (Chrome DevTools Protocol) na porta 9222
- Chrome usa perfil dedicado `C:\Users\User\.chrome-e2e-profile` (sessões persistem)
- **Sem flags de automação**: `navigator.webdriver` é `false`, o site não detecta modo teste
- Janela visível — você vê os testes navegando em tempo real

## Setup (uma vez por sessão de Chrome)

```powershell
# 1. Fechar Chrome e relançar com CDP (perfil dedicado)
taskkill /F /IM chrome.exe
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="C:\Users\User\.chrome-e2e-profile" `
  --no-first-run --no-default-browser-check

# 2. Login (só na primeira vez — a sessão auth_session persiste no perfil)
node tests/prod-e2e-auth.cjs --login
```

> ⚠️ Chrome 136+ **ignora** `--remote-debugging-port` no perfil default
> (mudança de segurança). Use sempre o `--user-data-dir` dedicado.

## Suítes

### 1. Pública — `node tests/prod-e2e-runner.cjs` (19 testes)

Navegação, i18n, controle de acesso e SEO sem autenticação.

| Grupo | O que cobre |
|---|---|
| Home & locales | PT-BR/EN carregam, redirect de locale |
| Navegação | Dropdown Services, seletor de idiomas (todas opções) |
| Rotas localizadas | quem-sou-eu, servicos, channel-management, about-me, servicios |
| Controle de acesso | /dashboard → signin sem sessão |
| APIs protegidas | /api/live/status, /api/platform/analytics → 401 sem sessão |
| SEO | sitemap.xml, robots.txt |
| Performance | TTFB em produção (~84ms) |

### 2. Autenticada — `node tests/prod-e2e-auth.cjs` (24 testes)

Fluxos do dashboard logado. **Cria e deleta um comando de teste** (`!e2etestcmd`)
— o resto é não-destrutivo.

| Grupo | O que cobre |
|---|---|
| Sessão | auth_session presente e válido |
| 9 rotas dashboard | Todas renderizam `<main>` |
| Live | API real dos 3 canais, cards de plataforma, Chat Unificado |
| Insights | Analytics reais (totalFollowers), cards de métricas |
| Chat commands | CRUD completo: defaults listados, form abre, create, delete |
| Channels | Plataformas conectadas, botões Conectar |
| Settings | Tabs renderizam (flag de bug i18n conhecido) |

### Bugs reais de produção capturados (falhas legítimas)

1. **`/dashboard/scheduled-streams` → 404** — link órfão no nav; a rota não existe
   no código (funcionalidade de agendamento está embutida na página Live via
   `stream-scheduler.tsx`). Fix: remover o link ou criar a rota.
2. **Settings com chaves i18n cruas** — `dashboard.settings.tabs.profil` etc.
   renderizam como texto (chaves de tradução sem valor no locale pt-BR).
3. **JWT exposto no console** da página Live (WebSocket URL logada com token).
   Baixa severidade, mas não deveria logar.

### Fix aplicado durante os testes (2026-09-24)

`supabase db push` — 3 migrations pendentes no remoto:
- `20260914233609_create_custom_commands.sql` ✅ (era o motivo do POST 400
  `"Could not find the table 'public.custom_commands'"`)
- `20260920_create_platform_stats_snapshots.sql` ✅ (corrigido syntax error:
  índice expression precisa de parênteses duplos `((...))`)
- `20260921_create_live_metrics_snapshots.sql` ✅

## Relatórios

- `tests/prod-e2e-report.json` — suíte pública
- `tests/prod-e2e-auth-report.json` — suíte autenticada
- `tests/prod-e2e-fails/` — screenshots das falhas

## Resultado último run (2026-09-24)

- Pública: **19/19** ✅ (TTFB 67ms)
- Autenticada: **22/24** — os 2 fails são o mesmo bug real:
  `/dashboard/scheduled-streams` é 404 (rota órfã no nav de produção)
