---
description: Workflow de testes antes de qualquer commit
---

# Workflow de Testes

## Ordem de Execução

### 1. Verificar se Builda

```bash
// turbo
npm run build
```

Se falhar, corrigir erros antes de prosseguir.

### 2. Verificar Tipos TypeScript

```bash
// turbo
npm run type-check
```

### 3. Rodar Linter

```bash
// turbo
npm run lint
```

### 4. Rodar Testes Unitários Existentes

```bash
// turbo
npm run test
```

### 5. Se Criou Novas Funcionalidades, Criar Testes Unitários

- Testes devem ficar em `src/__tests__/`
- Seguir padrão: `[nome-do-arquivo].test.ts`
- Cobrir casos de sucesso e falha

### 6. Rodar Testes E2E (se alterou UI)

```bash
npm run test:e2e
```

---

## Critérios de Aprovação

- ✅ Build passa sem erros
- ✅ Sem erros de TypeScript
- ✅ Sem warnings de ESLint críticos
- ✅ Todos os testes passam
- ✅ Cobertura de testes >= 80% para novos arquivos
