# Navigation Structure Tests

## Overview

Este conjunto de testes garante que a estrutura de navegação esteja correta em todo o site, especificamente verificando:

- **Landing Pages**: NÃO devem ter header principal de navegação, MAS devem ter breadcrumbs
- **Homepage**: DEVE ter header completo com navegação E breadcrumbs
- **Páginas Institucionais**: DEVEM ter breadcrumbs e seletor de idioma
- **Todas as Páginas**: DEVEM ter breadcrumbs para navegação estrutural

## Arquivos de Teste

### 1. `header-presence.cy.ts` (Testes Completos)
- Testa a presença/ausência do header principal em todas as páginas
- Verifica breadcrumbs em todas as páginas
- Testa funcionalidade completa do header na homepage
- Verifica dropdown de serviços apenas na homepage
- Testa navegação estrutural dos breadcrumbs
- **Tempo**: ~3-4 minutos para executar

### 2. `header-presence-simple.cy.ts` (Testes Rápidos)
- Versão simplificada para CI/CD
- Testa apenas funcionalidades principais
- Foco na verificação básica de estrutura de navegação
- **Tempo**: ~45 segundos para executar

## Estrutura de Navegação por Tipo de Página

| Tipo de Página | Header Principal | Breadcrumbs | Services Menu |
|----------------|------------------|-------------|---------------|
| **Homepage** | ✅ | ✅ | ✅ |
| **Landing Pages** | ❌ | ✅ | ❌ |
| **Institucionais** | ✅ | ✅ | ❌ |

## Tipos de Navegação

### 1. Header Principal (apenas homepage)
```html
<header>
  <nav>
    <!-- Links: Home, About, Projects, Services, Contact -->
    <!-- Services dropdown -->
    <!-- Language selector -->
    <!-- Theme toggle -->
  </nav>
</header>
```

### 2. Breadcrumbs (todas as páginas)
```html
<nav aria-label="Breadcrumb navigation">
  <!-- Home > Categoria > Página Atual -->
</nav>
```

## Verificações Realizadas

### Landing Pages
- ✅ **SEM** elemento `<header>`
- ✅ **SEM** menu "Services"/"Serviços"
- ✅ **SEM** seletor de idioma do header
- ✅ **COM** breadcrumbs navigation
- ✅ **COM** footer

### Homepage
- ✅ **COM** elemento `<header>` visível
- ✅ **COM** navegação `<nav>` dentro do header
- ✅ **COM** logo "Gabriel Toth Gonçalves" como link
- ✅ **COM** seletor de idioma no header
- ✅ **COM** dropdown "Services"/"Serviços"
- ✅ **COM** breadcrumbs (separados do header)
- ✅ **COM** footer

### Páginas Institucionais
- ✅ **COM** breadcrumbs navigation
- ✅ **COM** seletor de idioma (implementação específica)
- ✅ **COM** footer

## Como Executar

### Todos os testes de navegação:
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

1. **Consistência de UX**: Garante que cada tipo de página tenha a navegação apropriada
2. **Landing Page Optimization**: LPs sem distração do header melhoram conversão
3. **Navigation Clarity**: Breadcrumbs fornecem contexto e navegação em todas as páginas
4. **Header Functionality**: Header principal funciona corretamente na homepage
5. **Regression Prevention**: Evita reintrodução de problemas de navegação

## Diferenças entre Tipos de Navegação

### Header Principal vs Breadcrumbs

| Aspecto | Header Principal | Breadcrumbs |
|---------|------------------|-------------|
| **Localização** | Apenas homepage | Todas as páginas |
| **Propósito** | Navegação entre seções | Contexto hierárquico |
| **Elementos** | Menu, Services, Language | Caminho: Home > Categoria > Página |
| **Posição** | Fixo no topo | Abaixo do header (quando existe) |
| **Styling** | Background com blur | Simples, texto pequeno |

## Integração com CI/CD

### Para Pipelines Rápidos:
Use `header-presence-simple.cy.ts`:
- Verificação rápida em PRs
- Validação pré-deploy
- Smoke tests em produção

### Para Validação Completa:
Use `header-presence.cy.ts`:
- Testes noturnos completos
- Validação pré-release
- Debugging de problemas específicos

## Debugging de Problemas

### Problema: "Teste falhando - header encontrado onde não deveria"
- Verifique se a página é realmente uma landing page
- Confirme que não há `<header>` no código da página
- Verifique se breadcrumbs não estão sendo confundidos com header

### Problema: "Breadcrumbs não encontrados"
- Verifique se o seletor `nav[aria-label*="Breadcrumb"]` está correto
- Confirme que o componente Breadcrumbs está sendo importado
- Verifique se `aria-label` está definido corretamente

### Problema: "Services dropdown não funciona"
- Confirme que está testando na homepage (único lugar onde deve existir)
- Verifique se o seletor está correto: `header` + `contains("Services")`
- Confirme que o dropdown não está sendo testado em landing pages 
