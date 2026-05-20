# Supabase migrations

1. Edit `supabase/schema.sql` (canonical DDL snapshot).
2. Apply to remote: `npx supabase db push` (or SQL Editor).
3. Regenerate types if needed.
4. Do not keep numbered `phase-*` or `task-*` labels in SQL comments.

Optional one-off deltas can live in `supabase/migrations/` temporarily; after `db push`, merge into `schema.sql` and delete the migration file.

Do not add Vitest suites only for migration files.
