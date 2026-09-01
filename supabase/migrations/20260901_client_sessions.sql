-- Client session/cookie vault for unofficial social media integrations
-- (Twitter/X, Facebook, Instagram, Kwai via OmniRoute/1proxy scraping mesh)
--
-- Encrypted with AES-256-CBC via scripts/env/COOKIE_ENCRYPTION_KEY

create table if not exists client_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    platform text not null check (platform in ('twitter', 'facebook', 'instagram', 'kwai', 'tiktok', 'twitch', 'youtube')),
    payload jsonb not null, -- { encryptedCookies: string, iv: string, scrapedAt, expiresIn }
    credits_used integer not null default 0,
    last_billed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, platform)
);

create index idx_client_sessions_user on client_sessions(user_id);
create index idx_client_sessions_billable on client_sessions(last_billed_at) where credits_used > 0;

-- RLS: users can only see their own sessions
alter table client_sessions enable row level security;

create policy "users_read_own_sessions"
    on client_sessions for select
    using (auth.uid() = user_id);

create policy "users_insert_own_sessions"
    on client_sessions for insert
    with check (auth.uid() = user_id);

create policy "users_delete_own_sessions"
    on client_sessions for delete
    using (auth.uid() = user_id);
