# 🚨 EMERGENCY ROLLBACK - LEIA PRIMEIRO

Este arquivo contém procedimentos de emergência para reverter problemas em produção.

---

## Níveis de Severidade

### 🔴 CRÍTICO (Site fora do ar)

1. **Rollback imediato via Vercel**
    - Acessar: https://vercel.com/gabrieltoth/gabrieltoth.com/deployments
    - Clicar nos "..." do deploy anterior funcional
    - Selecionar "Promote to Production"

2. **Se Vercel não estiver acessível**
    ```bash
    git revert HEAD
    git push origin main --force
    ```

### 🟠 ALTO (Funcionalidade quebrada)

1. Identificar o commit problemático:
    ```bash
    git log --oneline -10
    ```
2. Reverter o commit específico:
    ```bash
    git revert <hash-do-commit>
    git push origin main
    ```

### 🟡 MÉDIO (Bug afetando usuários)

1. Criar hotfix:
    ```bash
    git checkout -b hotfix/nome-do-problema
    # Fazer correção
    git commit -m "fix: descrição do problema"
    git checkout main
    git merge hotfix/nome-do-problema
    git push origin main
    ```

---

## Rollback de Banco de Dados

### Se a migration causou problema:

```sql
-- Conectar no banco de produção
-- Verificar o estado atual
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;

-- Reverter última migration manualmente se necessário
DROP TABLE IF EXISTS <tabela_problemática>;
```

### Restore de Backup:

```bash
# Listar backups disponíveis (depende do provider)
# Restaurar o mais recente antes do problema
```

---

## Rollback de Docker (Self-Hosted)

```bash
# Ver imagens disponíveis
docker images gabrieltoth/platform-api

# Reverter para versão anterior
docker-compose down
docker-compose up -d --pull=never gabrieltoth/platform-api:previous-tag
```

---

## Checklist Pós-Rollback

- [ ] Site está acessível?
- [ ] Funcionalidades principais funcionando?
- [ ] Logs de erro pararam?
- [ ] Notificar equipe sobre o problema
- [ ] Documentar causa raiz em `docs/postmortems/`

---

## Contatos de Emergência

- **Vercel Status**: https://www.vercel-status.com/
- **GitHub Status**: https://www.githubstatus.com/
