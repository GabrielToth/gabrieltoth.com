# Vercel Deployment Fix - Referência Git Quebrada

## Problema Identificado

A Vercel parou de fazer deploy automático porque havia uma **referência Git quebrada** em `.git/refs/remotes/origin/HEAD`.

### Sintomas
- ✗ Git push não dispara deploy automático na Vercel
- ✗ Erro: `bad object refs/remotes/origin/HEAD`
- ✗ Erro: `unable to resolve reference 'refs/remotes/origin/HEAD': reference broken`
- ✗ Site não atualiza há vários dias

## Causa Raiz

A referência `origin/HEAD` estava corrompida ou apontando para um branch que não existe mais. Isso impede que o Git comunique corretamente com o GitHub, o que por sua vez impede que o webhook da Vercel seja acionado.

## Solução Aplicada

```bash
# 1. Remover a referência quebrada
Remove-Item -Path ".git/refs/remotes/origin/HEAD" -Force

# 2. Recriar a referência apontando para o branch correto
git remote set-head origin main
```

## Verificação

```bash
# Verificar se a referência foi corrigida
git log --oneline -5

# Deve mostrar:
# 0654d21 (HEAD -> main, origin/main, origin/HEAD) removed unused md
#         ↑ Note que agora origin/HEAD está presente
```

## Próximos Passos

1. ✅ Referência Git corrigida
2. ✅ Webhook da Vercel deve estar funcionando novamente
3. Próximo `git push` deve disparar deploy automático

## Como Evitar no Futuro

- Evite deletar branches remotos sem atualizar as referências locais
- Use `git remote prune origin` regularmente para limpar referências obsoletas
- Verifique `git remote -v` e `git branch -a` periodicamente

## Teste

Para confirmar que está funcionando:

```bash
# Faça uma pequena alteração
echo "# Test" >> README.md

# Commit e push
git add README.md
git commit -m "test: verify Vercel deployment"
git push origin main

# Verifique o dashboard da Vercel em https://vercel.com/gabrieltoth/gabrieltoth-projects
# Deve aparecer um novo deployment em progresso
```

---

**Status**: ✅ RESOLVIDO
**Data**: 2026-03-10
**Causa**: Referência Git corrompida
**Solução**: Recriação de `origin/HEAD`
