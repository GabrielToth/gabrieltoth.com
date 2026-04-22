# Boas Práticas - Kiro Agent

## 📋 Instruções Gerais

### 1. Documentação
- **NÃO** gere arquivos `.md` de resumo após completar tasks
- **NÃO** crie relatórios de mudanças em `.md` a menos que explicitamente solicitado
- **APENAS** crie `.md` quando o usuário pedir especificamente um arquivo de documentação
- Resuma mudanças diretamente na resposta em texto simples

### 2. Commits e Git
- Sempre use mensagens de commit descritivas e em inglês
- Prefira commits atômicos (uma mudança por commit)
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- **OBRIGATÓRIO**: Incluir número da issue: `fix(#123): description`
- **NUNCA** use versão como nome de commit (❌ `1.8.22`, ❌ `1.8.23`)
- Não faça push automaticamente - sempre confirme antes
- Versioning é separado: use `npm version patch|minor|major` após commits

### 3. Código
- Mantenha consistência com o estilo do projeto
- Siga as convenções de nomenclatura existentes
- Não adicione dependências sem confirmar
- Sempre teste antes de fazer commit

### 4. Respostas
- Seja conciso e direto
- Use listas e tabelas para organizar informações
- Mostre apenas o essencial
- Se precisar de detalhes, o usuário pedirá

### 5. Arquivos Descartáveis
- Não envie para git: relatórios de mudanças, sumários, listas de tarefas
- Esses arquivos devem ser criados APENAS se o usuário pedir explicitamente
- Exemplo: "crie um relatório.md" ou "documente as mudanças"

## 🎯 Fluxo de Trabalho

1. **Abrir Issue no GitHub** (SEMPRE PRIMEIRO)
2. **Entender** a tarefa
3. **Implementar** as mudanças
4. **Testar** se possível
5. **Resumir** na resposta (sem .md)
6. **Fazer commit** com mensagem clara referenciando a issue
7. **Confirmar** antes de push

---

## 🔴 REGRA CRÍTICA: GitHub Issues ANTES de Implementar

**OBRIGATÓRIO**: Abrir uma issue no GitHub ANTES de sugerir ou implementar qualquer solução.

### Por Que?
- Documenta o problema detalhadamente
- Cria rastreabilidade
- Permite discussão antes da implementação
- Facilita code review
- Mantém histórico de decisões

### Quando Aplicar?
- ✅ Toda vez que identificar um problema
- ✅ Toda vez que receber uma tarefa
- ✅ Toda vez que precisar fazer mudanças no código
- ✅ Mesmo para pequenas correções

### Quando NÃO Aplicar?
- ❌ Apenas se o usuário explicitamente disser "não precisa de issue"
- ❌ Apenas se a issue já existir (reutilizar a existente)

### Processo Obrigatório

**PASSO 1: Abrir Issue**
```
Título: [Type] Descrição clara do problema
Descrição: Detalhar contexto, problema, impacto, requisitos
Labels: feature, bug, enhancement, etc.
```

**PASSO 2: Aguardar Confirmação**
- Esperar o usuário confirmar a issue
- Ou prosseguir se o usuário autorizar

**PASSO 3: Implementar com Referência**
- Usar número da issue em todos os commits
- Formato: `fix(#123): description`
- Fechar issue automaticamente: `Closes #123`

### Exemplo Correto

```
❌ ERRADO:
- Usuário: "Preciso corrigir o header"
- Kiro: [Implementa direto]

✅ CORRETO:
- Usuário: "Preciso corrigir o header"
- Kiro: "Vou abrir uma issue no GitHub descrevendo o problema"
- Kiro: [Abre issue #42 com detalhes]
- Kiro: [Aguarda confirmação ou prossegue]
- Kiro: [Implementa com commits referenciando #42]
```

### Template de Issue

```markdown
## Descrição
[Explicar o que precisa ser feito]

## Contexto
- Por que isso é importante?
- Qual problema resolve?
- Impacto esperado?

## Requisitos
- [ ] Requisito 1
- [ ] Requisito 2

## Critérios de Aceitação
- [ ] Funcionalidade X implementada
- [ ] Testes escritos
- [ ] Build passa
- [ ] Compatível com cloud e local

## Notas Técnicas
- Arquivos afetados
- Dependências necessárias
- Possíveis impactos
```

## ✅ Checklist Antes de Responder

- [ ] Tarefa foi completada?
- [ ] Build testado localmente com `npm run build`?
- [ ] Código foi testado?
- [ ] Commit foi feito?
- [ ] Preciso gerar .md? (Apenas se solicitado)
- [ ] Resumo está claro e conciso?

## 🔨 Build Local Obrigatório

**SEMPRE** execute `npm run build` localmente antes de fazer commit/push:
- Se falhar, corrija os erros
- Tente novamente até passar
- Não suba código que não compila
- Isso evita quebrar o deploy em produção

## 📝 Exemplo de Resposta Correta

```
✅ Implementado com sucesso

Mudanças:
- Arquivo A: adicionado função X
- Arquivo B: atualizado import Y
- Arquivo C: removido código Z

Commit: abc1234 - feat: implement feature X
Status: Pronto para push
```

## ❌ Exemplo de Resposta Incorreta

```
[Gera arquivo MUDANCAS.md]
[Gera arquivo RELATORIO.md]
[Gera arquivo SUMARIO.md]
```

---

## 🚀 Workflow de Finalização de Implementação

**OBRIGATÓRIO** seguir este ciclo após completar toda a implementação de uma feature/spec:

### 1️⃣ Testes Gerais (Testar TODO o site)
```bash
npm run test                        # Executar todos os testes
npm run test:coverage               # Gerar relatório de cobertura
```
- Verificar que todos os testes passam
- Revisar cobertura de testes
- Se algum teste falhar, corrigir antes de prosseguir

### 2️⃣ Testes de Velocidade/Performance
```bash
npm run lighthouse                  # Executar Lighthouse audit
npm run perf:full                   # Análise completa de performance
npm run analyze                     # Analisar tamanho do bundle
```
- Verificar Core Web Vitals (LCP, FID, CLS)
- Analisar tamanho do bundle
- Documentar métricas de performance

### 3️⃣ Decisão: Performance Aceitável?

**SIM - Performance OK:**
- Prosseguir para o passo 4 (Formatação de Código)

**NÃO - Performance Ruim:**
- Fazer commit com mensagem: `fix: performance improvements`
- Criar novo commit separado para otimizações
- Executar otimizações (code splitting, lazy loading, etc.)
- Voltar ao passo 2 (Testes de Performance)
- Repetir até atingir targets aceitáveis

### 4️⃣ Formatação e Padronização de Código
```bash
npm run format                      # Formatar código com Prettier
npm run lint:fix                    # Corrigir problemas de ESLint
npm run type-check                  # Verificar tipos TypeScript
```
- Código será formatado automaticamente
- Erros de linting serão corrigidos
- Tipos TypeScript serão validados

### 5️⃣ Verificação de Ortografia e Dicionário
```bash
npm run spell-check                 # Verificar ortografia
```
- Se houver palavras desconhecidas:
  - Adicionar ao dicionário do projeto (`.cspell.json` ou similar)
  - Ou corrigir a ortografia se for erro real
  - Executar novamente até passar

### 6️⃣ Documentação no Storybook
```bash
npm run storybook                   # Iniciar Storybook
```
- Criar/atualizar stories para novos componentes
- Documentar props e comportamentos
- Adicionar exemplos de uso
- Verificar que stories renderizam corretamente

### 7️⃣ Build Final
```bash
npm run build                       # Build para produção
```
- Verificar que build completa sem erros
- Revisar warnings (se houver)
- Confirmar que bundle size está aceitável

### 8️⃣ Testes Finais (Ciclo Completo)
```bash
npm run test                        # Todos os testes novamente
npm run test:e2e                    # E2E tests (se aplicável)
npm run lighthouse                  # Performance final
```
- Garantir que tudo ainda funciona após formatação
- Verificar performance final
- Confirmar que nenhuma regressão foi introduzida

### 9️⃣ Commit e Push
```bash
git add .                           # Adicionar todas as mudanças
git commit -m "feat: complete feature X"  # Commit com mensagem descritiva
git push -u origin feature-branch   # Push para repositório remoto
```

### Mensagens de Commit Recomendadas

**IMPORTANTE**: Cada commit deve incluir o número da issue e descrever a mudança específica.

**Implementação inicial:**
```
feat(#123): implement dashboard redesign components
```

**Performance improvements:**
```
perf(#123): optimize bundle size and lazy load components
```

**Formatação e linting:**
```
style(#123): format code and fix linting issues
```

**Documentação:**
```
docs(#123): add Storybook stories for dashboard components
```

**Testes:**
```
test(#123): add comprehensive test coverage for components
```

**Bug fix:**
```
fix(#123): remove header from registration flow
```

**Refatoração:**
```
refactor(#123): extract validation logic to utilities
```

**NUNCA faça commits assim:**
```
❌ 1.8.22 - Versão como nome
❌ 1.8.23 - Versão como nome
❌ fix: remove header - Sem número da issue
❌ Update code - Sem tipo de commit
❌ WIP - Muito vago
```

### ❌ Exemplos INCORRETOS

```
❌ 1.8.22 - NUNCA use versão como nome de commit
❌ 1.8.23 - NUNCA use versão como nome de commit
❌ fix: remove header - Sem número da issue
❌ Update code - Sem tipo de commit
❌ WIP - Muito vago
```

### ✅ Formato OBRIGATÓRIO de Commit

**SEMPRE** use este formato:
```
<type>(#<issue-number>): <description>
```

**Exemplos corretos:**
```
fix(#42): remove header from registration flow
feat(#123): add WhatsApp integration
perf(#156): optimize bundle size
docs(#89): add Storybook stories
test(#201): add comprehensive test coverage
style(#45): format code and fix linting issues
refactor(#78): extract validation logic to utilities
```

**REGRA CRÍTICA**: O nome do commit NUNCA deve ser apenas a versão (1.8.22, 1.8.23, etc.). A versão é incrementada SEPARADAMENTE após o commit usando `npm version patch|minor|major`.

---

## 📋 Checklist Completo de Finalização

- [ ] Todos os testes passam (`npm run test`)
- [ ] Cobertura de testes aceitável (> 80%)
- [ ] Performance dentro dos targets (LCP < 2.5s, etc.)
- [ ] Código formatado (`npm run format`)
- [ ] Linting corrigido (`npm run lint:fix`)
- [ ] Tipos TypeScript validados (`npm run type-check`)
- [ ] Ortografia verificada (`npm run spell-check`)
- [ ] Storybook stories criadas/atualizadas
- [ ] Build completa sem erros (`npm run build`)
- [ ] Testes finais passam
- [ ] Commit feito com mensagem descritiva
- [ ] Push realizado para repositório remoto

---

## 🔄 Workflow GitHub: Issues → PRs → Commits

**OBRIGATÓRIO** usar este workflow para todas as implementações:

### 1️⃣ Criar Issue no GitHub

**Título:** Descritivo e conciso
```
[Feature] Add WhatsApp Integration
[Bug] Fix dashboard performance on mobile
[Enhancement] Improve accessibility compliance
```

**Descrição Detalhada:**
```markdown
## Descrição
Explicar o que precisa ser feito e por quê.

## Contexto
- Por que isso é importante?
- Qual problema resolve?
- Impacto esperado?

## Requisitos
- [ ] Requisito 1
- [ ] Requisito 2
- [ ] Requisito 3

## Critérios de Aceitação
- [ ] Funcionalidade X implementada
- [ ] Testes escritos e passando
- [ ] Documentação atualizada
- [ ] Performance dentro dos targets
- [ ] Compatível com versão cloud e local

## Notas Técnicas
- Arquivos que serão modificados
- Dependências necessárias
- Possíveis impactos

## Referências
- Links para documentação
- Issues relacionadas
- PRs relacionadas
```

**Labels:** `feature`, `bug`, `enhancement`, `documentation`, `performance`, `accessibility`

**Assignee:** Atribuir a si mesmo

**Milestone:** Selecionar a milestone correspondente (ver seção de Milestones)

### 2️⃣ Criar Branch e PR

```bash
# Criar branch a partir da issue
git checkout -b feature/issue-123-whatsapp-integration

# Fazer push inicial (sem commits ainda)
git push -u origin feature/issue-123-whatsapp-integration
```

**Criar PR no GitHub:**
- Título: `[PR #123] Add WhatsApp Integration`
- Descrição: Referenciar a issue: `Closes #123`
- Linked Issues: Selecionar a issue criada
- Reviewers: Atribuir reviewers se necessário

### 3️⃣ Executar Workflow de Implementação

Seguir o workflow de finalização (seção anterior) fazendo commits:

```bash
# Commit 1: Implementação inicial
git commit -m "feat(#123): implement WhatsApp integration core"

# Commit 2: Testes
git commit -m "test(#123): add comprehensive tests for WhatsApp integration"

# Commit 3: Performance
git commit -m "perf(#123): optimize WhatsApp integration performance"

# Commit 4: Documentação
git commit -m "docs(#123): add Storybook stories and API documentation"

# Commit 5: Formatação
git commit -m "style(#123): format code and fix linting issues"
```

**Formato de Commit Obrigatório:**
```
<type>(<issue-number>): <description>

<body>

Closes #<issue-number>
```

Exemplo:
```
feat(#123): add WhatsApp integration

- Implement WhatsApp API connection
- Add message sending functionality
- Create WhatsApp channel management UI

Closes #123
```

### 4️⃣ Push e Merge

```bash
# Push todos os commits
git push origin feature/issue-123-whatsapp-integration

# Aguardar aprovação de reviewers
# Merge via GitHub UI (Squash or Create a merge commit)
```

**Checklist antes de Merge:**
- [ ] Todos os testes passam
- [ ] CI/CD pipeline passou
- [ ] Code review aprovado
- [ ] Sem conflitos com main
- [ ] Performance dentro dos targets
- [ ] Compatível com versão cloud e local

---

## 📌 Compatibilidade Cloud vs Local

**OBRIGATÓRIO** para TODAS as implementações:

### Versão Cloud
- Hospedada em servidor (Vercel, AWS, etc.)
- Acesso via URL pública
- Banco de dados remoto
- Autenticação via OAuth/JWT
- Variáveis de ambiente em produção

### Versão Local
- Executada localmente (`npm run dev`)
- Banco de dados local (SQLite, PostgreSQL local)
- Autenticação simplificada para testes
- Variáveis de ambiente em `.env.local`

### Checklist de Compatibilidade

- [ ] Código funciona em ambas as versões
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Banco de dados funciona em ambas
- [ ] Autenticação funciona em ambas
- [ ] APIs externas têm fallback para local
- [ ] Testes passam em ambas as versões
- [ ] Performance aceitável em ambas

### Exemplo de Código Compatível

```typescript
// ✅ BOM - Funciona em ambas as versões
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export async function fetchData() {
  const response = await fetch(`${apiUrl}/data`)
  return response.json()
}
```

```typescript
// ❌ RUIM - Só funciona em produção
const apiUrl = 'https://api.production.com/api'

export async function fetchData() {
  const response = await fetch(`${apiUrl}/data`)
  return response.json()
}
```

---

**Última atualização:** 21 de Abril de 2026


## 📦 Semantic Versioning Rules

**OBRIGATÓRIO** seguir Semantic Versioning (SemVer) para todas as mudanças:

### Versão Atual: 1.8.26

**Formato:** `MAJOR.MINOR.PATCH`

- **MAJOR (X.0.0)**: Breaking changes, large feature removals, major refactors
  - Exemplo: Remover dashboard completamente, mudar estrutura de API
  - Incrementar quando: Mudanças que quebram compatibilidade

- **MINOR (0.X.0)**: New features, small removals (não categorias/páginas inteiras)
  - Exemplo: Adicionar novo campo de formulário, novo componente
  - Incrementar quando: Adicionar funcionalidade sem quebrar compatibilidade

- **PATCH (0.0.X)**: Bug fixes only, performance improvements, documentation
  - Exemplo: Corrigir validação de email, otimizar performance
  - Incrementar quando: Apenas correções e melhorias sem novas features

### ⚠️ IMPORTANTE: Versioning é SEPARADO de Commit Messages

**NUNCA** use versão como nome de commit:
```bash
❌ ERRADO - Commit com versão como nome:
git commit -m "1.8.22"
git commit -m "1.8.23"
git commit -m "1.8.26"

✅ CORRETO - Commit com número da issue e descrição:
git commit -m "fix(#42): remove header from registration flow"
git commit -m "feat(#123): add new dashboard component"
git commit -m "perf(#156): optimize bundle size"
```

### Regra Obrigatória: Incrementar Versão APÓS Commits

**Workflow correto:**

```bash
# 1. Fazer mudanças no código
# 2. Fazer commit com mensagem descritiva e número da issue
git commit -m "fix(#42): remove header from registration flow"

# 3. DEPOIS incrementar versão (separado)
npm version patch  # 1.8.25 → 1.8.26

# 4. Push com tags
git push origin feature-branch --tags
```

**Exemplo de Commit com Versioning:**
```bash
# Fazer mudanças
git add .

# Commit com número da issue (NUNCA versão)
git commit -m "feat(#123): add new dashboard component"

# Incrementar versão (escolher patch/minor/major)
npm version minor  # 1.8.26 → 1.9.0

# Push com tags
git push origin feature-branch --tags
```

### Checklist de Versioning

- [ ] Commit feito com mensagem descritiva e número da issue (NÃO versão)
- [ ] Identifiquei o tipo de mudança (bug fix, feature, breaking change)
- [ ] Executei `npm version patch|minor|major` APÓS o commit
- [ ] Versão em `package.json` foi incrementada corretamente
- [ ] Tag git foi criada automaticamente
- [ ] Push realizado com `--tags`

---

## 🐳 Docker Container Requirements

**CRÍTICO**: Testes e desenvolvimento local REQUEREM Docker containers rodando.

### Containers Necessários

Antes de executar testes ou desenvolvimento, certifique-se que os seguintes containers estão rodando:

- **PostgreSQL Database**: Banco de dados principal
- **Redis Cache**: Cache e session storage
- **SMTP Server** (MailHog ou similar): Email testing
- **Backend Services**: Serviços backend containerizados

### Iniciar Containers

```bash
# Iniciar todos os containers (docker-compose)
docker-compose up -d

# Verificar status dos containers
docker-compose ps

# Ver logs dos containers
docker-compose logs -f
```

### Verificação Pré-Teste

**OBRIGATÓRIO** antes de executar testes:

```bash
# Verificar se containers estão rodando
docker-compose ps

# Verificar conectividade com banco de dados
npm run db:check

# Verificar conectividade com Redis
npm run redis:check
```

### Checklist de Docker

- [ ] Docker Desktop está instalado e rodando
- [ ] `docker-compose up -d` foi executado
- [ ] Todos os containers estão com status "Up"
- [ ] Banco de dados está acessível
- [ ] Redis está acessível
- [ ] SMTP server está acessível

### Troubleshooting Docker

**Containers não iniciam:**
```bash
# Limpar containers antigos
docker-compose down -v

# Reconstruir images
docker-compose build --no-cache

# Iniciar novamente
docker-compose up -d
```

**Banco de dados não conecta:**
```bash
# Verificar logs do PostgreSQL
docker-compose logs postgres

# Reiniciar container
docker-compose restart postgres
```

**Redis não conecta:**
```bash
# Verificar logs do Redis
docker-compose logs redis

# Reiniciar container
docker-compose restart redis
```

---

## ✅ Checklist Completo de Finalização (Atualizado)

- [ ] Versão foi incrementada em `package.json` (npm version patch/minor/major)
- [ ] Docker containers estão rodando (`docker-compose ps`)
- [ ] Todos os testes passam (`npm run test`)
- [ ] Cobertura de testes aceitável (> 80%)
- [ ] Performance dentro dos targets (LCP < 2.5s, etc.)
- [ ] Código formatado (`npm run format`)
- [ ] Linting corrigido (`npm run lint:fix`)
- [ ] Tipos TypeScript validados (`npm run type-check`)
- [ ] Ortografia verificada (`npm run spell-check`)
- [ ] Storybook stories criadas/atualizadas
- [ ] Build completa sem erros (`npm run build`)
- [ ] Testes finais passam
- [ ] Commit feito com mensagem descritiva
- [ ] Push realizado para repositório remoto com tags

---

**Última atualização:** 22 de Abril de 2026
