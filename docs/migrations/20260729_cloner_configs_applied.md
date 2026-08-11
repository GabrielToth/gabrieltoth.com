# Applied Migration: 20260729_cloner_configs

- Table `public.cloner_configs` created in Supabase database with RLS policies enabled.
- `repost_configs` updated with `last_checked_at` column and foreign key constraint to `channel_groups`.
- Verified live against Supabase environment.
