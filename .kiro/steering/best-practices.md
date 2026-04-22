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
- Não faça push automaticamente - sempre confirme antes

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

1. **Entender** a tarefa
2. **Implementar** as mudanças
3. **Testar** se possível
4. **Resumir** na resposta (sem .md)
5. **Fazer commit** com mensagem clara
6. **Confirmar** antes de push

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

**Implementação inicial:**
```
feat: implement dashboard redesign components
```

**Performance improvements:**
```
perf: optimize bundle size and lazy load components
```

**Formatação e linting:**
```
style: format code and fix linting issues
```

**Documentação:**
```
docs: add Storybook stories for dashboard components
```

**Testes:**
```
test: add comprehensive test coverage for components
```

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

### Versão Atual: 1.8.20

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

### Regra Obrigatória: Incrementar Versão em Cada Commit

**TODOS** os commits devem incrementar a versão em `package.json`:

```bash
# Bug fix - incrementar PATCH
npm version patch  # 1.8.20 → 1.8.21

# Nova feature - incrementar MINOR
npm version minor  # 1.8.20 → 1.9.0

# Breaking change - incrementar MAJOR
npm version major  # 1.8.20 → 2.0.0
```

**Exemplo de Commit com Versioning:**
```bash
# Fazer mudanças
git add .

# Incrementar versão (escolher patch/minor/major)
npm version patch

# Commit será criado automaticamente com tag
git push origin feature-branch --tags
```

### Checklist de Versioning

- [ ] Identifiquei o tipo de mudança (bug fix, feature, breaking change)
- [ ] Executei `npm version patch|minor|major` antes de fazer push
- [ ] Versão em `package.json` foi incrementada corretamente
- [ ] Tag git foi criada automaticamente
- [ ] Commit de versioning foi feito

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
