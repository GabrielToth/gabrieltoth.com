# 🚨 EMERGENCY ROLLBACK - READ FIRST

This file contains emergency procedures to revert issues in production.

---

## Severity Levels

### 🔴 CRITICAL (Site down)

1. **Immediate rollback via Vercel**
    - Access: https://vercel.com/gabrieltoth/gabrieltoth.com/deployments
    - Click "..." on the previous working deployment
    - Select "Promote to Production"

2. **If Vercel is not accessible**
    ```bash
    git revert HEAD
    git push origin main --force
    ```

### 🟠 HIGH (Broken functionality)

1. Identify the problematic commit:
    ```bash
    git log --oneline -10
    ```
2. Revert the specific commit:
    ```bash
    git revert <commit-hash>
    git push origin main
    ```

### 🟡 MEDIUM (Bug affecting users)

1. Create hotfix:
    ```bash
    git checkout -b hotfix/problem-name
    # Make fix
    git commit -m "fix: problem description"
    git checkout main
    git merge hotfix/problem-name
    git push origin main
    ```

---

## Database Rollback

### If migration caused an issue:

```sql
-- Connect to production database
-- Check current state
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;

-- Revert last migration manually if necessary
DROP TABLE IF EXISTS <problematic_table>;
```

### Backup Restore:

```bash
# List available backups (depends on provider)
# Restore the most recent one before the issue
```

---

## Docker Rollback (Self-Hosted)

```bash
# View available images
docker images gabrieltoth/platform-api

# Revert to previous version
docker-compose down
docker-compose up -d --pull=never gabrieltoth/platform-api:previous-tag
```

---

## Post-Rollback Checklist

- [ ] Is the site accessible?
- [ ] Are main functionalities working?
- [ ] Have error logs stopped?
- [ ] Notify team about the issue
- [ ] Document root cause in `docs/postmortems/`

---

## Emergency Contacts

- **Vercel Status**: https://www.vercel-status.com/
- **GitHub Status**: https://www.githubstatus.com/
