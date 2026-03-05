---
description: Workflow de deploy para produção
---

# Workflow de Deploy

## Pré-Requisitos

1. Todos os testes devem passar (ver `/testing`)
2. Código revisado e aprovado
3. Branch atualizada com `main`

## Passos para Deploy

### 1. Atualizar Versão

```bash
npm version patch  # ou minor/major conforme semver
```

### 2. Criar Commit Semântico

Formato: `<tipo>(<escopo>): <descrição>`

Tipos:

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

Exemplo:

```bash
git add .
git commit -m "feat(credits): implementar dedução por uso de banda"
```

### 3. Push para Repositório

```bash
git push origin main
```

### 4. Verificar Deploy Automático

- Vercel fará deploy automático
- Acompanhar em: https://vercel.com/gabrieltoth

### 5. Validar em Produção

- Acessar https://gabrieltoth.com
- Testar funcionalidade implementada
- Verificar logs de erro

---

## Em Caso de Falha

Seguir: `.agent/EMERGENCY_ROLLBACK.md`
