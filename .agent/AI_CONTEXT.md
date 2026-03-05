# 🤖 Contexto para IAs - Gabriel Toth Platform

Este arquivo contém o contexto essencial para qualquer IA que for trabalhar neste projeto.

---

## Sobre o Projeto

**gabrieltoth.com** é uma plataforma multi-propósito que inclui:

1. **Portfólio pessoal** (frontend existente)
2. **Plataforma de criadores de conteúdo** (em desenvolvimento)
    - Sistema de créditos para uso
    - Chat unificado multi-plataforma
    - Download/agendamento de vídeos
    - Dashboard de analytics
    - Streaming com metrificação

---

## Estrutura de Pastas Relevante

```
src/
├── app/
│   ├── [locale]/         # Frontend (Next.js i18n)
│   └── api/
│       ├── platform/     # ⭐ APIs da plataforma de criadores
│       │   ├── credits/
│       │   ├── youtube/
│       │   ├── chat/
│       │   ├── analytics/
│       │   ├── stream/
│       │   └── webhooks/
│       └── ...           # APIs existentes (contact, payments)
├── lib/
│   ├── db/               # ⭐ Cliente PostgreSQL
│   ├── credits/          # ⭐ Sistema de créditos
│   ├── metering/         # ⭐ Metrificação de infra
│   ├── stripe/           # Pagamentos
│   └── ...               # Libs existentes
└── components/           # UI components
```

---

## Padrões de Código

### Nomenclatura

- **Arquivos**: `kebab-case.ts`
- **Componentes React**: `PascalCase.tsx`
- **Funções/Variáveis**: `camelCase`
- **Constantes**: `UPPER_SNAKE_CASE`

### API Routes

- Usar `NextResponse.json()` para respostas
- Sempre validar input do usuário
- Sempre verificar autenticação onde necessário
- Logar erros com `console.error`

### Banco de Dados

- Usar `query()` de `@/lib/db`
- Transações com `BEGIN`, `COMMIT`, `ROLLBACK`
- Parametrizar queries (prevenir SQL injection)

---

## Sistema de Créditos

- 1 Crédito ≈ R$ 0.0001
- Cada ação tem um custo em `CREDIT_COSTS` (ver `src/lib/credits/index.ts`)
- Infraestrutura é cobrada: banda, disco, cache

---

## Endpoints Principais

| Método | Path                           | Descrição                       |
| ------ | ------------------------------ | ------------------------------- |
| GET    | `/api/platform/analytics`      | Dashboard de consumo do usuário |
| POST   | `/api/platform/credits/deduct` | Deduzir créditos                |
| GET    | `/api/health`                  | Health check                    |

---

## Antes de Começar

1. Ler `/onboarding` workflow
2. Entender o módulo específico em `docs/modules/`
3. Seguir `/testing` antes de commitar
4. Em problemas, usar `EMERGENCY_ROLLBACK.md`
