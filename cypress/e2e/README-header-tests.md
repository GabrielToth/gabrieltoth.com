# Header Presence Tests

## Overview

Este conjunto de testes garante que a estrutura de navegação esteja correta em todo o site, especificamente verificando:

- **Landing Pages**: NÃO devem ter header/navegação
- **Homepage**: DEVE ter header completo com navegação
- **Páginas Institucionais**: DEVEM ter header quando apropriado

## Arquivos de Teste

### 1. `header-presence.cy.ts` (Testes Completos)
- Testa todas as landing pages em inglês e português
- Verifica funcionalidade completa do header
- Testa dropdown de serviços
- Verifica navegação condicional
- **Tempo**: ~2-3 minutos para executar

### 2. `header-presence-simple.cy.ts` (Testes Rápidos)
- Versão simplificada para CI/CD
- Testa apenas páginas principais
- Foco na verificação básica de presença/ausência
- **Tempo**: ~30 segundos para executar

## Landing Pages Testadas

Estas páginas **NÃO DEVEM** ter header:
- `/[locale]/pc-optimization`
- `/[locale]/channel-management`
- `/[locale]/waveigl-support`
- `/[locale]/editors`

## Páginas com Header

Estas páginas **DEVEM** ter header:
- `/[locale]` (Homepage)
- `/[locale]/privacy-policy`
- `/[locale]/terms-of-service`

## Verificações Realizadas

### Landing Pages (Não devem ter header)
- ✅ Elemento `<header>` não existe
- ✅ Elemento `<nav>` não existe
- ✅ Logo "Gabriel Toth Gonçalves" não é um link
- ✅ Seletor de idioma não existe
- ✅ Dropdown de serviços não existe
- ✅ Footer existe

### Homepage (Deve ter header)
- ✅ Elemento `<header>` existe e é visível
- ✅ Elemento `<nav>` existe e é visível
- ✅ Logo "Gabriel Toth Gonçalves" é um link
- ✅ Seletor de idioma existe
- ✅ Dropdown de serviços existe
- ✅ Links de navegação funcionam
- ✅ Footer existe

## Como Executar

### Todos os testes de header:
```bash
npx cypress run --spec "cypress/e2e/header-presence.cy.ts"
```

### Testes rápidos:
```bash
npx cypress run --spec "cypress/e2e/header-presence-simple.cy.ts"
```

### No modo interativo:
```bash
npx cypress open
```

## Importância dos Testes

1. **UX Consistency**: Garante experiência consistente
2. **Landing Page Optimization**: LPs sem distração melhoram conversão
3. **Navigation Integrity**: Header funciona onde deveria
4. **Regression Prevention**: Evita reintrodução de problemas

## Integração com CI/CD

Recomenda-se usar `header-presence-simple.cy.ts` no pipeline para:
- Verificação rápida em PRs
- Validação pré-deploy
- Smoke tests em produção

E usar `header-presence.cy.ts` para:
- Testes noturnos completos
- Validação pré-release
- Debugging de problemas específicos 
