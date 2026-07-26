# Agentic Orchestration Architecture — v2

## Princípios

1. **Review é depois de tudo.** doc + test paralelos → code (depende de ambos) → review (depende de code + doc)
2. **Auto-cura.** Se um worker falha, tenta outro modelo, outra abordagem, ou decompoe em filhos menores
3. **Pool de contas.** Múltiplas contas Kiro, AGY, etc — round-robin com tracking de token
4. **Contexto consciente.** Worker sabe o tamanho do output que produz; o scheduler sabe se cabe no input do próximo
5. **Pais spawnam filhos.** Subtask complexa vira sub-DAG com workers próprios
6. **Bug Hunter 24/7.** Pool de agents navegando o site, detectando erros, criando Issues automaticamente

---

## 1. Stack

```
Orquestrador (Node/TS) → OmniRoute API (localhost:20128) → Providers (Kiro, AGY, etc)
         │
         ├── Configs versionadas (config/orchestration/*.yaml)
         ├── State DB (SQLite ou Redis p/ checkpointing)
         └── Issue Tracker (gh CLI + GitHub API)
```

---

## 2. Core Architecture

```
                         ┌─────────────────────────┐
                         │     TASK BRUTA          │
                         │ "implementar feature X" │
                         └───────────┬─────────────┘
                                     ▼
                     ┌─────────────────────────────┐
                     │      CONDUCTOR              │
                     │ 1. Decompose (barato)       │
                     │ 2. Gera DAG com metadados   │
                     │ 3. Estima tokens por etapa  │
                     └───────────┬─────────────────┘
                                 │
                                 ▼
                     ┌─────────────────────────────┐
                     │      DAG EXECUTOR           │
                     │ Resolve topologia           │
                     │ Spawna workers em paralelo  │
                     │ Gerencia falhas + retry     │
                     │ Tracking de contexto        │
                     └───────────┬─────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │ WORKER POOL  │  │ ACCOUNT POOL │  │ CONTEXT      │
     │ Router por   │  │ Kiro: 3 cts  │  │ TRACKER      │
     │ tipo+contexto│  │ AGY: 2 cts   │  │ Sabe output  │
     │              │  │ AGI: 1 ct    │  │ de cada step │
     └──────────────┘  └──────────────┘  └──────────────┘
                                 │
                                 ▼
                     ┌─────────────────────────────┐
                     │      OmniRoute API          │
                     │  localhost:20128             │
                     │  combo + model selection    │
                     └─────────────────────────────┘
```

---

## 3. DAG Correto — Implementação

```
        ┌──────────────┐
        │  DECOMPOSE   │  ← barato: quebra task
        │  (cheap)     │     em etapas + estima tokens
        └──────┬───────┘
               │
        ┌──────┴───────┐          (paralelo)
        │              │
        ▼              ▼
  ┌──────────┐  ┌──────────┐
  │  DOC     │  │  TEST    │  ← ambos baratos
  │ (cheap)  │  │ (cheap)  │     rodam em paralelo
  └────┬─────┘  └────┬─────┘
       │             │
       └──────┬──────┘
              ▼
        ┌──────────┐
        │  CODE    │  ← caro: recebe doc + test prontos
        │ (code)   │     contexto pequeno (só spec + docs)
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │  REVIEW  │  ← caro: recebe code + doc + test
        │ (review) │     contexto controlado
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │  MERGE   │  ← barato: formata output final
        │ (cheap)  │
        └──────────┘
```

---

## 4. Auto-Cura (Resilience)

Cada worker tem uma **estratégia de retry em cascata**:

```
Worker.code falha → 1º retry: mesmo modelo
                  → 2º retry: modelo diferente (claude-sonnet-4.5 → gpt-5.6-sol)
                  → 3º retry: conta diferente (kiro-ct1 → kiro-ct2)
                  → 4º decompor em filhos menores: code.split()
                      ├── code.componentA (filho)
                      ├── code.componentB (filho)
                      └── code.integration (filho)
                  → Se nada funciona: reporta ao pai com diagnóstico
```

Se TODOS os caminhos falham:

```
Worker.code falha totalmente
    → Worker.code tenta abordagem completamente diferente
      (ex: "implemente de outra forma, sem usar X")
    → Se ainda falha → notifica o Conductor
        → Conductor pode re-planejar o DAG inteiro
```

### Estratégias alternativas (escalonamento)

```yaml
retry_strategies:
  - type: same_model          # 1: mesma conta, mesmo modelo
  - type: different_model     # 2: mesma conta, modelo diferente
  - type: different_account   # 3: conta diferente, mesmo modelo
  - type: split               # 4: decompor em sub-workers
  - type: alternative_approach # 5: abordagem completamente nova
```

---

## 5. Account Pool

```
┌─────────────────────────────────────────────────────────┐
│                     ACCOUNT POOL                        │
├────────────┬──────────┬────────┬───────────┬───────────┤
│ Provider   │ Account  │ Model  │ Used Tok  │ Status    │
├────────────┼──────────┼────────┼───────────┼───────────┤
│ kiro       │ ct-1     │ sonnet │ 450K/20M  │ OK        │
│ kiro       │ ct-2     │ sonnet │ 120K/20M  │ OK        │
│ kiro       │ ct-3     │ sonnet │ 0K/20M    │ OK        │
│ agy        │ agy-1    │ gemini │ 2.1M/1B   │ OK        │
│ agy        │ agy-2    │ gemini │ 500K/1B   │ OK        │
│ agi        │ agi-1    │ claude │ 0K/200M   │ paused    │
└────────────┴──────────┴────────┴───────────┴───────────┘

Seleção: least_used (menos tokens gastos no período)
Fallback: se conta bater rate_limit → próxima conta
```

---

## 6. Context-Aware Routing

Cada worker **declara** quanto vai gastar:

```typescript
// Worker.code sabe que vai produzir ~4000 tokens de output
// O scheduler sabe que o próximo worker (review) vai receber:
//   code.output (4K) + doc.output (2K) + test.output (2K) = 8K total
//   8K + system prompt (1K) = 9K → cabe tranquilamente no modelo de review (200K)

// Se total estimado EXCEDE o limite:
//   → compressão automática (sumarizar outputs mais antigos)
//   → ou split em mais workers (revisar por módulo)
```

```typescript
interface ContextBudget {
  estimatedInputTokens: number
  estimatedOutputTokens: number
  depsTotalTokens: number      // soma dos outputs das dependências
  modelLimit: number           // limite do modelo destino
  fits: boolean                // estimatedInputTokens <= modelLimit
  compressionNeeded: string[]  // quais outputs precisam ser resumidos
}
```

---

## 7. Parent-Child Spawning

```
Worker.code recebe: "implemente módulo de pagamentos"
  │
  ├── Percebe que é complexo → spawna filhos
  │
  ├── code.payment-form.tsx (filho 1)  → contexto: spec do form
  ├── code.payment-api.ts (filho 2)    → contexto: spec da API
  ├── code.payment-hooks.ts (filho 3)  → contexto: spec dos hooks
  │
  └── code.merge (reúne tudo) → retorna pro pai (review)

Cada filho tem:
  - Modelo próprio (pode ser diferente do pai)
  - Contexto isolado (só a parte que lhe compete)
  - Estado rastreável (id do pai, id do filho, status)
  - Capacidade de spawnar NETOS se precisar
```

---

## 8. 24/7 Bug Hunter Agents

```
┌─────────────────────────────────────────────────────────┐
│                   BUG HUNT ORCHESTRATOR                  │
│  - Agenda agents em intervalos (1h, 6h, 24h)            │
│  - Mantém pool de sessions de browser-use               │
│  - Coleta resultados → cria GitHub Issues               │
│  - Evita duplicatas (check se Issue similar já existe)  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PAGE CRUISER │ │ UI CHECKER   │ │ EDGE TESTER  │
│ Navega rotas │ │ Verifica     │ │ Testa inputs │
│ clica links  │ │ contraste,   │ │ vazios,      │
│ preenche     │ │ layout,      │ │ errados,     │
│ formulários  │ │ responsivo   │ │ limites      │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌──────────────────┐
              │  ISSUE GENERATOR │
              │  - Screenshot    │
              │  - Console log   │
              │  - Steps to rep  │
              │  - gh issue create│
              └──────────────────┘
```

### Behaviour dos agents

```yaml
bug_hunt:
  - name: page-cruiser
    schedule: every 6h
    max_pages: 50
    actions:
      - navigate: "/"
      - navigate: "/dashboard"
      - navigate: "/dashboard/publish"
      - click_all_links
      - fill_random_forms
      - check_console_errors
    on_error:
      - screenshot
      - capture_console
      - create_issue

  - name: ui-checker
    schedule: every 24h
    max_pages: 20
    actions:
      - check_responsive: [375, 768, 1024, 1440]
      - check_contrast
      - check_overlapping_elements
      - report_visual_bugs
    on_error:
      - screenshot
      - create_issue

  - name: edge-tester
    schedule: every 12h
    max_pages: 10
    actions:
      - test_empty_states
      - test_error_boundaries
      - test_missing_permissions
      - test_input_validation
    on_error:
      - screenshot
      - capture_network_logs
      - create_issue
```

---

## 9. Config Versionada (Git)

```
config/orchestration/
├── accounts.yaml              # Pool de contas (versionado, sem secrets)
├── accounts.secret.yaml       # Secrets local, .gitignore
├── models.yaml                # Task type → combo + model
├── workflows.yaml             # DAGs: implement, fix-bug, research
├── retry-strategies.yaml      # Escalonamento de auto-cura
├── bug-hunt.yaml              # Schedule e config dos Bug Hunters
└── prompts/                   # System prompts versionados
    ├── decompose.yaml
    ├── code-gen.yaml
    ├── review.yaml
    └── merge.yaml
```

---

## 10. Roadmap de Implementação

| Fase | O quê | Entrega |
|------|-------|---------|
| **P1** | Conductor + DAG Executor + Worker Pool (com OmniRoute API) | Core funcional |
| **P2** | Context-Aware Routing (track tokens, compressão) | Não estoura contexto |
| **P3** | Auto-cura (retry cascata, split, abordagens alternativas) | Resiliência |
| **P4** | Account Pool (múltiplas contas por provider) | Pool de tokens grátis |
| **P5** | Parent-Child Spawning (sub-DAGs dinâmicas) | Escalabilidade |
| **P6** | Bug Hunter 24/7 (browser-use pool + auto-issue) | Vigilância autônoma |

---

## 11. O que isso desbloqueia

| Feature | Como fica |
|---------|-----------|
| Prompt longo demais | Cada worker vê só o que precisa + tracker de contexto |
| Rate limit batendo | Pool de contas → round-robin entre múltiplas |
| Modelo caro p/ tudo | Routing: doc/test/merge = barato; code/review = caro |
| Bug não reportado | Bug Hunter navega 24/7 e cria Issue automático |
| Worker falhou | Auto-cura: tenta 4 estratégias antes de desistir |
| Tarefa complexa | Parent spawna filhos → cada um resolve uma parte |
