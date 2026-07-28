# Backup and Disaster Recovery Procedure — gabrieltoth.com

## 1. Automated Backups

- **Supabase Database**: Point-in-time recovery (PITR) & daily automated WAL backups managed via Supabase Free/Pro tier.
- **Local Database Backups**: Automated export script using Supabase CLI:
  ```bash
  npm run db:types:local
  ```

## 2. Manual Backup Execution

To perform a manual backup before major migrations:

```bash
# Export schema and data via Supabase CLI
npx supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

## 3. Restoration Procedure

1. Verify environment credentials in target database environment (`SUPABASE_DB_URL`).
2. Run database restoration script:
   ```bash
   npx supabase db reset
   ```
3. Apply latest migrations:
   ```bash
   npm run db:migrate
   ```
4. Verify schema integrity:
   ```bash
   npm run db:types
   ```
